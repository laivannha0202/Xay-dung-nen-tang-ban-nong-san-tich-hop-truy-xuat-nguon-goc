import { layApiBaseUrlMoiTruongMobile } from './api-runtime';

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

async function docJson<T>(duongDan: string): Promise<T> {
  const response = await fetch(`${layApiBaseUrlMoiTruongMobile()}${duongDan}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function layDanhSachXaPhuongHungYenMobile(): Promise<XaPhuongHungYenMobile[]> {
  return docJson<XaPhuongHungYenMobile[]>('/api/v1/dia-ban-hung-yen/xa-phuong');
}

export async function layDanhSachThonToDanPhoMobile(
  xaPhuongMa: string,
): Promise<ThonToDanPhoMobile[]> {
  return docJson<ThonToDanPhoMobile[]>(
    `/api/v1/dia-ban-hung-yen/xa-phuong/${encodeURIComponent(xaPhuongMa)}/thon-to-dan-pho`,
  );
}
