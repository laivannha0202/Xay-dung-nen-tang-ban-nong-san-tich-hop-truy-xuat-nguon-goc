#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET - RECONCILE MIGRATION HISTORY + APPLY FIX01
NO BACKUP / CHECKSUM-GATED / NON-DESTRUCTIVE TO USER DATA

Mục tiêu:
- DB đã có migration 20260922064019... nhưng source mất folder.
- Khôi phục ĐÚNG migration cũ chỉ khi SHA-256 khớp checksum Prisma lưu trong DB.
- Tạo migration corrective để bỏ 3 cột của patch cũ không còn trong schema hiện tại.
- Giữ nguyên việc DROP DEFAULT refunds/adjustments vì schema hiện tại không khai báo @default.
- Giữ migration Fix01 20260922175000... hiện có.
- Chạy prisma migrate status -> deploy -> status.
- Chạy prisma validate -> generate -> API typecheck.
- Không commit, không push, không git reset, không xóa dữ liệu.

Chạy từ root repo:
  python .\fix_agrimarket_00_reconcile_migration_history_nobackup.py
"""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import uuid
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
MISSING_MIGRATION = "20260922064019_add_minimum_shelf_life_and_settlement_status"
CORRECTIVE_MIGRATION = "20260922170000_reconcile_abandoned_settlement_fefo_patch"
FIX01_MIGRATION = "20260922175000_payment_reservation_commit_before_shipment"

KNOWN_FIX01_TRACKED = {
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

def run(cmd: list[str], cwd: Path, timeout: int = 300) -> tuple[int, str, str]:
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
    for candidate in [p, *p.parents]:
        pkg = candidate / "package.json"
        if not pkg.exists():
            continue
        try:
            data = json.loads(pkg.read_text(encoding="utf-8"))
        except Exception:
            continue
        if data.get("name") == "agrimarket":
            return candidate
    raise SystemExit("Không tìm thấy root repo AgriMarket.")

def git_stdout_lines(root: Path, args: list[str]) -> list[str]:
    rc, out, err = run(["git", *args], root, 120)
    if rc != 0:
        raise RuntimeError(f"git {' '.join(args)} lỗi:\nSTDOUT:\n{out}\nSTDERR:\n{err}")
    return [x.strip().replace("\\", "/") for x in out.splitlines() if x.strip()]

def assert_git_scope(root: Path) -> None:
    rc, head, _ = run(["git", "rev-parse", "--short", "HEAD"], root, 60)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise RuntimeError(f"HEAD hiện tại {head!r}, yêu cầu baseline {EXPECTED_HEAD}.")

    staged = git_stdout_lines(root, ["diff", "--cached", "--name-only"])
    if staged:
        raise RuntimeError("Đang có file staged; dừng để không đụng staging area: " + ", ".join(staged))

    dirty = git_stdout_lines(root, ["diff", "--name-only"])
    unknown = [p for p in dirty if p not in KNOWN_FIX01_TRACKED]
    if unknown:
        raise RuntimeError(
            "Có tracked changes ngoài Fix01; không tự đụng: " + ", ".join(unknown)
        )

    if not dirty:
        raise RuntimeError(
            "Không thấy tracked diff của Fix01. Script này chỉ dùng sau khi Fix01 v5 đã patch."
        )

    print("Tracked changes hiện tại đều nằm trong phạm vi Fix01:")
    for p in dirty:
        print("  M", p)

def db_probe(root: Path) -> dict:
    api = root / "apps" / "api"
    temp = api / f".tmp-reconcile-{uuid.uuid4().hex}.mjs"

    js = r"""
import mariadb from 'mariadb';
import { config as loadDotenv } from 'dotenv';
import path from 'node:path';

loadDotenv();
loadDotenv({ path: path.resolve(process.cwd(), '..', '..', '.env') });

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error('Thiếu DATABASE_URL');

const u = new URL(raw);
const conn = await mariadb.createConnection({
  host: u.hostname,
  port: u.port ? Number(u.port) : 3306,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: decodeURIComponent(u.pathname.replace(/^\/+/, '')),
});

