#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET FIX 01D - FLASH SALE UNIT FIXTURE QUOTA
NO BACKUP / NO MIGRATION / NO BUSINESS-SOURCE CHANGE / NO COMMIT / NO PUSH

Nguyên nhân:
- GiaHieuLucService hiện select gioiHanTong + soLuongDaBan và yêu cầu:
    gioiHanTong === null || soLuongDaBan < gioiHanTong
- FakeMuc trong unit test cũ không mô phỏng 2 field này.
- Runtime nhận undefined/undefined => conQuotaTong = false => flash hợp lệ bị hiểu thành NORMAL.

Fix đúng:
- Không sửa business service.
- Fake DB mô phỏng Prisma thật:
    gioiHanTong mặc định null
    soLuongDaBan mặc định 0
- Thêm regression unit: quota tổng đã hết => NORMAL.
- Chạy typecheck + toàn bộ unit test.

Chạy từ root repo:
  python .\fix_agrimarket_01d_flash_sale_unit_fixture_nobackup.py
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
TEST_REL = "apps/api/src/modules/flash-sale/gia-hieu-luc.service.spec.ts"

KNOWN_TRACKED = {
    "apps/admin-web/src/app/don-hang/page.tsx",
    "apps/api/prisma/schema.prisma",
    "apps/api/src/modules/giao-hang/giao-hang.module.ts",
    "apps/api/src/modules/giao-hang/giao-hang.service.ts",
    "apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts",
    "apps/api/src/modules/thanh-toan/thanh-toan.service.ts",
    "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts",
    "apps/api/test/cod-mock-payment.e2e-spec.ts",
    "apps/api/test/dat-cho-ton-kho.e2e-spec.ts",
    "apps/api/test/payment-callback-idempotency.e2e-spec.ts",
    "apps/api/test/phieu-kho.e2e-spec.ts",
    "apps/mobile/src/app/don-hang/[id].tsx",
    "packages/api-client/src/domain-ui.ts",
    TEST_REL,
}

MARKER = "AGRIMARKET-FIX01D-FLASH-QUOTA-FAKE"

def run(cmd: list[str], cwd: Path, timeout: int = 600) -> tuple[int, str, str]:
    if os.name == "nt" and cmd and cmd[0] == "pnpm":
        cmd = ["cmd", "/c", *cmd]
    p = subprocess.run(
        cmd,
        cwd=str(cwd),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=timeout,
        shell=False,
    )
    return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()

def find_repo(start: Path) -> Path:
    p = start.resolve()
    for c in [p, *p.parents]:
        pkg = c / "package.json"
        if not pkg.exists():
            continue
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
        except Exception:
            continue
        if data.get("name") == "agrimarket":
            return c
    raise SystemExit("Không tìm thấy root repo AgriMarket.")

def git_lines(root: Path, args: list[str]) -> list[str]:
    rc, out, err = run(["git", *args], root, 120)
    if rc != 0:
        raise RuntimeError(f"git {' '.join(args)} lỗi:\n{out}\n{err}")
    return [x.strip().replace("\\", "/") for x in out.splitlines() if x.strip()]

def assert_scope(root: Path) -> None:
    rc, head, err = run(["git", "rev-parse", "--short", "HEAD"], root, 60)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise RuntimeError(f"HEAD={head!r}, yêu cầu {EXPECTED_HEAD}. {err}")

    staged = git_lines(root, ["diff", "--cached", "--name-only"])
    if staged:
        raise RuntimeError("Có file staged; dừng: " + ", ".join(staged))

    dirty = git_lines(root, ["diff", "--name-only"])
    unknown = [x for x in dirty if x not in KNOWN_TRACKED]
    if unknown:
        raise RuntimeError("Có tracked change ngoài phạm vi đã biết: " + ", ".join(unknown))

def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: cần đúng 1 pattern, thực tế {n}.")
    return text.replace(old, new, 1)

