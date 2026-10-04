#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AGRIMARKET FIX 01
Payment != Shipment / Reservation Commit Boundary

Baseline: dc7c663

Mục tiêu:
1) Payment success/COD chỉ COMMIT reservation, không ORDER_SHIP.
2) Thêm trạng thái reservation DA_XAC_NHAN.
3) TTL chỉ áp dụng DANG_GIU; reservation đã commit không bị expiry worker release.
4) Physical ORDER_SHIP chỉ xảy ra khi shipment PICKED_UP và tất cả supplier-order
   của parent order đã bắt đầu giao; đây là bước an toàn trung gian giữ inventory
   không oversell và tách Payment khỏi physical dispatch.
5) Release trước shipment cho phép cả DANG_GIU và DA_XAC_NHAN.
6) Sửa test hành vi liên quan.
7) Không migrate DB tự động, không commit, không push.

Chạy:
  python .\fix_agrimarket_01_payment_inventory_boundary.py

Tùy chọn:
  python .\fix_agrimarket_01_payment_inventory_boundary.py --verify

--verify chạy Prisma validate/generate, API typecheck và API unit tests.
Không chạy migrate dev/deploy.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

EXPECTED_HEAD = "dc7c663"
MIGRATION_DIR = "20260922175000_payment_reservation_commit_before_shipment"

def run(cmd: list[str], cwd: Path, timeout: int = 300) -> tuple[int, str]:
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
    out = (p.stdout or "") + (("\n" + p.stderr) if p.stderr else "")
    return p.returncode, out.strip()

def find_repo(start: Path) -> Path:
    p = start.resolve()
    for candidate in [p, *p.parents]:
        pkg = candidate / "package.json"
        if pkg.exists():
            try:
                data = json.loads(pkg.read_text(encoding="utf-8"))
                if data.get("name") == "agrimarket":
                    return candidate
            except Exception:
                pass
    raise SystemExit("Không tìm thấy root repo AgriMarket.")

def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def write(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8", newline="\n")

def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: cần đúng 1 pattern, thực tế {count}. Dừng để tránh sửa nhầm.")
    return text.replace(old, new, 1)

def replace_all_exact(text: str, old: str, new: str, expected: int, label: str) -> str:
    count = text.count(old)
    if count != expected:
        raise RuntimeError(f"{label}: cần {expected} pattern, thực tế {count}. Dừng để tránh sửa nhầm.")
    return text.replace(old, new)

def backup_file(root: Path, backup_root: Path, rel: str) -> None:
    src = root / rel
    dst = backup_root / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def tracked_tree_clean(root: Path) -> bool:
    rc1, _ = run(["git", "diff", "--quiet", "--"], root)
    rc2, _ = run(["git", "diff", "--cached", "--quiet", "--"], root)
    return rc1 == 0 and rc2 == 0

def patch_schema(root: Path, backup_root: Path) -> None:
    rel = "apps/api/prisma/schema.prisma"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        """enum TrangThaiDatChoTonKho {
  DANG_GIU
  DA_BAN
  DA_GIAI_PHONG
  HET_HAN
}""",
        """enum TrangThaiDatChoTonKho {
  DANG_GIU
  DA_XAC_NHAN
  DA_BAN
  DA_GIAI_PHONG
  HET_HAN
}""",
        "schema reservation enum",
    )

    text = replace_once(
        text,
        """  hetHanLuc   DateTime              @map("het_han_luc") @db.DateTime(3)
  ketThucLuc  DateTime?             @map("ket_thuc_luc") @db.DateTime(3)""",
        """  hetHanLuc   DateTime              @map("het_han_luc") @db.DateTime(3)
  xacNhanLuc  DateTime?             @map("xac_nhan_luc") @db.DateTime(3)
  ketThucLuc  DateTime?             @map("ket_thuc_luc") @db.DateTime(3)""",
        "schema reservation xacNhanLuc",
    )

    write(path, text)

