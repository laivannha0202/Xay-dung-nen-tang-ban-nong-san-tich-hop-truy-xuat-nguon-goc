'use client';

const KHOA = 'agrimarket-customer-session';
const KENH_DONG_BO = 'agrimarket-phien-khach-hang';

export type NguoiDungPhienKhachHang = {
  id: string;
  email: string;
  hoTen: string;
};

export type PhienKhachHang = {
  accessToken: string;
  nguoiDung: NguoiDungPhienKhachHang;
  /**
   * Thời điểm access token hết hạn (epoch ms), tính từ `expiresIn` mà
   * backend trả về. Dùng cho proactive refresh. Không có nghĩa là
   * "phiên hết" — hết access token thì refresh bằng HttpOnly cookie.
   * TUYỆT ĐỐI không lưu refreshToken ở đây (cookie HttpOnly của backend
   * giữ, JS không được chạm vào).
   */
  accessTokenExpiresAt?: number;
};

export function luuPhienKhachHang(phien: PhienKhachHang): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KHOA, JSON.stringify(phien));
}

export function layPhienKhachHang(): PhienKhachHang | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(KHOA);
  if (!raw) return null;

  try {
    const phien = JSON.parse(raw) as PhienKhachHang;
    if (!phien || typeof phien.accessToken !== 'string' || !phien.nguoiDung) {
      window.sessionStorage.removeItem(KHOA);
      return null;
    }
    return phien;
  } catch {
    window.sessionStorage.removeItem(KHOA);
    return null;
  }
}

/**
 * Cập nhật access token (và metadata) sau khi login/refresh thành công.
 * Trả về phiên mới, hoặc null khi trước đó chưa có phiên (caller tự quyết).
 */
export function capNhatAccessTokenPhien(
  accessToken: string,
  expiresIn?: number,
  nguoiDung?: NguoiDungPhienKhachHang,
): PhienKhachHang | null {
  const hienTai = layPhienKhachHang();
  const moi: PhienKhachHang = {
    accessToken,
    nguoiDung: nguoiDung ?? hienTai?.nguoiDung ?? { id: '', email: '', hoTen: '' },
    ...(typeof expiresIn === 'number' && Number.isFinite(expiresIn)
      ? { accessTokenExpiresAt: Date.now() + expiresIn * 1000 }
      : {}),
  };
  luuPhienKhachHang(moi);
  return moi;
}

export function xoaPhienKhachHang(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KHOA);
}

export function coPhienKhachHang(): boolean {
  return layPhienKhachHang() !== null;
}

/**
 * Lỗi chuẩn khi phiên thật sự không còn hiệu lực (refresh đã 401).
 * Wrapper `thucThiApiKhachHang` chỉ ném lỗi này SAU KHI đã thử refresh,
 * nên UI gặp lỗi này thì redirect login mà không cần refresh thêm.
 */
export class LoiPhienKhachHangHetHan extends Error {
  readonly status = 401;

  constructor(message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
    super(message);
    this.name = 'LoiPhienKhachHangHetHan';
  }
}

/**
 * Lỗi khi chưa đăng nhập (không có access token và không restore được).
 * Phân biệt với 401 của server để UI không nhầm với "token hỏng".
 */
export class LoiChuaDangNhapKhachHang extends Error {
  readonly status = 401;

  constructor(message = 'Bạn cần đăng nhập để tiếp tục.') {
    super(message);
    this.name = 'LoiChuaDangNhapKhachHang';
  }
}

/**
 * Backend (jwt-access.guard) trả HTTP 401 khi access token không hợp lệ
 * hoặc đã hết hạn. Generated client ném Error có `.status`, còn runtime
 * thủ công ném `LoiHttpApiClient` với message `HTTP 401`.
 * LƯU Ý: 401 của protected API KHÔNG có nghĩa là phiên hết — caller phải
 * thử refresh trước (xem `thucThiApiKhachHang`). Chỉ khi refresh cũng 401
 * (LoiPhienKhachHangHetHan) thì phiên mới thật sự invalid.
 */
export function laLoiPhienHetHan(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if (error instanceof LoiPhienKhachHangHetHan) return true;
  const status = (error as { status?: unknown }).status;
  if (typeof status === 'number') return status === 401;
  const message = error instanceof Error ? error.message : '';
  return /HTTP 401|\b401\b|Unauthorized/i.test(message);
}

export function bearerOptionsKhachHang(): RequestInit {
  const token = layPhienKhachHang()?.accessToken;

  if (!token) {
    throw new LoiChuaDangNhapKhachHang('Bạn cần đăng nhập để đồng bộ giỏ hàng.');
  }

  return {
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export type SuKienPhienKhachHang = 'doi-phien' | 'xoa-phien';

function kenhDongBo(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  try {
    return new BroadcastChannel(KENH_DONG_BO);
  } catch {
    return null;
  }
}

/**
 * Thông báo cho các tab khác khi phiên đổi (login/refresh/logout) để tab B
 * không hiển thị authenticated vô thời hạn sau khi tab A logout.
 * Chỉ gửi tín hiệu, KHÔNG gửi token.
 */
export function thongBaoPhienKhachHangThayDoi(suKien: SuKienPhienKhachHang): void {
  if (typeof window === 'undefined') return;
  kenhDongBo()?.postMessage({ loai: suKien, luc: Date.now() });
  try {
    window.dispatchEvent(new CustomEvent<SuKienPhienKhachHang>(KENH_DONG_BO, { detail: suKien }));
  } catch {
    // Môi trường không hỗ trợ CustomEvent detail — bỏ qua, các tab vẫn
    // đồng bộ qua BroadcastChannel/storage event.
  }
}

/**
 * Đăng ký lắng nghe thay đổi phiên từ tab khác (hoặc cùng tab).
 * Trả về hàm hủy đăng ký.
 */
export function langNghePhienKhachHangThayDoi(
  xuLy: (suKien: SuKienPhienKhachHang) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const channel = kenhDongBo();
  const xuLyBroadcast = (event: MessageEvent) => {
    const loai = (event.data as { loai?: unknown } | null)?.loai;
    if (loai === 'doi-phien' || loai === 'xoa-phien') xuLy(loai);
  };
  const xuLyLocal = (event: Event) => {
    const loai = (event as CustomEvent<SuKienPhienKhachHang>).detail;
    if (loai === 'doi-phien' || loai === 'xoa-phien') xuLy(loai);
  };

  channel?.addEventListener('message', xuLyBroadcast);
  window.addEventListener(KENH_DONG_BO, xuLyLocal);

  return () => {
    channel?.removeEventListener('message', xuLyBroadcast);
    channel?.close();
    window.removeEventListener(KENH_DONG_BO, xuLyLocal);
  };
}
