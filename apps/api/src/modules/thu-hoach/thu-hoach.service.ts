import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiMuaVu } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatThuHoachDto } from './dto/cap-nhat-thu-hoach.dto';
import type { DanhSachThuHoachDto, ThuHoachDto } from './dto/phan-hoi-thu-hoach.dto';
import type { TaoThuHoachDto } from './dto/tao-thu-hoach.dto';
import type { TruyVanThuHoachDto } from './dto/truy-van-thu-hoach.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type ThuHoachRow = Prisma.ThuHoachGetPayload<{
  include: {
    muaVu: {
      include: {
        trangTrai: true;
      };
    };
  };
}>;

type MuaVuThuHoach = Prisma.MuaVuGetPayload<{
  select: {
    id: true;
    ngayTrong: true;
    trangThai: true;
  };
}>;

@Injectable()
export class ThuHoachService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanThuHoachDto): Promise<DanhSachThuHoachDto> {
    const where: Prisma.ThuHoachWhereInput = {};

    if (dto.muaVuId) {
      where.muaVuId = dto.muaVuId;
    }

    const donVi = dto.donVi?.trim();

    if (donVi) {
      where.donVi = donVi.toUpperCase();
    }

    const phanLoai = dto.phanLoai?.trim();

    if (phanLoai) {
      where.phanLoai = phanLoai;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          phanLoai: {
            contains: timKiem,
          },
        },
        {
          donVi: {
            contains: timKiem,
          },
        },
        {
          ghiChu: {
            contains: timKiem,
          },
        },
        {
          muaVu: {
            cayTrong: {
              contains: timKiem,
            },
          },
        },
        {
          muaVu: {
            giong: {
              contains: timKiem,
            },
          },
        },
        {
          muaVu: {
            trangTrai: {
              ten: {
                contains: timKiem,
              },
            },
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.thuHoach.findMany({
        where,
        include: {
          muaVu: {
            include: {
              trangTrai: true,
            },
          },
        },
        orderBy: [
          {
            ngayThuHoach: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.thuHoach.count({
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

  async layChiTiet(id: string): Promise<ThuHoachDto> {
    const row = await this.prisma.thuHoach.findUnique({
      where: { id },
      include: {
        muaVu: {
          include: {
            trangTrai: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy thu hoạch.');
    }

    return this.toDto(row);
  }

  async tao(tacNhanId: string, dto: TaoThuHoachDto, metadata: MetadataAudit): Promise<ThuHoachDto> {
    const [actor, muaVu] = await Promise.all([
      this.layActor(tacNhanId),
      this.layMuaVuCoTheThuHoach(dto.muaVuId),
    ]);

    const ngayThuHoach = this.taoNgay(dto.ngayThuHoach);

    this.kiemTraNgayThuHoach(ngayThuHoach, muaVu);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.thuHoach.create({
        data: {
          muaVuId: dto.muaVuId,
          ngayThuHoach,
          soLuong: dto.soLuong,
          donVi: dto.donVi.trim().toUpperCase(),
          phanLoai: dto.phanLoai.trim(),
          ghiChu: this.chuanHoaGhiChu(dto.ghiChu),
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'THU_HOACH_TAO',
          thucThe: 'thu_hoach',
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
    dto: CapNhatThuHoachDto,
    metadata: MetadataAudit,
  ): Promise<ThuHoachDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layRaw(id)]);

    const muaVuId = dto.muaVuId ?? hienTai.muaVuId;

    const muaVu = await this.layMuaVuCoTheThuHoach(muaVuId);

    const ngayThuHoach =
      dto.ngayThuHoach !== undefined ? this.taoNgay(dto.ngayThuHoach) : hienTai.ngayThuHoach;

    this.kiemTraNgayThuHoach(ngayThuHoach, muaVu);

    const data: Prisma.ThuHoachUncheckedUpdateInput = {};

    if (dto.muaVuId !== undefined) {
      data.muaVuId = dto.muaVuId;
    }

    if (dto.ngayThuHoach !== undefined) {
      data.ngayThuHoach = ngayThuHoach;
    }

    if (dto.soLuong !== undefined) {
      data.soLuong = dto.soLuong;
    }

    if (dto.donVi !== undefined) {
      data.donVi = dto.donVi.trim().toUpperCase();
    }

    if (dto.phanLoai !== undefined) {
      data.phanLoai = dto.phanLoai.trim();
    }

    if (dto.ghiChu !== undefined) {
      data.ghiChu = this.chuanHoaGhiChu(dto.ghiChu);
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.thuHoach.update({
        where: { id },
        data,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'THU_HOACH_SUA',
          thucThe: 'thu_hoach',
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

  private async layMuaVuCoTheThuHoach(id: string): Promise<MuaVuThuHoach> {
    const muaVu = await this.prisma.muaVu.findUnique({
      where: { id },
      select: {
        id: true,
        ngayTrong: true,
        trangThai: true,
      },
    });

    if (!muaVu) {
      throw new BadRequestException('Mùa vụ không tồn tại.');
    }

    if (muaVu.trangThai === TrangThaiMuaVu.HUY) {
      throw new BadRequestException('Không thể ghi thu hoạch cho mùa vụ đã hủy.');
    }

    return muaVu;
  }

  private async layRaw(id: string) {
    const item = await this.prisma.thuHoach.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy thu hoạch.');
    }

    return item;
  }

  private taoNgay(value: string): Date {
    const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      throw new BadRequestException('Ngày thu hoạch không hợp lệ.');
    }

    return date;
  }

  private kiemTraNgayThuHoach(ngayThuHoach: Date, muaVu: MuaVuThuHoach): void {
    if (ngayThuHoach.getTime() < muaVu.ngayTrong.getTime()) {
      throw new BadRequestException('Ngày thu hoạch không được trước ngày trồng.');
    }

    const now = new Date();
    const homNayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (ngayThuHoach.getTime() > homNayUtc.getTime()) {
      throw new BadRequestException('Ngày thu hoạch thực tế không được ở tương lai.');
    }
  }

  private chuanHoaGhiChu(value: string | undefined): string | null {
    const text = value?.trim();

    return text ? text : null;
  }

  private toDto(row: ThuHoachRow): ThuHoachDto {
    return {
      id: row.id,
      muaVu: {
        id: row.muaVu.id,
        cayTrong: row.muaVu.cayTrong,
        giong: row.muaVu.giong,
        ngayTrong: this.dateOnly(row.muaVu.ngayTrong),
        trangThai: row.muaVu.trangThai,
        trangTrai: {
          id: row.muaVu.trangTrai.id,
          ma: row.muaVu.trangTrai.ma,
          ten: row.muaVu.trangTrai.ten,
        },
      },
      ngayThuHoach: this.dateOnly(row.ngayThuHoach),
      soLuong: Number(row.soLuong),
      donVi: row.donVi,
      phanLoai: row.phanLoai,
      ghiChu: row.ghiChu,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(item: {
    muaVuId: string;
    ngayThuHoach: Date;
    soLuong: Prisma.Decimal;
    donVi: string;
    phanLoai: string;
    ghiChu: string | null;
  }) {
    return {
      muaVuId: item.muaVuId,
      ngayThuHoach: this.dateOnly(item.ngayThuHoach),
      soLuong: Number(item.soLuong),
      donVi: item.donVi,
      phanLoai: item.phanLoai,
      ghiChu: item.ghiChu,
    };
  }

  private dateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
