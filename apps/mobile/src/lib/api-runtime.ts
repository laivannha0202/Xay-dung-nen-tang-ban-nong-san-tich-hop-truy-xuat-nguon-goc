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
        'Đang fallback về 127.0.0.1:3000; địa chỉ này không truy cập được Backend ' +
        'từ điện thoại Android thật. Hãy tạo apps/mobile/.env từ .env.example.',
    );
  }

  return API_BASE_URL_MAC_DINH_LOCAL;
}

export function cauHinhApiMobile(): string {
  const baseUrl = layApiBaseUrlMoiTruongMobile();
  cauHinhApiClient(baseUrl);
  return baseUrl;
}
