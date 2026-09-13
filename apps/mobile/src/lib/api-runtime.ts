import { cauHinhApiClient } from '@agrimarket/api-client';

const API_BASE_URL_MAC_DINH_LOCAL = 'http://127.0.0.1:3000';

let daCanhBaoThieuBienMoiTruong = false;

export function layApiBaseUrlMoiTruongMobile(): string {
  const tuMoiTruong = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (tuMoiTruong) {
    return tuMoiTruong.replace(/\/+$/, '');
  }

  if (!daCanhBaoThieuBienMoiTruong) {
    daCanhBaoThieuBienMoiTruong = true;
    console.warn(
      '[AgriMarket] Chưa cấu hình EXPO_PUBLIC_API_BASE_URL. ' +
        'Đang dùng 127.0.0.1:3000. Với điện thoại Android qua USB, ' +
        'chạy adb reverse tcp:3000 tcp:3000; nếu dùng LAN thì tạo file .env',
    );
  }

  return API_BASE_URL_MAC_DINH_LOCAL;
}

export function cauHinhApiMobile(): string {
  const baseUrl = layApiBaseUrlMoiTruongMobile();
  console.log('[AgriMarket] API Base URL:', baseUrl);
  cauHinhApiClient(baseUrl);
  console.log('[AgriMarket] API client configured');
  return baseUrl;
}