def patch_inventory_service(root: Path, backup_root: Path) -> None:
    rel = "apps/api/src/modules/ton-kho/dat-cho-ton-kho.service.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        """import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';""",
        """import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';""",
        "inventory import ConflictException",
    )

    marker = """  async giaiPhong(id: string): Promise<KetQuaDatChoTonKho> {
    return (
      await this.ketThuc(
        id,
        TrangThaiDatChoTonKho.DA_GIAI_PHONG,
        LoaiGiaoDichTonKho.ORDER_RELEASE,
        false,
        false,
      )
    ).ketQua;
  }

"""
    commit_method = """  /**
   * Payment/COD chỉ xác nhận quyền giữ hàng cho Order.
   * Không giảm onHand, không tạo ORDER_SHIP, không tạo PXK.
   * Reservation đã DA_XAC_NHAN không còn bị TTL worker hết hạn.
   */
  async xacNhanThanhToan(id: string): Promise<KetQuaDatChoTonKho> {
    await this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<Array<{ id: string }>>(
          Prisma.sql`
            SELECT id
            FROM inventory_reservation
            WHERE id = ${id}
            FOR UPDATE
          `,
        );

        if (locked.length !== 1) {
          throw new NotFoundException('Không tìm thấy inventory reservation.');
        }

        const reservation = await tx.datChoTonKho.findUniqueOrThrow({
          where: { id },
          select: {
            trangThai: true,
          },
        });

        if (
          reservation.trangThai === TrangThaiDatChoTonKho.DA_XAC_NHAN ||
          reservation.trangThai === TrangThaiDatChoTonKho.DA_BAN
        ) {
          return;
        }

        if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
          throw new ConflictException(
            `Không thể commit reservation từ trạng thái ${reservation.trangThai}.`,
          );
        }

        await tx.datChoTonKho.update({
          where: { id },
          data: {
            trangThai: TrangThaiDatChoTonKho.DA_XAC_NHAN,
            xacNhanLuc: new Date(),
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 20_000,
      },
    );

    return this.layKetQua(id);
  }

"""
    text = replace_once(text, marker, commit_method + marker, "insert xacNhanThanhToan")

    marker2 = """  async xacNhanDaBan(id: string): Promise<KetQuaDatChoTonKho> {
    return (
      await this.ketThuc(
        id,
        TrangThaiDatChoTonKho.DA_BAN,
        LoaiGiaoDichTonKho.ORDER_SHIP,
        true,
        false,
      )
    ).ketQua;
  }

"""
    replacement2 = marker2 + """  /**
   * Physical dispatch trong transaction shipment.
   * Chỉ hợp lệ khi Payment/COD đã commit reservation (DA_XAC_NHAN).
   * Nếu đã DA_BAN thì coi là idempotent; trạng thái khác là xung đột nghiệp vụ.
   */
  async xacNhanDaBanTrongTransaction(
    tx: Prisma.TransactionClient,
    id: string,
  ): Promise<boolean> {
    const changed = await this.ketThucTrongTransaction(
      tx,
      id,
      TrangThaiDatChoTonKho.DA_BAN,
      LoaiGiaoDichTonKho.ORDER_SHIP,
      true,
      false,
    );

    if (changed) {
      return true;
    }

    const current = await tx.datChoTonKho.findUnique({
      where: { id },
      select: { trangThai: true },
    });

    if (current?.trangThai === TrangThaiDatChoTonKho.DA_BAN) {
      return false;
    }

    throw new ConflictException(
      `Không thể ORDER_SHIP reservation từ trạng thái ${current?.trangThai ?? 'KHONG_TON_TAI'}.`,
    );
  }

"""
    text = replace_once(text, marker2, replacement2, "insert xacNhanDaBanTrongTransaction")

    old_guard = """    if (reservation.trangThai !== TrangThaiDatChoTonKho.DANG_GIU) {
      return false;
    }

    if (chiKhiHetHan && reservation.hetHanLuc.getTime() > Date.now()) {
      return false;
    }
"""
    new_guard = """    const trangThaiChoPhep = new Set<TrangThaiDatChoTonKho>(
      trangThaiMoi === TrangThaiDatChoTonKho.DA_BAN
        ? [TrangThaiDatChoTonKho.DA_XAC_NHAN]
        : chiKhiHetHan
          ? [TrangThaiDatChoTonKho.DANG_GIU]
          : [
              TrangThaiDatChoTonKho.DANG_GIU,
              TrangThaiDatChoTonKho.DA_XAC_NHAN,
            ],
    );

    if (!trangThaiChoPhep.has(reservation.trangThai)) {
      return false;
    }

    if (chiKhiHetHan && reservation.hetHanLuc.getTime() > Date.now()) {
      return false;
    }
"""
    text = replace_once(text, old_guard, new_guard, "reservation terminal guard")

    write(path, text)

