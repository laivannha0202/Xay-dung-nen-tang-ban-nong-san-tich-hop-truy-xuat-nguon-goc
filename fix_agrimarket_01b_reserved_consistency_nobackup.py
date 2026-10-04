#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET FIX 01B - RESERVED CONSISTENCY SELF-HEAL
NO BACKUP / NO MIGRATION / NO COMMIT / NO PUSH

Sửa lỗi focused E2E:
- datCho() gọi giaiPhongHetHanDaQua()
- DB local còn reservation legacy DANG_GIU nhưng inventory_lot.reserved đã lệch
- một row lệch làm toàn bộ reservation mới fail "Reserved inventory nhỏ hơn reservation item."

Giải pháp:
- Trước terminal transition (release/expire/ship), row-lock inventory lot đã có sẵn.
- Tính lại reserved kỳ vọng từ các reservation ACTIVE:
    DANG_GIU + DA_XAC_NHAN
- Nếu counter inventory_lot.reserved lệch, tự đồng bộ về tổng active reservation.
- Sau đó mới release/ship.
- Có Logger warning để không "nuốt" drift im lặng.
- Thêm E2E regression cho dữ liệu legacy lệch.
- Chạy API typecheck + 4 focused E2E.

Chạy tại root repo:
  python .\fix_agrimarket_01b_reserved_consistency_nobackup.py
"""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
SERVICE_REL = "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts"
TEST_REL = "apps/api/test/dat-cho-ton-kho.e2e-spec.ts"

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

MARKER = "AGRIMARKET-FIX01B-RESERVED-RECONCILE"

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

def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        raise RuntimeError(f"{label}: cần đúng 1 pattern, thực tế {n}.")
    return text.replace(old, new, 1)

def assert_scope(root: Path) -> None:
    rc, head, err = run(["git", "rev-parse", "--short", "HEAD"], root, 60)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise RuntimeError(f"HEAD={head!r}, yêu cầu baseline {EXPECTED_HEAD}. {err}")

    staged = git_lines(root, ["diff", "--cached", "--name-only"])
    if staged:
        raise RuntimeError("Có file staged; dừng: " + ", ".join(staged))

    dirty = git_lines(root, ["diff", "--name-only"])
    unknown = [x for x in dirty if x not in KNOWN_TRACKED]
    if unknown:
        raise RuntimeError("Có tracked change ngoài Fix01: " + ", ".join(unknown))

    service = (root / SERVICE_REL).read_text(encoding="utf-8")
    required = [
        "TrangThaiDatChoTonKho.DA_XAC_NHAN",
        "async xacNhanThanhToan(",
        "async xacNhanDaBanTrongTransaction(",
    ]
    missing = [x for x in required if x not in service]
    if missing:
        raise RuntimeError(
            "Source chưa ở trạng thái Fix01 v5. Thiếu: " + ", ".join(missing)
        )

def patch_service(root: Path) -> None:
    path = root / SERVICE_REL
    text = path.read_text(encoding="utf-8")

    if MARKER in text:
        print("↪ service đã có Fix01B, bỏ qua patch.")
        return

    text = replace_once(
        text,
        """  ConflictException,
  Injectable,
  NotFoundException,""",
        """  ConflictException,
  Injectable,
  Logger,
  NotFoundException,""",
        "import Logger",
    )

    text = replace_once(
        text,
        """@Injectable()
