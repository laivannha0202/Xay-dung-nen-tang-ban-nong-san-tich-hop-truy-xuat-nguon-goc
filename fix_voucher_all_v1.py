#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AgriMarket - FULL VOUCHER WALLET + CHECKOUT V1

Tự động hoàn thiện luồng voucher kiểu sàn TMĐT:
- /khuyen-mai: khách xem và lưu voucher vào tài khoản.
- /thanh-toan: chọn voucher đã lưu bằng popup, không nhập mã thủ công.
- Điểm thưởng: dùng công tắc, backend tính số điểm tối đa hợp lệ.
- Backend vẫn là source of truth cho thời gian, quota, đơn tối thiểu và phạm vi.
- Admin có trường mô tả voucher hiển thị cho khách.
- Tạo Prisma migration, API, runtime client, UI và contract tests.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path
import re
import shutil
import subprocess
from typing import NoReturn

REPO_NAME = "Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc"

SCHEMA_REL = Path("apps/api/prisma/schema.prisma")
KHUYEN_MAI_SERVICE_REL = Path("apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts")
KHUYEN_MAI_MODULE_REL = Path("apps/api/src/modules/khuyen-mai/khuyen-mai.module.ts")
KHUYEN_MAI_ADMIN_DTO_REL = Path("apps/api/src/modules/khuyen-mai/dto/quan-tri-khuyen-mai.dto.ts")
KHUYEN_MAI_KHACH_DTO_REL = Path("apps/api/src/modules/khuyen-mai/dto/khuyen-mai-khach-hang.dto.ts")
KHUYEN_MAI_KHACH_CONTROLLER_REL = Path("apps/api/src/modules/khuyen-mai/khuyen-mai-khach-hang.controller.ts")
CHECKOUT_PREVIEW_SERVICE_REL = Path("apps/api/src/modules/gio-hang/checkout-preview.service.ts")
CHECKOUT_PREVIEW_DTO_REL = Path("apps/api/src/modules/gio-hang/dto/checkout-preview.dto.ts")
DON_HANG_SERVICE_REL = Path("apps/api/src/modules/don-hang/don-hang.service.ts")

API_CLIENT_INDEX_REL = Path("packages/api-client/src/index.ts")
API_CLIENT_VOUCHER_REL = Path("packages/api-client/src/khuyen-mai-khach.ts")

WEB_API_VOUCHER_REL = Path("apps/customer-web/src/lib/api-khuyen-mai-khach.ts")
WEB_API_CHECKOUT_REL = Path("apps/customer-web/src/lib/api-checkout.ts")
WEB_PROMO_REL = Path("apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx")
WEB_PROMO_PAGE_REL = Path("apps/customer-web/src/app/khuyen-mai/page.tsx")
WEB_CHECKOUT_REL = Path("apps/customer-web/src/components/checkout-content.tsx")
WEB_CSS_REL = Path("apps/customer-web/src/app/brand-sync.css")
WEB_VOUCHER_TEST_REL = Path("apps/customer-web/test/khuyen-mai-voucher.test.mjs")
WEB_CHECKOUT_TEST_REL = Path("apps/customer-web/test/thanh-toan.test.mjs")

ADMIN_API_REL = Path("apps/admin-web/src/lib/api-khuyen-mai.ts")
ADMIN_PAGE_REL = Path("apps/admin-web/src/app/khuyen-mai/page.tsx")

MARK_SCHEMA = "model KhachHangKhuyenMai"
MARK_SERVICE = "AUTO_VOUCHER_WALLET_SERVICE_V1"
MARK_CHECKOUT_PREVIEW = "AUTO_VOUCHER_LOYALTY_PREVIEW_V1"
MARK_CHECKOUT_WEB = "AUTO_VOUCHER_CHECKOUT_UI_V1"
MARK_ADMIN = "AUTO_VOUCHER_ADMIN_MOTA_V1"
MARK_CSS = "/* ===== MARKET VOUCHER WALLET V1 ===== */"


def log(msg: str = "") -> None:
    print(msg, flush=True)


def ok(msg: str) -> None:
    log(f"✅ {msg}")


def info(msg: str) -> None:
    log(f"ℹ️  {msg}")


def warn(msg: str) -> None:
    log(f"⚠️  {msg}")


def fail(msg: str, code: int = 1) -> NoReturn:
    log(f"❌ {msg}")
    raise SystemExit(code)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8", newline="\n")


def find_repo(explicit: str | None) -> Path:
    candidates: list[Path] = []
    if explicit:
        candidates.append(Path(explicit).expanduser())

    here = Path.cwd().resolve()
    candidates.extend([here, *here.parents])

    if os.name == "nt":
        candidates.append(Path(r"E:\dev") / REPO_NAME)

    seen: set[str] = set()
    for p in candidates:
        try:
            p = p.resolve()
        except OSError:
            continue
        key = str(p).lower()
        if key in seen:
            continue
        seen.add(key)
        if (p / "package.json").is_file() and (p / "apps/customer-web").is_dir() and (p / "apps/api").is_dir():
            return p

    fail(
        "Không tìm thấy repo. Dùng:\n"
        'python fix_voucher_all_v1.py --repo "E:\\dev\\'
        + REPO_NAME
        + '"'
    )


def require(root: Path, rel: Path) -> Path:
    p = root / rel
    if not p.is_file():
        fail(f"Không tìm thấy file bắt buộc: {p}")
    return p