def patch_payment_service(root: Path, backup_root: Path) -> None:
    rel = "apps/api/src/modules/thanh-toan/thanh-toan.service.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        "type HanhDongTonKho = 'SOLD' | 'RELEASE';",
        "type HanhDongTonKho = 'COMMIT' | 'RELEASE';",
        "payment action type",
    )

    text = replace_all_exact(text, "'SOLD'", "'COMMIT'", 3, "payment SOLD->COMMIT")

    text = replace_once(
        text,
        """          await this.datChoTonKhoService.xacNhanDaBan(
            reservation.id,
          );""",
        """          await this.datChoTonKhoService.xacNhanThanhToan(
            reservation.id,
          );""",
        "payment success commit method",
    )

    text = replace_once(
        text,
        """          reservation.trangThai !==
          TrangThaiDatChoTonKho.DA_BAN
        ) {
          throw new BadRequestException(
            `Không thể commit inventory từ trạng thái ${reservation.trangThai}.`,
          );
        }""",
        """          reservation.trangThai !==
            TrangThaiDatChoTonKho.DA_XAC_NHAN &&
          reservation.trangThai !==
            TrangThaiDatChoTonKho.DA_BAN
        ) {
          throw new BadRequestException(
            `Không thể commit reservation từ trạng thái ${reservation.trangThai}.`,
          );
        }""",
        "payment existing committed state",
    )

    text = text.replace(
        "// Payment được chấp nhận (PAID hoặc COD=PENDING nhưng hàng đã commit)",
        "// Payment được chấp nhận (PAID hoặc COD=PENDING) chỉ commit reservation, chưa xuất kho",
    )

    write(path, text)

def patch_callback_service(root: Path, backup_root: Path) -> None:
    rel = "apps/api/src/modules/thanh-toan/thanh-toan-callback.service.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        """      const result = await this.datChoTonKhoService.xacNhanDaBan(reservation.id);
      if (result.trangThai !== TrangThaiDatChoTonKho.DA_BAN) {
        throw new ConflictException(
          `Callback success xung đột reservation state ${result.trangThai}.`,
        );
      }""",
        """      const result = await this.datChoTonKhoService.xacNhanThanhToan(reservation.id);
      if (result.trangThai !== TrangThaiDatChoTonKho.DA_XAC_NHAN) {
        throw new ConflictException(
          `Callback success xung đột reservation state ${result.trangThai}.`,
        );
      }""",
        "callback success must commit not ship",
    )

    write(path, text)

def patch_shipping_service(root: Path, backup_root: Path) -> None:
    rel = "apps/api/src/modules/giao-hang/giao-hang.service.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        """import { ShippingAdapterRegistry } from './adapter/shipping-adapter.registry';""",
        """import { DatChoTonKhoService } from '../ton-kho/dat-cho-ton-kho.service';
import { ShippingAdapterRegistry } from './adapter/shipping-adapter.registry';""",
        "shipping import inventory service",
    )

    text = replace_once(
        text,
        """  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingAdapterRegistry: ShippingAdapterRegistry,
  ) {}""",
        """  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingAdapterRegistry: ShippingAdapterRegistry,
    private readonly datChoTonKhoService: DatChoTonKhoService,
  ) {}""",
        "shipping constructor inventory service",
    )

    text = replace_once(
        text,
        """        donHangNhaCungCap: {
          select: {
            id: true,
            donHangId: true,
            trangThai: true,
          },
        },""",
        """        donHangNhaCungCap: {
          select: {
            id: true,
            donHangId: true,
            trangThai: true,
            donHang: {
              select: {
                maDonHang: true,
              },
            },
          },
        },""",
        "shipping current select parent order number",
    )

    needle = """        await tx.donHang.updateMany({
          where: {
            id: current.donHangNhaCungCap.donHangId,
            trangThai: {
              in: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
              ],
            },
          },
          data: {
            trangThai: TrangThaiDonHang.DANG_GIAO,
          },
        });
      }
