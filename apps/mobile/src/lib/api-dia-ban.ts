import {
  layDanhSachThonToDanPhoTheoXaPhuong,
  layDanhSachXaPhuongHungYen,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';

export const TINH_HUNG_YEN = 'Hưng Yên';

export type XaPhuongHungYenMobile = {
  ma: string;
  ten: string;
  tenDayDu: string;
  loai: string;
  tenChuanHoa?: string;
};

export type ThonToDanPhoMobile = {
  ma: string;
  ten: string;
  tenDayDu: string;
  loai: string;
};

export function chuanHoaTenDiaBanMobile(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function layDanhSachXaPhuongHungYenMobile(): Promise<XaPhuongHungYenMobile[]> {
  const response = await layDanhSachXaPhuongHungYen();
  return duLieuApi(response) as XaPhuongHungYenMobile[];
}

export async function layDanhSachThonToDanPhoMobile(
  xaPhuongMa: string,
): Promise<ThonToDanPhoMobile[]> {
  const response = await layDanhSachThonToDanPhoTheoXaPhuong(xaPhuongMa);
  return duLieuApi(response) as ThonToDanPhoMobile[];
}
