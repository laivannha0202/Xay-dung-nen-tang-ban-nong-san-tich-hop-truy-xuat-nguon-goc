import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi } from '../../generated/prisma/client';

import type { CapNhatDiaChiKhachHangDto } from './dto/cap-nhat-dia-chi-khach-hang.dto';
import type { DiaChiKhachHangPhanHoiDto } from './dto/phan-hoi-dia-chi-khach-hang.dto';
import type { TaoDiaChiKhachHangDto } from './dto/tao-dia-chi-khach-hang.dto';

const TINH_HUNG_YEN = 'Hưng Yên';

function chuanHoaTenTinh(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/^(tinh|thanh pho)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function laTinhHungYen(value: string): boolean {
  return chuanHoaTenTinh(value) === 'hung yen';
}

type DiaChiGiaoDich = Prisma.TransactionClient;

type XaPhuongDaKiemTra = {
  ma: string;
  tenDayDu: string;
};

type ThonToDanPhoDaKiemTra = {
  ma: string;
  tenDayDu: string;
};

@Injectable()
export class DiaChiKhachHangService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(nguoiDungId: string): Promise<DiaChiKhachHangPhanHoiDto[]> {
    await this.damBaoKhachHangHoatDong(nguoiDungId);
    const items = await this.prisma.diaChi.findMany({
      where: { nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      orderBy: [{ macDinh: 'desc' }, { updatedAt: 'desc' }],
      include: {
        xaPhuong: { select: { ma: true, tenDayDu: true } },
        thonToDanPho: { select: { ma: true, tenDayDu: true } },
      },
    });
    return items.map((item) => this.phanHoi(item));
  }

  async tao(nguoiDungId: string, dto: TaoDiaChiKhachHangDto): Promise<DiaChiKhachHangPhanHoiDto> {
    const id = await this.prisma.$transaction(async (tx) => {
      await this.khoaVaDamBaoKhachHang(tx, nguoiDungId);
      if (dto.macDinh === true) {
        await this.boMacDinhCu(tx, nguoiDungId);
      }

      const xaPhuongMa = dto.xaPhuongMa?.trim() || null;
      if (!xaPhuongMa) {
        throw new BadRequestException(
          'Vui lòng chọn Xã/Phường thuộc tỉnh Hưng Yên. AgriMarket hiện chỉ hỗ trợ địa chỉ giao hàng tại Hưng Yên.',
        );
      }

      const { xaPhuong, thonToDanPho } = await this.kiemTraDiaBanMoi(
        tx,
        xaPhuongMa,
        dto.thonToDanPhoMa?.trim() || null,
        dto.tinhThanh,
        dto.quanHuyen,
        dto.maBuuChinh,
      );
      const created = await tx.diaChi.create({
        data: {
          nguoiDungId,
          tenNguoiNhan: this.batBuoc(dto.tenNguoiNhan, 'Tên người nhận', 2),
          soDienThoai: dto.soDienThoai.trim(),
          dongDiaChi: this.batBuoc(dto.dongDiaChi, 'Địa chỉ chi tiết', 3),
          phuongXa: xaPhuong.tenDayDu,
          quanHuyen: null,
          tinhThanh: TINH_HUNG_YEN,
          maBuuChinh: null,
          xaPhuongMa: xaPhuong.ma,
          thonToDanPhoMa: thonToDanPho?.ma ?? null,
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
      const hienTai = await this.timSoHuu(tx, nguoiDungId, id);

      const data: Prisma.DiaChiUncheckedUpdateInput = {};
      if (dto.tenNguoiNhan !== undefined)
        data.tenNguoiNhan = this.batBuoc(dto.tenNguoiNhan, 'Tên người nhận', 2);
      if (dto.soDienThoai !== undefined) data.soDienThoai = dto.soDienThoai.trim();
      if (dto.dongDiaChi !== undefined)
        data.dongDiaChi = this.batBuoc(dto.dongDiaChi, 'Địa chỉ chi tiết', 3);

      const doiXaPhuong = dto.xaPhuongMa !== undefined;
      const xaPhuongMaMoi = doiXaPhuong ? dto.xaPhuongMa?.trim() || null : hienTai.xaPhuongMa;

      if (xaPhuongMaMoi) {
        const thonYeuCau =
          dto.thonToDanPhoMa !== undefined
            ? dto.thonToDanPhoMa?.trim() || null
            : doiXaPhuong
              ? null
              : hienTai.thonToDanPhoMa;
        const { xaPhuong, thonToDanPho } = await this.kiemTraDiaBanMoi(
          tx,
          xaPhuongMaMoi,
          thonYeuCau,
          dto.tinhThanh,
          dto.quanHuyen,
          dto.maBuuChinh,
        );
        data.xaPhuongMa = xaPhuong.ma;
        data.thonToDanPhoMa = thonToDanPho?.ma ?? null;
        data.phuongXa = xaPhuong.tenDayDu;
        data.quanHuyen = null;
        data.tinhThanh = TINH_HUNG_YEN;
        data.maBuuChinh = null;
      } else {
        const dangGuiTruongDiaBanCu =
          dto.phuongXa !== undefined ||
          dto.quanHuyen !== undefined ||
          dto.tinhThanh !== undefined ||
          dto.maBuuChinh !== undefined ||
          dto.thonToDanPhoMa !== undefined ||
          dto.xaPhuongMa !== undefined;

        if (dangGuiTruongDiaBanCu) {
          throw new BadRequestException(
            'Địa chỉ giao hàng mới chỉ hỗ trợ Hưng Yên. Vui lòng chọn Xã/Phường theo danh sách hiện hành.',
          );
        }
        // Tương thích dữ liệu legacy: vẫn cho sửa tên người nhận / điện thoại /
        // địa chỉ chi tiết, nhưng không cho tiếp tục thay đổi vị trí theo cấu trúc cũ.
      }

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

  private async kiemTraDiaBanMoi(
    tx: DiaChiGiaoDich,
    xaPhuongMa: string,
    thonToDanPhoMa: string | null,
    tinhThanh: string | undefined,
    quanHuyen: string | null | undefined,
    maBuuChinh: string | null | undefined,
  ): Promise<{ xaPhuong: XaPhuongDaKiemTra; thonToDanPho: ThonToDanPhoDaKiemTra | null }> {
    if (quanHuyen?.trim()) {
      throw new BadRequestException('AgriMarket không còn dùng Quận/Huyện. Vui lòng chọn Xã/Phường Hưng Yên.');
    }
    if (maBuuChinh?.trim()) {
      throw new BadRequestException('AgriMarket không còn dùng mã bưu chính.');
    }
    if (tinhThanh !== undefined && !laTinhHungYen(tinhThanh)) {
      throw new BadRequestException('Tỉnh giao hàng cố định là Hưng Yên.');
    }

    const xaPhuong = await tx.xaPhuongHungYen.findUnique({
      where: { ma: xaPhuongMa },
      select: { ma: true, tenDayDu: true, hoatDong: true },
    });
    if (!xaPhuong || !xaPhuong.hoatDong) {
      throw new BadRequestException('Xã/phường không thuộc tỉnh Hưng Yên.');
    }

    if (!thonToDanPhoMa) {
          const soThonToDanPhoDaCo = await tx.thonToDanPho.count({
            where: { xaPhuongMa: xaPhuong.ma, hoatDong: true },
          });
          if (soThonToDanPhoDaCo > 0) {
            throw new BadRequestException('Vui lòng chọn thôn/tổ dân phố.');
          }
          return { xaPhuong, thonToDanPho: null };
        }

    const thonToDanPho = await tx.thonToDanPho.findUnique({
      where: { ma: thonToDanPhoMa },
      select: { ma: true, tenDayDu: true, xaPhuongMa: true, hoatDong: true },
    });
    if (!thonToDanPho || !thonToDanPho.hoatDong) {
      throw new BadRequestException('Thôn/tổ dân phố không hợp lệ.');
    }
    if (thonToDanPho.xaPhuongMa !== xaPhuong.ma) {
      throw new BadRequestException('Thôn/tổ dân phố không thuộc xã/phường đã chọn.');
    }
    return { xaPhuong, thonToDanPho };
  }

  private async layMot(nguoiDungId: string, id: string): Promise<DiaChiKhachHangPhanHoiDto> {
    const item = await this.prisma.diaChi.findFirst({
      where: { id, nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      include: {
        xaPhuong: { select: { ma: true, tenDayDu: true } },
        thonToDanPho: { select: { ma: true, tenDayDu: true } },
      },
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
    xaPhuongMa: string | null;
    thonToDanPhoMa: string | null;
    macDinh: boolean;
    createdAt: Date;
    updatedAt: Date;
    xaPhuong?: { ma: string; tenDayDu: string } | null;
    thonToDanPho?: { ma: string; tenDayDu: string } | null;
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
      xaPhuongMa: item.xaPhuongMa,
      thonToDanPhoMa: item.thonToDanPhoMa,
      tenXaPhuong: item.xaPhuong?.tenDayDu ?? null,
      tenThonToDanPho: item.thonToDanPho?.tenDayDu ?? null,
      macDinh: item.macDinh,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
