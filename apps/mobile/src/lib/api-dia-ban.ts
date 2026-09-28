import {
  layDanhSachThonToDanPhoTheoXaPhuong,
  layDanhSachXaPhuongHungYen,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';

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

/**
 * `TINH_HUNG_YEN`, `chuanHoaTenDiaBanMobile`, `nhanLoaiXaPhuongMobile` nằm ở
 * `./dia-ban-chuan-hoa` (không phụ thuộc generated client) để test Node thuần
 * load được. Re-export ở đây để các màn hình chỉ cần import từ một chỗ.
 */
export { TINH_HUNG_YEN, chuanHoaTenDiaBanMobile, nhanLoaiXaPhuongMobile } from './dia-ban-chuan-hoa';

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