try {
  const migration = await conn.query(
    `SELECT migration_name, checksum, finished_at, rolled_back_at, logs
       FROM _prisma_migrations
      WHERE migration_name = ?
      ORDER BY started_at DESC
      LIMIT 1`,
    ['20260922064019_add_minimum_shelf_life_and_settlement_status'],
  );

  const columns = await conn.query(`
    SELECT TABLE_NAME AS tableName,
           COLUMN_NAME AS columnName,
           COLUMN_DEFAULT AS columnDefault,
           COLUMN_TYPE AS columnType,
           IS_NULLABLE AS isNullable
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND (
         (TABLE_NAME = 'settlement' AND COLUMN_NAME IN ('trangThai','refunds','adjustments'))
         OR
         (TABLE_NAME = 'system_settings' AND COLUMN_NAME IN ('minimum_shelf_life_days','seller_escrow_hours'))
         OR
         (TABLE_NAME = 'inventory_reservation' AND COLUMN_NAME IN ('trang_thai','xac_nhan_luc'))
       )
     ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);

  const out = {
    migration: migration.length ? {
      migration_name: migration[0].migration_name,
      checksum: migration[0].checksum,
      finished_at: migration[0].finished_at,
      rolled_back_at: migration[0].rolled_back_at,
      logs: migration[0].logs,
    } : null,
    columns: columns.map(r => ({
      tableName: r.tableName,
      columnName: r.columnName,
      columnDefault: r.columnDefault,
      columnType: r.columnType,
      isNullable: r.isNullable,
    })),
  };

  console.log('AGRIMARKET_DB_PROBE=' + JSON.stringify(out));
} finally {
  await conn.end();
}
"""
    temp.write_text(js, encoding="utf-8", newline="\n")
    try:
        rc, out, err = run(
            ["pnpm", "--filter", "@agrimarket/api", "exec", "node", str(temp)],
            root,
            120,
        )
        if rc != 0:
            raise RuntimeError(f"Không query được DB.\nSTDOUT:\n{out}\nSTDERR:\n{err}")
        marker = "AGRIMARKET_DB_PROBE="
        line = next((x for x in out.splitlines() if x.startswith(marker)), None)
        if not line:
            raise RuntimeError("DB probe không trả JSON marker.\n" + out)
        return json.loads(line[len(marker):])
    finally:
        try:
            temp.unlink()
        except FileNotFoundError:
            pass

def candidate_variants() -> list[tuple[str, bytes]]:
    base = """-- AlterTable
ALTER TABLE `settlement` ADD COLUMN `trangThai` ENUM('PENDING', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
    ALTER COLUMN `refunds` DROP DEFAULT,
    ALTER COLUMN `adjustments` DROP DEFAULT;

-- AlterTable
ALTER TABLE `system_settings` ADD COLUMN `minimum_shelf_life_days` INTEGER UNSIGNED NOT NULL DEFAULT 2,
    ADD COLUMN `seller_escrow_hours` INTEGER UNSIGNED NOT NULL DEFAULT 24;
"""
    no_comments = """ALTER TABLE `settlement` ADD COLUMN `trangThai` ENUM('PENDING', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
    ALTER COLUMN `refunds` DROP DEFAULT,
    ALTER COLUMN `adjustments` DROP DEFAULT;

ALTER TABLE `system_settings` ADD COLUMN `minimum_shelf_life_days` INTEGER UNSIGNED NOT NULL DEFAULT 2,
    ADD COLUMN `seller_escrow_hours` INTEGER UNSIGNED NOT NULL DEFAULT 24;
"""
    variants: list[tuple[str, bytes]] = []
    for label, text in [("prisma-standard", base), ("no-comments", no_comments)]:
        for final_nl in [True, False]:
            x = text if final_nl else text.rstrip("\n")
            variants.append((f"{label}-lf-finalnl-{final_nl}", x.encode("utf-8")))
            variants.append((f"{label}-crlf-finalnl-{final_nl}", x.replace("\n", "\r\n").encode("utf-8")))
    return variants

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def restore_missing_migration(root: Path, db_checksum: str) -> tuple[Path, str]:
    migdir = root / "apps/api/prisma/migrations" / MISSING_MIGRATION
    sqlpath = migdir / "migration.sql"

    if sqlpath.exists():
        data = sqlpath.read_bytes()
        current = sha(data)
        if current != db_checksum:
            raise RuntimeError(
                f"migration.sql local đã tồn tại nhưng checksum khác DB.\n"
                f"local={current}\ndb={db_checksum}"
            )
        print("✓ Missing migration đã tồn tại và checksum khớp DB.")
        return sqlpath, current

    matched = None
    for label, data in candidate_variants():
        if sha(data) == db_checksum:
            matched = (label, data)
            break

    if not matched:
        details = "\n".join(f"  {label}: {sha(data)}" for label, data in candidate_variants())
        raise RuntimeError(
            "Không thể khôi phục migration cũ một cách an toàn vì checksum DB "
            "không khớp các dạng SQL đã biết.\n"
            f"DB checksum: {db_checksum}\nCandidate checksums:\n{details}\n"
            "DỪNG, không sửa _prisma_migrations."
        )

    label, data = matched
    migdir.mkdir(parents=True, exist_ok=False)
    sqlpath.write_bytes(data)
    print(f"✓ Khôi phục migration cũ đúng checksum: {label}")
    print(f"  SHA256: {db_checksum}")
    return sqlpath, db_checksum

def assert_old_patch_shape(probe: dict) -> None:
    cols = {(x["tableName"], x["columnName"]): x for x in probe["columns"]}

    required = [
        ("settlement", "trangThai"),
        ("settlement", "refunds"),
        ("settlement", "adjustments"),
        ("system_settings", "minimum_shelf_life_days"),
        ("system_settings", "seller_escrow_hours"),
        ("inventory_reservation", "trang_thai"),
    ]
    missing = [f"{t}.{c}" for t, c in required if (t, c) not in cols]
    if missing:
        raise RuntimeError(
            "DB không có đúng shape của migration cũ; không tạo corrective migration: "
            + ", ".join(missing)
        )

    if str(cols[("system_settings", "minimum_shelf_life_days")]["columnDefault"]) not in {"2", "2.0"}:
        raise RuntimeError("minimum_shelf_life_days không có DEFAULT 2 như kỳ vọng.")
    if str(cols[("system_settings", "seller_escrow_hours")]["columnDefault"]) not in {"24", "24.0"}:
        raise RuntimeError("seller_escrow_hours không có DEFAULT 24 như kỳ vọng.")

    for c in ["refunds", "adjustments"]:
        default = cols[("settlement", c)]["columnDefault"]
        if default is not None:
            raise RuntimeError(
                f"settlement.{c} hiện vẫn có DEFAULT={default!r}; "
                "không tự suy diễn migration corrective."
            )

def create_corrective_migration(root: Path) -> Path:
    migdir = root / "apps/api/prisma/migrations" / CORRECTIVE_MIGRATION
    sqlpath = migdir / "migration.sql"
    content = """-- Reconcile abandoned local patch 20260922064019.
-- Keep DROP DEFAULT on settlement.refunds/adjustments because current Prisma
-- schema intentionally has no @default for those fields.
-- Remove only the three columns that are not present in the current source schema.

ALTER TABLE `settlement`
  DROP COLUMN `trangThai`;

ALTER TABLE `system_settings`
  DROP COLUMN `minimum_shelf_life_days`,
  DROP COLUMN `seller_escrow_hours`;
"""
    if sqlpath.exists():
        existing = sqlpath.read_text(encoding="utf-8")
        if existing != content:
            raise RuntimeError(
                f"Corrective migration đã tồn tại nhưng nội dung khác: {sqlpath}"
            )
        print("✓ Corrective migration đã tồn tại đúng nội dung.")
        return sqlpath

    migdir.mkdir(parents=True, exist_ok=False)
    sqlpath.write_text(content, encoding="utf-8", newline="\n")
    print("✓ Tạo corrective migration:", sqlpath.relative_to(root))
    return sqlpath

def assert_fix01_migration(root: Path) -> None:
    sqlpath = root / "apps/api/prisma/migrations" / FIX01_MIGRATION / "migration.sql"
    if not sqlpath.exists():
        raise RuntimeError(
            f"Thiếu Fix01 migration: {sqlpath.relative_to(root)}"
        )
    text = sqlpath.read_text(encoding="utf-8")
    required = ["DA_XAC_NHAN", "xac_nhan_luc", "inventory_reservation"]
    for x in required:
        if x not in text:
            raise RuntimeError(f"Fix01 migration thiếu token {x!r}.")

def pnpm(root: Path, args: list[str], timeout: int = 600) -> None:
    print("\n$ pnpm " + " ".join(args))
    rc, out, err = run(["pnpm", *args], root, timeout)
    if out:
        print(out)
    if err:
        print(err)
    if rc != 0:
        raise RuntimeError(f"Command thất bại exit={rc}: pnpm {' '.join(args)}")

def main() -> int:
    root = find_repo(Path.cwd())
    print("=" * 88)
    print(" AGRIMARKET - RECONCILE MIGRATION HISTORY + APPLY FIX01 - NO BACKUP")
    print("=" * 88)
    print("Repo:", root)

    try:
        assert_git_scope(root)

        print("\n=== DB PROBE TRƯỚC ===")
        probe = db_probe(root)
        print(json.dumps(probe, ensure_ascii=False, indent=2, default=str))

        mig = probe.get("migration")
        if not mig:
            raise RuntimeError(f"DB không có migration {MISSING_MIGRATION}.")
        if mig.get("rolled_back_at") is not None:
            raise RuntimeError("Migration cũ trong DB đã rolled_back; không tự reconcile.")
        if mig.get("finished_at") is None:
            raise RuntimeError("Migration cũ trong DB chưa finished; không tự reconcile.")
        checksum = (mig.get("checksum") or "").strip()
        if len(checksum) != 64:
            raise RuntimeError(f"Checksum DB không hợp lệ: {checksum!r}")

        assert_old_patch_shape(probe)
        restore_missing_migration(root, checksum)
        create_corrective_migration(root)
        assert_fix01_migration(root)

        print("\n=== PRISMA STATUS SAU RECONCILE FILESYSTEM ===")
        rc, out, err = run(
            ["pnpm", "--filter", "@agrimarket/api", "prisma:migrate:status"],
            root,
            240,
        )
        if out:
            print(out)
        if err:
            print(err)
        combined = out + "\n" + err
        if "not found locally in prisma/migrations" in combined:
            raise RuntimeError("Prisma vẫn báo có migration DB không tồn tại local.")
        if "local migration history and the migrations table" in combined.lower():
            raise RuntimeError("Migration history vẫn divergent sau reconcile.")

        print("\n=== APPLY PENDING MIGRATIONS ===")
        pnpm(root, ["--filter", "@agrimarket/api", "prisma:migrate:deploy"], 300)

        print("\n=== STATUS SAU DEPLOY ===")
        pnpm(root, ["--filter", "@agrimarket/api", "prisma:migrate:status"], 240)

        print("\n=== DB PROBE SAU ===")
        after = db_probe(root)
        print(json.dumps(after, ensure_ascii=False, indent=2, default=str))
        cols = {(x["tableName"], x["columnName"]): x for x in after["columns"]}

        forbidden = [
            ("settlement", "trangThai"),
            ("system_settings", "minimum_shelf_life_days"),
            ("system_settings", "seller_escrow_hours"),
        ]
        leftovers = [f"{t}.{c}" for t, c in forbidden if (t, c) in cols]
        if leftovers:
            raise RuntimeError("Corrective migration chưa bỏ hết cột cũ: " + ", ".join(leftovers))

        xac = cols.get(("inventory_reservation", "xac_nhan_luc"))
        state = cols.get(("inventory_reservation", "trang_thai"))
        if not xac:
            raise RuntimeError("Fix01 chưa tạo inventory_reservation.xac_nhan_luc.")
        if not state or "DA_XAC_NHAN" not in (state.get("columnType") or ""):
            raise RuntimeError("Fix01 chưa thêm DA_XAC_NHAN vào inventory_reservation.trang_thai.")

        print("\n=== VALIDATE / GENERATE / TYPECHECK ===")
        pnpm(root, ["--filter", "@agrimarket/api", "prisma:validate"], 180)
        pnpm(root, ["--filter", "@agrimarket/api", "prisma:generate"], 240)
        pnpm(root, ["--filter", "@agrimarket/api", "typecheck"], 480)

        print("\n=== GIT DIFF CHECK ===")
        rc, out, err = run(["git", "diff", "--check"], root, 120)
        if out:
            print(out)
        if err:
            print(err)
        if rc != 0:
            raise RuntimeError("git diff --check thất bại.")

        print("\n=== GIT STATUS ===")
        rc, out, err = run(["git", "status", "--short"], root, 120)
        print(out)
        if err:
            print(err)

        print("\n" + "=" * 88)
        print(" PASS - MIGRATION HISTORY ĐÃ RECONCILE + FIX01 ĐÃ APPLY")
        print(" - Không backup")
        print(" - Không reset DB")
        print(" - Không sửa/xóa _prisma_migrations thủ công")
        print(" - Không commit/push")
        print("=" * 88)
        return 0

    except Exception as e:
        print("\n" + "=" * 88)
        print(" DỪNG AN TOÀN")
        print("=" * 88)
        print(str(e))
        print("\nKhông chạy migrate reset. Không xóa _prisma_migrations thủ công.")
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
