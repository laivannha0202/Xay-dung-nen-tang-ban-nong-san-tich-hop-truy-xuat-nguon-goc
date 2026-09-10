import {
  layGoiYSanPhamCuaToi,
  type DanhSachGoiYSanPham,
} from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

export const GOI_Y_MOBILE_QUERY_KEY = ['mobile', 'khach-hang', 'goi-y'] as const;

export async function layGoiYSanPhamMobile(gioiHan = 8): Promise<DanhSachGoiYSanPham> {
  return layGoiYSanPhamCuaToi(gioiHan, await layTuyChonBearer());
}
