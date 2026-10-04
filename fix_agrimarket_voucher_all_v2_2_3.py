#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket - tự động nâng cấp Voucher + Điểm thưởng theo logic sàn TMĐT.

Mục tiêu thiết kế:
- Khách săn/lưu voucher từ trang Khuyến mãi.
- Có "Kho voucher" trong tài khoản.
- Checkout ưu tiên chọn voucher đã lưu; nhập mã thủ công chỉ là phương án phụ.
- Backend kiểm tra voucher theo từng khách hàng, không chỉ đếm lượt toàn hệ thống.
- Voucher dùng được ghi nhận cùng transaction tạo đơn.
- Hủy đơn / hoàn tiền toàn bộ khôi phục voucher trong transaction.
- Customer Web và Mobile dùng chung runtime API client.
- Điểm thưởng vẫn do backend quyết định số dư/quy đổi/điều kiện.

Script V2.1 hỗ trợ cả main 15/09/2026 và một số biến thể local của giao diện.
Chỉ dùng Python standard library.

Chạy tại thư mục gốc repo:
    python fix_agrimarket_voucher_all_v2_2_3.py --migrate

Nên xem trước:
    python fix_agrimarket_voucher_all.py --dry-run

Tùy chọn:
    --repo PATH       Đường dẫn repo nếu không chạy tại root.
    --dry-run         Kiểm tra anchor, không ghi file.
    --skip-checks     Không chạy prettier/prisma/typecheck.
    --migrate         Chạy prisma migrate dev sau khi sửa.
    --full-check      Chạy thêm pnpm test.
    --allow-partial   Patch UI mobile phụ lỗi thì cảnh báo thay vì dừng.
