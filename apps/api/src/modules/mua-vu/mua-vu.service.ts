import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiMuaVu } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatMuaVuDto } from './dto/cap-nhat-mua-vu.dto';
import type { DanhSachMuaVuDto, MuaVuDto } from './dto/phan-hoi-mua-vu.dto';
import type { TaoMuaVuDto } from './dto/tao-mua-vu.dto';
import type { TruyVanMuaVuDto } from './dto/truy-van-mua-vu.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type MuaVuRow = Prisma.MuaVuGetPayload<{
  include: {
    trangTrai: true;
  };
}>;

@Injectable()
export class MuaVuService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanMuaVuDto): Promise<DanhSachMuaVuDto> {
    const where: Prisma.MuaVuWhereInput = {};

    if (dto.trangTraiId) {
      where.trangTraiId = dto.trangTraiId;
    }

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          cayTrong: {
            contains: timKiem,
          },
        },
        {
          giong: {
            contains: timKiem,
          },
        },
        {
          trangTrai: {
            ten: {
              contains: timKiem,
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.muaVu.findMany({
        where,
        include: {
          trangTrai: true,
        },
        orderBy: [
          {
            ngayDuKienThuHoach: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.muaVu.count({
        where,
      }),
    ]);

    return {
      duLieu: rows.map((row) => this.toDto(row)),
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<MuaVuDto> {
    const row = await this.prisma.muaVu.findUnique({
      where: { id },
      include: {
        trangTrai: true,
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy mùa vụ.');
    }

    return this.toDto(row);
  }

  async tao(tacNhanId: string, dto: TaoMuaVuDto, metadata: MetadataAudit): Promise<MuaVuDto> {
    const actor = await this.layActor(tacNhanId);

    await this.layTrangTraiHoatDong(dto.trangTraiId);

    const ngayTrong = this.taoNgay(dto.ngayTrong);
    const ngayDuKienThuHoach = this.taoNgay(dto.ngayDuKienThuHoach);

    this.kiemTraKhoangNgay(ngayTrong, ngayDuKienThuHoach);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.muaVu.create({
        data: {
          trangTraiId: dto.trangTraiId,
          cayTrong: dto.cayTrong.trim(),
          giong: dto.giong.trim(),
          ngayTrong,
          ngayDuKienThuHoach,
          sanLuongDuKienKg: dto.sanLuongDuKienKg,
          trangThai: dto.trangThai ?? TrangThaiMuaVu.KE_HOACH,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'MUA_VU_TAO',
          thucThe: 'mua_vu',
          thucTheId: moi.id,
          truoc: {
            tonTai: false,
          },
          sau: this.snapshot(moi),
          metadata,
        },
      });

      return moi.id;
    });

    return this.layChiTiet(id);
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatMuaVuDto,
    metadata: MetadataAudit,
  ): Promise<MuaVuDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layRaw(id)]);

    const data: Prisma.MuaVuUncheckedUpdateInput = {};

    if (dto.trangTraiId !== undefined) {
      await this.layTrangTraiHoatDong(dto.trangTraiId);
      data.trangTraiId = dto.trangTraiId;
    }

    if (dto.cayTrong !== undefined) {
      data.cayTrong = dto.cayTrong.trim();
    }

    if (dto.giong !== undefined) {
      data.giong = dto.giong.trim();
    }

    const ngayTrong = dto.ngayTrong !== undefined ? this.taoNgay(dto.ngayTrong) : hienTai.ngayTrong;

    const ngayDuKienThuHoach =
      dto.ngayDuKienThuHoach !== undefined
        ? this.taoNgay(dto.ngayDuKienThuHoach)
        : hienTai.ngayDuKienThuHoach;

    this.kiemTraKhoangNgay(ngayTrong, ngayDuKienThuHoach);

    if (dto.ngayTrong !== undefined) {
      data.ngayTrong = ngayTrong;
    }

    if (dto.ngayDuKienThuHoach !== undefined) {
      data.ngayDuKienThuHoach = ngayDuKienThuHoach;
    }

    if (dto.sanLuongDuKienKg !== undefined) {
      data.sanLuongDuKienKg = dto.sanLuongDuKienKg;
    }

    if (dto.trangThai !== undefined) {
      data.trangThai = dto.trangThai;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.muaVu.update({
        where: { id },
        data,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'MUA_VU_SUA',
          thucThe: 'mua_vu',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });
    });

    return this.layChiTiet(id);
  }

  private async layActor(id: string): Promise<{
    id: string;
    email: string;
  }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }

    return actor;
  }

  private async layTrangTraiHoatDong(id: string): Promise<void> {
    const farm = await this.prisma.trangTrai.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
      },
    });

    if (!farm) {
      throw new BadRequestException('Trang trại không tồn tại hoặc đã ngừng hoạt động.');
    }
  }

  private async layRaw(id: string) {
    const item = await this.prisma.muaVu.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy mùa vụ.');
    }

    return item;
  }

  private taoNgay(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      throw new BadRequestException('Ngày mùa vụ không hợp lệ.');
    }

    return date;
  }

  private kiemTraKhoangNgay(ngayTrong: Date, ngayDuKienThuHoach: Date): void {
    if (ngayDuKienThuHoach.getTime() <= ngayTrong.getTime()) {
      throw new BadRequestException('Ngày dự kiến thu hoạch phải sau ngày trồng.');
    }
  }

  private toDto(row: MuaVuRow): MuaVuDto {
    return {
      id: row.id,
      trangTrai: {
        id: row.trangTrai.id,
        ma: row.trangTrai.ma,
        ten: row.trangTrai.ten,
      },
      cayTrong: row.cayTrong,
      giong: row.giong,
      ngayTrong: this.dateOnly(row.ngayTrong),
      ngayDuKienThuHoach: this.dateOnly(row.ngayDuKienThuHoach),
      sanLuongDuKienKg: Number(row.sanLuongDuKienKg),
      trangThai: row.trangThai,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(item: {
    trangTraiId: string;
    cayTrong: string;
    giong: string;
    ngayTrong: Date;
    ngayDuKienThuHoach: Date;
    sanLuongDuKienKg: Prisma.Decimal;
    trangThai: TrangThaiMuaVu;
  }) {
    return {
      trangTraiId: item.trangTraiId,
      cayTrong: item.cayTrong,
      giong: item.giong,
      ngayTrong: this.dateOnly(item.ngayTrong),
      ngayDuKienThuHoach: this.dateOnly(item.ngayDuKienThuHoach),
      sanLuongDuKienKg: Number(item.sanLuongDuKienKg),
      trangThai: item.trangThai,
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
