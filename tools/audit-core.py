#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AgriMarket core-business static audit (READ ONLY).

Run from repo root:
    python audit_agrimarket_core.py
    python audit_agrimarket_core.py --verify

The script never edits tracked source, never migrates DB, never commits/pushes.
Reports are written under .agrimarket-backup/audit/ (ignored by Git in this repo).
"""
from __future__ import annotations

import argparse, datetime as dt, json, re, subprocess
from dataclasses import dataclass, asdict
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
ROOT_NAME = "agrimarket"
SCAN_ROOTS = [
    "apps/api/src", "apps/api/prisma", "apps/customer-web/src",
    "apps/admin-web/src", "apps/mobile/src", "packages/api-client",
]
SKIP = {".git","node_modules",".next","dist","build","coverage",".turbo",".cache",".expo","__pycache__"}
SUFFIX = {".ts",".tsx",".js",".mjs",".cjs",".prisma",".sql",".json",".toml",".md"}

@dataclass
class Finding:
    code: str
    severity: str
    status: str
    title: str
    detail: str
    evidence: list[str]
    next_action: str

def cmd(args: list[str], cwd: Path, timeout=180):
    try:
        p = subprocess.run(args, cwd=str(cwd), text=True, encoding="utf-8", errors="replace",
                           capture_output=True, timeout=timeout, shell=False)
        out = (p.stdout or "") + (("\n" + p.stderr) if p.stderr else "")
        return p.returncode, out.strip()
    except Exception as e:
        return 999, repr(e)

def repo_root(start: Path) -> Path:
    for p in [start.resolve(), *start.resolve().parents]:
        f = p / "package.json"
        if f.exists():
            try:
                if json.loads(f.read_text(encoding="utf-8")).get("name") == ROOT_NAME:
                    return p
            except Exception:
                pass
    raise SystemExit("Không tìm thấy root AgriMarket. Hãy chạy script từ trong repo.")

def text(p: Path) -> str:
    try: return p.read_text(encoding="utf-8")
    except Exception:
        try: return p.read_text(encoding="utf-8", errors="replace")
        except Exception: return ""

def rel(root: Path, p: Path) -> str:
    try: return p.relative_to(root).as_posix()
    except Exception: return str(p)

def files(root: Path):
    out=[]
    for rr in SCAN_ROOTS:
        b=root/rr
        if not b.exists(): continue
        for p in b.rglob("*"):
            if not p.is_file(): continue
            if any(x in p.parts for x in SKIP): continue
            if "/src/generated/prisma/" in "/"+p.as_posix()+"/": continue
            if p.suffix.lower() in SUFFIX or p.name=="package.json": out.append(p)
    return out

def hits(root: Path, ps, pats, limit=20):
    regs=[re.compile(x,re.I) for x in pats]; out=[]
    for p in ps:
        for i,line in enumerate(text(p).splitlines(),1):
            if any(r.search(line) for r in regs):
                out.append(f"{rel(root,p)}:{i}: {line.strip()[:220]}")
                if len(out)>=limit:return out
    return out

def block(src: str, kind: str, name: str):
    m=re.search(rf"(?ms)^{kind}\s+{re.escape(name)}\s*\{{(.*?)^\}}",src)
    return m.group(1) if m else ""

def add(fs,*a): fs.append(Finding(*a))

def audit(root: Path):
    fs=[]; inv={}
    _,head=cmd(["git","rev-parse","--short","HEAD"],root)
    _,origin=cmd(["git","rev-parse","--short","origin/main"],root)
    _,branch=cmd(["git","branch","--show-current"],root)
    _,status=cmd(["git","status","--short"],root)
    meta={"repo":str(root),"head":head,"origin_main":origin,"branch":branch,"git_status_short":status,
          "audit_time":dt.datetime.now().astimezone().isoformat()}
    if head.startswith(EXPECTED_HEAD):
        add(fs,"BASE-001","INFO","PASS","HEAD đúng baseline dc7c663",head,[],"Giữ baseline này cho patch tiếp theo.")
    else:
        add(fs,"BASE-001","P0","REVIEW","HEAD khác baseline đã xác nhận",f"HEAD={head}",[],"Xác nhận lại trước patch.")
    if status.strip():
        add(fs,"BASE-002","P0","FAIL","Working tree không sạch","git status có thay đổi.",status.splitlines()[:15],"Dừng patch và xác định nguồn thay đổi.")
    else:
        add(fs,"BASE-002","INFO","PASS","Working tree sạch","git status --short rỗng.",[],"Có thể audit/patch có kiểm soát.")

    allf=files(root); inv["files_scanned"]=len(allf)
    schema_p=root/"apps/api/prisma/schema.prisma"; schema=text(schema_p)
    if not schema:
        add(fs,"SCHEMA-001","P0","FAIL","Không đọc được schema.prisma",str(schema_p),[],"Dừng.")
        return meta,fs,inv

    # FEFO / inventory
    fefo=root/"apps/api/src/modules/ton-kho/fefo.service.ts"
    reserve=root/"apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts"
    ftxt=text(fefo); rtxt=text(reserve)
    fev=hits(root,[fefo,reserve],[r"CO_THE_BAN",r"ngayHetHan|ngay_het_han",r"FOR UPDATE",r"ORDER_RESERVE",r"ORDER_RELEASE",r"ORDER_SHIP",r"reserved",r"blocked"],30)
    if "FOR UPDATE" in rtxt and "ORDER_RESERVE" in rtxt and "ORDER_RELEASE" in rtxt:
        add(fs,"INV-001","INFO","FOUNDATION_PRESENT","Reservation row-lock + ledger đã có","Nền chống oversell cần được giữ.",fev[:15],"Không đập lại transaction/locking.")
    exp=bool(re.search(r"expectedDelivery|deliveryEta|estimatedDelivery|ngayGiaoDuKien|ngayDuKienGiao|deliveryLeadTime",ftxt+rtxt,re.I))
    mins=bool(re.search(r"minimumShelfLife|minimum_shelf_life|hanSuDungToiThieu|soNgayHanSuDungToiThieu",ftxt+rtxt+schema,re.I))
    if not (exp and mins):
        add(fs,"FEFO-001","P0","GAP_LIKELY","FEFO chưa có đủ ETA + minimum shelf-life","Baseline hiện chủ yếu CO_THE_BAN + expiry>=today; chưa chứng minh expiry >= expectedDeliveryDate + minimumShelfLifeDays.",fev[:20],"Tìm/reuse SLA giao hàng rồi đồng bộ cùng cutoff ở FEFO preview và reservation SQL.")
    near=hits(root,allf,[r"nguongSapHetHanNgay|near_expiry_threshold"],8)
    if near: add(fs,"FEFO-002","INFO","FOUNDATION_PRESENT","Có near-expiry threshold riêng","Không dùng nó thay minimum shelf-life.",near,"Giữ warning threshold độc lập.")

    # Settlement
    ds=root/"apps/api/src/modules/doi-soat/doi-soat.service.ts"
    bal=root/"apps/api/src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service.ts"
    dtxt=text(ds); btxt=text(bal)
    dev=hits(root,[ds,bal],[r"congKhaDungTrongGiaoDich",r"dangCho",r"khaDung",r"tamGiu",r"daThanhToan",r"updatedAt",r"FOR UPDATE",r"phaiTra"],25)
    if "congKhaDungTrongGiaoDich" in dtxt:
        add(fs,"SETTLE-001","P0","GAP_CONFIRMED","Tạo đối soát cộng thẳng KHA_DUNG","Baseline settlement chưa đi DANG_CHO→KHA_DUNG theo escrow.",dev,"Tạo entitlement pending theo delivery event và release đúng amount khi mature/no blocker.")
    if re.search(r"updatedAt\s*:\s*\{",dtxt):
        add(fs,"SETTLE-002","P0","GAP_CONFIRMED","Settlement dùng updatedAt để chọn supplier order","updatedAt là timestamp kỹ thuật, không phải deliveredAt/accounting timestamp.",dev,"Dùng business delivery timestamp rõ ràng.")
    if all(x in btxt for x in ["dangCho","khaDung","tamGiu","daThanhToan"]):
        add(fs,"SETTLE-003","INFO","FOUNDATION_PRESENT","Supplier balance đã có 4 bucket","Có DANG_CHO/KHA_DUNG/TAM_GIU/DA_THANH_TOAN.",dev[:12],"Bổ sung transition đúng thay vì tạo balance mới.")
    delivered=hits(root,[schema_p],[r"deliveredAt|completedAt|giaoLuc|daGiaoLuc|hoanThanhLuc"],12)
    if not delivered:
        add(fs,"SETTLE-004","P0","GAP_LIKELY","Chưa thấy deliveredAt/completedAt rõ trong schema","Scan tĩnh chưa tìm thấy business delivery timestamp theo các tên phổ biến.",[],"Trace shipment/order; nếu thiếu thật thì thêm explicit timestamp bằng migration mới.")

    # Refund item attribution
    rh=hits(root,allf,[r"model\s+(RefundItem|MucHoanTien|ChiTietHoanTien|HoanTienItem)\b",r"mucDonHangId.*hoan|hoan.*mucDonHangId",r"orderItemId.*refund|refund.*orderItemId"],20)
    if not rh:
        add(fs,"REFUND-001","P0","GAP_LIKELY","Chưa thấy refund allocation xuống OrderItem","Không thấy RefundItem/MucHoanTien hoặc mapping refund↔orderItem tương đương.",[],"Audit refund service; bổ sung item/supplier attribution + snapshot nếu thật sự thiếu.")
    else:
        add(fs,"REFUND-001","P1","REVIEW","Có dấu vết item-level refund","Cần xác minh rounding, voucher/loyalty, supplier isolation.",rh,"Viết partial/multi-supplier refund tests.")

    # Payment idempotency and ship coupling
    pf=[p for p in allf if "/thanh-toan/" in "/"+rel(root,p)+"/" or "payment" in rel(root,p).lower()]
    idem=hits(root,pf,[r"maYeuCau",r"maGiaoDich",r"idempoten",r"laLoiUnique",r"ConflictException"],20)
    if idem: add(fs,"PAY-001","INFO","FOUNDATION_PRESENT","Payment có foundation idempotency","Có request/transaction keys và conflict handling.",idem,"Giữ foundation; test callback retry nhiều lần.")
    ship=hits(root,pf,[r"ORDER_SHIP",r"xacNhanDaBan\s*\(",r"onHand.*decrement"],20)
    if ship:
        add(fs,"PAY-002","P0","REVIEW","Payment code có tham chiếu physical shipment/inventory","Cần trace call graph để chắc Payment SUCCESS không ship hàng.",ship,"Giữ invariant payment paid != physical shipped.")
    else:
        add(fs,"PAY-002","INFO","NO_DIRECT_MATCH","Không thấy ORDER_SHIP trực tiếp trong payment files","Tín hiệu tốt nhưng E2E vẫn bắt buộc.",[],"Test payment success không giảm onHand.")

    # Recall reverse trace
    rf=[p for p in allf if any(k in rel(root,p).lower() for k in ["lo-san-pham","thu-hoi","truy-xuat"])]
    reverse=hits(root,rf,[r"mucDonHang.*loSanPham|loSanPham.*mucDonHang",r"orderItem.*batch|batch.*orderItem",r"khachHang.*thuHoi|thuHoi.*khachHang"],15)
    if not reverse:
        base=hits(root,rf,[r"THU_HOI|ThuHoiLoSanPham|thongBaoKhachHang"],15)
        add(fs,"RECALL-001","P1","GAP_LIKELY","Recall chưa chứng minh Batch→OrderItem→Customer","Có recall status/hồ sơ nhưng chưa thấy reverse mapping chính xác.",base,"Audit actual shipped-batch allocation; bổ sung impact lookup và bảo vệ PII.")

    # Warehouse semantics
    stock=block(schema,"enum","LoaiGiaoDichTonKho")
    docs=block(schema,"enum","LoaiPhieuKho")
    inv["LoaiGiaoDichTonKho"]=[x.strip() for x in stock.splitlines() if x.strip()]
    inv["LoaiPhieuKho"]=[x.strip() for x in docs.splitlines() if x.strip()]
    if not re.search(r"DAMAGE|EXPIRE|HAO_HUT|HET_HAN|XUAT_HUY|SPOIL|KIEM_KE",stock+docs,re.I):
        add(fs,"WH-001","P1","GAP_LIKELY","Warehouse loss semantics chưa rõ trong enum","Có thể dùng generic adjustment+reason; cần audit trước khi thêm enum.",[f"LoaiGiaoDichTonKho={inv['LoaiGiaoDichTonKho']}",f"LoaiPhieuKho={inv['LoaiPhieuKho']}"],"Đảm bảo damage/expire/shrinkage giảm kho nhưng không thành sales/revenue.")

    # RBAC inventory
    ctr=[p for p in allf if p.name.endswith(".controller.ts")]
    auth=hits(root,ctr,[r"@UseGuards",r"@Roles",r"@Quyen",r"@Permissions",r"@VaiTro",r"@ApiBearerAuth"],50)
    inv["controller_count"]=len(ctr); inv["auth_evidence_count_limited"]=len(auth)
    add(fs,"RBAC-001","P1","REVIEW","Cần endpoint/permission/ownership matrix",f"Có {len(ctr)} controllers; static scan không đủ kết luận RBAC đúng.",auth[:20],"Audit method→role→permission→ownership→state guard.")

    # Focused test inventory
    td=root/"apps/api/test"; tests={p.name for p in td.glob("*.e2e-spec.ts")} if td.exists() else set()
    inv["api_e2e_count"]=len(tests)
    wanted=["fefo.e2e-spec.ts","dat-cho-ton-kho.e2e-spec.ts","payment-callback-idempotency.e2e-spec.ts","payment-domain.e2e-spec.ts","shipment-domain.e2e-spec.ts","doi-soat.e2e-spec.ts","so-du-nha-cung-cap.e2e-spec.ts","hoan-tien.e2e-spec.ts","khieu-nai.e2e-spec.ts","thu-hoi-lo-san-pham.e2e-spec.ts","phan-quyen.e2e-spec.ts"]
    miss=[x for x in wanted if x not in tests]
    if miss: add(fs,"TEST-001","P1","REVIEW","Thiếu một số focused E2E filename","Có thể coverage nằm ở suite khác.",miss,"Map scenario→suite trước patch.")
    else: add(fs,"TEST-001","INFO","FOUNDATION_PRESENT","Focused E2E foundations hiện diện",f"Tìm thấy {len(wanted)}/{len(wanted)} suite mục tiêu.",wanted,"Sau mỗi patch chạy focused suites.")

    return meta,fs,inv

def verify(root: Path):
    commands={
      "git_status":["git","status","--short"],
      "prisma_validate":["pnpm","--filter","@agrimarket/api","prisma:validate"],
      "api_typecheck":["pnpm","--filter","@agrimarket/api","typecheck"],
      "api_unit":["pnpm","--filter","@agrimarket/api","test:unit"],
    }
    out={}
    for n,c in commands.items():
        code,txt=cmd(c,root,300)
        out[n]={"command":c,"exit_code":code,"output":txt}
    return out

def markdown(meta,fs,inv,vr):
    order={"P0":0,"P1":1,"P2":2,"INFO":3}
    fs=sorted(fs,key=lambda x:(order.get(x.severity,9),x.code))
    L=["# AGRIMARKET CORE BUSINESS AUDIT","",f"- Repo: `{meta['repo']}`",f"- Branch: `{meta['branch']}`",f"- HEAD: `{meta['head']}`",f"- origin/main: `{meta['origin_main']}`",f"- Audit: `{meta['audit_time']}`","","> Static audit có evidence; GAP_LIKELY/REVIEW chưa phải kết luận cuối cho đến khi có behavioral tests.","","| Code | Mức | Trạng thái | Vấn đề |","|---|---:|---|---|"]
    for f in fs:L.append(f"| {f.code} | {f.severity} | {f.status} | {f.title} |")
    for f in fs:
        L += ["",f"## {f.code} — {f.title}","",f"- Severity: **{f.severity}**",f"- Status: **{f.status}**",f"- Detail: {f.detail}",f"- Next: {f.next_action}"]
        if f.evidence:
            L.append("- Evidence:")
            L += [f"  - `{e}`" for e in f.evidence]
    L += ["","## Inventory","","```json",json.dumps(inv,ensure_ascii=False,indent=2),"```"]
    if vr:
        L += ["","## Verification",""]
        for n,v in vr.items():
            L += [f"### {n}",f"- Exit: `{v['exit_code']}`","```text",v['output'][-12000:],"```"]
    return "\n".join(L)+"\n"

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--verify",action="store_true"); a=ap.parse_args()
    root=repo_root(Path.cwd())
    print("="*78); print(" AGRIMARKET CORE BUSINESS AUDIT - READ ONLY"); print("="*78); print("Repo:",root)
    meta,fs,inv=audit(root); vr=verify(root) if a.verify else None
    out=root/".agrimarket-backup"/"audit"; out.mkdir(parents=True,exist_ok=True)
    stamp=dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    payload={"meta":meta,"inventory":inv,"findings":[asdict(x) for x in fs],"verification":vr}
    md=markdown(meta,fs,inv,vr)
    for p,data in [(out/f"agrimarket-core-audit-{stamp}.json",json.dumps(payload,ensure_ascii=False,indent=2)),(out/f"agrimarket-core-audit-{stamp}.md",md),(out/"LATEST.json",json.dumps(payload,ensure_ascii=False,indent=2)),(out/"LATEST.md",md)]: p.write_text(data,encoding="utf-8")
    order={"P0":0,"P1":1,"P2":2,"INFO":3}
    print("\n=== BASELINE ==="); print("HEAD       :",meta['head']); print("origin/main:",meta['origin_main']); print("branch     :",meta['branch']); print("git clean  :","YES" if not meta['git_status_short'].strip() else "NO")
    print("\n=== FINDINGS ===")
    for f in sorted(fs,key=lambda x:(order.get(x.severity,9),x.code)): print(f"[{f.severity:4}] [{f.status:18}] {f.code}: {f.title}")
    if vr:
        print("\n=== VERIFICATION ===")
        for n,v in vr.items(): print(f"{n}: exit={v['exit_code']}")
    print("\n=== REPORT ==="); print(out/"LATEST.md"); print(out/"LATEST.json"); print("\nKhông có tracked source file nào được chỉnh sửa.")
    return 0

if __name__=="__main__": raise SystemExit(main())
