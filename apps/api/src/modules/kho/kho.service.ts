import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatKhoDto } from './dto/cap-nhat-kho.dto';
import type { DanhSachKhoDto, KhoDto } from './dto/phan-hoi-kho.dto';
import type { TaoKhoDto } from './dto/tao-kho.dto';
import type { TruyVanKhoDto } from './dto/truy-van-kho.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class KhoService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanKhoDto): Promise<DanhSachKhoDto> {
    const where: Prisma.KhoWhereInput = {};

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    const timKiem = dto.timKiem?.trim();
    if (timKiem) {
      where.OR = [
        { maKho: { contains: timKiem } },
        { ten: { contains: timKiem } },
        { diaChi: { contains: timKiem } },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;
    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.kho.findMany({
        where,
        orderBy: [{ ten: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.kho.count({ where }),
    ]);

    return {
      duLieu,
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<KhoDto> {
    return this.layBatBuoc(id);
  }

  async tao(tacNhanId: string, dto: TaoKhoDto, metadata: MetadataAudit): Promise<KhoDto> {
    const actor = await this.layActor(tacNhanId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const moi = await tx.kho.create({
          data: {
            maKho: this.chuanHoaBatBuoc(dto.maKho, 'Mã kho'),
            ten: this.chuanHoaBatBuoc(dto.ten, 'Tên kho'),
            diaChi: this.chuanHoaBatBuoc(dto.diaChi, 'Địa chỉ kho'),
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'KHO_TAO',
            thucThe: 'kho',
            thucTheId: moi.id,
            truoc: { tonTai: false },
            sau: this.snapshot(moi),
            metadata,
          },
        });

        return moi;
      });
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatKhoDto,
    metadata: MetadataAudit,
  ): Promise<KhoDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);
    const data: Prisma.KhoUpdateInput = {};

    if (dto.maKho !== undefined) {
      data.maKho = this.chuanHoaBatBuoc(dto.maKho, 'Mã kho');
    }
    if (dto.ten !== undefined) {
      data.ten = this.chuanHoaBatBuoc(dto.ten, 'Tên kho');
    }
    if (dto.diaChi !== undefined) {
      data.diaChi = this.chuanHoaBatBuoc(dto.diaChi, 'Địa chỉ kho');
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có dữ liệu cần cập nhật.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const sau = await tx.kho.update({
          where: { id },
          data,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'KHO_SUA',
            thucThe: 'kho',
            thucTheId: id,
            truoc: this.snapshot(hienTai),
            sau: this.snapshot(sau),
            metadata,
          },
        });

        return sau;
      });
    } catch (error) {
      this.nemLoiUnique(error);
      throw error;
    }
  }

  async doiTrangThai(
    tacNhanId: string,
    id: string,
    trangThai: TrangThaiBanGhi,
    metadata: MetadataAudit,
  ): Promise<KhoDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (hienTai.trangThai === trangThai) {
      return hienTai;
    }

    return this.prisma.$transaction(async (tx) => {
      const sau = await tx.kho.update({
        where: { id },
        data: { trangThai },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'KHO_DOI_TRANG_THAI',
          thucThe: 'kho',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });

      return sau;
    });
  }

  private async layActor(id: string): Promise<{ id: string; email: string }> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!actor) {
      throw new NotFoundException('Không tìm thấy tác nhân.');
    }
    return actor;
  }

  private async layBatBuoc(id: string): Promise<KhoDto> {
    const item = await this.prisma.kho.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Không tìm thấy kho.');
    }
    return item;
  }

  private chuanHoaBatBuoc(value: string, tenTruong: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${tenTruong} không được để trống.`);
    }
    return normalized;
  }

  private snapshot(item: KhoDto) {
    return {
      maKho: item.maKho,
      ten: item.ten,
      diaChi: item.diaChi,
      trangThai: item.trangThai,
    };
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã kho đã tồn tại.');
    }
  }
}
