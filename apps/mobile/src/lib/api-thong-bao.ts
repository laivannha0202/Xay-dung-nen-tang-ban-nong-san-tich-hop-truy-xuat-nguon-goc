import { layThongBaoThuHoachMoi } from '@agrimarket/api-client';

import { layTuyChonBearer } from './phien-xac-thuc';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export const THONG_BAO_IN_APP_QUERY_KEY = ['thong-bao-mobile', 'in-app', 'thu-hoach'] as const;

export type ThongBaoThuHoachInAppMobile = {
  id: string;
  thuHoachId: string;
  trangTraiId: string;
  tenTrangTrai: string;
  cayTrong: string;
  giong: string;
  ngayThuHoach: string;
  soLuong: number;
  donVi: string;
  phanLoai: string;
  createdAt: string;
};

export type DanhSachThongBaoInAppMobile = {
  duLieu: ThongBaoThuHoachInAppMobile[];
  tong: number;
};

export async function layThongBaoInAppMobile(): Promise<DanhSachThongBaoInAppMobile> {
  const response = await layThongBaoThuHoachMoi(await layTuyChonBearer());

  return duLieu(response) as DanhSachThongBaoInAppMobile;
}
