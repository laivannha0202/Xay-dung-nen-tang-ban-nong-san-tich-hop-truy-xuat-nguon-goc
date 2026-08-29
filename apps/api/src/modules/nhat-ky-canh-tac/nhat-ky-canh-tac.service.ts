import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { LoaiSuKienCanhTac, Prisma } from '../../generated/prisma/client';

import type { CapNhatNhatKyCanhTacDto } from './dto/cap-nhat-nhat-ky-canh-tac.dto';
import type {
  DanhSachNhatKyCanhTacDto,
  NhatKyCanhTacDto,
} from './dto/phan-hoi-nhat-ky-canh-tac.dto';
import type { TaoNhatKyCanhTacDto } from './dto/tao-nhat-ky-canh-tac.dto';
import type { TruyVanNhatKyCanhTacDto } from './dto/truy-van-nhat-ky-canh-tac.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

type NhatKyCanhTacRow = Prisma.NhatKyCanhTacGetPayload<{
  include: {
    muaVu: {
      include: {
        trangTrai: true;
      };
    };
  };
}>;

@Injectable()
export class NhatKyCanhTacService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanNhatKyCanhTacDto): Promise<DanhSachNhatKyCanhTacDto> {
    const where: Prisma.NhatKyCanhTacWhereInput = {};

    if (dto.muaVuId) {
      where.muaVuId = dto.muaVuId;
    }

    if (dto.loaiSuKien) {
      where.loaiSuKien = dto.loaiSuKien;
    }

    if (dto.hienThiCongKhai !== undefined) {
      where.hienThiCongKhai = dto.hienThiCongKhai;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          noiDung: {
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
      this.prisma.nhatKyCanhTac.findMany({
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
            thoiGian: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.nhatKyCanhTac.count({
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

  async layChiTiet(id: string): Promise<NhatKyCanhTacDto> {
    const row = await this.prisma.nhatKyCanhTac.findUnique({
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
      throw new NotFoundException('Không tìm thấy nhật ký canh tác.');
    }

    return this.toDto(row);
  }

  async tao(
    tacNhanId: string,
    dto: TaoNhatKyCanhTacDto,
    metadata: MetadataAudit,
  ): Promise<NhatKyCanhTacDto> {
    const actor = await this.layActor(tacNhanId);

    await this.layMuaVuBatBuoc(dto.muaVuId);

    const thoiGian = this.taoThoiGian(dto.thoiGian);

    const id = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.nhatKyCanhTac.create({
        data: {
          muaVuId: dto.muaVuId,
          loaiSuKien: dto.loaiSuKien,
          thoiGian,
          noiDung: dto.noiDung.trim(),
          hienThiCongKhai: dto.hienThiCongKhai ?? false,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAT_KY_CANH_TAC_TAO',
          thucThe: 'nhat_ky_canh_tac',
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
    dto: CapNhatNhatKyCanhTacDto,
    metadata: MetadataAudit,
  ): Promise<NhatKyCanhTacDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layRaw(id)]);

    const data: Prisma.NhatKyCanhTacUncheckedUpdateInput = {};

    if (dto.muaVuId !== undefined) {
      await this.layMuaVuBatBuoc(dto.muaVuId);
      data.muaVuId = dto.muaVuId;
    }

    if (dto.loaiSuKien !== undefined) {
      data.loaiSuKien = dto.loaiSuKien;
    }

    if (dto.thoiGian !== undefined) {
      data.thoiGian = this.taoThoiGian(dto.thoiGian);
    }

    if (dto.noiDung !== undefined) {
      data.noiDung = dto.noiDung.trim();
    }

    if (dto.hienThiCongKhai !== undefined) {
      data.hienThiCongKhai = dto.hienThiCongKhai;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    await this.prisma.$transaction(async (tx) => {
      const sau = await tx.nhatKyCanhTac.update({
        where: { id },
        data,
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAT_KY_CANH_TAC_SUA',
          thucThe: 'nhat_ky_canh_tac',
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

  private async layMuaVuBatBuoc(id: string): Promise<void> {
    const season = await this.prisma.muaVu.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!season) {
      throw new BadRequestException('Mùa vụ không tồn tại.');
    }
  }

  private async layRaw(id: string) {
    const item = await this.prisma.nhatKyCanhTac.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy nhật ký canh tác.');
    }

    return item;
  }

  private taoThoiGian(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Thời gian sự kiện không hợp lệ.');
    }

    return date;
  }

  private toDto(row: NhatKyCanhTacRow): NhatKyCanhTacDto {
    return {
      id: row.id,
      muaVu: {
        id: row.muaVu.id,
        cayTrong: row.muaVu.cayTrong,
        giong: row.muaVu.giong,
        trangThai: row.muaVu.trangThai,
        trangTrai: {
          id: row.muaVu.trangTrai.id,
          ma: row.muaVu.trangTrai.ma,
          ten: row.muaVu.trangTrai.ten,
        },
      },
      loaiSuKien: row.loaiSuKien,
      thoiGian: row.thoiGian,
      noiDung: row.noiDung,
      hienThiCongKhai: row.hienThiCongKhai,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private snapshot(item: {
    muaVuId: string;
    loaiSuKien: LoaiSuKienCanhTac;
    thoiGian: Date;
    noiDung: string;
    hienThiCongKhai: boolean;
  }) {
    return {
      muaVuId: item.muaVuId,
      loaiSuKien: item.loaiSuKien,
      thoiGian: item.thoiGian.toISOString(),
      noiDung: item.noiDung,
      hienThiCongKhai: item.hienThiCongKhai,
    };
  }
}