"""

from __future__ import annotations

import argparse
import os
import datetime as dt
import re
import shutil
import subprocess
import sys
from pathlib import Path

MARKER = "AGRIMARKET_VOUCHER_WALLET_V2"
MIGRATION_DIR = "20260915110000_voucher_wallet_tmdt"
SCRIPT_VERSION = "2.2.3"


class PatchError(RuntimeError):
    pass


class Patcher:
    def __init__(self, root: Path, dry_run: bool = False, allow_partial: bool = False):
        self.root = root
        self.dry_run = dry_run
        self.allow_partial = allow_partial
        self.originals: dict[Path, bytes | None] = {}
        # Bản nội dung mới nhất theo từng file, kể cả khi --dry-run.
        # Sửa lỗi dry-run cũ: nhiều patch liên tiếp không còn đọc lại file gốc.
        self.staged: dict[Path, str] = {}
        self.changed: list[Path] = []
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        self.backup_root = root / ".agrimarket-fix-backup" / f"voucher-{stamp}"

    def path(self, rel: str) -> Path:
        return self.root / rel

    def require(self, rel: str) -> Path:
        p = self.path(rel)
        if not p.exists():
            raise PatchError(f"Không tìm thấy file bắt buộc: {rel}")
        return p

    def read(self, rel: str) -> str:
        p = self.require(rel)
        if p in self.staged:
            return self.staged[p]
        return p.read_text(encoding="utf-8").replace("\r\n", "\n")

    def _remember(self, p: Path) -> None:
        if p in self.originals:
            return
        self.originals[p] = p.read_bytes() if p.exists() else None
        if p.exists() and not self.dry_run:
            dest = self.backup_root / p.relative_to(self.root)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest)

    def write(self, rel: str, content: str) -> None:
        p = self.path(rel)
        normalized = content.replace("\r\n", "\n")
        if p in self.staged:
            current = self.staged[p]
        elif p.exists():
            current = p.read_text(encoding="utf-8").replace("\r\n", "\n")
        else:
            current = None
        if current == normalized:
            print(f"[SKIP] {rel} (không đổi)")
            return
        self._remember(p)
        self.staged[p] = normalized
        if self.dry_run:
            print(f"[DRY]  WRITE {rel}")
            return
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(normalized, encoding="utf-8", newline="\n")
        if p not in self.changed:
            self.changed.append(p)
        print(f"[OK]   WRITE {rel}")

    def replace_once(
        self,
        rel: str,
        old: str,
        new: str,
        *,
        label: str,
        optional: bool = False,
    ) -> bool:
        text = self.read(rel)
        if new in text:
            print(f"[SKIP] {label} (đã áp dụng)")
            return False
        count = text.count(old)
        if count != 1:
            msg = f"{label}: cần đúng 1 anchor nhưng tìm thấy {count} trong {rel}"
            if optional or self.allow_partial:
                print(f"[WARN] {msg}")
                return False
            raise PatchError(msg)
        self.write(rel, text.replace(old, new, 1))
        return True

    def insert_before(
        self,
        rel: str,
        anchor: str,
        addition: str,
        *,
        label: str,
        marker: str | None = None,
        optional: bool = False,
    ) -> bool:
        text = self.read(rel)
        if marker and marker in text:
            print(f"[SKIP] {label} (đã áp dụng)")
            return False
        count = text.count(anchor)
        if count != 1:
            msg = f"{label}: anchor xuất hiện {count} lần trong {rel}"
            if optional or self.allow_partial:
                print(f"[WARN] {msg}")
                return False
            raise PatchError(msg)
        self.write(rel, text.replace(anchor, addition + anchor, 1))
        return True

    def ensure_import(self, rel: str, import_line: str, *, marker: str, label: str) -> bool:
        text = self.read(rel)
        if marker in text:
            print(f"[SKIP] {label} (đã áp dụng)")
            return False
        # Hỗ trợ import một dòng và import nhiều dòng; không phụ thuộc PageHeader/web-page.
        matches = list(re.finditer(r"^import\b[\s\S]*?;[ \t]*$", text, re.MULTILINE))
        if not matches:
            raise PatchError(f"{label}: không tìm thấy import block trong {rel}")
        insert_at = matches[-1].end()
        self.write(rel, text[:insert_at] + "\n" + import_line.rstrip() + text[insert_at:])
        return True

    def rollback(self) -> None:
        if self.dry_run:
            return
        print("\n[ROLLBACK] Khôi phục thay đổi của lần chạy này...")
        for p, data in reversed(list(self.originals.items())):
            try:
                if data is None:
                    if p.exists():
                        p.unlink()
                    parent = p.parent
                    while parent != self.root and parent.exists() and not any(parent.iterdir()):
                        parent.rmdir()
                        parent = parent.parent
                else:
                    p.parent.mkdir(parents=True, exist_ok=True)
                    p.write_bytes(data)
            except Exception as exc:
                print(f"[WARN] Không rollback được {p}: {exc}")

    def summary(self) -> None:
        print("\n=== FILE THAY ĐỔI ===")
        if self.dry_run:
            print("Dry-run: chưa ghi file.")
            return
        if not self.changed:
            print("Không có thay đổi mới.")
            return
        for p in self.changed:
            print(" -", p.relative_to(self.root))
        print("\nBackup:", self.backup_root)


def check_repo(root: Path) -> None:
    package = root / "package.json"
    if not package.exists():
        raise PatchError("Không thấy package.json. Hãy chạy ở thư mục gốc repo.")
    if '"name": "agrimarket"' not in package.read_text(encoding="utf-8"):
        raise PatchError("package.json không giống repo AgriMarket.")
    required = [
        "apps/api/prisma/schema.prisma",
        "apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts",
        "apps/api/src/modules/gio-hang/checkout-preview.service.ts",
        "apps/api/src/modules/don-hang/don-hang.service.ts",
        "apps/customer-web/src/components/checkout-content.tsx",
        "apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx",
        "packages/api-client/src/index.ts",
    ]
    missing = [rel for rel in required if not (root / rel).exists()]
    if missing:
        raise PatchError("Repo thiếu file bắt buộc: " + ", ".join(missing))


def patch_prisma(p: Patcher) -> None:
    rel = "apps/api/prisma/schema.prisma"

    p.replace_once(
        rel,
        '''  thongBaoThuHoach ThongBaoThuHoach[]
  taiKhoanLoyalty  TaiKhoanLoyalty?

  @@index([trangThai], map: "idx_khach_hang_trang_thai")''',
        '''  thongBaoThuHoach ThongBaoThuHoach[]
  taiKhoanLoyalty  TaiKhoanLoyalty?
  voucherKhachHang VoucherKhachHang[]

  @@index([trangThai], map: "idx_khach_hang_trang_thai")''',
        label="Prisma: KhachHang -> VoucherKhachHang",
    )

    p.replace_once(
        rel,
        '''  sanPham          SanPham?        @relation(fields: [sanPhamId], references: [id], onDelete: Restrict, map: "fk_khuyen_mai_san_pham")
  donHang          DonHang[]

  @@index([phamVi, trangThai, batDauLuc, ketThucLuc], map: "idx_khuyen_mai_scope_time")''',
        '''  sanPham          SanPham?        @relation(fields: [sanPhamId], references: [id], onDelete: Restrict, map: "fk_khuyen_mai_san_pham")
  donHang          DonHang[]
  voucherKhachHang VoucherKhachHang[]

  @@index([phamVi, trangThai, batDauLuc, ketThucLuc], map: "idx_khuyen_mai_scope_time")''',
        label="Prisma: KhuyenMai -> VoucherKhachHang",
    )

    model = f'''// {MARKER}: ví voucher của từng khách hàng.
model VoucherKhachHang {{
  id              String    @id @default(uuid(7)) @db.Char(36)
  khachHangId     String    @map("khach_hang_id") @db.Char(36)
  khuyenMaiId     String    @map("khuyen_mai_id") @db.Char(36)
  maDonHangSuDung String?   @map("ma_don_hang_su_dung") @db.VarChar(50)
  daSuDungLuc     DateTime? @map("da_su_dung_luc") @db.DateTime(3)
  createdAt       DateTime  @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.DateTime(3)
  khachHang       KhachHang @relation(fields: [khachHangId], references: [id], onDelete: Cascade, map: "fk_voucher_khach_hang_khach_hang")
  khuyenMai       KhuyenMai @relation(fields: [khuyenMaiId], references: [id], onDelete: Cascade, map: "fk_voucher_khach_hang_khuyen_mai")

  @@unique([khachHangId, khuyenMaiId], map: "uk_voucher_khach_hang_khach_km")
  @@index([khachHangId, daSuDungLuc, createdAt], map: "idx_voucher_khach_hang_trang_thai")
  @@index([khuyenMaiId, daSuDungLuc], map: "idx_voucher_khach_hang_khuyen_mai")
  @@map("voucher_khach_hang")
}}

'''
    p.insert_before(
        rel,
        "model TheoDoiTrangTrai {",
        model,
        label="Prisma: thêm model VoucherKhachHang",
        marker=MARKER,
    )

    migration = '''-- AgriMarket Voucher Wallet V2
-- Lưu/nhận voucher theo khách, dùng một lần, có thể khôi phục khi hủy/refund toàn bộ.

CREATE TABLE `voucher_khach_hang` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `khuyen_mai_id` CHAR(36) NOT NULL,
    `ma_don_hang_su_dung` VARCHAR(50) NULL,
    `da_su_dung_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_voucher_khach_hang_khach_km`(`khach_hang_id`, `khuyen_mai_id`),
    INDEX `idx_voucher_khach_hang_trang_thai`(`khach_hang_id`, `da_su_dung_luc`, `created_at`),
    INDEX `idx_voucher_khach_hang_khuyen_mai`(`khuyen_mai_id`, `da_su_dung_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `voucher_khach_hang`
    ADD CONSTRAINT `fk_voucher_khach_hang_khach_hang`
    FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voucher_khach_hang`
    ADD CONSTRAINT `fk_voucher_khach_hang_khuyen_mai`
    FOREIGN KEY (`khuyen_mai_id`) REFERENCES `khuyen_mai`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
'''
    p.write(f"apps/api/prisma/migrations/{MIGRATION_DIR}/migration.sql", migration)


VOUCHER_DTO = r'''import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PhamViKhuyenMai } from '../../../generated/prisma/client';

export type TrangThaiVoucherKhachHang = 'KHA_DUNG' | 'DA_SU_DUNG' | 'HET_HAN';

export class VoucherHienThiDto {
  @ApiProperty() khuyenMaiId!: string;
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
  @ApiPropertyOptional({ nullable: true }) moTa!: string | null;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;
  @ApiPropertyOptional({ nullable: true }) danhMucSanPhamId!: string | null;
  @ApiPropertyOptional({ nullable: true }) sanPhamId!: string | null;
  @ApiProperty() donHangToiThieu!: number;
  @ApiProperty() giaTriGiam!: number;
  @ApiProperty() batDauLuc!: Date;
  @ApiProperty() ketThucLuc!: Date;
  @ApiPropertyOptional({ nullable: true }) gioiHanSuDung!: number | null;
  @ApiProperty() soLanDaSuDung!: number;
  @ApiProperty() daLuu!: boolean;
  @ApiPropertyOptional({ nullable: true }) daLuuLuc!: Date | null;
  @ApiPropertyOptional({ nullable: true }) daSuDungLuc!: Date | null;
  @ApiPropertyOptional({ nullable: true }) maDonHangSuDung!: string | null;
  @ApiProperty({ enum: ['KHA_DUNG', 'DA_SU_DUNG', 'HET_HAN'] })
  trangThaiVoucher!: TrangThaiVoucherKhachHang;
}

export class DanhSachVoucherHienThiDto {
  @ApiProperty({ type: [VoucherHienThiDto] }) items!: VoucherHienThiDto[];
  @ApiProperty() tong!: number;
}
'''


VOUCHER_CONTROLLER = r'''import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { DanhSachVoucherHienThiDto, VoucherHienThiDto } from './dto/voucher-khach-hang.dto';
import { KhuyenMaiService } from './khuyen-mai.service';

@ApiTags('Khuyến mãi công khai')
@Controller('khuyen-mai/voucher')
export class KhuyenMaiVoucherCongKhaiController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get()
  @ApiOperation({ operationId: 'layVoucherCongKhai', summary: 'Lấy voucher đang có thể nhận/lưu' })
  @ApiOkResponse({ type: DanhSachVoucherHienThiDto })
  layDanhSach(): Promise<DanhSachVoucherHienThiDto> {
    return this.service.layDanhSachVoucherCongKhai();
  }
}

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/voucher')
export class VoucherKhachHangController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get()
  @ApiOperation({ operationId: 'layVoucherCuaToi', summary: 'Lấy kho voucher của khách hàng hiện tại' })
  @ApiOkResponse({ type: DanhSachVoucherHienThiDto })
  layCuaToi(@Req() request: RequestDaXacThuc): Promise<DanhSachVoucherHienThiDto> {
    return this.service.layVoucherCuaToi(this.nguoiDungId(request));
  }

  @Post(':khuyenMaiId/luu')
  @ApiOperation({ operationId: 'luuVoucherCuaToi', summary: 'Lưu/nhận voucher vào kho voucher' })
  @ApiCreatedResponse({ type: VoucherHienThiDto })
  luu(
    @Req() request: RequestDaXacThuc,
    @Param('khuyenMaiId') khuyenMaiId: string,
  ): Promise<VoucherHienThiDto> {
    return this.service.luuVoucherCuaToi(this.nguoiDungId(request), khuyenMaiId);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }
}
'''


def patch_backend(p: Patcher) -> None:
    p.write("apps/api/src/modules/khuyen-mai/dto/voucher-khach-hang.dto.ts", VOUCHER_DTO)
    p.write("apps/api/src/modules/khuyen-mai/khuyen-mai-khach-hang.controller.ts", VOUCHER_CONTROLLER)

    p.replace_once(
        "apps/api/src/modules/khuyen-mai/khuyen-mai.module.ts",
        '''import { KhuyenMaiQuanTriController } from './khuyen-mai-quan-tri.controller';
import { KhuyenMaiService } from './khuyen-mai.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [KhuyenMaiQuanTriController],''',
        '''import {
  KhuyenMaiVoucherCongKhaiController,
  VoucherKhachHangController,
} from './khuyen-mai-khach-hang.controller';
import { KhuyenMaiQuanTriController } from './khuyen-mai-quan-tri.controller';
import { KhuyenMaiService } from './khuyen-mai.service';

@Module({
  imports: [XacThucModule, PhanQuyenModule],
  controllers: [
    KhuyenMaiQuanTriController,
    KhuyenMaiVoucherCongKhaiController,
    VoucherKhachHangController,
  ],''',
        label="KhuyenMaiModule: đăng ký public/customer voucher controllers",
    )

    rel = "apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts"
    p.insert_before(
        rel,
        "\nexport type NguCanhKhuyenMai = {",
        """\nimport type {\n  DanhSachVoucherHienThiDto,\n  VoucherHienThiDto,\n} from './dto/voucher-khach-hang.dto';\n""",
        label="KhuyenMaiService: import voucher DTO",
        marker="DanhSachVoucherHienThiDto",
    )

    customer_methods = r'''
  // AGRIMARKET_VOUCHER_WALLET_V2: discovery + wallet customer API.
  async layDanhSachVoucherCongKhai(): Promise<DanhSachVoucherHienThiDto> {
    const now = new Date();
    const rows = await this.prisma.khuyenMai.findMany({
      where: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        batDauLuc: { lte: now },
        ketThucLuc: { gte: now },
      },
      orderBy: [{ ketThucLuc: 'asc' }, { giaTriGiam: 'desc' }, { ma: 'asc' }],
      take: 100,
    });
    const items = rows
      .filter((row) => this.conLuotSuDung(row))
      .map((row) => this.toVoucherHienThiDto(row, null, now));
    return { items, tong: items.length };
  }

  async layVoucherCuaToi(nguoiDungId: string): Promise<DanhSachVoucherHienThiDto> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    const rows = await this.prisma.voucherKhachHang.findMany({
      where: { khachHangId },
      include: { khuyenMai: true },
      orderBy: [{ daSuDungLuc: 'asc' }, { createdAt: 'desc' }],
    });
    const now = new Date();
    const items = rows.map((row) => this.toVoucherHienThiDto(row.khuyenMai, row, now));
    return { items, tong: items.length };
  }

  async luuVoucherCuaToi(nguoiDungId: string, khuyenMaiId: string): Promise<VoucherHienThiDto> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    const now = new Date();
    const khuyenMai = await this.prisma.khuyenMai.findUnique({ where: { id: khuyenMaiId } });

    if (!khuyenMai) throw new NotFoundException('Không tìm thấy voucher.');
    if (
      khuyenMai.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
      now < khuyenMai.batDauLuc ||
      now > khuyenMai.ketThucLuc ||
      !this.conLuotSuDung(khuyenMai)
    ) {
      throw new BadRequestException('Voucher hiện không còn khả dụng để lưu.');
    }

    const wallet = await this.prisma.voucherKhachHang.upsert({
      where: { khachHangId_khuyenMaiId: { khachHangId, khuyenMaiId } },
      update: {},
      create: { khachHangId, khuyenMaiId },
    });
    return this.toVoucherHienThiDto(khuyenMai, wallet, now);
  }

'''
    p.insert_before(
        rel,
        "  async danhGiaTheoMa(",
        customer_methods,
        label="KhuyenMaiService: public/customer voucher methods",
        marker="AGRIMARKET_VOUCHER_WALLET_V2: discovery",
    )

    old_eval = r'''  async danhGiaTheoMa(ma: string, nguCanh: NguCanhKhuyenMai): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = this.chuanHoaMa(ma);
    const row = await this.prisma.khuyenMai.findUnique({
      where: { ma: normalized },
    });

    if (!row) {
      return this.khongTimThay(normalized);
    }

    return this.danhGiaQuyTac(this.snapshot(row), nguCanh);
  }
'''
    new_eval = r'''  async danhGiaTheoMa(
    ma: string,
    nguCanh: NguCanhKhuyenMai,
    khachHangId?: string,
  ): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = this.chuanHoaMa(ma);
    const row = await this.prisma.khuyenMai.findUnique({ where: { ma: normalized } });

    if (!row) return this.khongTimThay(normalized);

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe || !khachHangId) return ketQua;

    const wallet = await this.prisma.voucherKhachHang.findUnique({
      where: { khachHangId_khuyenMaiId: { khachHangId, khuyenMaiId: row.id } },
      select: { daSuDungLuc: true },
    });
    if (wallet?.daSuDungLuc) {
      return { ...ketQua, hopLe: false, lyDo: 'Voucher này đã được sử dụng trước đó.' };
    }

    return ketQua;
  }
'''
    p.replace_once(rel, old_eval, new_eval, label="KhuyenMaiService: preview kiểm tra voucher đã dùng")

    old_tx = r'''  async danhGiaVaGhiNhanTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    nguCanh: NguCanhKhuyenMai,
  ): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = this.chuanHoaMa(ma);
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];

    if (locked.length !== 1 || !lockedPromotion) {
      return this.khongTimThay(normalized);
    }

    const row = await tx.khuyenMai.findUnique({
      where: { id: lockedPromotion.id },
    });
    if (!row) {
      return this.khongTimThay(normalized);
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe) {
      return ketQua;
    }

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { increment: 1 } },
    });

    return ketQua;
  }
'''
    new_tx = r'''  async danhGiaVaGhiNhanTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    nguCanh: NguCanhKhuyenMai,
    voucherKhachHang?: { khachHangId: string; maDonHang: string },
  ): Promise<KetQuaDanhGiaKhuyenMai> {
    const normalized = this.chuanHoaMa(ma);
    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];

    if (locked.length !== 1 || !lockedPromotion) return this.khongTimThay(normalized);

    const row = await tx.khuyenMai.findUnique({ where: { id: lockedPromotion.id } });
    if (!row) return this.khongTimThay(normalized);

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);
    if (!ketQua.hopLe) return ketQua;

    if (voucherKhachHang) {
      const daCo = await tx.voucherKhachHang.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: voucherKhachHang.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { daSuDungLuc: true },
      });
      if (daCo?.daSuDungLuc) {
        return { ...ketQua, hopLe: false, lyDo: 'Voucher này đã được sử dụng trước đó.' };
      }

      // Nếu khách nhập code tay mà chưa "Lưu", transaction vẫn ghi lịch sử voucher.
      await tx.voucherKhachHang.upsert({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: voucherKhachHang.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        update: {
          daSuDungLuc: new Date(),
          maDonHangSuDung: voucherKhachHang.maDonHang,
        },
        create: {
          khachHangId: voucherKhachHang.khachHangId,
          khuyenMaiId: row.id,
          daSuDungLuc: new Date(),
          maDonHangSuDung: voucherKhachHang.maDonHang,
        },
      });
    }

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { increment: 1 } },
    });
    return ketQua;
  }
'''
    p.replace_once(rel, old_tx, new_tx, label="KhuyenMaiService: khóa voucher theo khách trong transaction")

    old_rollback = r'''  async hoanTacSuDungTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
  ): Promise<boolean> {
    const normalized = this.chuanHoaMa(ma);
    if (!normalized) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];
    if (locked.length !== 1 || !lockedPromotion) return false;

    const row = await tx.khuyenMai.findUnique({
      where: { id: lockedPromotion.id },
      select: { id: true, soLanDaSuDung: true },
    });
    if (!row || row.soLanDaSuDung <= 0) return false;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { decrement: 1 } },
    });
    return true;
  }
'''
    new_rollback = r'''  async hoanTacSuDungTheoMaTrongTransaction(
    tx: Prisma.TransactionClient,
    ma: string,
    khachHangId?: string,
    maDonHang?: string,
  ): Promise<boolean> {
    const normalized = this.chuanHoaMa(ma);
    if (!normalized) return false;

    const locked = await tx.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        SELECT id
        FROM khuyen_mai
        WHERE ma = ${normalized}
        FOR UPDATE
      `,
    );
    const lockedPromotion = locked[0];
    if (locked.length !== 1 || !lockedPromotion) return false;

    const row = await tx.khuyenMai.findUnique({
      where: { id: lockedPromotion.id },
      select: { id: true, soLanDaSuDung: true },
    });
    if (!row || row.soLanDaSuDung <= 0) return false;

    await tx.khuyenMai.update({
      where: { id: row.id },
      data: { soLanDaSuDung: { decrement: 1 } },
    });

    if (khachHangId && maDonHang) {
      await tx.voucherKhachHang.updateMany({
        where: {
          khachHangId,
          khuyenMaiId: row.id,
          maDonHangSuDung: maDonHang,
          daSuDungLuc: { not: null },
        },
        data: { daSuDungLuc: null, maDonHangSuDung: null },
      });
    }

    return true;
  }
'''
    p.replace_once(rel, old_rollback, new_rollback, label="KhuyenMaiService: khôi phục voucher khi hủy/refund")

    helpers = r'''
  private async layKhachHangIdTheoNguoiDung(nguoiDungId: string): Promise<string> {
    const khachHang = await this.prisma.khachHang.findFirst({
      where: { nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: { id: true },
    });
    if (!khachHang) throw new NotFoundException('Không tìm thấy khách hàng hoạt động.');
    return khachHang.id;
  }

  private conLuotSuDung(row: { gioiHanSuDung: number | null; soLanDaSuDung: number }): boolean {
    return row.gioiHanSuDung === null || row.soLanDaSuDung < row.gioiHanSuDung;
  }

  private toVoucherHienThiDto(
    row: KhuyenMaiRow,
    wallet: {
      id: string;
      createdAt: Date;
      daSuDungLuc: Date | null;
      maDonHangSuDung: string | null;
    } | null,
    now = new Date(),
  ): VoucherHienThiDto {
    let trangThaiVoucher: VoucherHienThiDto['trangThaiVoucher'] = 'KHA_DUNG';
    if (wallet?.daSuDungLuc) {
      trangThaiVoucher = 'DA_SU_DUNG';
    } else if (
      row.trangThai !== TrangThaiBanGhi.HOAT_DONG ||
      now < row.batDauLuc ||
      now > row.ketThucLuc ||
      !this.conLuotSuDung(row)
    ) {
      trangThaiVoucher = 'HET_HAN';
    }

    return {
      khuyenMaiId: row.id,
      ma: row.ma,
      ten: row.ten,
      moTa: row.moTa,
      phamVi: row.phamVi,
      danhMucSanPhamId: row.danhMucSanPhamId,
      sanPhamId: row.sanPhamId,
      donHangToiThieu: Number(row.donHangToiThieu),
      giaTriGiam: Number(row.giaTriGiam),
      batDauLuc: row.batDauLuc,
      ketThucLuc: row.ketThucLuc,
      gioiHanSuDung: row.gioiHanSuDung,
      soLanDaSuDung: row.soLanDaSuDung,
      daLuu: Boolean(wallet),
      daLuuLuc: wallet?.createdAt ?? null,
      daSuDungLuc: wallet?.daSuDungLuc ?? null,
      maDonHangSuDung: wallet?.maDonHangSuDung ?? null,
      trangThaiVoucher,
    };
  }

'''
    p.insert_before(
        rel,
        "  private async chuanBiDuLieuQuanTri(",
        helpers,
        label="KhuyenMaiService: helpers voucher wallet",
        marker="private toVoucherHienThiDto(",
    )

    p.replace_once(
        "apps/api/src/modules/gio-hang/checkout-preview.service.ts",
        '''      const ketQua = await this.khuyenMaiService.danhGiaTheoMa(maKhuyenMai, {
        tongTienDonHang: tamTinhHangHoa,
        danhMucIds,
        sanPhamIds,
      });''',
        '''      const ketQua = await this.khuyenMaiService.danhGiaTheoMa(
        maKhuyenMai,
        {
          tongTienDonHang: tamTinhHangHoa,
          danhMucIds,
          sanPhamIds,
        },
        gioHang.khachHangId,
      );''',
        label="Checkout preview: kiểm tra voucher theo khách",
    )

    p.replace_once(
        "apps/api/src/modules/don-hang/don-hang.service.ts",
        '''                  sanPhamIds: cartLocked.muc.map((muc) => muc.bienTheSanPham.sanPham.id),
                },
              );''',
        '''                  sanPhamIds: cartLocked.muc.map((muc) => muc.bienTheSanPham.sanPham.id),
                },
                {
                  khachHangId: khachHang.id,
                  maDonHang,
                },
              );''',
        label="Create Order: ghi voucher vào wallet theo customer/order",
    )

    p.replace_once(
        "apps/api/src/modules/don-hang/don-hang.service.ts",
        '''          await this.khuyenMaiService.hoanTacSuDungTheoMaTrongTransaction(
            tx,
            order.maKhuyenMaiSnapshot,
          );''',
        '''          await this.khuyenMaiService.hoanTacSuDungTheoMaTrongTransaction(
            tx,
            order.maKhuyenMaiSnapshot,
            order.khachHangId,
            order.maDonHang,
          );''',
        label="Hủy đơn: khôi phục voucher customer",
    )

    p.replace_once(
        "apps/api/src/modules/thanh-toan/thanh-toan-hoan-tien-hau-xu-ly.service.ts",
        '''          await this.khuyenMaiService.hoanTacSuDungTheoMaTrongTransaction(
            tx,
            payment.donHang.maKhuyenMaiSnapshot,
          );''',
        '''          await this.khuyenMaiService.hoanTacSuDungTheoMaTrongTransaction(
            tx,
            payment.donHang.maKhuyenMaiSnapshot,
            payment.donHang.khachHangId,
            payment.donHang.maDonHang,
          );''',
        label="Refund toàn bộ: khôi phục voucher customer",
    )


API_CLIENT_VOUCHER = r'''import { layApiBaseUrl } from './runtime';

export type TrangThaiVoucherKhachHang = 'KHA_DUNG' | 'DA_SU_DUNG' | 'HET_HAN';

export type VoucherHienThi = {
  khuyenMaiId: string;
  ma: string;
  ten: string;
  moTa: string | null;
  phamVi: 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM';
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  daLuu: boolean;
  daLuuLuc: string | null;
  daSuDungLuc: string | null;
  maDonHangSuDung: string | null;
  trangThaiVoucher: TrangThaiVoucherKhachHang;
};

export type DanhSachVoucherHienThi = {
  items: VoucherHienThi[];
  tong: number;
};

type LoiHttp = Error & { status: number; data?: unknown };

async function taoLoiHttp(response: Response): Promise<LoiHttp> {
  let data: unknown;
  try {
    const raw = await response.text();
    if (raw) {
      try {
        data = JSON.parse(raw) as unknown;
      } catch {
        data = raw;
      }
    }
  } catch {
    data = undefined;
  }
  const error = new Error(`Yêu cầu không thành công (HTTP ${response.status}).`) as LoiHttp;
  error.name = 'LoiHttpApiClient';
  error.status = response.status;
  error.data = data;
  return error;
}

async function goiJson<T>(
  path: string,
  method: 'GET' | 'POST',
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  const response = await fetch(new URL(path, layApiBaseUrl()), { ...options, method, headers });
  if (!response.ok) throw await taoLoiHttp(response);
  return (await response.json()) as T;
}

export function layVoucherCongKhaiRuntime(
  options: RequestInit = {},
): Promise<DanhSachVoucherHienThi> {
  return goiJson<DanhSachVoucherHienThi>('/api/v1/khuyen-mai/voucher', 'GET', options);
}

export function layVoucherCuaToiRuntime(
  options: RequestInit = {},
): Promise<DanhSachVoucherHienThi> {
  return goiJson<DanhSachVoucherHienThi>('/api/v1/khach-hang/voucher', 'GET', options);
}

export function luuVoucherCuaToiRuntime(
  khuyenMaiId: string,
  options: RequestInit = {},
): Promise<VoucherHienThi> {
  return goiJson<VoucherHienThi>(
    `/api/v1/khach-hang/voucher/${encodeURIComponent(khuyenMaiId)}/luu`,
    'POST',
    options,
  );
}
'''

WEB_API_VOUCHER = r''' 'use client';

import {
  layVoucherCongKhaiRuntime,
  layVoucherCuaToiRuntime,
  luuVoucherCuaToiRuntime,
  type DanhSachVoucherHienThi,
  type VoucherHienThi,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

export const VOUCHER_CONG_KHAI_QUERY_KEY = ['voucher', 'cong-khai'] as const;
export const VOUCHER_CUA_TOI_QUERY_KEY = ['voucher', 'cua-toi'] as const;

export function layVoucherCongKhai(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCongKhaiRuntime();
}

export function layVoucherCuaToi(): Promise<DanhSachVoucherHienThi> {
  return thucThiApiKhachHang((tuyChon) => layVoucherCuaToiRuntime(tuyChon));
}

export function luuVoucherCuaToi(khuyenMaiId: string): Promise<VoucherHienThi> {
  return thucThiApiKhachHang((tuyChon) => luuVoucherCuaToiRuntime(khuyenMaiId, tuyChon));
}
'''.lstrip()

MOBILE_API_VOUCHER = r'''import {
  layVoucherCongKhaiRuntime,
  layVoucherCuaToiRuntime,
  luuVoucherCuaToiRuntime,
  type DanhSachVoucherHienThi,
  type VoucherHienThi,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

export const VOUCHER_MOBILE_QUERY_KEY = ['mobile', 'voucher', 'cua-toi'] as const;

export function layVoucherCongKhaiMobile(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCongKhaiRuntime();
}

export async function layVoucherCuaToiMobile(): Promise<DanhSachVoucherHienThi> {
  return layVoucherCuaToiRuntime(await layTuyChonBearer());
}

export async function luuVoucherCuaToiMobile(khuyenMaiId: string): Promise<VoucherHienThi> {
  return luuVoucherCuaToiRuntime(khuyenMaiId, await layTuyChonBearer());
}
'''


def patch_api_client(p: Patcher) -> None:
    p.write("packages/api-client/src/voucher.ts", API_CLIENT_VOUCHER)
    p.replace_once(
        "packages/api-client/src/index.ts",
        "export * from './diem-thuong';",
        "export * from './diem-thuong';\nexport * from './voucher';",
        label="API client: export voucher runtime",
    )
    p.write("apps/customer-web/src/lib/api-voucher.ts", WEB_API_VOUCHER)
    p.write("apps/mobile/src/lib/api-voucher.ts", MOBILE_API_VOUCHER)


TRUNG_TAM_VOUCHER = r''' 'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconCheck, IconClock, IconTicket } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';

import {
  VOUCHER_CONG_KHAI_QUERY_KEY,
  VOUCHER_CUA_TOI_QUERY_KEY,
  layVoucherCongKhai,
  layVoucherCuaToi,
  luuVoucherCuaToi,
} from '@/lib/api-voucher';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

function ngay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function TrungTamVoucher() {
  const queryClient = useQueryClient();
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';

  const congKhaiQuery = useQuery({
    queryKey: VOUCHER_CONG_KHAI_QUERY_KEY,
    queryFn: layVoucherCongKhai,
    staleTime: 30_000,
  });
  const cuaToiQuery = useQuery({
    queryKey: VOUCHER_CUA_TOI_QUERY_KEY,
    queryFn: layVoucherCuaToi,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

  const daLuuIds = useMemo(
    () => new Set((cuaToiQuery.data?.items ?? []).map((item) => item.khuyenMaiId)),
    [cuaToiQuery.data],
  );

  const luuMutation = useMutation({
    mutationFn: luuVoucherCuaToi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: VOUCHER_CUA_TOI_QUERY_KEY });
    },
  });

  const items = congKhaiQuery.data?.items ?? [];

  return (
    <Stack gap="md" mb="xl">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={3}>
          <Group gap="sm">
            <ThemeIcon color="agrimarket" variant="light" radius="xl">
              <IconTicket size={18} />
            </ThemeIcon>
            <Title order={2} fz={{ base: 20, md: 24 }}>Voucher AgriMarket</Title>
          </Group>
          <Text size="sm" c="dimmed">
            Lưu voucher vào tài khoản rồi chọn trực tiếp khi thanh toán. Không cần ghi nhớ mã.
          </Text>
        </Stack>
        {daDangNhap ? (
          <Button component={Link} href="/tai-khoan/voucher" variant="subtle" color="agrimarket">
            Kho voucher của tôi
          </Button>
        ) : null}
      </Group>

      {congKhaiQuery.isPending ? (
        <Text size="sm" c="dimmed">Đang tải voucher…</Text>
      ) : congKhaiQuery.isError ? (
        <Paper withBorder p="md">
          <Text size="sm" c="red.7">Không tải được danh sách voucher. Hãy thử lại sau.</Text>
        </Paper>
      ) : items.length === 0 ? (
        <Paper withBorder p="lg">
          <Text fw={800}>Chưa có voucher đang phát hành</Text>
          <Text size="sm" c="dimmed" mt={4}>
            Flash Sale vẫn hoạt động bình thường; voucher mới sẽ xuất hiện tại đây khi quản trị viên phát hành.
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {items.map((item) => {
            const daLuu = daLuuIds.has(item.khuyenMaiId);
            return (
              <Paper key={item.khuyenMaiId} withBorder p="md" radius="md" style={{ borderStyle: 'dashed' }}>
                <Stack gap="sm" h="100%">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Badge color="agrimarket" variant="light" size="lg">Giảm {tien(item.giaTriGiam)}</Badge>
                    <Text size="xs" c="dimmed" fw={700}>{item.ma}</Text>
                  </Group>
                  <Stack gap={2}>
                    <Text fw={900} lineClamp={2}>{item.ten}</Text>
                    {item.moTa ? <Text size="xs" c="dimmed" lineClamp={2}>{item.moTa}</Text> : null}
                  </Stack>
                  <Text size="sm">Đơn tối thiểu <Text span fw={850}>{tien(item.donHangToiThieu)}</Text></Text>
                  <Group gap={5}>
                    <IconClock size={14} />
                    <Text size="xs" c="dimmed">HSD {ngay(item.ketThucLuc)}</Text>
                  </Group>
                  {daLuu ? (
                    <Button mt="auto" color="agrimarket" variant="light" leftSection={<IconCheck size={16} />} disabled>
                      Đã lưu
                    </Button>
                  ) : daDangNhap ? (
                    <Button
                      mt="auto"
                      color="agrimarket"
                      leftSection={<IconTicket size={16} />}
                      loading={luuMutation.isPending}
                      onClick={() => luuMutation.mutate(item.khuyenMaiId)}
                    >
                      Lưu voucher
                    </Button>
                  ) : (
                    <Button
                      mt="auto"
                      component={Link}
                      href="/dang-nhap?next=/khuyen-mai"
                      color="agrimarket"
                      leftSection={<IconTicket size={16} />}
                    >
                      Đăng nhập để lưu
                    </Button>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
'''.lstrip()


VOUCHER_CHECKOUT_PICKER = r''' 'use client';

import {
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { IconCheck, IconChevronRight, IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { VOUCHER_CUA_TOI_QUERY_KEY, layVoucherCuaToi } from '@/lib/api-voucher';

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

export function VoucherCheckoutPicker({
  selectedCode,
  disabled,
  onSelect,
}: {
  selectedCode: string;
  disabled?: boolean;
  onSelect: (ma: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [manual, setManual] = useState('');

  const query = useQuery({
    queryKey: VOUCHER_CUA_TOI_QUERY_KEY,
    queryFn: layVoucherCuaToi,
    staleTime: 15_000,
    retry: 0,
  });

  const available = (query.data?.items ?? []).filter((item) => item.trangThaiVoucher === 'KHA_DUNG');
  const selected = available.find((item) => item.ma === selectedCode);

  return (
    <>
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ThemeIcon variant="light" color="agrimarket" radius="xl"><IconTicket size={18} /></ThemeIcon>
            <Stack gap={1} style={{ minWidth: 0 }}>
              <Text fw={850}>Voucher AgriMarket</Text>
              {selected ? (
                <Text size="sm" c="green.8" fw={750} lineClamp={1}>
                  {selected.ma} · giảm {tien(selected.giaTriGiam)}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  {available.length > 0
                    ? `${available.length} voucher đã lưu có thể chọn`
                    : 'Chưa có voucher khả dụng trong kho'}
                </Text>
              )}
            </Stack>
          </Group>
          <Button
            variant="subtle"
            color="agrimarket"
            rightSection={<IconChevronRight size={16} />}
            disabled={disabled}
            onClick={() => setOpened(true)}
          >
            {selected ? 'Đổi' : 'Chọn'}
          </Button>
        </Group>
      </Paper>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Chọn voucher" centered size="lg">
        <Stack gap="md">
          {query.isPending ? (
            <Text size="sm" c="dimmed">Đang tải kho voucher…</Text>
          ) : available.length === 0 ? (
            <Paper withBorder p="md">
              <Text fw={800}>Chưa có voucher đã lưu</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Vào trang Khuyến mãi để lưu voucher trước, hoặc nhập mã khác bên dưới.
              </Text>
            </Paper>
          ) : (
            available.map((item) => (
              <Paper key={item.khuyenMaiId} withBorder p="md" radius="md">
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Stack gap={2} style={{ minWidth: 0 }}>
                    <Group gap="xs">
                      <Badge color="agrimarket" variant="light">Giảm {tien(item.giaTriGiam)}</Badge>
                      <Text size="xs" fw={800} c="dimmed">{item.ma}</Text>
                    </Group>
                    <Text fw={850} lineClamp={1}>{item.ten}</Text>
                    <Text size="xs" c="dimmed">
                      Đơn từ {tien(item.donHangToiThieu)} · Backend kiểm tra lại điều kiện theo giỏ hàng.
                    </Text>
                  </Stack>
                  <Button
                    color="agrimarket"
                    variant={selectedCode === item.ma ? 'light' : 'filled'}
                    leftSection={selectedCode === item.ma ? <IconCheck size={15} /> : undefined}
                    onClick={() => { onSelect(item.ma); setOpened(false); }}
                  >
                    {selectedCode === item.ma ? 'Đang dùng' : 'Dùng'}
                  </Button>
                </Group>
              </Paper>
            ))
          )}

          <Paper withBorder p="md" radius="md">
            <Stack gap="xs">
              <Text fw={800} size="sm">Có mã voucher khác?</Text>
              <Group align="flex-end">
                <TextInput
                  style={{ flex: 1 }}
                  label="Nhập mã"
                  placeholder="Ví dụ FRESH50"
                  value={manual}
                  onChange={(event) => setManual(event.currentTarget.value.toUpperCase())}
                />
                <Button
                  color="agrimarket"
                  disabled={!manual.trim()}
                  onClick={() => { onSelect(manual.trim().toUpperCase()); setOpened(false); }}
                >
                  Áp dụng
                </Button>
              </Group>
            </Stack>
          </Paper>

          {selectedCode ? (
            <Button variant="subtle" color="red" onClick={() => { onSelect(''); setOpened(false); }}>
              Bỏ voucher đang chọn
            </Button>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
}
'''.lstrip()


VOUCHER_ACCOUNT_CONTENT = r''' 'use client';

import {
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconTicket } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { VOUCHER_CUA_TOI_QUERY_KEY, layVoucherCuaToi } from '@/lib/api-voucher';
import { useXacThucKhachHang } from './phien-khach-hang-provider';
import { EmptyState } from './empty-state';

function tien(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(value))}đ`;
}

function ngay(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function VoucherCuaToiContent() {
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';
  const [filter, setFilter] = useState<'KHA_DUNG' | 'DA_SU_DUNG' | 'HET_HAN'>('KHA_DUNG');

  const query = useQuery({
    queryKey: VOUCHER_CUA_TOI_QUERY_KEY,
    queryFn: layVoucherCuaToi,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

  const items = useMemo(
    () => (query.data?.items ?? []).filter((item) => item.trangThaiVoucher === filter),
    [filter, query.data],
  );

  if (!daDangNhap && trangThai !== 'dang-tai') {
    return (
      <EmptyState
        tieuDe="Đăng nhập để xem kho voucher"
        moTa="Voucher đã lưu và lịch sử sử dụng được gắn với tài khoản AgriMarket."
        hanhDong={<Button component={Link} href="/dang-nhap?next=/tai-khoan/voucher">Đăng nhập</Button>}
      />
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap={3}>
        <Title order={1} fz={26}>Kho voucher</Title>
        <Text size="sm" c="dimmed">
          Voucher bạn đã lưu từ trang Khuyến mãi. Voucher khả dụng sẽ xuất hiện tại Checkout.
        </Text>
      </Stack>

      <SegmentedControl
        value={filter}
        onChange={(value) => setFilter(value as typeof filter)}
        data={[
          { value: 'KHA_DUNG', label: 'Khả dụng' },
          { value: 'DA_SU_DUNG', label: 'Đã dùng' },
          { value: 'HET_HAN', label: 'Hết hạn' },
        ]}
      />

      {query.isPending ? (
        <Text c="dimmed">Đang tải kho voucher…</Text>
      ) : query.isError ? (
        <Paper withBorder p="md"><Text c="red.7">Không tải được kho voucher.</Text></Paper>
      ) : items.length === 0 ? (
        <EmptyState
          tieuDe="Không có voucher ở mục này"
          moTa="Bạn có thể săn thêm voucher tại trang Khuyến mãi."
          bieuTuong={<IconTicket size={30} />}
          hanhDong={<Button component={Link} href="/khuyen-mai">Săn voucher</Button>}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {items.map((item) => (
            <Paper key={item.khuyenMaiId} withBorder p="md" radius="md" style={{ borderStyle: 'dashed' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge color={item.trangThaiVoucher === 'KHA_DUNG' ? 'agrimarket' : 'gray'} variant="light">
                    Giảm {tien(item.giaTriGiam)}
                  </Badge>
                  <Text size="xs" fw={800} c="dimmed">{item.ma}</Text>
                </Group>
                <Text fw={900}>{item.ten}</Text>
                <Text size="sm">Đơn từ {tien(item.donHangToiThieu)}</Text>
                <Text size="xs" c="dimmed">HSD {ngay(item.ketThucLuc)}</Text>
                {item.maDonHangSuDung ? (
                  <Text size="xs" c="dimmed">Đã dùng cho đơn {item.maDonHangSuDung}</Text>
                ) : null}
                {item.trangThaiVoucher === 'KHA_DUNG' ? (
                  <Button component={Link} href="/gio-hang" color="agrimarket" variant="light">Dùng ngay</Button>
                ) : null}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
'''.lstrip()

VOUCHER_ACCOUNT_PAGE = r'''import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { VoucherCuaToiContent } from '@/components/voucher-cua-toi-content';

export const metadata: Metadata = {
  title: 'Kho voucher',
  description: 'Quản lý voucher đã lưu và lịch sử sử dụng trên AgriMarket.',
};

export default function TrangVoucherCuaToi() {
  return (
    <KhungTaiKhoan>
      <VoucherCuaToiContent />
    </KhungTaiKhoan>
  );
}
'''


def patch_customer_web(p: Patcher) -> None:
    p.write("apps/customer-web/src/components/trung-tam-voucher.tsx", TRUNG_TAM_VOUCHER)
    p.write("apps/customer-web/src/components/voucher-checkout-picker.tsx", VOUCHER_CHECKOUT_PICKER)
    p.write("apps/customer-web/src/components/voucher-cua-toi-content.tsx", VOUCHER_ACCOUNT_CONTENT)
    p.write("apps/customer-web/src/app/tai-khoan/voucher/page.tsx", VOUCHER_ACCOUNT_PAGE)

    promo_rel = "apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx"
    p.ensure_import(
        promo_rel,
        "import { TrungTamVoucher } from './trung-tam-voucher';",
        marker="from './trung-tam-voucher'",
        label="Trang Khuyến mãi: import TrungTamVoucher",
    )

    # File local của bạn có thể khác main ở import hoặc spacing. Chèn theo cấu trúc JSX,
    # không bám cứng vào dòng `PageHeader` như bản script cũ.
    promo_text = p.read(promo_rel)
    if '<TrungTamVoucher />' not in promo_text:
        matches = list(
            re.finditer(r"(?m)^(?P<indent>[ \t]*)<AgriContainer\b[^>]*>\s*$", promo_text)
        )
        if not matches:
            raise PatchError(
                "Trang Khuyến mãi: không tìm thấy AgriContainer để chèn khu Voucher. "
                "File local đã khác cấu trúc dự kiến."
            )
        page_header_pos = promo_text.find('<PageHeader')
        target = next((m for m in matches if m.start() > page_header_pos), matches[0])
        insert_at = target.end()
        indent = target.group('indent') + '  '
        promo_text = (
            promo_text[:insert_at]
            + f"\n{indent}<TrungTamVoucher />"
            + promo_text[insert_at:]
        )
        p.write(promo_rel, promo_text)
        print(
            "[DRY]  Trang Khuyến mãi: hiển thị voucher trước Flash Sale"
            if p.dry_run
            else "[OK]   Trang Khuyến mãi: hiển thị voucher trước Flash Sale"
        )
    else:
        print("[SKIP] Trang Khuyến mãi: hiển thị voucher trước Flash Sale (đã áp dụng)")

    p.replace_once(
        "apps/customer-web/src/app/khuyen-mai/page.tsx",
        "description: 'Săn Flash Sale nông sản giảm giá từ các trang trại trên AgriMarket.',",
        "description: 'Săn và lưu voucher, đồng thời khám phá Flash Sale nông sản trên AgriMarket.',",
        label="Trang Khuyến mãi: metadata voucher + Flash Sale",
        optional=True,
    )

    account_rel = "apps/customer-web/src/components/khung-tai-khoan.tsx"
    account_text = p.read(account_rel)
    if 'IconTicket' not in account_text:
        pattern = r'(import\s*\{[\s\S]*?)(\}\s*from\s*[\"\']@tabler/icons-react[\"\'];)'
        matches = list(re.finditer(pattern, account_text))
        if len(matches) != 1:
            raise PatchError("Account nav: không xác định được import @tabler/icons-react.")
        m = matches[0]
        before = m.group(1)
        replacement = before + ('' if before.endswith('\n') else '\n') + '  IconTicket,\n' + m.group(2)
        account_text = account_text[:m.start()] + replacement + account_text[m.end():]
        p.write(account_rel, account_text)
    else:
        print("[SKIP] Account nav: IconTicket đã tồn tại")

    account_text = p.read(account_rel)
    if "key: 'voucher'" not in account_text and 'key: "voucher"' not in account_text:
        lines = account_text.splitlines(keepends=True)
        inserted = False
        for i, line in enumerate(lines):
            if "key: 'diem-thuong'" in line or 'key: "diem-thuong"' in line:
                indent = line[: len(line) - len(line.lstrip())]
                quote = '"' if 'key: "diem-thuong"' in line else "'"
                lines.insert(
                    i + 1,
                    f"{indent}{{ key: {quote}voucher{quote}, label: {quote}Kho voucher{quote}, href: {quote}/tai-khoan/voucher{quote}, icon: IconTicket }},\n",
                )
                inserted = True
                break
        if not inserted:
            raise PatchError("Account nav: không tìm thấy mục Điểm thưởng để chèn Kho voucher.")
        p.write(account_rel, ''.join(lines))
    else:
        print("[SKIP] Account nav: Kho voucher đã tồn tại")

    rel = "apps/customer-web/src/components/checkout-content.tsx"
    p.ensure_import(
        rel,
        "import { VoucherCheckoutPicker } from './voucher-checkout-picker';",
        marker="from './voucher-checkout-picker'",
        label="Checkout Web: import VoucherCheckoutPicker",
    )

    old_block = '''              <BuocCheckout so={2} icon={<IconTicket size={20} />} title="Voucher và điểm thưởng">
                {diemHienCo !== null ? (
                  <Text size="sm" c="dimmed">Điểm hiện có: <Text span fw={800} c="dark.8">{dinhDangGia(diemHienCo)} điểm</Text> · Backend quyết định mức dùng tối đa, quy đổi và điều kiện áp dụng.</Text>
                ) : null}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput label="Mã khuyến mãi" placeholder="Ví dụ FRESH50" value={maKhuyenMaiNhap} onChange={(event) => setMaKhuyenMaiNhap(event.currentTarget.value.toUpperCase())} disabled={khoaLuaChon} />
                  <TextInput label="Điểm muốn sử dụng" placeholder="0" inputMode="numeric" value={diemNhap} onChange={(event) => setDiemNhap(event.currentTarget.value.replace(/[^0-9]/g, ''))} disabled={khoaLuaChon} leftSection={<IconCoins size={16} />} />
                </SimpleGrid>
                {loiUuDai ? <Alert color="red">{loiUuDai}</Alert> : null}
                <Group gap="sm">
                  <Button onClick={apDungUuDai} loading={previewQuery.isFetching} disabled={khoaLuaChon} color="agrimarket">Áp dụng ưu đãi</Button>
                  <Button variant="default" onClick={boUuDai} disabled={khoaLuaChon || previewQuery.isFetching}>Bỏ ưu đãi</Button>
                </Group>
                <Divider />
                <ThanhPhanCheckoutRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
                <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
              </BuocCheckout>'''

    new_block = '''              <BuocCheckout so={2} icon={<IconTicket size={20} />} title="Ưu đãi">
                <VoucherCheckoutPicker
                  selectedCode={maKhuyenMaiNhap}
                  disabled={khoaLuaChon}
                  onSelect={(ma) => {
                    setMaKhuyenMaiNhap(ma);
                    setLoiUuDai(null);
                    setUuDaiApDung((hienTai) => ({
                      ...hienTai,
                      maKhuyenMai: ma || undefined,
                    }));
                  }}
                />

                <Paper withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={1}>
                        <Text fw={850}>Điểm AgriMarket</Text>
                        <Text size="sm" c="dimmed">
                          {diemHienCo === null
                            ? 'Đang tải số dư điểm…'
                            : diemHienCo > 0
                              ? `Bạn có ${dinhDangGia(diemHienCo)} điểm`
                              : 'Bạn chưa có điểm thưởng. Hoàn thành đơn hàng để tích điểm.'}
                        </Text>
                      </Stack>
                      <IconCoins size={20} color={PRIMARY} />
                    </Group>
                    <Group align="flex-end">
                      <TextInput
                        style={{ flex: 1 }}
                        label="Số điểm muốn dùng"
                        placeholder="0"
                        inputMode="numeric"
                        value={diemNhap}
                        onChange={(event) => setDiemNhap(event.currentTarget.value.replace(/[^0-9]/g, ''))}
                        disabled={khoaLuaChon || !diemHienCo}
                      />
                      <Button
                        onClick={apDungUuDai}
                        loading={previewQuery.isFetching}
                        disabled={khoaLuaChon || !diemHienCo}
                        color="agrimarket"
                      >
                        Áp dụng điểm
                      </Button>
                    </Group>
                  </Stack>
                </Paper>

                {loiUuDai ? <Alert color="red">{loiUuDai}</Alert> : null}
                <Group gap="sm">
                  <Button
                    variant="default"
                    onClick={boUuDai}
                    disabled={khoaLuaChon || previewQuery.isFetching}
                  >
                    Bỏ toàn bộ ưu đãi
                  </Button>
                </Group>
                <Divider />
                <ThanhPhanCheckoutRow nhan="Voucher" thanhPhan={preview.promotion} laKhoanGiam />
                <ThanhPhanCheckoutRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
              </BuocCheckout>'''
    checkout_text = p.read(rel)
    if '<VoucherCheckoutPicker' not in checkout_text:
        pattern = r"(?ms)^(?P<indent>[ \t]*)<BuocCheckout\s+so=\{2\}[\s\S]*?</BuocCheckout>"
        matches = list(re.finditer(pattern, checkout_text))
        if len(matches) != 1:
            raise PatchError(
                f"Checkout Web: cần đúng 1 <BuocCheckout so={{2}}> nhưng tìm thấy {len(matches)}."
            )
        m = matches[0]
        indent = m.group('indent')
        raw_lines = new_block.splitlines()
        min_indent = min(
            (len(line) - len(line.lstrip()) for line in raw_lines if line.strip()),
            default=0,
        )
        replacement = '\n'.join(
            indent + line[min_indent:] if line.strip() else line
            for line in raw_lines
        )
        checkout_text = checkout_text[:m.start()] + replacement + checkout_text[m.end():]
        p.write(rel, checkout_text)
        print(
            "[DRY]  Checkout Web: UX chọn voucher + điểm"
            if p.dry_run
            else "[OK]   Checkout Web: UX chọn voucher + điểm"
        )
    else:
        print("[SKIP] Checkout Web: VoucherCheckoutPicker đã tồn tại")

    # Còn một dòng ở summary.
    text = p.read(rel)
    if 'nhan="Khuyến mãi"' in text:
        p.write(rel, text.replace('nhan="Khuyến mãi"', 'nhan="Voucher"'))


MOBILE_PICKER_HELPER = r'''
function VoucherPickerMobile({
  visible,
  selectedCode,
  vouchers,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedCode: string;
  vouchers: Array<{ khuyenMaiId: string; ma: string; ten: string; giaTriGiam: number; donHangToiThieu: number; trangThaiVoucher: string }>;
  onClose: () => void;
  onSelect: (ma: string) => void;
}) {
  const available = vouchers.filter((item) => item.trangThaiVoucher === 'KHA_DUNG');
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <View className="max-h-[78%] rounded-t-[28px] bg-white px-5 pb-8 pt-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[20px] font-extrabold text-[#202A24]">Chọn voucher</Text>
              <Text className="mt-1 text-[12px] text-[#7C8880]">Voucher đã lưu trong tài khoản</Text>
            </View>
            <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F6F3]">
              <Ionicons name="close" size={22} color="#425047" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {available.map((item) => (
              <Pressable
                key={item.khuyenMaiId}
                onPress={() => onSelect(item.ma)}
                className="rounded-[18px] border border-dashed border-[#BFD4C7] bg-white p-4 active:bg-[#F3FAF6]"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="text-[16px] font-extrabold text-[#087A4B]">Giảm {dinhDangGia(item.giaTriGiam)}</Text>
                    <Text numberOfLines={1} className="mt-1 font-bold text-[#263129]">{item.ten}</Text>
                    <Text className="mt-1 text-[12px] text-[#7C8880]">Đơn từ {dinhDangGia(item.donHangToiThieu)} · {item.ma}</Text>
                  </View>
                  {selectedCode === item.ma ? <Ionicons name="checkmark-circle" size={24} color={PRIMARY} /> : null}
                </View>
              </Pressable>
            ))}
            {available.length === 0 ? (
              <View className="rounded-[18px] bg-[#F6F8F7] p-4">
                <Text className="font-bold text-[#263129]">Chưa có voucher khả dụng</Text>
                <Text className="mt-1 text-[12px] leading-5 text-[#7C8880]">Bạn vẫn có thể nhập mã voucher thủ công tại Checkout.</Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

'''


def patch_mobile(p: Patcher) -> None:
    rel = "apps/mobile/src/app/thanh-toan.tsx"
    if not p.path(rel).exists():
        print("[WARN] Không có Mobile checkout, bỏ qua.")
        return

    p.replace_once(
        rel,
        "import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';",
        "import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';",
        label="Mobile: import Modal",
        optional=True,
    )
    p.insert_before(
        rel,
        "import { moDangNhap } from '@/lib/auth-navigation';",
        """import { VOUCHER_MOBILE_QUERY_KEY, layVoucherCuaToiMobile } from '@/lib/api-voucher';\n""",
        label="Mobile: import voucher API",
        marker="VOUCHER_MOBILE_QUERY_KEY",
        optional=True,
    )
    p.insert_before(
        rel,
        "export default function TrangThanhToan() {",
        MOBILE_PICKER_HELPER,
        label="Mobile: component VoucherPickerMobile",
        marker="function VoucherPickerMobile(",
        optional=True,
    )
    p.replace_once(
        rel,
        '''  const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<TaoDonHangMobileKetQua | null>(null);''',
        '''  const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
  const [moVoucher, setMoVoucher] = useState(false);
  const [donHangDaTao, setDonHangDaTao] = useState<TaoDonHangMobileKetQua | null>(null);''',
        label="Mobile: state voucher modal",
        optional=True,
    )
    p.insert_before(
        rel,
        "  useEffect(() => {\n    if (!addressQuery.data?.length) return;",
        '''  const voucherQuery = useQuery({
    queryKey: VOUCHER_MOBILE_QUERY_KEY,
    queryFn: layVoucherCuaToiMobile,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

''',
        label="Mobile: query kho voucher",
        marker="queryKey: VOUCHER_MOBILE_QUERY_KEY",
        optional=True,
    )
    p.replace_once(
        rel,
        '<SectionTitle icon="ticket-outline" title="Voucher và điểm thưởng" />',
        '<SectionTitle icon="ticket-outline" title="Ưu đãi" />',
        label="Mobile: title Ưu đãi",
        optional=True,
    )

    old_input = '''              <TextInput
                value={maKhuyenMaiNhap}
                onChangeText={setMaKhuyenMaiNhap}
                editable={!khoaSauKhiTaoDon}
                autoCapitalize="characters"
                placeholder="Nhập mã khuyến mãi"
                className="min-h-12 rounded-xl border border-[#DCE7DF] px-4 text-[15px] text-[#263129]"
              />'''
    new_input = '''              <Pressable
                disabled={khoaSauKhiTaoDon}
                onPress={() => setMoVoucher(true)}
                className="min-h-14 flex-row items-center justify-between rounded-xl border border-[#DCE7DF] px-4 disabled:opacity-50"
              >
                <View className="min-w-0 flex-1">
                  <Text className="text-[12px] font-semibold text-[#6D7A72]">Voucher AgriMarket</Text>
                  <Text numberOfLines={1} className="mt-1 text-[15px] font-extrabold text-[#263129]">
                    {maKhuyenMaiNhap
                      ? maKhuyenMaiNhap
                      : `${(voucherQuery.data?.items ?? []).filter((item) => item.trangThaiVoucher === 'KHA_DUNG').length} voucher đã lưu`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PRIMARY} />
              </Pressable>
              <TextInput
                value={maKhuyenMaiNhap}
                onChangeText={(value) => setMaKhuyenMaiNhap(value.toUpperCase())}
                editable={!khoaSauKhiTaoDon}
                autoCapitalize="characters"
                placeholder="Hoặc nhập mã voucher khác"
                className="min-h-12 rounded-xl border border-[#DCE7DF] px-4 text-[15px] text-[#263129]"
              />'''
    p.replace_once(rel, old_input, new_input, label="Mobile: chọn voucher từ wallet", optional=True)

    text = p.read(rel)
    if 'nhan="Khuyến mãi"' in text:
        p.write(rel, text.replace('nhan="Khuyến mãi"', 'nhan="Voucher"'))

    # Chèn picker trước nút chính: component nằm trong cùng View nên không phá SafeAreaView.
    p.insert_before(
        rel,
        '''          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !coTheDatHang, busy: datHangMutation.isPending }}''',
        '''          <VoucherPickerMobile
            visible={moVoucher}
            selectedCode={maKhuyenMaiNhap}
            vouchers={voucherQuery.data?.items ?? []}
            onClose={() => setMoVoucher(false)}
            onSelect={(ma) => {
              setMaKhuyenMaiNhap(ma);
              setLoiUuDai(null);
              setUuDaiApDung((hienTai) => ({ ...hienTai, maKhuyenMai: ma }));
              setMoVoucher(false);
            }}
          />

''',
        label="Mobile: render voucher picker",
        marker="visible={moVoucher}",
        optional=True,
    )


def resolve_pnpm_prefix() -> list[str] | None:
    """
    Windows thường cài pnpm dưới dạng pnpm.CMD. shutil.which("pnpm") vẫn tìm thấy
    file đó, nhưng subprocess.run(["pnpm", ...], shell=False) có thể ném
    FileNotFoundError. Vì vậy luôn dùng đường dẫn thật; run_cmd sẽ bọc .cmd/.bat
    bằng cmd.exe.

    Nếu chưa có shim pnpm nhưng có Corepack, dùng `corepack pnpm`.
    """
    pnpm = shutil.which("pnpm") or shutil.which("pnpm.cmd")
    if pnpm:
        return [pnpm]

    corepack = shutil.which("corepack") or shutil.which("corepack.cmd")
    if corepack:
        return [corepack, "pnpm"]

    return None


def _windows_command(args: list[str]) -> list[str]:
    if os.name != "nt" or not args:
        return args

    executable = args[0]
    resolved = shutil.which(executable) if not Path(executable).exists() else executable
    if resolved:
        executable = resolved

    suffix = Path(executable).suffix.lower()
    final_args = [executable, *args[1:]]

    if suffix in {".cmd", ".bat"}:
        comspec = os.environ.get("COMSPEC") or shutil.which("cmd.exe") or "cmd.exe"
        command_line = subprocess.list2cmdline(final_args)
        return [comspec, "/d", "/s", "/c", command_line]

    return final_args


def run_cmd(
    root: Path,
    args: list[str],
    *,
    required: bool = True,
    env_extra: dict[str, str] | None = None,
) -> bool:
    print("\n$", " ".join(args))
    actual = _windows_command(args)
    env = os.environ.copy()
    if env_extra:
        env.update(env_extra)
    try:
        proc = subprocess.run(actual, cwd=root, check=False, env=env)
    except FileNotFoundError:
        print(f"[WARN] Không tìm thấy lệnh: {args[0]}")
        return not required
    if proc.returncode != 0:
        print(f"[FAIL] Exit code {proc.returncode}: {' '.join(args)}")
        return False
    return True


def preflight_toolchain(root: Path) -> list[str]:
    """Kiểm tra pnpm trước khi đụng vào source để tránh sửa xong mới rollback."""
    prefix = resolve_pnpm_prefix()
    if prefix is None:
        raise PatchError(
            "Không tìm thấy pnpm/Corepack. Repo yêu cầu Node 24 + pnpm 11.24.0. "
            "Trong PowerShell hãy chạy `node -v`, `corepack enable`, "
            "`corepack prepare pnpm@11.24.0 --activate`, rồi thử `pnpm -v`."
        )

    print("[INFO] Package manager:", " ".join(prefix))
    if not run_cmd(root, [*prefix, "--version"]):
        raise PatchError(
            "Đã tìm thấy pnpm/Corepack nhưng Python chưa chạy được package manager. "
            "Hãy thử `pnpm -v` trong PowerShell."
        )
    return prefix


def run_checks(
    p: Patcher,
    migrate: bool,
    full_check: bool,
    pnpm_prefix: list[str] | None = None,
) -> None:
    root = p.root
    prefix = pnpm_prefix or resolve_pnpm_prefix()
    if prefix is None:
        raise PatchError("Không tìm thấy pnpm/Corepack để chạy kiểm tra.")

    def pnpm(*args: str) -> list[str]:
        return [*prefix, *args]

    prettier_exts = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".css", ".scss"}
    changed = [
        str(path.relative_to(root))
        for path in p.changed
        if path.suffix.lower() in prettier_exts
    ]
    if changed:
        if not run_cmd(root, pnpm("exec", "prettier", "--write", *changed), required=False):
            print("[WARN] Prettier có file không format được; tiếp tục Prisma/typecheck để bắt lỗi thực tế.")

    if not run_cmd(root, pnpm("--filter", "@agrimarket/api", "prisma:validate")):
        raise PatchError("Prisma validate thất bại.")
    if not run_cmd(root, pnpm("--filter", "@agrimarket/api", "prisma:generate")):
        raise PatchError("Prisma generate thất bại.")

    if migrate:
        # Migration SQL đã được script tạo sẵn. `migrate deploy` chỉ áp dụng
        # migration pending và KHÔNG hỏi tên migration mới như `migrate dev`.
        if not run_cmd(
            root,
            pnpm(
                "--filter",
                "@agrimarket/api",
                "exec",
                "prisma",
                "migrate",
                "deploy",
                "--config",
                "prisma7.config.ts",
            ),
        ):
            raise PatchError(
                "Prisma migrate deploy thất bại. Kiểm tra DATABASE_URL/MySQL và migration history."
            )

    if not run_cmd(root, pnpm("typecheck")):
        raise PatchError("Typecheck thất bại.")
    if full_check:
        if os.name == "nt":
            print(
                "[INFO] Windows: chạy API Jest với NODE_OPTIONS qua environment "
                "(không dùng cú pháp POSIX trong package.json)."
            )
            if not run_cmd(
                root,
                pnpm(
                    "--filter",
                    "@agrimarket/api",
                    "exec",
                    "jest",
                    "--config",
                    "./test/jest-e2e.json",
                    "--runInBand",
                ),
                env_extra={"NODE_OPTIONS": "--experimental-vm-modules"},
            ):
                raise PatchError("API Jest suite thất bại.")

            if not run_cmd(
                root,
                pnpm(
                    "-r",
                    "--if-present",
                    "--filter",
                    "!@agrimarket/api",
                    "run",
                    "test",
                ),
            ):
                raise PatchError("Test suite của workspace ngoài API thất bại.")
        elif not run_cmd(root, pnpm("test")):
            raise PatchError("Test suite thất bại.")


def print_next_steps(migrated: bool) -> None:
    print("\n=== HOÀN TẤT ===")
    print("Luồng Voucher mới:")
    print("  Admin tạo khuyến mãi")
    print("  -> /khuyen-mai: khách Lưu voucher")
    print("  -> /tai-khoan/voucher: Kho voucher")
    print("  -> /thanh-toan: Chọn voucher đã lưu / nhập mã phụ")
    print("  -> Preview kiểm tra điều kiện")
    print("  -> Create Order khóa voucher theo khách + ghi lịch sử")
    print("  -> Hủy/refund toàn bộ khôi phục voucher")
    print()
    if not migrated:
        print("DB CHƯA migrate. Khi MySQL dev đang chạy, chạy lại:")
        print("  python fix_agrimarket_voucher_all_v2_2_3.py --migrate")
        print()
    print("Khởi động:")
    print("  pnpm dev")
    print("Kiểm tra:")
    print("  http://localhost:3000/khuyen-mai")
    print("  http://localhost:3000/tai-khoan/voucher")
    print("  http://localhost:3000/thanh-toan")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Tự động nâng cấp Voucher Wallet + Checkout AgriMarket theo logic sàn TMĐT."
    )
    parser.add_argument("--repo", default=".", help="Đường dẫn thư mục gốc repo")
    parser.add_argument("--dry-run", action="store_true", help="Không ghi file")
    parser.add_argument("--skip-checks", action="store_true", help="Không chạy prettier/prisma/typecheck")
    parser.add_argument("--migrate", action="store_true", help="Áp dụng migration lên DB dev")
    parser.add_argument("--full-check", action="store_true", help="Chạy thêm pnpm test")
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Patch UI phụ không khớp thì cảnh báo thay vì dừng",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = Path(args.repo).expanduser().resolve()

    try:
        check_repo(root)
    except PatchError as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 2

    print(f"AgriMarket Voucher Wallet V2 · script {SCRIPT_VERSION}")
    print("Repo:", root)
    print("Mode:", "DRY-RUN" if args.dry_run else "WRITE")
    print()

    pnpm_prefix: list[str] | None = None
    if not args.dry_run and (not args.skip_checks or args.migrate):
        try:
            pnpm_prefix = preflight_toolchain(root)
        except PatchError as exc:
            print(f"\n[ERROR] {exc}", file=sys.stderr)
            print("Chưa có file source nào bị thay đổi.")
            return 2

    if args.migrate and not args.dry_run:
        print("[INFO] Chế độ migration: prisma migrate deploy (không tạo migration tương tác).")

    p = Patcher(root, dry_run=args.dry_run, allow_partial=args.allow_partial)
    try:
        patch_prisma(p)
        patch_backend(p)
        patch_api_client(p)
        patch_customer_web(p)
        patch_mobile(p)

        if not args.dry_run and not args.skip_checks:
            run_checks(
                p,
                migrate=args.migrate,
                full_check=args.full_check,
                pnpm_prefix=pnpm_prefix,
            )
        elif not args.dry_run and args.migrate:
            prefix = pnpm_prefix or preflight_toolchain(root)
            if not run_cmd(
                root,
                [
                    *prefix,
                    "--filter",
                    "@agrimarket/api",
                    "exec",
                    "prisma",
                    "migrate",
                    "deploy",
                    "--config",
                    "prisma7.config.ts",
                ],
            ):
                raise PatchError("Prisma migrate dev thất bại.")
    except Exception as exc:
        print(f"\n[ERROR] {exc}", file=sys.stderr)
        if not args.dry_run:
            p.rollback()
            print("\nĐã rollback thay đổi của lần chạy này. Backup vẫn được giữ.")
        return 1

    p.summary()
    if not args.dry_run:
        print_next_steps(migrated=args.migrate)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
