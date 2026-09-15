'use client';

import { dangNhap, dangXuat, lamMoiToken } from '@agrimarket/api-client';

import {
  LoiChuaDangNhapKhachHang,
  LoiPhienKhachHangHetHan,
  bearerOptionsKhachHang,
  capNhatAccessTokenPhien,
  laLoiPhienHetHan,
  layPhienKhachHang,
  luuPhienKhachHang,
  thongBaoPhienKhachHangThayDoi,
  xoaPhienKhachHang,
  type NguoiDungPhienKhachHang,
  type PhienKhachHang,
} from './phien-khach-hang';

/**
 * Engine xác thực tập trung của Customer Web.
 *
 * - Refresh token nằm trong HttpOnly cookie của backend, JS không chạm vào.
 * - Mọi protected API đi qua `thucThiApiKhachHang`: 401 access token thì
 *   refresh (single-flight) rồi retry đúng 1 lần; chỉ khi refresh cũng 401
 *   mới coi phiên hết thật sự.
 * - KHÔNG gọi generated `dangNhap`/`lamMoiToken`/`dangXuat` trực tiếp từ
 *   component — dùng các helper dưới đây để timer/broadcast/generation
 *   không bị lệch.
 */

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

/** Refresh trước khi access token hết hạn khoảng này (ms). */
const NGUONG_LAM_MOI_TRUOC_HAN_MS = 60_000;

/**
 * Single-flight refresh: nhiều request cùng 401 thì cùng chờ 1 promise,
 * tránh bắn N refresh đồng thời làm rotation revoke lẫn nhau.
 * Reset trong `finally` để promise hỏng không kẹt mãi.
 */
let loiHuaLamMoi: Promise<PhienKhachHang | null> | null = null;
/** Tăng mỗi lần login/logout để kết quả refresh cũ không ghi đè phiên mới. */
let theHePhien = 0;
let timerLamMoiTruocHan: ReturnType<typeof setTimeout> | null = null;

function huyLichLamMoiTruocHan(): void {
  if (timerLamMoiTruocHan !== null) {
    clearTimeout(timerLamMoiTruocHan);
    timerLamMoiTruocHan = null;
  }
}

function lapLichLamMoiTruocHan(expiresIn: number | undefined): void {
  huyLichLamMoiTruocHan();
  if (typeof window === 'undefined') return;
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) return;

  // Không setInterval spam API — một setTimeout đúng thời điểm duy nhất.
  const treMs = Math.max(10_000, expiresIn * 1000 - NGUONG_LAM_MOI_TRUOC_HAN_MS);
  timerLamMoiTruocHan = setTimeout(() => {
    timerLamMoiTruocHan = null;
    // Proactive thất bại thì thôi: request protected tiếp theo sẽ dùng
    // lớp 2 (401 → refresh → retry). Không redirect từ timer để public
    // page không bị văng vô lý.
    void lamMoiPhienKhachHang().catch(() => undefined);
  }, treMs);

  // Tab sleep (laptop gập, mobile background) có thể làm timer treo mà
  // không bao giờ bắn. unref để không giữ process (nếu môi trường hỗ trợ).
  const timer = timerLamMoiTruocHan as unknown as { unref?: () => void };
  if (typeof timer.unref === 'function') {
    try {
      timer.unref();
    } catch {
      // Browser không có unref — bỏ qua.
    }
  }
}

function luuPhienSauCapToken(
  accessToken: string,
  expiresIn: number | undefined,
  nguoiDung: NguoiDungPhienKhachHang,
): PhienKhachHang {
  const phien: PhienKhachHang = {
    accessToken,
    nguoiDung,
    ...(typeof expiresIn === 'number' && Number.isFinite(expiresIn)
      ? { accessTokenExpiresAt: Date.now() + expiresIn * 1000 }
      : {}),
  };
  luuPhienKhachHang(phien);
  lapLichLamMoiTruocHan(expiresIn);
  thongBaoPhienKhachHangThayDoi('doi-phien');
  return phien;
}

function xoaPhienCucBo(): void {
  huyLichLamMoiTruocHan();
  xoaPhienKhachHang();
  thongBaoPhienKhachHangThayDoi('xoa-phien');
}

/**
 * Refresh access token bằng HttpOnly cookie (single-flight).
 * - Thành công: lưu token mới, trả phiên.
 * - Refresh 401 (cookie hết/không hợp lệ): xóa phiên local, trả null.
 * - Lỗi mạng: ném tiếp để caller giữ phiên cũ, không logout oan.
 */
export function lamMoiPhienKhachHang(): Promise<PhienKhachHang | null> {
  if (loiHuaLamMoi) return loiHuaLamMoi;

  const theHe = theHePhien;
  loiHuaLamMoi = (async () => {
    try {
      const response = await lamMoiToken({ nenTang: 'WEB' }, { credentials: 'include' });
      const data = duLieu(response) as {
        accessToken: string;
        expiresIn?: number;
        nguoiDung: NguoiDungPhienKhachHang;
      };
      // Logout/login xảy ra trong lúc refresh đang bay thì bỏ kết quả cũ.
      if (theHe !== theHePhien) return layPhienKhachHang();
      return luuPhienSauCapToken(data.accessToken, data.expiresIn, data.nguoiDung);
    } catch (error) {
      if (laLoiPhienHetHan(error)) {
        // Refresh token thật sự hết/không hợp lệ — chỉ lúc này mới xóa phiên.
        if (theHe === theHePhien) xoaPhienCucBo();
        return null;
      }
      throw error;
    } finally {
      loiHuaLamMoi = null;
    }
  })();

  return loiHuaLamMoi;
}

