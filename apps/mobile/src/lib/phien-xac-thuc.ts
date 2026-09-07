import { apiDangNhap, apiDangXuat, apiLamMoi } from './api-xac-thuc';
import { docRefreshToken, luuRefreshToken, xoaRefreshToken } from './secure-token';
import { datChuaDangNhap, datDaDangNhap } from '@/stores/xac-thuc.store';
import { layTrangThaiHttp } from './api-error';
import { xoaHanhDongSauDangNhap } from './auth-navigation';

let accessToken: string | null = null;
let accessTokenHetHanLuc = 0;
let khoiPhucPromise: Promise<void> | null = null;
let lamMoiPromise: Promise<boolean> | null = null;

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
  // Tránh refresh cũ hoàn tất sau login mới và ghi đè token/session vừa đăng nhập.
  if (lamMoiPromise) {
    await lamMoiPromise;
  }

  await apDungToken(await apiDangNhap(email, matKhau));
}

async function thucHienLamMoiPhienMobile(): Promise<boolean> {
  const refreshToken = await docRefreshToken();

  if (!refreshToken) {
    xoaAccessToken();
    datChuaDangNhap('chua-co-phien');
    return false;
  }

  try {
    const response = await apiLamMoi(refreshToken);
    await apDungToken(response as TokenResponse);
    return true;
  } catch (error) {
    const status = layTrangThaiHttp(error);
    const refreshTokenKhongHopLe =
      status === 400 || status === 401 || status === 403;

    xoaAccessToken();

    if (refreshTokenKhongHopLe) {
      await xoaRefreshToken();
      xoaHanhDongSauDangNhap();
      datChuaDangNhap('het-phien');
      return false;
    }

    // Network / 5xx / lỗi tạm thời: không phá refresh token.
    // App có thể khôi phục lại phiên ở lần chạy/retry tiếp theo.
    datChuaDangNhap('loi-ket-noi');
    return false;
  }
}

/**
 * Single-flight refresh:
 * - request đầu tiên thực hiện refresh thật;
 * - mọi request đồng thời nhận cùng một Promise;
 * - Promise được giải phóng sau khi hoàn tất để lần hết hạn sau có thể refresh lại.
 */
export function lamMoiPhienMobile(): Promise<boolean> {
  if (!lamMoiPromise) {
    lamMoiPromise = thucHienLamMoiPhienMobile().finally(() => {
      lamMoiPromise = null;
    });
  }

  return lamMoiPromise;
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
  // Nếu refresh đang chạy (đặc biệt khi Backend rotate refresh token),
  // đợi nó xong rồi mới đọc/revoke token mới nhất.
  if (lamMoiPromise) {
    await lamMoiPromise;
  }

  const refreshToken = await docRefreshToken();

  try {
    if (refreshToken) await apiDangXuat(refreshToken);
  } finally {
    xoaAccessToken();
    await xoaRefreshToken();
    xoaHanhDongSauDangNhap();
    datChuaDangNhap('dang-xuat');
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
