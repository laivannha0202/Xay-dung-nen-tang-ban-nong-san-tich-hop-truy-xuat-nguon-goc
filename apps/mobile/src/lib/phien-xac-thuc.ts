import { apiDangNhap, apiDangXuat, apiLamMoi } from './api-xac-thuc';
import { docRefreshToken, luuRefreshToken, xoaRefreshToken } from './secure-token';
import { datChuaDangNhap, datDaDangNhap } from '@/stores/xac-thuc.store';

let accessToken: string | null = null;
let accessTokenHetHanLuc = 0;
let khoiPhucPromise: Promise<void> | null = null;

type TokenResponse = Awaited<ReturnType<typeof apiDangNhap>>;

async function apDungToken(response: TokenResponse): Promise<void> {
  if (!response.refreshToken) throw new Error('Mobile Auth không nhận được refresh token.');
  accessToken = response.accessToken;
  accessTokenHetHanLuc = Date.now() + Math.max(0, response.expiresIn - 30) * 1000;
  datDaDangNhap(response.nguoiDung);
  await luuRefreshToken(response.refreshToken);
}

function xoaAccessToken(): void {
  accessToken = null;
  accessTokenHetHanLuc = 0;
}

export async function dangNhapMobile(email: string, matKhau: string): Promise<void> {
  await apDungToken(await apiDangNhap(email, matKhau));
}

export async function lamMoiPhienMobile(): Promise<boolean> {
  const refreshToken = await docRefreshToken();
  if (!refreshToken) {
    xoaAccessToken();
    datChuaDangNhap();
    return false;
  }
  try {
    const response = await apiLamMoi(refreshToken);
    await apDungToken(response as TokenResponse);
    return true;
  } catch {
    xoaAccessToken();
    await xoaRefreshToken();
    datChuaDangNhap();
    return false;
  }
}

export function khoiPhucPhienMobile(): Promise<void> {
  if (!khoiPhucPromise) {
    khoiPhucPromise = lamMoiPhienMobile()
      .then(() => undefined)
      .finally(() => {
        khoiPhucPromise = null;
      });
  }
  return khoiPhucPromise;
}

export async function dangXuatMobile(): Promise<void> {
  const refreshToken = await docRefreshToken();
  try {
    if (refreshToken) await apiDangXuat(refreshToken);
  } finally {
    xoaAccessToken();
    await xoaRefreshToken();
    datChuaDangNhap();
  }
}

export async function damBaoAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessTokenHetHanLuc) return accessToken;
  return (await lamMoiPhienMobile()) ? accessToken : null;
}

export async function layTuyChonBearer(): Promise<RequestInit> {
  const token = await damBaoAccessToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}
