#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET FIX 01C - E2E IDEMPOTENCY ISOLATION
NO BACKUP / NO MIGRATION / NO COMMIT / NO PUSH

Nguyên nhân:
- E2E dùng maYeuCau / maGiaoDich cố định qua nhiều lần chạy.
- DB validation hiện không drop toàn DB sau mỗi run, nên lịch sử Payment/Transaction cũ còn lại.
- Lần chạy sau đụng unique key hoặc idempotency key của customer cũ:
  + COD/MOCK positive path -> 403 "Idempotency key thuộc khách hàng khác"
  + callback fixture -> P2002 uk_payment_transaction_code

Fix:
- Mỗi Jest run dùng UUID/idempotency keys riêng.
- Retry trong CÙNG test vẫn dùng lại đúng key để kiểm tra idempotency thật.
- Callback refs cũng unique theo từng run.
- Không xóa lịch sử payment/ledger cũ.
- Không sửa business source.
- Chạy typecheck + 4 focused E2E.

Chạy tại root repo:
  python .\fix_agrimarket_01c_e2e_idempotency_isolation_nobackup.py
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
COD_TEST = "apps/api/test/cod-mock-payment.e2e-spec.ts"
CALLBACK_TEST = "apps/api/test/payment-callback-idempotency.e2e-spec.ts"

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
}

COD_MARKER = "AGRIMARKET-FIX01C-COD-RUN-UNIQUE"
CALLBACK_MARKER = "AGRIMARKET-FIX01C-CALLBACK-RUN-UNIQUE"

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
        raise RuntimeError(f"git {' '.join(args)} lỗi:\nSTDOUT:\n{out}\nSTDERR:\n{err}")
    return [x.strip().replace("\\", "/") for x in out.splitlines() if x.strip()]

def assert_scope(root: Path) -> None:
    rc, head, err = run(["git", "rev-parse", "--short", "HEAD"], root, 60)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise RuntimeError(f"HEAD={head!r}, yêu cầu baseline {EXPECTED_HEAD}. {err}")

    staged = git_lines(root, ["diff", "--cached", "--name-only"])
    if staged:
        raise RuntimeError("Có file staged; script không đụng staging area: " + ", ".join(staged))

    dirty = git_lines(root, ["diff", "--name-only"])
    unknown = [x for x in dirty if x not in KNOWN_TRACKED]
    if unknown:
        raise RuntimeError("Có tracked change ngoài Fix01: " + ", ".join(unknown))

    service = (root / "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts").read_text(
        encoding="utf-8"
    )
    if "AGRIMARKET-FIX01B-RESERVED-RECONCILE" not in service:
        raise RuntimeError("Chưa thấy Fix01B trong inventory service. Không patch tiếp.")

def replace_exact(text: str, old: str, new: str, expected: int, label: str) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: cần {expected} occurrence, thực tế {count}.")
    return text.replace(old, new)

def patch_cod_test(root: Path) -> None:
    path = root / COD_TEST
    text = path.read_text(encoding="utf-8")

    if COD_MARKER in text:
        print("↪ COD test đã có Fix01C, bỏ qua.")
        return

    anchor = """  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

"""
    block = """  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // AGRIMARKET-FIX01C-COD-RUN-UNIQUE
  // Mỗi test run phải có idempotency key riêng. Retry trong cùng run vẫn reuse key COD.
  const paymentRequestIds = {
    noAuth: randomUUID(),
    foreignOrder: randomUUID(),
    cod: randomUUID(),
    mockSuccess: randomUUID(),
    mockFail: randomUUID(),
    mockMissingResult: randomUUID(),
    codInvalidMock: randomUUID(),
  } as const;

  const paymentTransactionCode = (requestId: string) =>
    `PAY-${requestId.replaceAll('-', '').toUpperCase()}`;

"""
    if anchor not in text:
        raise RuntimeError("COD: không tìm thấy anchor suffix.")
    text = text.replace(anchor, block, 1)

    replacements = [
        ("'00000000-0000-4000-8000-000000000054'", "paymentRequestIds.noAuth", 1, "noAuth key"),
        ("'10000000-0000-4000-8000-000000000054'", "paymentRequestIds.foreignOrder", 1, "foreign key"),
        ("'20000000-0000-4000-8000-000000000054'", "paymentRequestIds.cod", 2, "COD key + retry"),
        ("'30000000-0000-4000-8000-000000000054'", "paymentRequestIds.mockSuccess", 1, "mock success key"),
        ("'40000000-0000-4000-8000-000000000054'", "paymentRequestIds.mockFail", 1, "mock fail key"),
        ("'50000000-0000-4000-8000-000000000054'", "paymentRequestIds.mockMissingResult", 1, "mock validation key"),
        ("'60000000-0000-4000-8000-000000000054'", "paymentRequestIds.codInvalidMock", 1, "COD invalid mock key"),
    ]
    for old, new, expected, label in replacements:
        text = replace_exact(text, old, new, expected, f"COD {label}")

    # Expected transaction code and retry lookup must follow the dynamic COD key.
    text = replace_exact(
        text,
        "'PAY-20000000000040008000000000000054'",
        "paymentTransactionCode(paymentRequestIds.cod)",
        2,
        "COD expected/retry transaction code",
    )

    path.write_text(text, encoding="utf-8", newline="\n")
    print("✓ patched:", COD_TEST)