export class DatChoTonKhoService {
  constructor(""",
        f"""@Injectable()
export class DatChoTonKhoService {{
  // {MARKER}
  private readonly logger = new Logger(DatChoTonKhoService.name);

  constructor(""",
        "logger field",
    )

    old_guard = """      const row = rows[0]!;
      const qty = Number(muc.soLuong);

      if (Number(row.reserved) + 1e-9 < qty) {
        throw new BadRequestException('Reserved inventory nhỏ hơn reservation item.');
      }

      if (truOnHand && Number(row.onHand) + 1e-9 < qty) {
"""
    new_guard = """      const row = rows[0]!;
      const qty = Number(muc.soLuong);

      // Counter reserved là dữ liệu dẫn xuất từ reservation ACTIVE.
      // Legacy/test data có thể để counter lệch; nếu để một row lệch throw tại đây
      // thì giaiPhongHetHanDaQua() sẽ làm toàn bộ checkout/reservation mới bị chặn.
      // Row inventory_lot đang FOR UPDATE nên có thể reconcile atomic trước terminal transition.
      const reservedKyVong = await this.tinhReservedHoatDongTrongTransaction(
        tx,
        muc.tonKhoLoId,
      );
      const reservedHienTai = this.soLuong(Number(row.reserved));

      if (Math.abs(reservedHienTai - reservedKyVong) > 1e-9) {
        await tx.tonKhoLo.update({
          where: { id: muc.tonKhoLoId },
          data: {
            reserved: reservedKyVong,
          },
        });

        this.logger.warn(
          `[RESERVATION_RECONCILE] tonKhoLo=${muc.tonKhoLoId} reserved ${reservedHienTai} -> ${reservedKyVong}`,
        );
      }

      if (reservedKyVong + 1e-9 < qty) {
        throw new BadRequestException(
          'Tổng reservation ACTIVE nhỏ hơn reservation item đang kết thúc.',
        );
      }

      if (truOnHand && Number(row.onHand) + 1e-9 < qty) {
"""
    text = replace_once(text, old_guard, new_guard, "reserved invariant guard")

    method_anchor = """  private async lockFefoRows(
    tx: Prisma.TransactionClient,
    bienTheSanPhamId: string,
"""
    method = """  /**
   * Tổng reserved chuẩn = tổng item thuộc reservation còn ACTIVE.
   * DANG_GIU: checkout chưa commit payment.
   * DA_XAC_NHAN: payment/COD đã commit quyền giữ hàng, chưa physical shipment.
   */
  private async tinhReservedHoatDongTrongTransaction(
    tx: Prisma.TransactionClient,
    tonKhoLoId: string,
  ): Promise<number> {
    const rows = await tx.$queryRaw<Array<{ reservedKyVong: Prisma.Decimal }>>(
      Prisma.sql`
        SELECT COALESCE(SUM(item.so_luong), 0) AS reservedKyVong
        FROM inventory_reservation_item AS item
        INNER JOIN inventory_reservation AS reservation
          ON reservation.id = item.dat_cho_ton_kho_id
        WHERE item.ton_kho_lo_id = ${tonKhoLoId}
          AND reservation.trang_thai IN ('DANG_GIU', 'DA_XAC_NHAN')
      `,
    );

    return this.soLuong(Number(rows[0]?.reservedKyVong ?? 0));
  }

"""
    text = replace_once(
        text,
        method_anchor,
        method + method_anchor,
        "insert active reserved calculator",
    )

    path.write_text(text, encoding="utf-8", newline="\n")
    print("✓ patched:", SERVICE_REL)

def patch_test(root: Path) -> None:
    path = root / TEST_REL
    text = path.read_text(encoding="utf-8")
    marker = "legacy reserved counter lệch được reconcile"

    if marker in text:
        print("↪ regression test đã có, bỏ qua.")
        return

    anchor = """  it('TTL hết hạn tự/lazy release reserved và đánh dấu HET_HAN', async () => {
"""
    test = """  it('legacy reserved counter lệch được reconcile trước khi release hết hạn', async () => {
    const result = await service.datCho({
      maThamChieu: `P50-LEGACY-DRIFT-${suffix}`,
      items: [
        {
          bienTheSanPhamId: ids.variantMain,
          soLuong: 1,
        },
      ],
      ttlMs: 60_000,
    });

    const allocation = result.phanBo[0];
    if (!allocation) {
      throw new Error('Thiếu allocation cho regression legacy drift.');
    }

    // Mô phỏng dữ liệu cũ: reservation vẫn ACTIVE nhưng counter reserved bị lệch về 0.
    await prisma.tonKhoLo.update({
      where: { id: allocation.tonKhoLoId },
      data: { reserved: 0 },
    });
    await prisma.datChoTonKho.update({
      where: { id: result.id },
      data: { hetHanLuc: new Date(Date.now() - 1_000) },
    });

    await service.giaiPhongHetHanDaQua();

    const [reservation, inventory] = await Promise.all([
      prisma.datChoTonKho.findUniqueOrThrow({
        where: { id: result.id },
      }),
      prisma.tonKhoLo.findUniqueOrThrow({
        where: { id: allocation.tonKhoLoId },
      }),
    ]);

    expect(reservation.trangThai).toBe(TrangThaiDatChoTonKho.HET_HAN);
    expect(Number(inventory.reserved)).toBe(0);

    await expect(
      prisma.giaoDichTonKho.count({
        where: {
          tonKhoLoId: allocation.tonKhoLoId,
          loai: LoaiGiaoDichTonKho.ORDER_RELEASE,
        },
      }),
    ).resolves.toBeGreaterThanOrEqual(1);
  });

"""
    text = replace_once(text, anchor, test + anchor, "insert legacy drift regression")
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
    print("=" * 88)
    print(" AGRIMARKET FIX 01B - RESERVED CONSISTENCY SELF-HEAL - NO BACKUP")
    print("=" * 88)
    print("Repo:", root)

    try:
        assert_scope(root)
        patch_service(root)
        patch_test(root)

        rc, out, err = run(["git", "diff", "--check"], root, 120)
        print("\n=== GIT DIFF CHECK ===")
        print("PASS" if rc == 0 else f"FAIL exit={rc}")
        if out:
            print(out)
        if err:
            print(err)
        if rc != 0:
            raise RuntimeError("git diff --check fail.")

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

        print("\n=== STATUS ===")
        rc, out, err = run(["git", "status", "--short"], root, 120)
        print(out)
        if err:
            print(err)

        print("\n" + "=" * 88)
        print(" PASS - FIX01B + TYPECHECK + FOCUSED E2E")
        print(" Không backup / Không migration / Không commit / Không push")
        print("=" * 88)
        return 0

    except Exception as e:
        print("\n" + "=" * 88)
        print(" DỪNG - CHƯA COMMIT/PUSH")
        print("=" * 88)
        print(str(e))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
