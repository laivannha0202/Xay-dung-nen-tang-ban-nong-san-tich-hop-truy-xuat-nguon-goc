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
      '[AgriMarket] Chua co EXPO_PUBLIC_API_BASE_URL. ' +
        'Fallback 127.0.0.1:3000 chi phu hop web/simulator cung may. ' +
        'Voi dien thoai that, hay chay `pnpm dev:mobile` hoac `pnpm dev` de launcher tu cau hinh LAN IP.',
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
