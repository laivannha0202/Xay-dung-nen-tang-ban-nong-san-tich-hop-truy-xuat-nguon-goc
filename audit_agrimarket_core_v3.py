#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from pathlib import Path
import subprocess, json, re, datetime as dt

EXPECTED_HEAD = 'dc7c663'


def run(cmd, cwd):
    p = subprocess.run(cmd, cwd=str(cwd), capture_output=True, text=True,
                       encoding='utf-8', errors='replace', shell=False)
    out = (p.stdout or '') + (("\n" + p.stderr) if p.stderr else '')
    return p.returncode, out.strip()


def find_repo():
    here = Path.cwd().resolve()
    for p in [here, *here.parents]:
        pkg = p / 'package.json'
        if pkg.exists():
            try:
                if json.loads(pkg.read_text(encoding='utf-8')).get('name') == 'agrimarket':
                    return p
            except Exception:
                pass
    raise SystemExit('Khong tim thay root repo AgriMarket.')


def read(path):
    try:
        return path.read_text(encoding='utf-8')
    except Exception:
        return ''


def hits(root, path, patterns, limit=20):
    text = read(path)
    regs = [re.compile(x, re.I) for x in patterns]
    out = []
    for i, line in enumerate(text.splitlines(), 1):
        if any(r.search(line) for r in regs):
            out.append(f"{path.relative_to(root).as_posix()}:{i}: {line.strip()[:220]}")
            if len(out) >= limit:
                break
    return out


def main():
    root = find_repo()
    print('=' * 80)
    print(' AGRIMARKET CORE BUSINESS AUDIT - READ ONLY')
    print(' KHONG SUA SOURCE / KHONG MIGRATE / KHONG COMMIT / KHONG PUSH')
    print('=' * 80)
    print('Repo:', root)

    _, head = run(['git', 'rev-parse', '--short', 'HEAD'], root)
    _, origin = run(['git', 'rev-parse', '--short', 'origin/main'], root)
    _, branch = run(['git', 'branch', '--show-current'], root)
    _, status = run(['git', 'status', '--short'], root)

    print('\n=== BASELINE ===')
    print('HEAD       :', head)
    print('origin/main:', origin)
    print('branch     :', branch)
    print('git clean  :', 'YES' if not status.strip() else 'NO')

    files = {
        'schema': root / 'apps/api/prisma/schema.prisma',
        'fefo': root / 'apps/api/src/modules/ton-kho/fefo.service.ts',
        'reserve': root / 'apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts',
        'settlement': root / 'apps/api/src/modules/doi-soat/doi-soat.service.ts',
        'balance': root / 'apps/api/src/modules/so-du-nha-cung-cap/so-du-nha-cung-cap.service.ts',
    }
    text = {k: read(v) for k, v in files.items()}
    findings = []

    if not head.startswith(EXPECTED_HEAD):
        findings.append(('P0', 'BASELINE', f'HEAD khac baseline {EXPECTED_HEAD}: {head}'))
    if status.strip():
        findings.append(('P0', 'GIT', 'Working tree khong sach truoc audit.'))

    if 'FOR UPDATE' in text['reserve'] and 'ORDER_RESERVE' in text['reserve'] and 'ORDER_RELEASE' in text['reserve']:
        findings.append(('INFO', 'INVENTORY', 'Da co row-lock + reservation ledger foundation; giu nguyen.'))

    combined = (text['schema'] + text['fefo'] + text['reserve']).lower()
    eta_terms = ['expecteddelivery','ngaygiaodukien','ngaydukiengiao','deliveryeta','estimateddelivery','deliveryleadtime','leadtime']
    shelf_terms = ['minimumshelflife','minimum_shelf_life','hansudungtoithieu','songayhansudungtoithieu']
    if not any(x in combined for x in eta_terms) or not any(x in combined for x in shelf_terms):
        findings.append(('P0', 'FEFO', 'Chua chung minh expiry >= expectedDeliveryDate + minimumShelfLifeDays.'))

    if 'congKhaDungTrongGiaoDich' in text['settlement']:
        findings.append(('P0', 'SETTLEMENT', 'Tao doi soat dang cong truc tiep KHA_DUNG thay vi DANG_CHO escrow.'))
    if re.search(r'updatedAt\s*:\s*\{', text['settlement']):
        findings.append(('P0', 'SETTLEMENT', 'Doi soat dang dung updatedAt de loc supplier order.'))
    if all(x in text['balance'] for x in ['dangCho','khaDung','tamGiu','daThanhToan']):
        findings.append(('INFO', 'BALANCE', 'Da co DANG_CHO/KHA_DUNG/TAM_GIU/DA_THANH_TOAN; nen reuse.'))

    refund_patterns = [r'model\s+RefundItem\b', r'model\s+MucHoanTien\b', r'mucDonHangId.*hoan', r'orderItemId.*refund']
    if not any(re.search(p, text['schema'], re.I | re.M) for p in refund_patterns):
        findings.append(('P1', 'REFUND', 'Chua thay allocation refund xuong OrderItem trong Prisma schema.'))

    evidence = {
        'fefo': hits(root, files['fefo'], [r'CO_THE_BAN', r'ngayHetHan', r'orderBy', r'reserved', r'blocked']),
        'reservation': hits(root, files['reserve'], [r'FOR UPDATE', r'ORDER_RESERVE', r'ORDER_RELEASE', r'ORDER_SHIP', r'onHand', r'reserved', r'blocked', r'ngay_het_han']),
        'settlement': hits(root, files['settlement'], [r'updatedAt', r'HOAN_THANH', r'congKhaDungTrongGiaoDich', r'phaiTra', r'hoanTien']),
        'balance': hits(root, files['balance'], [r'dangCho', r'khaDung', r'tamGiu', r'daThanhToan', r'FOR UPDATE']),
    }

    print('\n=== FINDINGS ===')
    for sev, area, msg in findings:
        print(f'[{sev}] {area}: {msg}')

    print('\n=== EVIDENCE SUMMARY ===')
    for key, vals in evidence.items():
        print(f'\n--- {key.upper()} ---')
        for x in vals:
            print(x)

    out_dir = root / '.agrimarket-backup' / 'audit'
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        'time': dt.datetime.now().astimezone().isoformat(),
        'repo': str(root), 'head': head, 'origin_main': origin, 'branch': branch,
        'git_status_short': status,
        'findings': [{'severity': a, 'area': b, 'message': c} for a,b,c in findings],
        'evidence': evidence,
    }
    (out_dir / 'LATEST.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    md = ['# AGRIMARKET CORE BUSINESS AUDIT','',f'- HEAD: `{head}`',f'- origin/main: `{origin}`',f'- Branch: `{branch}`',f"- Working tree clean: `{'YES' if not status.strip() else 'NO'}`",'', '## Findings','']
    for sev, area, msg in findings:
        md.append(f'- **[{sev}] {area}** — {msg}')
    md += ['', '## Evidence', '']
    for key, vals in evidence.items():
        md.append(f'### {key}')
        md.extend(f'- `{x}`' for x in vals)
        md.append('')
    (out_dir / 'LATEST.md').write_text('\n'.join(md), encoding='utf-8')

    print('\n=== REPORT ===')
    print(out_dir / 'LATEST.md')
    print(out_dir / 'LATEST.json')
    _, after = run(['git','status','--short'], root)
    print('\n=== GIT STATUS AFTER AUDIT ===')
    print(after if after.strip() else '(clean)')
    print('\nAUDIT HOAN TAT - KHONG SUA SOURCE.')

if __name__ == '__main__':
    raise SystemExit(main())
