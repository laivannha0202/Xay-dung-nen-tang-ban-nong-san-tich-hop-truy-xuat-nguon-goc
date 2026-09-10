import {
  layGiaoDichDiemThuongRuntime,
  layTongQuanDiemThuongRuntime,
  type DanhSachGiaoDichDiemThuong,
  type TongQuanDiemThuong,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

export const DIEM_THUONG_TONG_QUAN_QUERY_KEY = ['diem-thuong-mobile', 'tong-quan'] as const;

export function diemThuongGiaoDichQueryKey(trang: number, gioiHan: number) {
  return ['diem-thuong-mobile', 'giao-dich', trang, gioiHan] as const;
}

export async function layTongQuanDiemThuongMobile(): Promise<TongQuanDiemThuong> {
  return layTongQuanDiemThuongRuntime(await layTuyChonBearer());
}

export async function layGiaoDichDiemThuongMobile(
  trang = 1,
  gioiHan = 20,
): Promise<DanhSachGiaoDichDiemThuong> {
  return layGiaoDichDiemThuongRuntime({ trang, gioiHan }, await layTuyChonBearer());
}