def find_exe(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    if os.name == "nt":
        found = shutil.which(name + ".cmd")
        if found:
            return found
    fail(f"Không tìm thấy `{name}` trong PATH.")


def run(cmd: list[str], cwd: Path, *, required: bool = True) -> int:
    log("\n▶ " + " ".join(cmd))
    p = subprocess.run(cmd, cwd=str(cwd), shell=False)
    if required and p.returncode != 0:
        fail(f"Lệnh thất bại ({p.returncode}): {' '.join(cmd)}", p.returncode)
    return p.returncode


def backup(root: Path, files: list[Path]) -> Path:
    base = root.parent / "_agrimarket_fix_backups"
    base.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = base / f"voucher-wallet-v1-{stamp}"
    dest.mkdir(parents=True, exist_ok=False)

    for src in files:
        if not src.is_file():
            continue
        try:
            rel = src.relative_to(root)
        except ValueError:
            continue
        dst = dest / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    ok(f"Backup ngoài repo: {dest}")
    return dest


def normalize_eof(path: Path) -> None:
    if not path.is_file():
        return
    raw = read(path)
    fixed = raw.rstrip() + "\n"
    if raw != fixed:
        path.write_text(fixed, encoding="utf-8", newline="\n")
        ok(f"Chuẩn hóa EOF: {path.name}")


def replace_required(s: str, old: str, new: str, label: str) -> str:
    if new in s:
        info(f"Đã có: {label}")
        return s
    if old not in s:
        fail(f"Không tìm thấy đoạn cần sửa: {label}")
    ok(label)
    return s.replace(old, new, 1)


def insert_before_required(s: str, marker: str, block: str, label: str) -> str:
    if block.strip() in s:
        info(f"Đã có: {label}")
        return s
    if marker not in s:
        fail(f"Không tìm thấy vị trí chèn: {label}")
    ok(label)
    return s.replace(marker, block + "\n" + marker, 1)


def ensure_schema_and_migration(root: Path) -> None:
    schema = root / SCHEMA_REL
    s = read(schema)

    if MARK_SCHEMA not in s:
        s = replace_required(
            s,
            """  taiKhoanLoyalty  TaiKhoanLoyalty?

  @@index([trangThai], map: "idx_khach_hang_trang_thai")""",
            """  taiKhoanLoyalty  TaiKhoanLoyalty?
  khuyenMaiDaLuu    KhachHangKhuyenMai[]

  @@index([trangThai], map: "idx_khach_hang_trang_thai")""",
            "Prisma: thêm quan hệ voucher đã lưu vào KhachHang",
        )

        s = replace_required(
            s,
            """  donHang          DonHang[]

  @@index([phamVi, trangThai, batDauLuc, ketThucLuc], map: "idx_khuyen_mai_scope_time")""",
            """  donHang          DonHang[]
  khachHangDaLuu   KhachHangKhuyenMai[]

  @@index([phamVi, trangThai, batDauLuc, ketThucLuc], map: "idx_khuyen_mai_scope_time")""",
            "Prisma: thêm quan hệ khách đã lưu vào KhuyenMai",
        )

        model = """
model KhachHangKhuyenMai {
  id           String     @id @default(uuid(7)) @db.Char(36)
  khachHangId  String     @map("khach_hang_id") @db.Char(36)
  khuyenMaiId  String     @map("khuyen_mai_id") @db.Char(36)
  createdAt    DateTime   @default(now()) @map("created_at") @db.DateTime(3)
  updatedAt    DateTime   @updatedAt @map("updated_at") @db.DateTime(3)
  khachHang    KhachHang  @relation(fields: [khachHangId], references: [id], onDelete: Cascade, map: "fk_khach_hang_khuyen_mai_khach_hang")
  khuyenMai    KhuyenMai  @relation(fields: [khuyenMaiId], references: [id], onDelete: Cascade, map: "fk_khach_hang_khuyen_mai_khuyen_mai")

  @@unique([khachHangId, khuyenMaiId], map: "uk_khach_hang_khuyen_mai")
  @@index([khuyenMaiId], map: "idx_khach_hang_khuyen_mai_khuyen_mai")
  @@index([khachHangId, createdAt], map: "idx_khach_hang_khuyen_mai_khach_hang_created_at")
  @@map("khach_hang_khuyen_mai")
}

"""
        marker = "model TheoDoiTrangTrai {"
        if marker not in s:
            fail("Prisma: không tìm thấy model TheoDoiTrangTrai.")
        s = s.replace(marker, model + marker, 1)
        write(schema, s)
        ok("Prisma: đã thêm ví voucher.")
    else:
        info("Prisma: ví voucher đã tồn tại.")

    # Đảm bảo luôn có migration tương ứng kể cả rerun sau một lần patch dở.
    migrations_root = root / "apps/api/prisma/migrations"
    found = False
    for migration_sql in migrations_root.glob("*/migration.sql"):
        try:
            if "khach_hang_khuyen_mai" in read(migration_sql):
                found = True
                break
        except OSError:
            pass

    if not found:
        stamp = dt.datetime.now().strftime("%Y%m%d%H%M%S")
        migration_dir = migrations_root / f"{stamp}_customer_voucher_wallet"
        migration_dir.mkdir(parents=True, exist_ok=False)
        sql = """-- Customer voucher wallet
CREATE TABLE `khach_hang_khuyen_mai` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `khuyen_mai_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_khach_hang_khuyen_mai`(`khach_hang_id`, `khuyen_mai_id`),
    INDEX `idx_khach_hang_khuyen_mai_khuyen_mai`(`khuyen_mai_id`),
    INDEX `idx_khach_hang_khuyen_mai_khach_hang_created_at`(`khach_hang_id`, `created_at`),
    PRIMARY KEY (`id`),

    CONSTRAINT `fk_khach_hang_khuyen_mai_khach_hang`
      FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT `fk_khach_hang_khuyen_mai_khuyen_mai`
      FOREIGN KEY (`khuyen_mai_id`) REFERENCES `khuyen_mai`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"""
        write(migration_dir / "migration.sql", sql)
        ok(f"Prisma: tạo migration {migration_dir.name}")
    else:
        info("Prisma: migration voucher wallet đã tồn tại.")


def write_customer_voucher_dto(root: Path) -> None:
    content = """import { ApiProperty } from '@nestjs/swagger';

import { PhamViKhuyenMai } from '../../../generated/prisma/client';

export class KhuyenMaiKhachHangDto {
  @ApiProperty() id!: string;
  @ApiProperty() ma!: string;
  @ApiProperty() ten!: string;
  @ApiProperty({ nullable: true, type: String }) moTa!: string | null;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;
  @ApiProperty({ nullable: true, type: String }) danhMucSanPhamId!: string | null;
  @ApiProperty({ nullable: true, type: String }) sanPhamId!: string | null;
  @ApiProperty() donHangToiThieu!: number;
  @ApiProperty() giaTriGiam!: number;
  @ApiProperty() batDauLuc!: Date;
  @ApiProperty() ketThucLuc!: Date;
  @ApiProperty({ nullable: true, type: Number }) gioiHanSuDung!: number | null;
  @ApiProperty() soLanDaSuDung!: number;
  @ApiProperty({ nullable: true, type: Number }) soLuotConLai!: number | null;
  @ApiProperty() daLuu!: boolean;
}

export class BoLuuKhuyenMaiKhachHangDto {
  @ApiProperty({ example: true }) ok!: boolean;
}
"""
    write(root / KHUYEN_MAI_KHACH_DTO_REL, content)
    ok("API: tạo DTO voucher khách hàng")


def write_customer_voucher_controller(root: Path) -> None:
    content = """import {
  Controller,
  Delete,
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

import {
  BoLuuKhuyenMaiKhachHangDto,
  KhuyenMaiKhachHangDto,
} from './dto/khuyen-mai-khach-hang.dto';
import { KhuyenMaiService } from './khuyen-mai.service';

@ApiTags('Khuyến mãi')
@Controller('khuyen-mai')
export class KhuyenMaiCongKhaiController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get('cong-khai')
  @ApiOperation({
    operationId: 'layKhuyenMaiCongKhai',
    summary: 'Lấy voucher đang hiệu lực để khách hàng có thể lưu',
  })
  @ApiOkResponse({ type: [KhuyenMaiKhachHangDto] })
  layCongKhai(): Promise<KhuyenMaiKhachHangDto[]> {
    return this.service.layCongKhaiKhachHang();
  }
}

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/khuyen-mai')
export class KhuyenMaiKhachHangController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layKhuyenMaiDaLuuCuaToi',
    summary: 'Lấy ví voucher của khách hàng hiện tại',
  })
  @ApiOkResponse({ type: [KhuyenMaiKhachHangDto] })
  layDaLuu(@Req() request: RequestDaXacThuc): Promise<KhuyenMaiKhachHangDto[]> {
    return this.service.layDaLuuKhachHang(this.nguoiDungId(request));
  }

  @Post(':id/luu')
  @ApiOperation({
    operationId: 'luuKhuyenMaiCuaToi',
    summary: 'Lưu voucher vào tài khoản khách hàng',
  })
  @ApiCreatedResponse({ type: KhuyenMaiKhachHangDto })
  luu(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<KhuyenMaiKhachHangDto> {
    return this.service.luuKhuyenMaiKhachHang(this.nguoiDungId(request), id);
  }

  @Delete(':id/luu')
  @ApiOperation({
    operationId: 'boLuuKhuyenMaiCuaToi',
    summary: 'Bỏ voucher khỏi ví khách hàng',
  })
  @ApiOkResponse({ type: BoLuuKhuyenMaiKhachHangDto })
  async boLuu(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<BoLuuKhuyenMaiKhachHangDto> {
    await this.service.boLuuKhuyenMaiKhachHang(this.nguoiDungId(request), id);
    return { ok: true };
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }
}
"""
    write(root / KHUYEN_MAI_KHACH_CONTROLLER_REL, content)
    ok("API: tạo controller voucher công khai + ví voucher")


def patch_khuyen_mai_module(root: Path) -> None:
    path = root / KHUYEN_MAI_MODULE_REL
    s = read(path)
    if "KhuyenMaiKhachHangController" in s:
        info("API module voucher đã khai báo.")
        return
    s = replace_required(
        s,
        """import { KhuyenMaiQuanTriController } from './khuyen-mai-quan-tri.controller';
import { KhuyenMaiService } from './khuyen-mai.service';""",
        """import {
  KhuyenMaiCongKhaiController,
  KhuyenMaiKhachHangController,
} from './khuyen-mai-khach-hang.controller';
import { KhuyenMaiQuanTriController } from './khuyen-mai-quan-tri.controller';
import { KhuyenMaiService } from './khuyen-mai.service';""",
        "API module: import controllers voucher",
    )
    s = replace_required(
        s,
        "controllers: [KhuyenMaiQuanTriController],",
        "controllers: [KhuyenMaiQuanTriController, KhuyenMaiCongKhaiController, KhuyenMaiKhachHangController],",
        "API module: đăng ký controllers voucher",
    )
    write(path, s)


def patch_admin_dto(root: Path) -> None:
    path = root / KHUYEN_MAI_ADMIN_DTO_REL
    s = read(path)

    if "moTa?: string | null;" not in s:
        s = replace_required(
            s,
            """  @ApiProperty({ enum: PhamViKhuyenMai })
  @IsEnum(PhamViKhuyenMai)
  phamVi!: PhamViKhuyenMai;""",
            """  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moTa?: string | null;

  @ApiProperty({ enum: PhamViKhuyenMai })
  @IsEnum(PhamViKhuyenMai)
  phamVi!: PhamViKhuyenMai;""",
            "Admin DTO: thêm mô tả voucher",
        )

    if "moTa!: string | null;" not in s:
        s = replace_required(
            s,
            """  @ApiProperty() ten!: string;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;""",
            """  @ApiProperty() ten!: string;
  @ApiProperty({ nullable: true, type: String }) moTa!: string | null;
  @ApiProperty({ enum: PhamViKhuyenMai }) phamVi!: PhamViKhuyenMai;""",
            "Admin response DTO: trả mô tả voucher",
        )
    write(path, s)


def patch_khuyen_mai_service(root: Path) -> None:
    path = root / KHUYEN_MAI_SERVICE_REL
    s = read(path)

    if "ForbiddenException" not in s.split("from '@nestjs/common';", 1)[0]:
        s = s.replace(
            "  ConflictException,\n  Injectable,",
            "  ConflictException,\n  ForbiddenException,\n  Injectable,",
            1,
        )
        ok("KhuyenMaiService: thêm ForbiddenException")

    if "KhuyenMaiKhachHangDto" not in s:
        marker = "import type {\n  DanhSachKhuyenMaiQuanTriDto,"
        if marker not in s:
            fail("KhuyenMaiService: không tìm thấy import DTO quản trị.")
        s = s.replace(
            marker,
            "import type { KhuyenMaiKhachHangDto } from './dto/khuyen-mai-khach-hang.dto';\n\n" + marker,
            1,
        )
        ok("KhuyenMaiService: import DTO khách hàng")

    if "khachHangId?: string;" not in s:
        s = replace_required(
            s,
            """export type NguCanhKhuyenMai = {
  tongTienDonHang: number;""",
            """export type NguCanhKhuyenMai = {
  khachHangId?: string;
  tongTienDonHang: number;""",
            "KhuyenMaiService: context có khachHangId",
        )

    if MARK_SERVICE not in s:
        methods = """  // AUTO_VOUCHER_WALLET_SERVICE_V1
  async layCongKhaiKhachHang(): Promise<KhuyenMaiKhachHangDto[]> {
    const now = new Date();
    const rows = await this.prisma.khuyenMai.findMany({
      where: {
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        batDauLuc: { lte: now },
        ketThucLuc: { gte: now },
      },
      orderBy: [{ ketThucLuc: 'asc' }, { giaTriGiam: 'desc' }],
    });

    return rows
      .filter((row) => this.conLuotKhuyenMai(row))
      .map((row) => this.toKhachHangDto(row, false));
  }

  async layDaLuuKhachHang(nguoiDungId: string): Promise<KhuyenMaiKhachHangDto[]> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    const now = new Date();
    const rows = await this.prisma.khachHangKhuyenMai.findMany({
      where: {
        khachHangId,
        khuyenMai: {
          trangThai: TrangThaiBanGhi.HOAT_DONG,
          batDauLuc: { lte: now },
          ketThucLuc: { gte: now },
        },
      },
      include: { khuyenMai: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows
      .map((row) => row.khuyenMai)
      .filter((row) => this.conLuotKhuyenMai(row))
      .map((row) => this.toKhachHangDto(row, true));
  }

  async luuKhuyenMaiKhachHang(
    nguoiDungId: string,
    khuyenMaiId: string,
  ): Promise<KhuyenMaiKhachHangDto> {
    const [khachHangId, row] = await Promise.all([
      this.layKhachHangIdTheoNguoiDung(nguoiDungId),
      this.prisma.khuyenMai.findUnique({ where: { id: khuyenMaiId } }),
    ]);

    if (!row) throw new NotFoundException('Không tìm thấy voucher.');
    if (!this.dangHieuLucChoKhachHang(row, new Date()) || !this.conLuotKhuyenMai(row)) {
      throw new BadRequestException('Voucher hiện không còn khả dụng để lưu.');
    }

    await this.prisma.khachHangKhuyenMai.upsert({
      where: {
        khachHangId_khuyenMaiId: {
          khachHangId,
          khuyenMaiId,
        },
      },
      create: { khachHangId, khuyenMaiId },
      update: {},
    });

    return this.toKhachHangDto(row, true);
  }

  async boLuuKhuyenMaiKhachHang(
    nguoiDungId: string,
    khuyenMaiId: string,
  ): Promise<void> {
    const khachHangId = await this.layKhachHangIdTheoNguoiDung(nguoiDungId);
    await this.prisma.khachHangKhuyenMai.deleteMany({
      where: { khachHangId, khuyenMaiId },
    });
  }

"""
        s = insert_before_required(
            s,
            "  async danhGiaTheoMa(",
            methods,
            "KhuyenMaiService: thêm public list + ví voucher",
        )

    if "Voucher chưa được lưu vào tài khoản." not in s:
        s = replace_required(
            s,
            """    if (!row) {
      return this.khongTimThay(normalized);
    }

    return this.danhGiaQuyTac(this.snapshot(row), nguCanh);""",
            """    if (!row) {
      return this.khongTimThay(normalized);
    }

    if (nguCanh.khachHangId) {
      const daLuu = await this.prisma.khachHangKhuyenMai.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: nguCanh.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { id: true },
      });
      if (!daLuu) return this.ketQuaChuaLuu(this.snapshot(row));
    }

    return this.danhGiaQuyTac(this.snapshot(row), nguCanh);""",
            "KhuyenMaiService: preview chỉ nhận voucher đã lưu",
        )

        s = replace_required(
            s,
            """    if (!row) {
      return this.khongTimThay(normalized);
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);""",
            """    if (!row) {
      return this.khongTimThay(normalized);
    }

    if (nguCanh.khachHangId) {
      const daLuu = await tx.khachHangKhuyenMai.findUnique({
        where: {
          khachHangId_khuyenMaiId: {
            khachHangId: nguCanh.khachHangId,
            khuyenMaiId: row.id,
          },
        },
        select: { id: true },
      });
      if (!daLuu) return this.ketQuaChuaLuu(this.snapshot(row));
    }

    const ketQua = this.danhGiaQuyTac(this.snapshot(row), nguCanh);""",
            "KhuyenMaiService: create order chỉ nhận voucher đã lưu",
        )

    if "moTa: dto.moTa?.trim() || null," not in s:
        s = replace_required(
            s,
            """    return {
      ma,
      ten,
      phamVi: dto.phamVi,""",
            """    return {
      ma,
      ten,
      moTa: dto.moTa?.trim() || null,
      phamVi: dto.phamVi,""",
            "KhuyenMaiService: lưu mô tả admin",
        )

    target = """      ma: row.ma,
      ten: row.ten,
      phamVi: row.phamVi,"""
    repl = """      ma: row.ma,
      ten: row.ten,
      moTa: row.moTa,
      phamVi: row.phamVi,"""
    if "moTa: row.moTa," not in s:
        if s.count(target) < 2:
            fail("KhuyenMaiService: không tìm đủ vị trí trả moTa.")
        s = s.replace(target, repl, 2)
        ok("KhuyenMaiService: trả/audit mô tả voucher")

    if "private async layKhachHangIdTheoNguoiDung" not in s:
        helpers = """  private async layKhachHangIdTheoNguoiDung(nguoiDungId: string): Promise<string> {
    const row = await this.prisma.khachHang.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: { id: true },
    });
    if (!row) {
      throw new ForbiddenException('Tài khoản hiện tại không phải khách hàng hoạt động.');
    }
    return row.id;
  }

  private dangHieuLucChoKhachHang(row: KhuyenMaiRow, now: Date): boolean {
    return (
      row.trangThai === TrangThaiBanGhi.HOAT_DONG &&
      row.batDauLuc.getTime() <= now.getTime() &&
      row.ketThucLuc.getTime() >= now.getTime()
    );
  }

  private conLuotKhuyenMai(row: KhuyenMaiRow): boolean {
    return row.gioiHanSuDung === null || row.soLanDaSuDung < row.gioiHanSuDung;
  }

  private toKhachHangDto(row: KhuyenMaiRow, daLuu: boolean): KhuyenMaiKhachHangDto {
    const soLuotConLai =
      row.gioiHanSuDung === null
        ? null
        : Math.max(0, row.gioiHanSuDung - row.soLanDaSuDung);

    return {
      id: row.id,
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
      soLuotConLai,
      daLuu,
    };
  }

  private ketQuaChuaLuu(rule: QuyTacKhuyenMaiSnapshot): KetQuaDanhGiaKhuyenMai {
    return {
      khuyenMaiId: rule.id,
      ma: rule.ma,
      hopLe: false,
      lyDo: 'Voucher chưa được lưu vào tài khoản.',
      phamVi: rule.phamVi,
      danhMucSanPhamId: rule.danhMucSanPhamId,
      sanPhamId: rule.sanPhamId,
      giaTriGiam: Number(rule.giaTriGiam ?? 0),
    };
  }

"""
        s = insert_before_required(
            s,
            "  private async layBatBuoc(",
            helpers,
            "KhuyenMaiService: thêm helpers voucher wallet",
        )

    write(path, s)


def patch_checkout_backend(root: Path) -> None:
    dto_path = root / CHECKOUT_PREVIEW_DTO_REL
    s = read(dto_path)

    if "class LoyaltyCheckoutPreviewDto" not in s:
        block = """export class LoyaltyCheckoutPreviewDto {
  @ApiProperty()
  soDuDiem!: number;

  @ApiProperty()
  giaTriMoiDiem!: number;

  @ApiProperty()
  diemToiDaCoTheSuDung!: number;

  @ApiProperty()
  giaTriGiamToiDa!: number;
}

"""
        s = insert_before_required(
            s,
            "export class CheckoutPreviewDto {",
            block,
            "Checkout DTO: thêm metadata điểm thưởng",
        )

    if "loyalty!: LoyaltyCheckoutPreviewDto;" not in s:
        s = replace_required(
            s,
            """  @ApiProperty({
    type: ThanhPhanChuaSanSangCheckoutPreviewDto,
  })
  points!: ThanhPhanChuaSanSangCheckoutPreviewDto;

  @ApiProperty({ type: TotalCheckoutPreviewDto })""",
            """  @ApiProperty({
    type: ThanhPhanChuaSanSangCheckoutPreviewDto,
  })
  points!: ThanhPhanChuaSanSangCheckoutPreviewDto;

  @ApiProperty({ type: LoyaltyCheckoutPreviewDto })
  loyalty!: LoyaltyCheckoutPreviewDto;

  @ApiProperty({ type: TotalCheckoutPreviewDto })""",
            "Checkout DTO: expose loyalty metadata",
        )
    write(dto_path, s)

    service_path = root / CHECKOUT_PREVIEW_SERVICE_REL
    s = read(service_path)

    if "khachHangId: gioHang.khachHangId," not in s:
        s = replace_required(
            s,
            """      const ketQua = await this.khuyenMaiService.danhGiaTheoMa(maKhuyenMai, {
        tongTienDonHang: tamTinhHangHoa,""",
            """      const ketQua = await this.khuyenMaiService.danhGiaTheoMa(maKhuyenMai, {
        khachHangId: gioHang.khachHangId,
        tongTienDonHang: tamTinhHangHoa,""",
            "Checkout preview: enforce voucher thuộc ví khách",
        )

    if MARK_CHECKOUT_PREVIEW not in s:
        point_marker = "    const diemSuDung = query.diemSuDung ?? 0;"
        metadata = """    // AUTO_VOUCHER_LOYALTY_PREVIEW_V1
    const [taiKhoanDiem, giaTriQuyDoiMoiDiem] = await Promise.all([
      this.prisma.taiKhoanLoyalty.findUnique({
        where: { khachHangId: gioHang.khachHangId },
        select: { diem: true },
      }),
      this.cauHinhHeThongService.layGiaTriQuyDoiMoiDiem(),
    ]);
    const soDuDiem = taiKhoanDiem?.diem ?? 0;
    const giaTriConLaiSauKhuyenMai = this.tien(Math.max(0, tamTinhHangHoa - giamKhuyenMai));
    const diemToiDaCoTheSuDung =
      giaTriQuyDoiMoiDiem > 0
        ? Math.max(
            0,
            Math.min(soDuDiem, Math.floor(giaTriConLaiSauKhuyenMai / giaTriQuyDoiMoiDiem)),
          )
        : 0;
    const giaTriGiamToiDa = this.tien(diemToiDaCoTheSuDung * Math.max(0, giaTriQuyDoiMoiDiem));

"""
        s = insert_before_required(
            s,
            point_marker,
            metadata,
            "Checkout preview: tính điểm tối đa dùng được",
        )

        old_fetch = """      const [taiKhoan, giaTriQuyDoiMoiDiem] = await Promise.all([
        this.prisma.taiKhoanLoyalty.findUnique({
          where: { khachHangId: gioHang.khachHangId },
          select: { diem: true },
        }),
        this.cauHinhHeThongService.layGiaTriQuyDoiMoiDiem(),
      ]);

"""
        if old_fetch not in s:
            fail("Checkout preview: không tìm thấy block query loyalty cũ.")
        s = s.replace(old_fetch, "", 1)
        s = s.replace(
            """      if (!taiKhoan || taiKhoan.diem < diemSuDung) {
        lyDoDiem = `Số dư điểm không đủ. Hiện có ${taiKhoan?.diem ?? 0} điểm.`;""",
            """      if (soDuDiem < diemSuDung) {
        lyDoDiem = `Số dư điểm không đủ. Hiện có ${soDuDiem} điểm.`;""",
            1,
        )
        ok("Checkout preview: tái sử dụng loyalty metadata")

    if "      loyalty: {" not in s:
        s = replace_required(
            s,
            """      points,
      total: {""",
            """      points,
      loyalty: {
        soDuDiem,
        giaTriMoiDiem: giaTriQuyDoiMoiDiem,
        diemToiDaCoTheSuDung,
        giaTriGiamToiDa,
      },
      total: {""",
            "Checkout preview: trả loyalty metadata",
        )

    write(service_path, s)

    order_path = root / DON_HANG_SERVICE_REL
    s = read(order_path)
    if "khachHangId: khachHang.id," not in s:
        s = replace_required(
            s,
            """                {
                  tongTienDonHang: tamTinhHangHoa,""",
            """                {
                  khachHangId: khachHang.id,
                  tongTienDonHang: tamTinhHangHoa,""",
            "Create order: enforce voucher thuộc ví khách",
        )
    write(order_path, s)


def write_runtime_api_client(root: Path) -> None:
    content = """import { layApiBaseUrl } from './runtime';

export type PhamViKhuyenMaiKhachHang = 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM';

export type KhuyenMaiKhachHang = {
  id: string;
  ma: string;
  ten: string;
  moTa: string | null;
  phamVi: PhamViKhuyenMaiKhachHang;
  danhMucSanPhamId: string | null;
  sanPhamId: string | null;
  donHangToiThieu: number;
  giaTriGiam: number;
  batDauLuc: string;
  ketThucLuc: string;
  gioiHanSuDung: number | null;
  soLanDaSuDung: number;
  soLuotConLai: number | null;
  daLuu: boolean;
};

type LoiHttp = Error & {
  status: number;
  data?: unknown;
};

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
  method: 'GET' | 'POST' | 'DELETE',
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  const response = await fetch(new URL(path, layApiBaseUrl()), {
    ...options,
    method,
    headers,
  });

  if (!response.ok) throw await taoLoiHttp(response);
  return (await response.json()) as T;
}

export function layKhuyenMaiCongKhaiRuntime(
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang[]> {
  return goiJson<KhuyenMaiKhachHang[]>('/api/v1/khuyen-mai/cong-khai', 'GET', options);
}

export function layKhuyenMaiDaLuuRuntime(
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang[]> {
  return goiJson<KhuyenMaiKhachHang[]>('/api/v1/khach-hang/khuyen-mai', 'GET', options);
}

export function luuKhuyenMaiRuntime(
  id: string,
  options: RequestInit = {},
): Promise<KhuyenMaiKhachHang> {
  return goiJson<KhuyenMaiKhachHang>(
    `/api/v1/khach-hang/khuyen-mai/${encodeURIComponent(id)}/luu`,
    'POST',
    options,
  );
}

export function boLuuKhuyenMaiRuntime(
  id: string,
  options: RequestInit = {},
): Promise<{ ok: boolean }> {
  return goiJson<{ ok: boolean }>(
    `/api/v1/khach-hang/khuyen-mai/${encodeURIComponent(id)}/luu`,
    'DELETE',
    options,
  );
}
"""
    write(root / API_CLIENT_VOUCHER_REL, content)

    index = root / API_CLIENT_INDEX_REL
    s = read(index)
    if "export * from './khuyen-mai-khach';" not in s:
        write(index, s.rstrip() + "\nexport * from './khuyen-mai-khach';\n")
        ok("api-client: export runtime voucher")
    else:
        info("api-client: runtime voucher đã export.")


def write_web_voucher_api(root: Path) -> None:
    content = """'use client';

import {
  boLuuKhuyenMaiRuntime,
  layKhuyenMaiCongKhaiRuntime,
  layKhuyenMaiDaLuuRuntime,
  luuKhuyenMaiRuntime,
  type KhuyenMaiKhachHang,
} from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

export type { KhuyenMaiKhachHang };

export const KHUYEN_MAI_CONG_KHAI_QUERY_KEY = ['khuyen-mai', 'cong-khai'] as const;
export const KHUYEN_MAI_DA_LUU_QUERY_KEY = ['khuyen-mai-khach', 'da-luu'] as const;

export function layKhuyenMaiCongKhaiKhach(): Promise<KhuyenMaiKhachHang[]> {
  return layKhuyenMaiCongKhaiRuntime({ cache: 'no-store' });
}

export function layKhuyenMaiDaLuuKhach(): Promise<KhuyenMaiKhachHang[]> {
  return thucThiApiKhachHang((tuyChon) =>
    layKhuyenMaiDaLuuRuntime({ ...tuyChon, cache: 'no-store' }),
  );
}

export function luuKhuyenMaiKhach(id: string): Promise<KhuyenMaiKhachHang> {
  return thucThiApiKhachHang((tuyChon) => luuKhuyenMaiRuntime(id, tuyChon));
}

export function boLuuKhuyenMaiKhach(id: string): Promise<{ ok: boolean }> {
  return thucThiApiKhachHang((tuyChon) => boLuuKhuyenMaiRuntime(id, tuyChon));
}
"""
    write(root / WEB_API_VOUCHER_REL, content)
    ok("Customer Web: tạo API voucher")


def patch_web_api_checkout(root: Path) -> None:
    path = root / WEB_API_CHECKOUT_REL
    s = read(path)

    old = """export type CheckoutPreviewKhach =
  Awaited<ReturnType<typeof layCheckoutPreview>>['data'];"""
    new = """type CheckoutPreviewGenerated =
  Awaited<ReturnType<typeof layCheckoutPreview>>['data'];

export type CheckoutPreviewKhach = CheckoutPreviewGenerated & {
  loyalty?: {
    soDuDiem: number;
    giaTriMoiDiem: number;
    diemToiDaCoTheSuDung: number;
    giaTriGiamToiDa: number;
  };
};"""
    if "type CheckoutPreviewGenerated" not in s:
        s = replace_required(s, old, new, "Customer Web checkout type: thêm loyalty metadata")
    write(path, s)


def write_promo_component(root: Path) -> None:
    content = """'use client';

// AUTO_VOUCHER_PROMO_CENTER_V1
import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconBolt, IconCheck, IconClock, IconTicket } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';
import {
  KHUYEN_MAI_CONG_KHAI_QUERY_KEY,
  KHUYEN_MAI_DA_LUU_QUERY_KEY,
  layKhuyenMaiCongKhaiKhach,
  layKhuyenMaiDaLuuKhach,
  luuKhuyenMaiKhach,
  type KhuyenMaiKhachHang,
} from '@/lib/api-khuyen-mai-khach';
import { AgriContainer } from './agri-container';
import { AgriSkeleton } from './agri-skeleton';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';
import { useXacThucKhachHang } from './phien-khach-hang-provider';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

function dinhDangThoiGian(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function nhanPhamVi(value: KhuyenMaiKhachHang['phamVi']): string {
  if (value === 'PLATFORM') return 'Toàn sàn';
  if (value === 'DANH_MUC') return 'Theo danh mục';
  return 'Theo sản phẩm';
}

export function DanhSachKhuyenMaiContent() {
  const queryClient = useQueryClient();
  const { trangThai } = useXacThucKhachHang();
  const daDangNhap = trangThai === 'da-dang-nhap';

  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  const voucherQuery = useQuery({
    queryKey: KHUYEN_MAI_CONG_KHAI_QUERY_KEY,
    queryFn: layKhuyenMaiCongKhaiKhach,
    staleTime: 30_000,
  });
  const daLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  const luuMutation = useMutation({
    mutationFn: luuKhuyenMaiKhach,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_CONG_KHAI_QUERY_KEY }),
      ]);
    },
  });

  const idsDaLuu = useMemo(
    () => new Set((daLuuQuery.data ?? []).map((item) => item.id)),
    [daLuuQuery.data],
  );

  const chienDich = useMemo(
    () => flashSaleQuery.data?.data ?? [],
    [flashSaleQuery.data],
  );
  const tongMuc = useMemo(
    () => chienDich.reduce((tong, cd) => tong + (cd.muc?.length ?? 0), 0),
    [chienDich],
  );

  return (
    <Box className="agri-page market-promo-page">
      <AgriContainer py={{ base: 18, md: 28 }}>
        <Stack gap="xl">
          <Group
            className="market-promo-toolbar"
            justify="space-between"
            align="center"
            gap="md"
            wrap="wrap"
          >
            <Stack gap={5}>
              <Breadcrumbs fz="xs" aria-label="Điều hướng trang khuyến mãi">
                <Anchor component={Link} href="/" c="dimmed">
                  Trang chủ
                </Anchor>
                <Text c="dark.7" fw={650}>
                  Khuyến mãi
                </Text>
              </Breadcrumbs>
              <Title order={1} fz={{ base: 23, sm: 27 }} fw={850}>
                Khuyến mãi
              </Title>
            </Stack>
            <Button component={Link} href="/gio-hang" variant="subtle" color="agrimarket">
              Xem giỏ hàng
            </Button>
          </Group>

          <Stack gap="md">
            <Group justify="space-between" align="flex-end" gap="md" wrap="wrap">
              <Stack gap={2}>
                <Group gap="xs">
                  <ThemeIcon variant="light" color="agrimarket" size={34} radius="md">
                    <IconTicket size={18} />
                  </ThemeIcon>
                  <Title order={2} fz="lg">
                    Mã giảm giá
                  </Title>
                </Group>
                <Text size="sm" c="dimmed">
                  Lưu voucher vào tài khoản, sau đó chọn trực tiếp khi thanh toán.
                </Text>
              </Stack>
              {daDangNhap ? (
                <Text size="xs" c="dimmed">
                  {idsDaLuu.size} mã đang có trong ví
                </Text>
              ) : null}
            </Group>

            {voucherQuery.isPending ? (
              <AgriSkeleton soLuong={3} />
            ) : voucherQuery.isError ? (
              <ErrorState
                tieuDe="Không tải được voucher"
                moTa="Hãy thử lại sau ít phút."
                onThuLai={() => void voucherQuery.refetch()}
              />
            ) : (voucherQuery.data?.length ?? 0) === 0 ? (
              <EmptyState
                tieuDe="Chưa có voucher đang phát hành"
                moTa="Voucher mới sẽ xuất hiện tại đây khi chương trình bắt đầu."
              />
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                {voucherQuery.data?.map((voucher) => {
                  const daLuu = idsDaLuu.has(voucher.id);
                  const dangLuu = luuMutation.isPending && luuMutation.variables === voucher.id;
                  return (
                    <Paper key={voucher.id} withBorder className="market-voucher-card" p={0}>
                      <Group wrap="nowrap" align="stretch" gap={0} h="100%">
                        <Box className="market-voucher-card__mark">
                          <IconTicket size={28} />
                          <Text fw={900} size="xs">
                            AGRI
                          </Text>
                        </Box>
                        <Stack gap={7} p="md" style={{ flex: 1, minWidth: 0 }}>
                          <Group justify="space-between" gap="sm" wrap="nowrap">
                            <Text fw={900} fz="lg" c="agrimarket.8">
                              Giảm {dinhDangTien(voucher.giaTriGiam)}
                            </Text>
                            <Badge variant="light" color="green" radius="sm">
                              {nhanPhamVi(voucher.phamVi)}
                            </Badge>
                          </Group>

                          <Text fw={800} lineClamp={1}>
                            {voucher.ten}
                          </Text>
                          {voucher.moTa ? (
                            <Text size="sm" c="dimmed" lineClamp={2}>
                              {voucher.moTa}
                            </Text>
                          ) : null}

                          <Group gap="xs" wrap="wrap">
                            <Badge variant="outline" color="gray" radius="sm">
                              {voucher.ma}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {voucher.donHangToiThieu > 0
                                ? `Đơn tối thiểu ${dinhDangTien(voucher.donHangToiThieu)}`
                                : 'Không yêu cầu đơn tối thiểu'}
                            </Text>
                          </Group>

                          <Group justify="space-between" align="center" mt="auto" gap="sm" wrap="wrap">
                            <Group gap={5}>
                              <IconClock size={14} color="#64748B" />
                              <Text size="xs" c="dimmed">
                                HSD {dinhDangThoiGian(voucher.ketThucLuc)}
                              </Text>
                            </Group>

                            {!daDangNhap ? (
                              <Button
                                component={Link}
                                href="/dang-nhap?next=/khuyen-mai"
                                size="xs"
                                variant="light"
                                color="agrimarket"
                              >
                                Đăng nhập để lưu
                              </Button>
                            ) : daLuu ? (
                              <Button
                                size="xs"
                                variant="light"
                                color="green"
                                leftSection={<IconCheck size={15} />}
                                disabled
                              >
                                Đã lưu
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="agrimarket"
                                loading={dangLuu}
                                disabled={luuMutation.isPending && !dangLuu}
                                onClick={() => luuMutation.mutate(voucher.id)}
                              >
                                Lưu mã
                              </Button>
                            )}
                          </Group>
                        </Stack>
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>

          <Stack gap="md">
            <Group gap="xs">
              <IconBolt size={22} color="#E53935" fill="#E53935" />
              <Title order={2} fz="lg" c="#C62828">
                Flash Sale
              </Title>
            </Group>

            {flashSaleQuery.isPending ? (
              <AgriSkeleton soLuong={6} />
            ) : flashSaleQuery.isError ? (
              <ErrorState
                tieuDe="Không tải được Flash Sale"
                moTa="Chương trình giảm giá đang tạm thời không khả dụng."
                onThuLai={() => void flashSaleQuery.refetch()}
              />
            ) : chienDich.length === 0 || tongMuc === 0 ? (
              <Paper withBorder p="lg" className="market-promo-empty">
                <Text size="sm" c="dimmed">
                  Hiện chưa có sản phẩm Flash Sale.
                </Text>
              </Paper>
            ) : (
              <Stack gap="xl">
                {chienDich.map((cd) => {
                  if (!cd.muc || cd.muc.length === 0) return null;
                  return (
                    <Stack key={cd.id} gap="md">
                      <Stack gap={2}>
                        <Text fw={900} fz={17} c="#C62828">
                          {cd.ten}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          {cd.moTa ? (
                            <Text size="sm" c="dimmed">
                              {cd.moTa}
                            </Text>
                          ) : null}
                          <Text size="sm" c="dimmed">
                            {`${dinhDangThoiGian(cd.batDauLuc)} – ${dinhDangThoiGian(cd.ketThucLuc)}`}
                          </Text>
                        </Group>
                      </Stack>

                      <Box
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                          gap: 10,
                          alignItems: 'stretch',
                        }}
                      >
                        {cd.muc.map((muc) => {
                          const hetHang = muc.soLuongKhaDung <= 0;
                          return (
                            <Paper
                              key={muc.bienTheSanPhamId}
                              component={Link}
                              href={`/san-pham/${muc.sanPhamId}`}
                              bg="white"
                              withBorder
                              p={8}
                              radius="sm"
                              pos="relative"
                              h="100%"
                              className="market-flash-card"
                              style={{
                                textDecoration: 'none',
                                color: 'inherit',
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 0,
                              }}
                            >
                              <Badge
                                pos="absolute"
                                top={8}
                                left={8}
                                bg="#E53935"
                                c="white"
                                radius={4}
                                size="sm"
                                fw={800}
                                styles={{ root: { zIndex: 2 } }}
                              >
                                {`-${muc.phanTramGiam}%`}
                              </Badge>

                              <Box
                                h={115}
                                style={{
                                  display: 'grid',
                                  placeItems: 'center',
                                  overflow: 'hidden',
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={muc.anhBiaUrl || anhDuPhongSanPham(muc.ten)}
                                  fallbackSrc={anhDuPhongSanPham(muc.ten)}
                                  alt={muc.ten}
                                  h={105}
                                  w="100%"
                                  fit="contain"
                                />
                              </Box>

                              <Stack gap={2} mt={6} style={{ flex: 1, minWidth: 0 }}>
                                <Text fw={750} size="xs" c="#173126" lineClamp={2} mih={32} lh={1.35}>
                                  {muc.ten}
                                </Text>
                                <Text size="11px" c="dimmed" lineClamp={1}>
                                  {`${muc.trangTrai.ten} · ${muc.khoiLuong} ${muc.donVi}`}
                                </Text>

                                <Group justify="space-between" align="flex-end" mt="auto" pt={4} wrap="nowrap">
                                  <Stack gap={0}>
                                    <Text fw={900} fz={13.5} c="#0B7A48">
                                      {dinhDangTien(muc.giaFlash)}
                                    </Text>
                                    <Text size="10px" c="dimmed" td="line-through">
                                      {dinhDangTien(muc.giaGoc)}
                                    </Text>
                                  </Stack>
                                  {hetHang ? (
                                    <Badge size="xs" radius={4} bg="#F1F5F2" c="#64748B">
                                      Hết hàng
                                    </Badge>
                                  ) : null}
                                </Group>
                              </Stack>
                            </Paper>
                          );
                        })}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </Stack>
      </AgriContainer>
    </Box>
  );
}
"""
    write(root / WEB_PROMO_REL, content)
    ok("Customer Web: làm lại trung tâm khuyến mãi + lưu voucher")


def patch_promo_metadata(root: Path) -> None:
    path = root / WEB_PROMO_PAGE_REL
    s = read(path)
    s = s.replace(
        "description: 'Săn Flash Sale nông sản giảm giá từ các trang trại trên AgriMarket.',",
        "description: 'Lưu voucher, săn Flash Sale và chọn ưu đãi khi thanh toán trên AgriMarket.',",
    )
    write(path, s)


def patch_checkout_web(root: Path) -> None:
    path = root / WEB_CHECKOUT_REL
    s = read(path)

    if MARK_CHECKOUT_WEB in s:
        info("Checkout Web voucher UI đã được patch.")
        return

    # Mantine imports.
    if "  Modal,\n" not in s:
        s = s.replace("  Image,\n  Paper,", "  Image,\n  Modal,\n  Paper,", 1)
        ok("Checkout Web: thêm Modal")
    if "  Switch,\n" not in s:
        s = s.replace("  Stack,\n  Text,", "  Stack,\n  Switch,\n  Text,", 1)
        ok("Checkout Web: thêm Switch")
    if "  TextInput,\n" in s:
        s = s.replace("  TextInput,\n", "", 1)
    if "  IconCoins,\n" in s:
        s = s.replace("  IconCoins,\n", "", 1)

    # API voucher import.
    if "api-khuyen-mai-khach" not in s:
        marker = "import { useXacThucKhachHang } from './phien-khach-hang-provider';"
        api_import = """import {
  KHUYEN_MAI_DA_LUU_QUERY_KEY,
  layKhuyenMaiDaLuuKhach,
  type KhuyenMaiKhachHang,
} from '@/lib/api-khuyen-mai-khach';
"""
        if marker not in s:
            fail("Checkout Web: không tìm thấy import AuthProvider.")
        s = s.replace(marker, api_import + marker, 1)
        ok("Checkout Web: import ví voucher")

    # State nhập tay -> modal + selected offer.
    state_pattern = re.compile(
        r"\s*const \[maKhuyenMaiNhap, setMaKhuyenMaiNhap\] = useState\(''\);\n"
        r"\s*const \[diemNhap, setDiemNhap\] = useState\(''\);\n"
        r"\s*const \[uuDaiApDung, setUuDaiApDung\] = useState<UuDaiCheckout>\(\{\}\);\n"
        r"\s*const \[loiUuDai, setLoiUuDai\] = useState<string \| null>\(null\);"
    )
    match = state_pattern.search(s)
    if not match:
        fail("Checkout Web: không tìm thấy state ưu đãi cũ.")
    replacement_states = """
  const [moChonVoucher, setMoChonVoucher] = useState(false);
  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
"""
    s = s[:match.start()] + replacement_states + s[match.end():]
    ok("Checkout Web: bỏ state nhập mã/điểm thủ công")

    # Query ví voucher.
    if "const voucherDaLuuQuery = useQuery" not in s:
        anchor = """  useEffect(() => {
    if (!diaChiQuery.data?.length) return;"""
        block = """  const voucherDaLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuKhach,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 0,
  });

"""
        if anchor not in s:
            fail("Checkout Web: không tìm thấy useEffect địa chỉ để chèn voucher query.")
        s = s.replace(anchor, block + anchor, 1)
        ok("Checkout Web: query ví voucher")

    # Functions form cũ -> actions mới.
    funcs = re.compile(
        r"  function apDungUuDai\(\) \{.*?\n  \}\n\n"
        r"  function boUuDai\(\) \{.*?\n  \}\n",
        re.S,
    )
    match = funcs.search(s)
    if not match:
        fail("Checkout Web: không tìm thấy apDungUuDai/boUuDai.")
    new_funcs = """  function chonVoucher(ma: string) {
    if (donHangDaTao || previewQuery.isFetching) return;
    setUuDaiApDung((hienTai) => ({
      ...hienTai,
      maKhuyenMai: ma,
      diemSuDung: undefined,
    }));
    setMoChonVoucher(false);
  }

  function boVoucher() {
    if (donHangDaTao || previewQuery.isFetching) return;
    setUuDaiApDung((hienTai) => ({
      ...hienTai,
      maKhuyenMai: undefined,
      diemSuDung: undefined,
    }));
  }

  function doiDungDiem(checked: boolean) {
    if (donHangDaTao || previewQuery.isFetching) return;
    const toiDa = preview?.loyalty?.diemToiDaCoTheSuDung ?? 0;
    setUuDaiApDung((hienTai) => ({
      ...hienTai,
      diemSuDung: checked && toiDa > 0 ? toiDa : undefined,
    }));
  }
"""
    s = s[:match.start()] + new_funcs + s[match.end():]
    ok("Checkout Web: thay form nhập bằng chọn voucher + toggle điểm")

    # Derived info.
    anchor = "  const diemHienCo = diemTongQuanQuery.data?.diem ?? null;"
    if anchor not in s:
        fail("Checkout Web: không tìm thấy diemHienCo.")
    derived = """  const diemHienCo = diemTongQuanQuery.data?.diem ?? null;
  const vouchersDaLuu = voucherDaLuuQuery.data ?? [];
  const voucherDangDung =
    vouchersDaLuu.find((item) => item.ma === uuDaiApDung.maKhuyenMai) ?? null;
  const loyalty = preview.loyalty;
  const dangDungDiem = (uuDaiApDung.diemSuDung ?? 0) > 0;

  function danhGiaVoucherSoBo(
    voucher: KhuyenMaiKhachHang,
  ): { hopLe: boolean; lyDo: string | null } {
    if (preview.price.tamTinhHangHoa < voucher.donHangToiThieu) {
      return {
        hopLe: false,
        lyDo: `Cần đơn từ ${dinhDangGia(voucher.donHangToiThieu)} ₫`,
      };
    }
    if (
      voucher.phamVi === 'SAN_PHAM' &&
      voucher.sanPhamId &&
      !preview.items.some((item) => item.sanPhamId === voucher.sanPhamId)
    ) {
      return { hopLe: false, lyDo: 'Giỏ hàng chưa có sản phẩm áp dụng.' };
    }
    return { hopLe: true, lyDo: null };
  }
"""
    s = s.replace(anchor, derived, 1)
    ok("Checkout Web: thêm eligibility sơ bộ voucher")

    # Modal chọn voucher.
    modal_anchor = "          {coItemKhongHopLe ? ("
    if modal_anchor not in s:
        fail("Checkout Web: không tìm thấy vị trí chèn Modal voucher.")
    modal = """          <Modal
            opened={moChonVoucher}
            onClose={() => setMoChonVoucher(false)}
            title={<Text fw={850}>Chọn voucher</Text>}
            centered
            size="lg"
          >
            {voucherDaLuuQuery.isPending ? (
              <AgriSkeleton soLuong={3} />
            ) : voucherDaLuuQuery.isError ? (
              <Stack gap="sm">
                <Text size="sm" c="red.7">Không tải được ví voucher.</Text>
                <Button variant="light" onClick={() => void voucherDaLuuQuery.refetch()}>
                  Thử lại
                </Button>
              </Stack>
            ) : vouchersDaLuu.length === 0 ? (
              <Stack gap="md" align="center" py="md">
                <Text fw={800}>Bạn chưa lưu voucher nào</Text>
                <Text size="sm" c="dimmed" ta="center">
                  Vào trang Khuyến mãi để lưu mã trước, sau đó quay lại chọn tại đây.
                </Text>
                <Button component={Link} href="/khuyen-mai" color="agrimarket">
                  Xem khuyến mãi
                </Button>
              </Stack>
            ) : (
              <Stack gap="sm">
                {vouchersDaLuu.map((voucher) => {
                  const danhGia = danhGiaVoucherSoBo(voucher);
                  const dangChon = voucherDangDung?.id === voucher.id;
                  return (
                    <Paper key={voucher.id} withBorder p="md" className="market-voucher-option">
                      <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                        <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                          <Group gap="xs" wrap="wrap">
                            <Text fw={900} c="agrimarket.8">
                              Giảm {dinhDangGia(voucher.giaTriGiam)} ₫
                            </Text>
                            <Text size="xs" fw={800} c="dimmed">
                              {voucher.ma}
                            </Text>
                          </Group>
                          <Text fw={700} size="sm" lineClamp={1}>
                            {voucher.ten}
                          </Text>
                          <Text size="xs" c={danhGia.hopLe ? 'dimmed' : 'orange.8'}>
                            {danhGia.lyDo ??
                              (voucher.donHangToiThieu > 0
                                ? `Đơn tối thiểu ${dinhDangGia(voucher.donHangToiThieu)} ₫`
                                : 'Có thể áp dụng cho đơn hàng hiện tại.')}
                          </Text>
                          {voucher.phamVi === 'DANH_MUC' ? (
                            <Text size="xs" c="dimmed">
                              Điều kiện danh mục được kiểm tra chính xác khi áp dụng.
                            </Text>
                          ) : null}
                        </Stack>
                        <Button
                          size="xs"
                          color="agrimarket"
                          variant={dangChon ? 'light' : 'filled'}
                          disabled={!danhGia.hopLe || dangChon}
                          onClick={() => chonVoucher(voucher.ma)}
                        >
                          {dangChon ? 'Đang dùng' : 'Chọn'}
                        </Button>
                      </Group>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Modal>

"""
    s = s.replace(modal_anchor, modal + modal_anchor, 1)
    ok("Checkout Web: thêm popup chọn voucher")

    # Replace full step.
    step_pattern = re.compile(
        r"""              <BuocCheckout so=\{2\}.*?title="Voucher và điểm thưởng">.*?              </BuocCheckout>""",
        re.S,
    )
    match = step_pattern.search(s)
    if not match:
        fail("Checkout Web: không tìm thấy block Voucher và điểm thưởng.")

    new_step = """              <BuocCheckout so={2} icon={<IconTicket size={20} />} title="Ưu đãi">
                <Paper withBorder className="market-checkout-choice" p="md">
                  <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                    <Stack gap={3} style={{ minWidth: 0 }}>
                      <Text fw={850}>Voucher AgriMarket</Text>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {voucherDangDung
                          ? `${voucherDangDung.ma} · giảm ${dinhDangGia(voucherDangDung.giaTriGiam)} ₫`
                          : vouchersDaLuu.length > 0
                            ? `${vouchersDaLuu.length} voucher đã lưu`
                            : 'Chưa có voucher trong ví'}
                      </Text>
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      {voucherDangDung ? (
                        <Button
                          variant="subtle"
                          color="gray"
                          size="xs"
                          onClick={boVoucher}
                          disabled={khoaLuaChon || previewQuery.isFetching}
                        >
                          Bỏ chọn
                        </Button>
                      ) : null}
                      <Button
                        variant="light"
                        color="agrimarket"
                        size="xs"
                        onClick={() => setMoChonVoucher(true)}
                        disabled={khoaLuaChon}
                      >
                        {voucherDangDung ? 'Đổi voucher' : 'Chọn voucher'}
                      </Button>
                    </Group>
                  </Group>
                </Paper>

                <Paper withBorder className="market-checkout-choice" p="md">
                  <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                    <Stack gap={3} style={{ minWidth: 0 }}>
                      <Text fw={850}>Điểm thưởng</Text>
                      <Text size="sm" c="dimmed">
                        {diemHienCo === null
                          ? 'Đang tải số dư điểm'
                          : loyalty && loyalty.diemToiDaCoTheSuDung > 0
                            ? `Có ${dinhDangGia(diemHienCo)} điểm · giảm tối đa ${dinhDangGia(loyalty.giaTriGiamToiDa)} ₫`
                            : `Có ${dinhDangGia(diemHienCo)} điểm · chưa thể dùng cho đơn này`}
                      </Text>
                    </Stack>
                    <Switch
                      checked={dangDungDiem}
                      onChange={(event) => doiDungDiem(event.currentTarget.checked)}
                      disabled={
                        khoaLuaChon ||
                        previewQuery.isFetching ||
                        !loyalty ||
                        loyalty.diemToiDaCoTheSuDung <= 0
                      }
                      aria-label="Sử dụng điểm thưởng"
                    />
                  </Group>
                </Paper>

                {preview.promotion.trangThai === 'DA_TINH' ? (
                  <Text size="xs" c="green.8" fw={700}>
                    Voucher đã giảm {dinhDangGia(preview.promotion.giaTri ?? 0)} ₫.
                  </Text>
                ) : null}
                {preview.points.trangThai === 'DA_TINH' ? (
                  <Text size="xs" c="green.8" fw={700}>
                    Điểm thưởng đã giảm {dinhDangGia(preview.points.giaTri ?? 0)} ₫.
                  </Text>
                ) : null}
              </BuocCheckout>"""
    s = s[:match.start()] + new_step + s[match.end():]
    ok("Checkout Web: thay form voucher/điểm bằng UI sàn TMĐT")

    # Marker + guard.
    s = s.replace("'use client';", f"'use client';\n\n// {MARK_CHECKOUT_WEB}", 1)
    for token in ["maKhuyenMaiNhap", "diemNhap", "loiUuDai", "apDungUuDai", "boUuDai"]:
        if token in s:
            fail(f"Checkout Web vẫn còn logic nhập tay cũ: {token}")

    write(path, s)


def patch_admin_web(root: Path) -> None:
    api_path = root / ADMIN_API_REL
    s = read(api_path)

    # Hai type có cùng đoạn ten/phamVi. Patch chính xác từng interface.
    if "moTa: string | null;" not in s:
        s = s.replace(
            """export type KhuyenMaiAdmin = {
  id: string;
  ma: string;
  ten: string;
  phamVi:""",
            """export type KhuyenMaiAdmin = {
  id: string;
  ma: string;
  ten: string;
  moTa: string | null;
  phamVi:""",
            1,
        )
        ok("Admin API: response type có moTa")

    if "moTa?: string | null;" not in s:
        s = s.replace(
            """export type LuuKhuyenMaiAdmin = {
  ma: string;
  ten: string;
  phamVi:""",
            """export type LuuKhuyenMaiAdmin = {
  ma: string;
  ten: string;
  moTa?: string | null;
  phamVi:""",
            1,
        )
        ok("Admin API: request type có moTa")
    write(api_path, s)

    page_path = root / ADMIN_PAGE_REL
    s = read(page_path)
    if MARK_ADMIN in s:
        info("Admin UI mô tả voucher đã patch.")
        return

    if "ProFormTextArea" not in s:
        s = s.replace("  ProFormText,\n", "  ProFormText,\n  ProFormTextArea,\n", 1)

    s = s.replace(
        """type FormKhuyenMai = {
  ma: string;
  ten: string;
  phamVi:""",
        """type FormKhuyenMai = {
  ma: string;
  ten: string;
  moTa?: string;
  phamVi:""",
        1,
    )

    s = s.replace(
        """    ma: values.ma.trim().toUpperCase(),
    ten: values.ten.trim(),
    phamVi: values.phamVi,""",
        """    ma: values.ma.trim().toUpperCase(),
    ten: values.ten.trim(),
    moTa: values.moTa?.trim() || null,
    phamVi: values.phamVi,""",
        1,
    )

    idx = s.find('      <ProFormSelect\n        name="phamVi"')
    if idx == -1:
        fail("Admin page: không tìm thấy trường phạm vi.")
    field = """      <ProFormTextArea
        name="moTa"
        label="Mô tả hiển thị cho khách"
        fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
        rules={[{ max: 500 }]}
        placeholder="Ví dụ: Dành cho đơn nông sản từ 200.000đ"
      />
"""
    s = s[:idx] + field + s[idx:]

    s = s.replace(
        """          ma: dangSua.ma,
          ten: dangSua.ten,
          phamVi: dangSua.phamVi,""",
        """          ma: dangSua.ma,
          ten: dangSua.ten,
          moTa: dangSua.moTa ?? undefined,
          phamVi: dangSua.phamVi,""",
        1,
    )

    s = s.replace(
        """            { key: 'name', label: 'Tên', children: chiTiet.ten },
            { key: 'scope', label: 'Phạm vi', children: nhanPhamVi(chiTiet.phamVi) },""",
        """            { key: 'name', label: 'Tên', children: chiTiet.ten },
            { key: 'description', label: 'Mô tả khách hàng', children: chiTiet.moTa || '—' },
            { key: 'scope', label: 'Phạm vi', children: nhanPhamVi(chiTiet.phamVi) },""",
        1,
    )

    s = s.replace("'use client';", f"'use client';\n\n// {MARK_ADMIN}", 1)
    write(page_path, s)
    ok("Admin Web: thêm mô tả voucher")


def patch_css(root: Path) -> None:
    path = root / WEB_CSS_REL
    s = read(path)
    if MARK_CSS in s:
        info("CSS voucher wallet đã có.")
        return

    block = """

/* ===== MARKET VOUCHER WALLET V1 ===== */
.market-promo-page {
  background: #f5f6f5;
}

.market-promo-toolbar {
  min-height: 72px;
  padding: 12px 16px;
  border: 1px solid #e4e9e5;
  border-radius: 10px;
  background: #fff;
}

.market-voucher-card {
  overflow: hidden;
  border-color: #e0e7e2 !important;
  border-radius: 10px !important;
  background: #fff;
  box-shadow: none !important;
}

.market-voucher-card__mark {
  width: 92px;
  min-height: 154px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #eaf7ef;
  color: #087a4b;
  border-right: 1px dashed #b8d9c4;
  flex-shrink: 0;
}

.market-voucher-option {
  border-color: #e1e7e3 !important;
  border-radius: 9px !important;
  box-shadow: none !important;
}

.market-flash-card,
.market-promo-empty {
  border-color: #e1e7e3 !important;
  box-shadow: none !important;
}

@media (max-width: 767px) {
  .market-promo-toolbar {
    padding: 10px 12px;
  }

  .market-voucher-card__mark {
    width: 74px;
  }
}
"""
    write(path, s.rstrip() + block)
    ok("Customer Web CSS: thêm voucher wallet")


def write_voucher_test(root: Path) -> None:
    content = """import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function doc(rel) {
  return fs.readFileSync(path.resolve(process.cwd(), rel), 'utf-8');
}

test('1. Prisma có ví voucher theo tài khoản, unique customer + promotion', () => {
  const schema = doc('apps/api/prisma/schema.prisma');
  assert.match(schema, /model KhachHangKhuyenMai/);
  assert.match(schema, /@@unique\\(\\[khachHangId, khuyenMaiId\\]/);
  assert.match(schema, /khuyenMaiDaLuu/);
});

test('2. API có public voucher + lưu/bỏ lưu protected', () => {
  const controller = doc('apps/api/src/modules/khuyen-mai/khuyen-mai-khach-hang.controller.ts');
  assert.match(controller, /Controller\\('khuyen-mai'\\)/);
  assert.match(controller, /Get\\('cong-khai'\\)/);
  assert.match(controller, /Controller\\('khach-hang\\/khuyen-mai'\\)/);
  assert.match(controller, /Post\\(':id\\/luu'\\)/);
  assert.match(controller, /Delete\\(':id\\/luu'\\)/);
  assert.match(controller, /JwtAccessGuard/);
});

test('3. Backend checkout chỉ chấp nhận voucher đã lưu', () => {
  const service = doc('apps/api/src/modules/khuyen-mai/khuyen-mai.service.ts');
  const preview = doc('apps/api/src/modules/gio-hang/checkout-preview.service.ts');
  const order = doc('apps/api/src/modules/don-hang/don-hang.service.ts');
  assert.match(service, /Voucher chưa được lưu vào tài khoản/);
  assert.match(service, /khachHangId_khuyenMaiId/);
  assert.match(preview, /khachHangId: gioHang\\.khachHangId/);
  assert.match(order, /khachHangId: khachHang\\.id/);
});

test('4. Trang khuyến mãi là nơi khách lưu voucher', () => {
  const content = doc('apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx');
  assert.match(content, /Mã giảm giá/);
  assert.match(content, /Lưu mã/);
  assert.match(content, /Đã lưu/);
  assert.match(content, /layKhuyenMaiCongKhaiKhach/);
  assert.match(content, /luuKhuyenMaiKhach/);
});

test('5. Checkout không còn bắt nhập mã/điểm bằng TextInput', () => {
  const content = doc('apps/customer-web/src/components/checkout-content.tsx');
  assert.equal(content.includes('label="Mã khuyến mãi"'), false);
  assert.equal(content.includes('label="Điểm muốn sử dụng"'), false);
  assert.match(content, /Chọn voucher/);
  assert.match(content, /voucherDaLuuQuery/);
  assert.match(content, /<Switch/);
  assert.match(content, /diemToiDaCoTheSuDung/);
});

test('6. Checkout preview expose mức điểm tối đa server-side', () => {
  const dto = doc('apps/api/src/modules/gio-hang/dto/checkout-preview.dto.ts');
  const service = doc('apps/api/src/modules/gio-hang/checkout-preview.service.ts');
  assert.match(dto, /LoyaltyCheckoutPreviewDto/);
  assert.match(dto, /diemToiDaCoTheSuDung/);
  assert.match(service, /giaTriQuyDoiMoiDiem/);
  assert.match(service, /giaTriGiamToiDa/);
});

test('7. Admin có mô tả voucher hiển thị cho khách', () => {
  const dto = doc('apps/api/src/modules/khuyen-mai/dto/quan-tri-khuyen-mai.dto.ts');
  const admin = doc('apps/admin-web/src/app/khuyen-mai/page.tsx');
  assert.match(dto, /moTa/);
  assert.match(admin, /Mô tả hiển thị cho khách/);
});
"""
    write(root / WEB_VOUCHER_TEST_REL, content)
    ok("Tests: tạo contract voucher wallet")


def static_guard(root: Path) -> None:
    checkout = read(root / WEB_CHECKOUT_REL)
    promo = read(root / WEB_PROMO_REL)
    schema = read(root / SCHEMA_REL)
    service = read(root / KHUYEN_MAI_SERVICE_REL)

    forbidden_checkout = [
        'label="Mã khuyến mãi"',
        'label="Điểm muốn sử dụng"',
        "maKhuyenMaiNhap",
        "diemNhap",
    ]
    bad = [x for x in forbidden_checkout if x in checkout]
    if bad:
        fail("Static guard: checkout vẫn còn input ưu đãi cũ: " + ", ".join(bad))

    required = {
        "schema wallet": MARK_SCHEMA in schema,
        "backend wallet": MARK_SERVICE in service,
        "promo save": "Lưu mã" in promo,
        "checkout modal": "Chọn voucher" in checkout,
        "checkout switch": "<Switch" in checkout,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        fail("Static guard thiếu: " + ", ".join(missing))

    ok("Static guard voucher flow PASS")


def verify(root: Path, no_db: bool) -> None:
    node = find_exe("node")
    pnpm = find_exe("pnpm")
    git = find_exe("git")

    run([pnpm, "--filter", "@agrimarket/api", "prisma:validate"], root)
    ok("Prisma validate PASS")

    run([pnpm, "--filter", "@agrimarket/api", "prisma:generate"], root)
    ok("Prisma generate PASS")

    run([node, "--test", str(WEB_VOUCHER_TEST_REL).replace("\\", "/")], root)
    ok("Voucher contract tests PASS")

    run([node, "--test", str(WEB_CHECKOUT_TEST_REL).replace("\\", "/")], root)
    ok("Checkout regression tests PASS")

    run([pnpm, "--filter", "@agrimarket/api-client", "typecheck"], root)
    ok("api-client typecheck PASS")

    run([pnpm, "--filter", "@agrimarket/api", "typecheck"], root)
    ok("API typecheck PASS")

    run([pnpm, "--filter", "@agrimarket/customer-web", "typecheck"], root)
    ok("Customer Web typecheck PASS")

    run([pnpm, "--filter", "@agrimarket/admin-web", "typecheck"], root)
    ok("Admin Web typecheck PASS")

    static_guard(root)

    run([pnpm, "--filter", "@agrimarket/api", "build"], root)
    ok("API build PASS")

    run([pnpm, "--filter", "@agrimarket/customer-web", "build"], root)
    ok("Customer Web build PASS")

    diff_paths = [
        str(SCHEMA_REL).replace("\\", "/"),
        "apps/api/prisma/migrations",
        str(KHUYEN_MAI_SERVICE_REL).replace("\\", "/"),
        str(KHUYEN_MAI_MODULE_REL).replace("\\", "/"),
        str(KHUYEN_MAI_ADMIN_DTO_REL).replace("\\", "/"),
        str(KHUYEN_MAI_KHACH_DTO_REL).replace("\\", "/"),
        str(KHUYEN_MAI_KHACH_CONTROLLER_REL).replace("\\", "/"),
        str(CHECKOUT_PREVIEW_SERVICE_REL).replace("\\", "/"),
        str(CHECKOUT_PREVIEW_DTO_REL).replace("\\", "/"),
        str(DON_HANG_SERVICE_REL).replace("\\", "/"),
        str(API_CLIENT_INDEX_REL).replace("\\", "/"),
        str(API_CLIENT_VOUCHER_REL).replace("\\", "/"),
        str(WEB_API_VOUCHER_REL).replace("\\", "/"),
        str(WEB_API_CHECKOUT_REL).replace("\\", "/"),
        str(WEB_PROMO_REL).replace("\\", "/"),
        str(WEB_PROMO_PAGE_REL).replace("\\", "/"),
        str(WEB_CHECKOUT_REL).replace("\\", "/"),
        str(WEB_CSS_REL).replace("\\", "/"),
        str(WEB_VOUCHER_TEST_REL).replace("\\", "/"),
        str(ADMIN_API_REL).replace("\\", "/"),
        str(ADMIN_PAGE_REL).replace("\\", "/"),
    ]
    run([git, "diff", "--check", "--", *diff_paths], root)
    ok("git diff --check scoped PASS")

    if no_db:
        warn("Bạn dùng --no-db: migration đã tạo nhưng chưa apply vào database.")
    else:
        run(
            [
                pnpm,
                "--filter",
                "@agrimarket/api",
                "exec",
                "prisma",
                "migrate",
                "deploy",
                "--config",
                "prisma7.config.ts",
            ],
            root,
        )
        ok("Database migration PASS")


def show_git(root: Path) -> None:
    git = find_exe("git")
    log("\n===== GIT STATUS =====")
    run([git, "status", "--short"], root, required=False)
    log("\n===== GIT DIFF STAT =====")
    run([git, "diff", "--stat"], root, required=False)


def commit_push(root: Path, do_commit: bool, do_push: bool) -> None:
    if not do_commit and not do_push:
        return
    if do_push and not do_commit:
        fail("--push phải đi cùng --commit.")

    git = find_exe("git")
    paths = [
        "apps/api/prisma/schema.prisma",
        "apps/api/prisma/migrations",
        "apps/api/src/modules/khuyen-mai",
        "apps/api/src/modules/gio-hang/checkout-preview.service.ts",
        "apps/api/src/modules/gio-hang/dto/checkout-preview.dto.ts",
        "apps/api/src/modules/don-hang/don-hang.service.ts",
        "apps/api/src/generated/prisma",
        "packages/api-client/src",
        "apps/customer-web/src/lib/api-khuyen-mai-khach.ts",
        "apps/customer-web/src/lib/api-checkout.ts",
        "apps/customer-web/src/components/danh-sach-khuyen-mai-content.tsx",
        "apps/customer-web/src/components/checkout-content.tsx",
        "apps/customer-web/src/app/khuyen-mai/page.tsx",
        "apps/customer-web/src/app/brand-sync.css",
        "apps/customer-web/test/khuyen-mai-voucher.test.mjs",
        "apps/admin-web/src/lib/api-khuyen-mai.ts",
        "apps/admin-web/src/app/khuyen-mai/page.tsx",
    ]
    existing = [p for p in paths if (root / p).exists()]
    run([git, "add", "--", *existing], root)

    rc = subprocess.run(
        [git, "diff", "--cached", "--quiet"],
        cwd=str(root),
        shell=False,
    ).returncode
    if rc == 0:
        info("Không có thay đổi mới để commit.")
    else:
        run(
            [git, "commit", "-m", "feat(web): hoàn thiện ví voucher và chọn ưu đãi khi thanh toán"],
            root,
        )
        ok("Commit thành công")

    if do_push:
        branch = subprocess.check_output(
            [git, "branch", "--show-current"],
            cwd=str(root),
            text=True,
        ).strip()
        if not branch:
            fail("Không xác định được branch hiện tại.")
        run([git, "push", "origin", branch], root)
        ok(f"Push origin/{branch} thành công")


def main() -> None:
    parser = argparse.ArgumentParser(description="Full voucher wallet AgriMarket")
    parser.add_argument("--repo", help="Đường dẫn root repo")
    parser.add_argument("--no-db", action="store_true", help="Không apply Prisma migration vào DB")
    parser.add_argument("--no-check", action="store_true", help="Chỉ sửa source, bỏ test/build/migration")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--push", action="store_true")
    args = parser.parse_args()

    if args.push and not args.commit:
        fail("--push phải dùng cùng --commit.")
    if args.no_check and (args.commit or args.push):
        fail("Không commit/push khi dùng --no-check.")

    root = find_repo(args.repo)
    info(f"Repo: {root}")

    required_rels = [
        SCHEMA_REL,
        KHUYEN_MAI_SERVICE_REL,
        KHUYEN_MAI_MODULE_REL,
        KHUYEN_MAI_ADMIN_DTO_REL,
        CHECKOUT_PREVIEW_SERVICE_REL,
        CHECKOUT_PREVIEW_DTO_REL,
        DON_HANG_SERVICE_REL,
        API_CLIENT_INDEX_REL,
        WEB_API_CHECKOUT_REL,
        WEB_PROMO_REL,
        WEB_PROMO_PAGE_REL,
        WEB_CHECKOUT_REL,
        WEB_CSS_REL,
        ADMIN_API_REL,
        ADMIN_PAGE_REL,
    ]
    required_files = [require(root, rel) for rel in required_rels]

    backup_dir = backup(root, required_files)

    try:
        ensure_schema_and_migration(root)
        write_customer_voucher_dto(root)
        write_customer_voucher_controller(root)
        patch_khuyen_mai_module(root)
        patch_admin_dto(root)
        patch_khuyen_mai_service(root)
        patch_checkout_backend(root)

        write_runtime_api_client(root)
        write_web_voucher_api(root)
        patch_web_api_checkout(root)
        write_promo_component(root)
        patch_promo_metadata(root)
        patch_checkout_web(root)
        patch_admin_web(root)
        patch_css(root)
        write_voucher_test(root)

        # Chuẩn hóa EOF các file trực tiếp sửa để diff --check không vướng blank line.
        for rel in [
            SCHEMA_REL,
            KHUYEN_MAI_SERVICE_REL,
            KHUYEN_MAI_MODULE_REL,
            KHUYEN_MAI_ADMIN_DTO_REL,
            KHUYEN_MAI_KHACH_DTO_REL,
            KHUYEN_MAI_KHACH_CONTROLLER_REL,
            CHECKOUT_PREVIEW_SERVICE_REL,
            CHECKOUT_PREVIEW_DTO_REL,
            DON_HANG_SERVICE_REL,
            API_CLIENT_INDEX_REL,
            API_CLIENT_VOUCHER_REL,
            WEB_API_VOUCHER_REL,
            WEB_API_CHECKOUT_REL,
            WEB_PROMO_REL,
            WEB_PROMO_PAGE_REL,
            WEB_CHECKOUT_REL,
            WEB_CSS_REL,
            WEB_VOUCHER_TEST_REL,
            ADMIN_API_REL,
            ADMIN_PAGE_REL,
        ]:
            normalize_eof(root / rel)

        ok("Đã sửa xong full voucher wallet + checkout")

        if args.no_check:
            warn("Đã bỏ test/typecheck/build/migration theo --no-check.")
        else:
            verify(root, args.no_db)

        show_git(root)
        commit_push(root, args.commit, args.push)

        log("\n============================================================")
        ok("FULL VOUCHER WALLET V1 HOÀN TẤT")
        info("Luồng mới: /khuyen-mai -> Lưu mã -> /thanh-toan -> Chọn voucher.")
        info("Điểm thưởng: công tắc dùng tối đa hợp lệ do backend tính.")
        info(f"Backup an toàn: {backup_dir}")
        if args.no_db:
            warn("Chưa apply DB vì bạn dùng --no-db.")
        else:
            info("Migration DB đã được apply.")
        log("============================================================")

    except BaseException:
        warn(f"Có lỗi. Backup an toàn: {backup_dir}")
        raise


if __name__ == "__main__":
    main()
