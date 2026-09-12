import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';

export const THONG_DIEP_NGOAI_PHAM_VI_GIAO_HANG =
  'Hiện AgriMarket chỉ hỗ trợ giao hàng trong tỉnh Hưng Yên.';

/**
 * Hưng Yên hiện hành bao gồm địa bàn Hưng Yên và Thái Bình trước sắp xếp 2025.
 * Chấp nhận nhãn "Thái Bình" cũ để dữ liệu địa chỉ legacy không bị vô hiệu đột ngột.
 */
const TEN_TINH_HUNG_YEN_HIEN_HANH = new Set(['hung yen', 'thai binh']);

function chuanHoaTenDiaPhuong(value: string): string {
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

export function thuocPhamViGiaoHangHungYen(tinhThanh: string | null | undefined): boolean {
  if (!tinhThanh?.trim()) return false;
  return TEN_TINH_HUNG_YEN_HIEN_HANH.has(chuanHoaTenDiaPhuong(tinhThanh));
}

export type DanhGiaPhamViGiaoHang = {
  hopLe: boolean;
  lyDo: string | null;
  diaChiId: string | null;
  tinhThanh: string | null;
};

@Injectable()
export class PhamViGiaoHangService {
  constructor(private readonly prisma: PrismaService) {}

  async danhGiaDiaChi(
    nguoiDungId: string,
    diaChiGiaoHangId: string | null | undefined,
  ): Promise<DanhGiaPhamViGiaoHang> {
    if (!diaChiGiaoHangId) {
      return {
        hopLe: false,
        lyDo: 'Vui lòng chọn địa chỉ giao hàng trong tỉnh Hưng Yên.',
        diaChiId: null,
        tinhThanh: null,
      };
    }

    const diaChi = await this.prisma.diaChi.findFirst({
      where: {
        id: diaChiGiaoHangId,
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        id: true,
        tinhThanh: true,
      },
    });

    if (!diaChi) {
      return {
        hopLe: false,
        lyDo: 'Địa chỉ giao hàng không hợp lệ hoặc không thuộc tài khoản.',
        diaChiId: null,
        tinhThanh: null,
      };
    }

    if (!thuocPhamViGiaoHangHungYen(diaChi.tinhThanh)) {
      return {
        hopLe: false,
        lyDo: THONG_DIEP_NGOAI_PHAM_VI_GIAO_HANG,
        diaChiId: diaChi.id,
        tinhThanh: diaChi.tinhThanh,
      };
    }

    return {
      hopLe: true,
      lyDo: null,
      diaChiId: diaChi.id,
      tinhThanh: diaChi.tinhThanh,
    };
  }

  async damBaoDiaChiHopLe(nguoiDungId: string, diaChiGiaoHangId: string): Promise<void> {
    const ketQua = await this.danhGiaDiaChi(nguoiDungId, diaChiGiaoHangId);
    if (!ketQua.hopLe) {
      throw new BadRequestException(ketQua.lyDo ?? THONG_DIEP_NGOAI_PHAM_VI_GIAO_HANG);
    }
  }
}