def patch_callback_test(root: Path) -> None:
    path = root / CALLBACK_TEST
    text = path.read_text(encoding="utf-8")

    if CALLBACK_MARKER in text:
        print("↪ Callback test đã có Fix01C, bỏ qua.")
        return

    anchor = """  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

"""
    block = """  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // AGRIMARKET-FIX01C-CALLBACK-RUN-UNIQUE
  // Payment transaction code là unique toàn DB nên không được hard-code qua nhiều Jest run.
  const callbackRefs = {
    success: `CALLBACK-SUCCESS-056-${randomUUID()}`,
    failed: `CALLBACK-FAILED-056-${randomUUID()}`,
    guard: `CALLBACK-GUARD-056-${randomUUID()}`,
  } as const;

"""
    if anchor not in text:
        raise RuntimeError("Callback: không tìm thấy anchor suffix.")
    text = text.replace(anchor, block, 1)

    # Current test uses these refs both when creating fixture and when calling callback.
    replacements = [
        ("'CALLBACKSUCCESS056'", "callbackRefs.success", 3, "success ref"),
        ("'CALLBACKFAILED056'", "callbackRefs.failed", 2, "failed ref"),
        ("'CALLBACKGUARD056'", "callbackRefs.guard", 2, "guard ref"),
    ]
    for old, new, expected, label in replacements:
        text = replace_exact(text, old, new, expected, f"Callback {label}")

    path.write_text(text, encoding="utf-8", newline="\n")
    print("✓ patched:", CALLBACK_TEST)

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
    print(" AGRIMARKET FIX 01C - E2E IDEMPOTENCY ISOLATION - NO BACKUP")
    print("=" * 92)
    print("Repo:", root)

    try:
        assert_scope(root)
        patch_cod_test(root)
        patch_callback_test(root)

        print("\n=== GIT DIFF CHECK ===")
        rc, out, err = run(["git", "diff", "--check"], root, 120)
        if out:
            print(out)
        if err:
            print(err)
        if rc != 0:
            raise RuntimeError("git diff --check fail.")
        print("PASS")

        run_checked(
            root,
            ["pnpm", "--filter", "@agrimarket/api", "typecheck"],
            480,
        )

        run_checked(
            root,
            [
                "pnpm",
                "--filter",
                "@agrimarket/api",
                "exec",
                "node",
                "../../tools/run-jest-vm.mjs",
                "./test/jest-e2e.json",
                "test/dat-cho-ton-kho.e2e-spec.ts",
                "test/cod-mock-payment.e2e-spec.ts",
                "test/payment-callback-idempotency.e2e-spec.ts",
                "test/phieu-kho.e2e-spec.ts",
            ],
            900,
        )

        print("\n=== GIT STATUS ===")
        rc, out, err = run(["git", "status", "--short"], root, 120)
        print(out)
        if err:
            print(err)

        print("\n" + "=" * 92)
        print(" PASS - FIX01C + TYPECHECK + 4 FOCUSED E2E")
        print(" Không backup / Không migration / Không commit / Không push")
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