function daHetAccessToken(phien: PhienKhachHang): boolean {
  if (typeof phien.accessTokenExpiresAt !== 'number') return false;
  return phien.accessTokenExpiresAt <= Date.now();
}

/**
 * Khôi phục phiên khi app khởi động/F5/tab mới:
 * - Còn access token hợp lệ: dùng ngay + lập lịch proactive (timer cũ mất
 *   sau reload nên phải lập lại).
 * - Không có token (hoặc đã hết): thử refresh bằng cookie, im lặng. Public
 *   page không cookie thì trả null mà không báo lỗi đỏ, không loop.
 */
export async function damBaoPhienKhachHang(): Promise<PhienKhachHang | null> {
  const cucBo = layPhienKhachHang();
  if (cucBo?.accessToken && !daHetAccessToken(cucBo)) {
    lapLichLamMoiTruocHan(
      typeof cucBo.accessTokenExpiresAt === 'number'
        ? (cucBo.accessTokenExpiresAt - Date.now()) / 1000
        : undefined,
    );
    return cucBo;
  }

  try {
    return await lamMoiPhienKhachHang();
  } catch {
    // Lỗi mạng lúc bootstrap: giữ phiên cũ (nếu có) để UI thử lại sau,
    // thay vì coi như guest rồi flicker.
    return cucBo;
  }
}

/**
 * Wrapper duy nhất cho mọi protected API của Customer Web.
 * - Gắn Bearer + credentials include.
 * - 401 → single-flight refresh → retry đúng 1 lần.
 * - Refresh thất bại → ném LoiPhienKhachHangHetHan (phiên đã được xóa).
 * - Không retry vô hạn, không refresh khi chính refresh/logout 401
 *   (các call đó không bao giờ đi qua wrapper này).
 */
export async function thucThiApiKhachHang<T>(
  thucHien: (tuyChon: RequestInit) => Promise<T>,
): Promise<T> {
  let tuyChon: RequestInit;
  try {
    tuyChon = bearerOptionsKhachHang();
  } catch {
    // Chưa có token local (tab mới, vừa F5 mất timer...): thử restore một
    // lần bằng cookie trước khi kết luận chưa đăng nhập.
    const phucHoi = await damBaoPhienKhachHang().catch(() => null);
    if (!phucHoi) throw new LoiChuaDangNhapKhachHang();
    tuyChon = bearerOptionsKhachHang();
  }

  try {
    return await thucHien(tuyChon);
  } catch (error) {
    // Lỗi đã là "phiên hết thật" hoặc không phải 401: ném tiếp, không retry.
    if (!laLoiPhienHetHan(error) || error instanceof LoiPhienKhachHangHetHan) {
      throw error;
    }

    const moi = await lamMoiPhienKhachHang().catch((loiLamMoi: unknown) => {
      // Refresh 401 → null (phiên đã xóa trong lamMoi). Lỗi mạng → ném
      // tiếp để giữ phiên, không logout oan.
      if (laLoiPhienHetHan(loiLamMoi)) return null;
      throw loiLamMoi;
    });

    if (!moi) throw new LoiPhienKhachHangHetHan();
    // Retry đúng 1 lần với token mới. Nếu vẫn 401 thì đó là lỗi nghiệp vụ
    // (không phải phiên), ném nguyên để UI hiển thị đúng.
    return thucHien(bearerOptionsKhachHang());
  }
}

/**
 * Đăng nhập Customer Web. `ghiNho` được gửi thật tới backend để quyết định
 * persistent hay session refresh cookie. Không lưu mật khẩu, không lưu
 * refresh token ở bất kỳ storage JS nào.
 */
export async function dangNhapKhachHang(
  email: string,
  matKhau: string,
  ghiNho: boolean,
): Promise<PhienKhachHang> {
  // Hủy refresh/timer của phiên cũ (nếu có) trước khi login phiên mới.
  theHePhien += 1;
  loiHuaLamMoi = null;
  huyLichLamMoiTruocHan();

  const response = await dangNhap(
    { email, matKhau, nenTang: 'WEB', ghiNho },
    { credentials: 'include' },
  );
  const data = duLieu(response) as {
    accessToken: string;
    expiresIn?: number;
    nguoiDung: NguoiDungPhienKhachHang;
  };

  return luuPhienSauCapToken(data.accessToken, data.expiresIn, data.nguoiDung);
}

/**
 * Đăng xuất: revoke refresh session + clear cookie ở backend, luôn xóa
 * phiên local + timer + reset single-flight. Lỗi mạng vẫn clear local để
 * UI không treo ở trạng thái đã đăng nhập (logout là idempotent ở server).
 */
export async function dangXuatKhachHang(): Promise<void> {
  theHePhien += 1;
  loiHuaLamMoi = null;
  try {
    await dangXuat({ nenTang: 'WEB' }, { credentials: 'include' });
  } catch {
    // Backend logout idempotent; dù lỗi mạng vẫn phải clear local.
  } finally {
    xoaPhienCucBo();
  }
}

/**
 * Cập nhật họ tên/email hiển thị sau khi đổi hồ sơ (không đụng token).
 */
export function capNhatNguoiDungPhienKhachHang(
  capNhat: Partial<NguoiDungPhienKhachHang>,
): PhienKhachHang | null {
  const hienTai = layPhienKhachHang();
  if (!hienTai) return null;
  const moi: PhienKhachHang = {
    ...hienTai,
    nguoiDung: { ...hienTai.nguoiDung, ...capNhat },
  };
  luuPhienKhachHang(moi);
  thongBaoPhienKhachHangThayDoi('doi-phien');
  return moi;
}

export { capNhatAccessTokenPhien };