"""
    replacement = """        await tx.donHang.updateMany({
          where: {
            id: current.donHangNhaCungCap.donHangId,
            trangThai: {
              in: [
                TrangThaiDonHang.DA_DONG_GOI,
                TrangThaiDonHang.DANG_GIAO,
              ],
            },
          },
          data: {
            trangThai: TrangThaiDonHang.DANG_GIAO,
          },
        });

        // Physical inventory chỉ rời kho khi carrier đã PICKED_UP.
        // Reservation hiện là cấp Order-wide; để không xuất cả order quá sớm ở
        // đơn nhiều NCC, chỉ ORDER_SHIP khi tất cả supplier-order đã bắt đầu giao.
        // reserved vẫn giữ hàng unavailable trong thời gian chờ các kiện còn lại.
        if (dto.trangThai === TrangThaiVanChuyen.PICKED_UP) {
          const chuaBatDauGiao = await tx.donHangNhaCungCap.count({
            where: {
              donHangId: current.donHangNhaCungCap.donHangId,
              trangThai: {
                notIn: [
                  TrangThaiDonHang.DANG_GIAO,
                  TrangThaiDonHang.DA_GIAO,
                  TrangThaiDonHang.HOAN_THANH,
                ],
              },
            },
          });

          if (chuaBatDauGiao === 0) {
            const reservation = await tx.datChoTonKho.findUnique({
              where: {
                maThamChieu: `ORDER:${current.donHangNhaCungCap.donHang.maDonHang}`,
              },
              select: { id: true },
            });

            if (!reservation) {
              throw new BadRequestException(
                'Không tìm thấy inventory reservation để xuất kho khi carrier nhận hàng.',
              );
            }

            await this.datChoTonKhoService.xacNhanDaBanTrongTransaction(
              tx,
              reservation.id,
            );
          }
        }
      }
"""
    text = replace_once(text, needle, replacement, "ship physical inventory on PICKED_UP")

    write(path, text)

def patch_shipping_module(root: Path, backup_root: Path) -> None:
    rel = "apps/api/src/modules/giao-hang/giao-hang.module.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        """import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';""",
        """import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';""",
        "shipping module import TonKhoModule",
    )

    text = replace_once(
        text,
        "imports: [PrismaModule, XacThucModule, PhanQuyenModule],",
        "imports: [PrismaModule, XacThucModule, PhanQuyenModule, TonKhoModule],",
        "shipping module imports array",
    )

    write(path, text)

def patch_tests(root: Path, backup_root: Path) -> None:
    # COD + MOCK payment behavior
    rel = "apps/api/test/cod-mock-payment.e2e-spec.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)

    text = replace_once(
        text,
        "it('COD: amount từ Order, payment PENDING và reservation chuyển DA_BAN', async () => {",
        "it('COD: payment PENDING chỉ commit reservation, chưa ORDER_SHIP', async () => {",
        "COD test title",
    )
    text = replace_all_exact(
        text,
        "TrangThaiDatChoTonKho.DA_BAN",
        "TrangThaiDatChoTonKho.DA_XAC_NHAN",
        2,
        "COD/MOCK committed reservation expectations",
    )
    text = replace_once(text, "expect(Number(inventory.onHand)).toBe(9);", "expect(Number(inventory.onHand)).toBe(10);", "COD onHand")
    text = replace_once(text, "expect(Number(inventory.reserved)).toBe(2);", "expect(Number(inventory.reserved)).toBe(3);", "COD reserved")
    text = replace_once(text, ").resolves.toBe(1);", ").resolves.toBe(0);", "COD ORDER_SHIP count")
    text = replace_once(text, "expect(Number(inventory.onHand)).toBe(8);", "expect(Number(inventory.onHand)).toBe(10);", "MOCK success onHand")
    text = replace_once(text, "expect(Number(inventory.reserved)).toBe(1);", "expect(Number(inventory.reserved)).toBe(3);", "MOCK success reserved")
    text = replace_once(text, "expect(Number(inventory.onHand)).toBe(8);", "expect(Number(inventory.onHand)).toBe(10);", "MOCK fail onHand")
    text = replace_once(text, "expect(Number(inventory.reserved)).toBe(0);", "expect(Number(inventory.reserved)).toBe(2);", "MOCK fail reserved")
    write(path, text)

    # Callback behavior
    rel = "apps/api/test/payment-callback-idempotency.e2e-spec.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)
    text = replace_once(
        text,
        "it('5 callback success đồng thời chỉ ghi nhận một ORDER_SHIP và không duplicate transaction', async () => {",
        "it('5 callback success đồng thời chỉ commit reservation, không ORDER_SHIP và không duplicate transaction', async () => {",
        "callback test title",
    )
    text = replace_all_exact(
        text,
        "TrangThaiDatChoTonKho.DA_BAN",
        "TrangThaiDatChoTonKho.DA_XAC_NHAN",
        1,
        "callback committed reservation expectation",
    )
    text = replace_all_exact(
        text,
        ").resolves.toBe(1);",
        ").resolves.toBe(0);",
        2,
        "callback ORDER_SHIP must stay zero",
    )
    write(path, text)

    # Reservation service behavior
    rel = "apps/api/test/dat-cho-ton-kho.e2e-spec.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)
    old = """    expect(result.phanBo[0]?.tonKhoLoId).toBe(ids.inventoryEarly);

    const sold = await service.xacNhanDaBan(result.id);
    expect(sold.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);

    const early = await prisma.tonKhoLo.findUniqueOrThrow({
"""
    new = """    expect(result.phanBo[0]?.tonKhoLoId).toBe(ids.inventoryEarly);

    const committed = await service.xacNhanThanhToan(result.id);
    expect(committed.trangThai).toBe(TrangThaiDatChoTonKho.DA_XAC_NHAN);

    const beforeShip = await prisma.tonKhoLo.findUniqueOrThrow({
      where: { id: ids.inventoryEarly },
    });
    expect(Number(beforeShip.onHand)).toBe(1);
    expect(Number(beforeShip.reserved)).toBe(1);

    const sold = await service.xacNhanDaBan(result.id);
    expect(sold.trangThai).toBe(TrangThaiDatChoTonKho.DA_BAN);

    const early = await prisma.tonKhoLo.findUniqueOrThrow({
"""
    text = replace_once(text, old, new, "reservation commit then ship test")
    text = text.replace(
        "it('sold chuyển reserved thành onHand giảm và ghi ORDER_SHIP', async () => {",
        "it('commit không giảm kho; physical ship mới giảm reserved/onHand và ghi ORDER_SHIP', async () => {",
    )
    write(path, text)

    # Warehouse PXK behavior
    rel = "apps/api/test/phieu-kho.e2e-spec.ts"
    path = root / rel
    backup_file(root, backup_root, rel)
    text = read(path)
    text = replace_once(
        text,
        """    await datChoTonKho.xacNhanDaBan(reservation.id);

    const docs = await prisma.phieuKho.findMany({""",
        """    await datChoTonKho.xacNhanThanhToan(reservation.id);
    await datChoTonKho.xacNhanDaBan(reservation.id);

    const docs = await prisma.phieuKho.findMany({""",
        "warehouse test must commit before ship",
    )
    write(path, text)

