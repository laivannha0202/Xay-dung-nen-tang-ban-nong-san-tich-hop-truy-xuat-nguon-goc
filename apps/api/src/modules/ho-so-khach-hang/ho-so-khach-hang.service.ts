import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type { CapNhatHoSoKhachHangDto } from './dto/cap-nhat-ho-so-khach-hang.dto';
import type { HoSoKhachHangPhanHoiDto } from './dto/phan-hoi-ho-so-khach-hang.dto';

@Injectable()
export class HoSoKhachHangService {
  constructor(private readonly prisma: PrismaService) {}

  async lay(nguoiDungId: string): Promise<HoSoKhachHangPhanHoiDto> {
    const profile = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      include: { nguoiDung: true },
    });

    if (!profile || profile.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng đang hoạt động.');
    }

    return {
      khachHangId: profile.id,
      nguoiDungId: profile.nguoiDungId,
      email: profile.nguoiDung.email,
      soDienThoai: profile.nguoiDung.soDienThoai,
      hoTen: profile.nguoiDung.hoTen,
      ngaySinh: profile.ngaySinh ? profile.ngaySinh.toISOString().slice(0, 10) : null,
      createdAt: profile.createdAt,
      updatedAt:
        profile.updatedAt > profile.nguoiDung.updatedAt
          ? profile.updatedAt
          : profile.nguoiDung.updatedAt,
    };
  }

  async capNhat(
    nguoiDungId: string,
    dto: CapNhatHoSoKhachHangDto,
  ): Promise<HoSoKhachHangPhanHoiDto> {
    const current = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      select: { id: true, trangThai: true },
    });

    if (!current || current.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy hồ sơ khách hàng đang hoạt động.');
    }

    if (dto.ngaySinh !== undefined && dto.ngaySinh !== null) {
      this.validateNgaySinh(dto.ngaySinh);
    }

    const nguoiDungData: Prisma.NguoiDungUpdateInput = {};
    const khachHangData: Prisma.KhachHangUpdateInput = {};

    if (dto.hoTen !== undefined) {
      nguoiDungData.hoTen = dto.hoTen.trim();
    }
    if (dto.soDienThoai !== undefined) {
      nguoiDungData.soDienThoai = dto.soDienThoai?.trim() || null;
    }
    if (dto.ngaySinh !== undefined) {
      khachHangData.ngaySinh = dto.ngaySinh ? new Date(`${dto.ngaySinh}T00:00:00.000Z`) : null;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (Object.keys(nguoiDungData).length > 0) {
          await tx.nguoiDung.update({
            where: { id: nguoiDungId },
            data: nguoiDungData,
          });
        }
        if (Object.keys(khachHangData).length > 0) {
          await tx.khachHang.update({
            where: { id: current.id },
            data: khachHangData,
          });
        }
      });
    } catch (error) {
      if (this.laLoiUnique(error)) {
        throw new ConflictException('Số điện thoại đã được tài khoản khác sử dụng.');
      }
      throw error;
    }

    return this.lay(nguoiDungId);
  }

  private validateNgaySinh(value: string): void {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('Ngày sinh không hợp lệ.');
    }
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (date.getTime() > today.getTime()) {
      throw new BadRequestException('Ngày sinh không được ở tương lai.');
    }
  }

  private laLoiUnique(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }
    return (error as { code?: unknown }).code === 'P2002';
  }
}
