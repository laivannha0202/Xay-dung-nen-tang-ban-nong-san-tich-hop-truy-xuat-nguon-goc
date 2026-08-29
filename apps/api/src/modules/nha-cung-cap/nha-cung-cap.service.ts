import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { Prisma } from '../../generated/prisma/client';

import type { CapNhatNhaCungCapDto } from './dto/cap-nhat-nha-cung-cap.dto';
import type { DanhSachNhaCungCapDto, NhaCungCapDto } from './dto/phan-hoi-nha-cung-cap.dto';
import type { TaoNhaCungCapDto } from './dto/tao-nha-cung-cap.dto';
import type { TruyVanNhaCungCapDto } from './dto/truy-van-nha-cung-cap.dto';

type MetadataAudit = {
  ip: string | null;
  userAgent: string | null;
};

@Injectable()
export class NhaCungCapService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(dto: TruyVanNhaCungCapDto): Promise<DanhSachNhaCungCapDto> {
    const where: Prisma.NhaCungCapWhereInput = {};

    if (dto.trangThai) {
      where.trangThai = dto.trangThai;
    }

    const timKiem = dto.timKiem?.trim();

    if (timKiem) {
      where.OR = [
        {
          ma: {
            contains: timKiem,
          },
        },
        {
          ten: {
            contains: timKiem,
          },
        },
        {
          nguoiDaiDien: {
            contains: timKiem,
          },
        },
        {
          email: {
            contains: timKiem,
          },
        },
        {
          soDienThoai: {
            contains: timKiem,
          },
        },
      ];
    }

    const skip = (dto.trang - 1) * dto.gioiHan;

    const [duLieu, tong] = await this.prisma.$transaction([
      this.prisma.nhaCungCap.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: dto.gioiHan,
      }),
      this.prisma.nhaCungCap.count({
        where,
      }),
    ]);

    return {
      duLieu,
      tong,
      trang: dto.trang,
      gioiHan: dto.gioiHan,
    };
  }

  async layChiTiet(id: string): Promise<NhaCungCapDto> {
    return this.layBatBuoc(id);
  }

  async tao(
    tacNhanId: string,
    dto: TaoNhaCungCapDto,
    metadata: MetadataAudit,
  ): Promise<NhaCungCapDto> {
    const actor = await this.layActor(tacNhanId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const moi = await tx.nhaCungCap.create({
          data: {
            ma: dto.ma.trim(),
            ten: dto.ten.trim(),
            nguoiDaiDien: this.chuanHoaOptional(dto.nguoiDaiDien),
            soDienThoai: this.chuanHoaOptional(dto.soDienThoai),
            email: this.chuanHoaOptional(dto.email)?.toLowerCase(),
            diaChi: this.chuanHoaOptional(dto.diaChi),
            ghiChu: this.chuanHoaOptional(dto.ghiChu),
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'NHA_CUNG_CAP_TAO',
            thucThe: 'nha_cung_cap',
            thucTheId: moi.id,
            truoc: {
              tonTai: false,
            },
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
    dto: CapNhatNhaCungCapDto,
    metadata: MetadataAudit,
  ): Promise<NhaCungCapDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    const data: Prisma.NhaCungCapUpdateInput = {};

    if (dto.ma !== undefined) {
      data.ma = dto.ma.trim();
    }

    if (dto.ten !== undefined) {
      data.ten = dto.ten.trim();
    }

    if (dto.nguoiDaiDien !== undefined) {
      data.nguoiDaiDien = this.chuanHoaOptional(dto.nguoiDaiDien);
    }

    if (dto.soDienThoai !== undefined) {
      data.soDienThoai = this.chuanHoaOptional(dto.soDienThoai);
    }

    if (dto.email !== undefined) {
      data.email = this.chuanHoaOptional(dto.email)?.toLowerCase();
    }

    if (dto.diaChi !== undefined) {
      data.diaChi = this.chuanHoaOptional(dto.diaChi);
    }

    if (dto.ghiChu !== undefined) {
      data.ghiChu = this.chuanHoaOptional(dto.ghiChu);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const sau = await tx.nhaCungCap.update({
          where: { id },
          data,
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'NHA_CUNG_CAP_SUA',
            thucThe: 'nha_cung_cap',
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
  ): Promise<NhaCungCapDto> {
    const [actor, hienTai] = await Promise.all([this.layActor(tacNhanId), this.layBatBuoc(id)]);

    if (hienTai.trangThai === trangThai) {
      return hienTai;
    }

    return this.prisma.$transaction(async (tx) => {
      const sau = await tx.nhaCungCap.update({
        where: { id },
        data: {
          trangThai,
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHA_CUNG_CAP_DOI_TRANG_THAI',
          thucThe: 'nha_cung_cap',
          thucTheId: id,
          truoc: this.snapshot(hienTai),
          sau: this.snapshot(sau),
          metadata,
        },
      });

      return sau;
    });
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

  private async layBatBuoc(id: string): Promise<NhaCungCapDto> {
    const item = await this.prisma.nhaCungCap.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Không tìm thấy nhà cung cấp.');
    }

    return item;
  }

  private chuanHoaOptional(value: string | undefined): string | null {
    const normalized = value?.trim();

    return normalized ? normalized : null;
  }

  private snapshot(item: NhaCungCapDto) {
    return {
      ma: item.ma,
      ten: item.ten,
      nguoiDaiDien: item.nguoiDaiDien,
      soDienThoai: item.soDienThoai,
      email: item.email,
      diaChi: item.diaChi,
      ghiChu: item.ghiChu,
      trangThai: item.trangThai,
    };
  }

  private nemLoiUnique(error: unknown): void {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Mã nhà cung cấp đã tồn tại.');
    }
  }
}