def patch_ui_labels(root: Path, backup_root: Path) -> None:
    targets = [
        (
            "packages/api-client/src/domain-ui.ts",
            "  DANG_GIU: { label: 'Đang giữ hàng', tone: 'warning' },\n  DA_BAN:",
            "  DANG_GIU: { label: 'Đang giữ hàng', tone: 'warning' },\n"
            "  DA_XAC_NHAN: { label: 'Đã xác nhận giữ hàng', tone: 'info' },\n"
            "  DA_BAN:",
            "api-client reservation label",
        ),
        (
            "apps/admin-web/src/app/don-hang/page.tsx",
            "  DANG_GIU: { text: 'Đang giữ hàng', color: 'gold' },\n  DA_BAN:",
            "  DANG_GIU: { text: 'Đang giữ hàng', color: 'gold' },\n"
            "  DA_XAC_NHAN: { text: 'Đã xác nhận giữ hàng', color: 'blue' },\n"
            "  DA_BAN:",
            "admin reservation label",
        ),
        (
            "apps/mobile/src/app/don-hang/[id].tsx",
            "    DANG_GIU: 'Đang giữ tồn',\n    DA_BAN:",
            "    DANG_GIU: 'Đang giữ tồn',\n"
            "    DA_XAC_NHAN: 'Đã xác nhận giữ hàng',\n"
            "    DA_BAN:",
            "mobile reservation label",
        ),
    ]
    for rel, old, new, label in targets:
        path = root / rel
        backup_file(root, backup_root, rel)
        text = read(path)
        text = replace_once(text, old, new, label)
        write(path, text)

def create_migration(root: Path) -> Path:
    migration = root / "apps/api/prisma/migrations" / MIGRATION_DIR / "migration.sql"
    if migration.exists():
        raise RuntimeError(f"Migration đã tồn tại: {migration}")
    migration.parent.mkdir(parents=True, exist_ok=False)
    sql = """-- AgriMarket: Payment success commits reservation but does not physically ship stock.
-- Physical ORDER_SHIP remains a separate shipment/warehouse event.

ALTER TABLE `inventory_reservation`
  MODIFY COLUMN `trang_thai`
    ENUM('DANG_GIU', 'DA_XAC_NHAN', 'DA_BAN', 'DA_GIAI_PHONG', 'HET_HAN')
    NOT NULL DEFAULT 'DANG_GIU',
  ADD COLUMN `xac_nhan_luc` DATETIME(3) NULL AFTER `het_han_luc`;
"""
    write(migration, sql)
    return migration

