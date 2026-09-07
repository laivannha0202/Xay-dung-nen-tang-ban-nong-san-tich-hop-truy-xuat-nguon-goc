import {
  dangKyThietBiPush,
  guiThuPushCuaToi,
  huyDangKyThietBiPush,
  layThongBaoThuHoachMoi,
} from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export const THONG_BAO_IN_APP_QUERY_KEY = [
  'thong-bao-mobile',
  'in-app',
  'thu-hoach',
] as const;

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

export type NenTangThietBiPushMobile =
  | 'ANDROID'
  | 'IOS';

export type DangKyThietBiPushMobileInput = {
  expoPushToken: string;
  projectId: string;
  nenTang: NenTangThietBiPushMobile;
};

export type ThietBiPushMobile = {
  id: string;
  nenTang: NenTangThietBiPushMobile;
  projectId: string;
  hoatDong: boolean;
  lanCuoiDangKy: string;
};

export type GuiThuPushMobile = {
  soThietBi: number;
  daGui: number;
  soLoi: number;
};

export async function layThongBaoInAppMobile(): Promise<DanhSachThongBaoInAppMobile> {
  const response = await layThongBaoThuHoachMoi(
    await layTuyChonBearer(),
  );

  return duLieuApi(
    response,
  ) as DanhSachThongBaoInAppMobile;
}

export async function dangKyThietBiPushMobile(
  input: DangKyThietBiPushMobileInput,
): Promise<ThietBiPushMobile> {
  const response = await dangKyThietBiPush(
    input,
    await layTuyChonBearer(),
  );

  return duLieuApi(
    response,
  ) as ThietBiPushMobile;
}

export async function huyDangKyThietBiPushMobile(
  expoPushToken: string,
): Promise<boolean> {
  const response = await huyDangKyThietBiPush(
    {
      expoPushToken,
    },
    await layTuyChonBearer(),
  );

  const data = duLieuApi(
    response,
  ) as {
    daHuy: boolean;
  };

  return data.daHuy;
}

export async function guiThuPushCuaToiMobile(): Promise<GuiThuPushMobile> {
  const response = await guiThuPushCuaToi(
    await layTuyChonBearer(),
  );

  return duLieuApi(
    response,
  ) as GuiThuPushMobile;
}