def patch_test(root: Path) -> None:
    path = root / TEST_REL
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("↪ Flash-sale unit fixture đã có Fix01D, bỏ qua patch.")
        return

    old_type = """type FakeMuc = {
  id: string;
  chienDichId: string;
  bienTheSanPhamId: string;
  giaFlash: number;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
"""
    new_type = f"""type FakeMuc = {{
  // {MARKER}
  id: string;
  chienDichId: string;
  bienTheSanPhamId: string;
  giaFlash: number;
  gioiHanTong?: number | null;
  soLuongDaBan?: number;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
"""
    text = replace_once(text, old_type, new_type, "FakeMuc quota fields")

    old_return = """        return locMucTheoWhere(where).sort(
          (a, b) => a.giaFlash - b.giaFlash || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        );
"""
    new_return = """        return locMucTheoWhere(where)
          .map((item) => ({
            ...item,
            // Prisma thật luôn trả hai field service đã select.
            // Model: gioiHanTong nullable; soLuongDaBan @default(0).
            gioiHanTong: item.gioiHanTong ?? null,
            soLuongDaBan: item.soLuongDaBan ?? 0,
          }))
          .sort(
            (a, b) => a.giaFlash - b.giaFlash || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
          );
"""
    text = replace_once(text, old_return, new_return, "normalize fake quota")

    anchor = """  it('hết tồn khả dụng (onHand - reserved - blocked <= 0) => NORMAL', async () => {
"""
    quota_test = """  it('quota tổng đã bán hết => NORMAL', async () => {
    const { db } = taoFakeDb([VARIANT_ID], {
      muc: [
        {
          id: 'muc-quota-het',
          chienDichId: 'camp-quota-het',
          bienTheSanPhamId: VARIANT_ID,
          giaFlash: GIA_FLASH,
          gioiHanTong: 10,
          soLuongDaBan: 10,
          trangThai: 'HOAT_DONG',
          chienDich: {
            trangThai: 'HOAT_DONG',
            batDauLuc: new Date(NOW.getTime() - 60_000),
            ketThucLuc: new Date(NOW.getTime() + 86_400_000),
          },
        },
      ],
    });

    const ketQua = await taoService().resolve(VARIANT_ID, NOW, db);
    expect(ketQua?.loaiGia).toBe('NORMAL');
    expect(ketQua?.giaHieuLuc).toBe(GIA_GOC);
  });

"""
    text = replace_once(text, anchor, quota_test + anchor, "quota exhausted regression")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("✓ patched:", TEST_REL)

def run_checked(root: Path, cmd: list[str], timeout: int) -> None:
    print("\n$ " + " ".join(cmd))
    rc, out, err = run(cmd, root, timeout)
    if out:
        print(out)
    if err:
        print(err)
    if rc != 0:
        raise RuntimeError(f"Command fail exit={rc}: {' '.join(cmd)}")

def main() -> int:
    root = find_repo(Path.cwd())
    print("=" * 92)
    print(" AGRIMARKET FIX 01D - FLASH SALE UNIT FIXTURE QUOTA - NO BACKUP")
    print("=" * 92)
    print("Repo:", root)

    try:
        assert_scope(root)
        patch_test(root)

        print("\n=== GIT DIFF CHECK ===")
        rc, out, err = run(["git", "diff", "--check"], root, 120)
        if out:
            print(out)
        if err:
            print(err)
        if rc != 0:
            raise RuntimeError("git diff --check fail.")
        print("PASS")

        run_checked(root, ["pnpm", "--filter", "@agrimarket/api", "typecheck"], 480)
        run_checked(root, ["pnpm", "--filter", "@agrimarket/api", "test:unit"], 900)

        print("\n=== STATUS ===")
        rc, out, err = run(["git", "status", "--short"], root, 120)
        print(out)
        if err:
            print(err)

        print("\n" + "=" * 92)
        print(" PASS - FIX01D + TYPECHECK + FULL UNIT")
        print(" Không backup / Không migration / Không business-source change / Không commit / Không push")
        print("=" * 92)
        return 0
    except Exception as e:
        print("\n" + "=" * 92)
        print(" DỪNG - CHƯA COMMIT/PUSH")
        print("=" * 92)
        print(str(e))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