def verify(root: Path) -> dict:
    commands = [
        ("prisma_validate", ["pnpm", "--filter", "@agrimarket/api", "prisma:validate"], 180),
        ("prisma_generate", ["pnpm", "--filter", "@agrimarket/api", "prisma:generate"], 240),
        ("api_typecheck", ["pnpm", "--filter", "@agrimarket/api", "typecheck"], 360),
        ("api_unit", ["pnpm", "--filter", "@agrimarket/api", "test:unit"], 600),
    ]
    result = {}
    for name, cmd, timeout in commands:
        rc, out = run(cmd, root, timeout=timeout)
        result[name] = {"exit_code": rc, "output": out}
        print(f"{name}: exit={rc}")
    return result

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    root = find_repo(Path.cwd())
    print("=" * 82)
    print(" AGRIMARKET FIX 01 - PAYMENT != SHIPMENT")
    print(" Reservation COMMIT riêng, ORDER_SHIP riêng")
    print("=" * 82)
    print("Repo:", root)

    rc, head = run(["git", "rev-parse", "--short", "HEAD"], root)
    if rc != 0 or not head.startswith(EXPECTED_HEAD):
        raise SystemExit(f"DỪNG: HEAD={head!r}, yêu cầu baseline {EXPECTED_HEAD}.")

    if not tracked_tree_clean(root):
        raise SystemExit(
            "DỪNG: tracked working tree đang có thay đổi. "
            "Script chỉ chạy trên baseline tracked sạch để tránh ghi đè sửa tay."
        )

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_root = root / ".agrimarket-backup" / f"fix01-payment-boundary-{stamp}"
    backup_root.mkdir(parents=True, exist_ok=False)

    print("Backup:", backup_root)

    try:
        patch_schema(root, backup_root)
        print("✓ schema.prisma")

        patch_inventory_service(root, backup_root)
        print("✓ dat-cho-ton-kho.service.ts")

        patch_payment_service(root, backup_root)
        print("✓ thanh-toan.service.ts")

        patch_callback_service(root, backup_root)
        print("✓ thanh-toan-callback.service.ts")

        patch_shipping_service(root, backup_root)
        print("✓ giao-hang.service.ts")

        patch_shipping_module(root, backup_root)
        print("✓ giao-hang.module.ts")

        patch_tests(root, backup_root)
        print("✓ focused tests")

        patch_ui_labels(root, backup_root)
        print("✓ UI reservation labels")

        migration = create_migration(root)
        print("✓ migration:", migration.relative_to(root))

    except Exception as e:
        print("\nLỖI PATCH:", e)
        print("Backup đã tạo tại:", backup_root)
        print(
            "Script dừng ngay để không tiếp tục sửa bừa. "
            "KHÔNG tự reset; hãy gửi output này để kiểm tra."
        )
        return 2

    rc_check, out_check = run(["git", "diff", "--check"], root)
    print("\n=== GIT DIFF CHECK ===")
    print("PASS" if rc_check == 0 else f"FAIL exit={rc_check}")
    if out_check:
        print(out_check)

    verify_result = None
    if args.verify:
        print("\n=== VERIFY ===")
        verify_result = verify(root)

    rc_status, status = run(["git", "status", "--short"], root)
    _, stat = run(["git", "diff", "--stat"], root)

    report = {
        "baseline": EXPECTED_HEAD,
        "backup": str(backup_root),
        "migration": MIGRATION_DIR,
        "git_diff_check": rc_check,
        "verification": verify_result,
        "git_status_short": status,
        "git_diff_stat": stat,
        "notes": [
            "Không chạy migrate dev/deploy.",
            "Không commit/push.",
            "Payment success/COD -> DA_XAC_NHAN, không ORDER_SHIP.",
            "ORDER_SHIP được chuyển sang shipment PICKED_UP khi mọi supplier-order đã bắt đầu giao.",
            "Đây là bước 01; settlement/refund/FEFO chưa được sửa trong script này.",
        ],
    }
    report_path = backup_root / "REPORT.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n=== GIT STATUS ===")
    print(status or "(clean)")
    print("\n=== DIFF STAT ===")
    print(stat or "(no diff)")
    print("\n=== REPORT ===")
    print(report_path)

    print("\nQUAN TRỌNG:")
    print("- Chưa apply migration vào DB.")
    print("- Chưa commit/push.")
    print("- Hãy gửi output + git diff --stat trước khi chạy migration.")
    return 0 if rc_check == 0 else 3

if __name__ == "__main__":
    raise SystemExit(main())
