import {
  layGiaoHangDonHangCuaToi,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const GIAO_HANG_MOBILE_QUERY_KEY = [
  'giao-hang-mobile',
] as const;

export function giaoHangDonHangMobileQueryKey(
  donHangId: string,
) {
  return [
    ...GIAO_HANG_MOBILE_QUERY_KEY,
    'don-hang',
    donHangId,
  ] as const;
}

export type SuKienGiaoHangMobile = {
  id: string;
  trangThai: string;
  moTa: string | null;
  viTri: string | null;
  thoiGian: string;
};

export type VanChuyenMobile = {
  id: string;
  donHangNhaCungCapId: string;
  maDonNhaCungCap: string;
  tenNhaCungCap: string;
  maVanDon: string;
  trangThai: string;
  createdAt: string;
  updatedAt: string;
  suKien: SuKienGiaoHangMobile[];
};

export type GiaoHangDonHangMobile = {
  donHangId: string;
  maDonHang: string;
  vanChuyen: VanChuyenMobile[];
};

export async function layGiaoHangDonHangMobile(
  donHangId: string,
): Promise<GiaoHangDonHangMobile> {
  const response = await layGiaoHangDonHangCuaToi(
    donHangId,
    await layTuyChonBearer(),
  );

  return duLieuApi(response) as GiaoHangDonHangMobile;
}
