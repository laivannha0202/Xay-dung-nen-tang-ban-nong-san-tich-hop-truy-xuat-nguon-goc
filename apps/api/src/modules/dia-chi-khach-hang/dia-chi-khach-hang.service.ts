import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type { CapNhatDiaChiKhachHangDto } from './dto/cap-nhat-dia-chi-khach-hang.dto';
import type { DiaChiKhachHangPhanHoiDto } from './dto/phan-hoi-dia-chi-khach-hang.dto';
import type { TaoDiaChiKhachHangDto } from './dto/tao-dia-chi-khach-hang.dto';

@Injectable()
export class DiaChiKhachHangService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(nguoiDungId: string): Promise<DiaChiKhachHangPhanHoiDto[]> {
    await this.damBaoKhachHangHoatDong(nguoiDungId);
    const items = await this.prisma.diaChi.findMany({
      where: { nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      orderBy: [{ macDinh: 'desc' }, { updatedAt: 'desc' }],
    });
    return items.map((item) => this.phanHoi(item));
  }

  async tao(nguoiDungId: string, dto: TaoDiaChiKhachHangDto): Promise<DiaChiKhachHangPhanHoiDto> {
    const id = await this.prisma.$transaction(async (tx) => {
      await this.khoaVaDamBaoKhachHang(tx, nguoiDungId);
      if (dto.macDinh === true) {
        await this.boMacDinhCu(tx, nguoiDungId);
      }
      const created = await tx.diaChi.create({
        data: {
          nguoiDungId,
          tenNguoiNhan: this.batBuoc(dto.tenNguoiNhan, 'Tên người nhận', 2),
          soDienThoai: dto.soDienThoai.trim(),
          dongDiaChi: this.batBuoc(dto.dongDiaChi, 'Dòng địa chỉ', 3),
          phuongXa: this.tuyChon(dto.phuongXa),
          quanHuyen: this.tuyChon(dto.quanHuyen),
          tinhThanh: this.batBuoc(dto.tinhThanh, 'Tỉnh/thành', 2),
          maBuuChinh: this.tuyChon(dto.maBuuChinh),
          macDinh: dto.macDinh === true,
        },
      });
      return created.id;
    });
    return this.layMot(nguoiDungId, id);
  }

  async capNhat(
    nguoiDungId: string,
    id: string,
    dto: CapNhatDiaChiKhachHangDto,
  ): Promise<DiaChiKhachHangPhanHoiDto> {
    await this.prisma.$transaction(async (tx) => {
      await this.khoaVaDamBaoKhachHang(tx, nguoiDungId);
      await this.timSoHuu(tx, nguoiDungId, id);

      const data: Prisma.DiaChiUpdateInput = {};
      if (dto.tenNguoiNhan !== undefined)
        data.tenNguoiNhan = this.batBuoc(dto.tenNguoiNhan, 'Tên người nhận', 2);
      if (dto.soDienThoai !== undefined) data.soDienThoai = dto.soDienThoai.trim();
      if (dto.dongDiaChi !== undefined)
        data.dongDiaChi = this.batBuoc(dto.dongDiaChi, 'Dòng địa chỉ', 3);
      if (dto.phuongXa !== undefined) data.phuongXa = this.tuyChon(dto.phuongXa);
      if (dto.quanHuyen !== undefined) data.quanHuyen = this.tuyChon(dto.quanHuyen);
      if (dto.tinhThanh !== undefined)
        data.tinhThanh = this.batBuoc(dto.tinhThanh, 'Tỉnh/thành', 2);
      if (dto.maBuuChinh !== undefined) data.maBuuChinh = this.tuyChon(dto.maBuuChinh);

      if (Object.keys(data).length > 0) {
        await tx.diaChi.update({ where: { id }, data });
      }
    });
    return this.layMot(nguoiDungId, id);
  }

  async datMacDinh(nguoiDungId: string, id: string): Promise<DiaChiKhachHangPhanHoiDto> {
    await this.prisma.$transaction(async (tx) => {
      await this.khoaVaDamBaoKhachHang(tx, nguoiDungId);
      await this.timSoHuu(tx, nguoiDungId, id);
      await this.boMacDinhCu(tx, nguoiDungId);
      await tx.diaChi.update({ where: { id }, data: { macDinh: true } });
    });
    return this.layMot(nguoiDungId, id);
  }

  async xoa(nguoiDungId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.khoaVaDamBaoKhachHang(tx, nguoiDungId);
      await this.timSoHuu(tx, nguoiDungId, id);
      await tx.diaChi.update({
        where: { id },
        data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG, macDinh: false },
      });
    });
  }

  private async layMot(nguoiDungId: string, id: string): Promise<DiaChiKhachHangPhanHoiDto> {
    const item = await this.prisma.diaChi.findFirst({
      where: { id, nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    if (!item) throw new NotFoundException('Không tìm thấy địa chỉ của khách hàng.');
    return this.phanHoi(item);
  }

  private async damBaoKhachHangHoatDong(nguoiDungId: string): Promise<void> {
    const customer = await this.prisma.khachHang.findUnique({
      where: { nguoiDungId },
      select: { trangThai: true },
    });
    if (!customer || customer.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy khách hàng đang hoạt động.');
    }
  }

  private async khoaVaDamBaoKhachHang(
    tx: Prisma.TransactionClient,
    nguoiDungId: string,
  ): Promise<void> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM nguoi_dung WHERE id = ${nguoiDungId} FOR UPDATE
    `;
    if (rows.length !== 1) throw new NotFoundException('Không tìm thấy người dùng.');
    const customer = await tx.khachHang.findUnique({
      where: { nguoiDungId },
      select: { trangThai: true },
    });
    if (!customer || customer.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
      throw new NotFoundException('Không tìm thấy khách hàng đang hoạt động.');
    }
  }

  private async timSoHuu(tx: Prisma.TransactionClient, nguoiDungId: string, id: string) {
    const item = await tx.diaChi.findFirst({
      where: { id, nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
    });
    if (!item) throw new NotFoundException('Không tìm thấy địa chỉ của khách hàng.');
    return item;
  }

  private async boMacDinhCu(tx: Prisma.TransactionClient, nguoiDungId: string): Promise<void> {
    await tx.diaChi.updateMany({
      where: { nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG, macDinh: true },
      data: { macDinh: false },
    });
  }

  private batBuoc(value: string, label: string, min: number): string {
    const normalized = value.trim();
    if (normalized.length < min) throw new BadRequestException(`${label} không hợp lệ.`);
    return normalized;
  }

  private tuyChon(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }

  private phanHoi(item: {
    id: string;
    tenNguoiNhan: string;
    soDienThoai: string;
    dongDiaChi: string;
    phuongXa: string | null;
    quanHuyen: string | null;
    tinhThanh: string;
    maBuuChinh: string | null;
    macDinh: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): DiaChiKhachHangPhanHoiDto {
    return {
      id: item.id,
      tenNguoiNhan: item.tenNguoiNhan,
      soDienThoai: item.soDienThoai,
      dongDiaChi: item.dongDiaChi,
      phuongXa: item.phuongXa,
      quanHuyen: item.quanHuyen,
      tinhThanh: item.tinhThanh,
      maBuuChinh: item.maBuuChinh,
      macDinh: item.macDinh,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
