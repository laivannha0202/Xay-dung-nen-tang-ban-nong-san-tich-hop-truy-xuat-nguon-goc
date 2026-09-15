'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { langNghePhienKhachHangThayDoi, layPhienKhachHang, type PhienKhachHang } from '@/lib/phien-khach-hang';
import { damBaoPhienKhachHang, dangXuatKhachHang } from '@/lib/xac-thuc-khach-hang';

export type TrangThaiXacThucKhachHang = 'dang-tai' | 'da-dang-nhap' | 'khach';

type GiaTriXacThucKhachHang = {
  trangThai: TrangThaiXacThucKhachHang;
  phien: PhienKhachHang | null;
  /** Thử restore lại phiên (dùng sau khi tab khác login). */
  lamMoiTrangThai: () => Promise<void>;
  /** Logout hoàn chỉnh (API + local + broadcast). */
  dangXuat: () => Promise<void>;
};

const MacDinhXacThucKhachHang: GiaTriXacThucKhachHang = {
  trangThai: 'dang-tai',
  phien: null,
  lamMoiTrangThai: async () => undefined,
  dangXuat: async () => undefined,
};

const XacThucKhachHangContext =
  createContext<GiaTriXacThucKhachHang>(MacDinhXacThucKhachHang);

export function useXacThucKhachHang(): GiaTriXacThucKhachHang {
  return useContext(XacThucKhachHangContext);
}

/** Alias ngắn cho component chỉ cần đọc phiên. */
export function usePhienKhachHang(): PhienKhachHang | null {
  return useContext(XacThucKhachHangContext).phien;
}

/**
 * Bootstrap phiên đúng 1 lần khi web khởi động:
 * - Còn access token hợp lệ → authenticated ngay.
 * - Mất token local nhưng refresh cookie còn hạn → restore im lặng.
 * - Không cookie → guest; public page hoạt động bình thường, không redirect,
 *   không lỗi đỏ, không loop.
 * Trong lúc `dang-tai`, header/tài khoản hiện skeleton thay vì nháy
 * "Đăng nhập" rồi đổi sang user.
 */
export function PhienKhachHangProvider({ children }: { children: ReactNode }) {
  const [trangThai, setTrangThai] = useState<TrangThaiXacThucKhachHang>('dang-tai');
  const [phien, setPhien] = useState<PhienKhachHang | null>(null);

  const lamMoiTrangThai = useCallback(async () => {
    const moi = await damBaoPhienKhachHang().catch(() => null);
    setPhien(moi);
    setTrangThai(moi ? 'da-dang-nhap' : 'khach');
  }, []);

  const dangXuat = useCallback(async () => {
    await dangXuatKhachHang();
    setPhien(null);
    setTrangThai('khach');
  }, []);

  useEffect(() => {
    let huy = false;
    void (async () => {
      const moi = await damBaoPhienKhachHang().catch(() => null);
      if (huy) return;
      setPhien(moi);
      setTrangThai(moi ? 'da-dang-nhap' : 'khach');
    })();

    // Đồng bộ giữa các tab: tab A logout/login/refresh → tab B cập nhật.
    // Tab B không đọc được sessionStorage của tab A nên với 'doi-phien'
    // sẽ restore im lặng bằng cookie dùng chung của browser.
    const huyLangNghe = langNghePhienKhachHangThayDoi((suKien) => {
      if (suKien === 'xoa-phien') {
        setPhien(layPhienKhachHang());
        setTrangThai('khach');
        return;
      }
      void (async () => {
        // Tab này đã có phiên riêng thì giữ nguyên, tránh ghi đè.
        if (layPhienKhachHang()) return;
        const moi = await damBaoPhienKhachHang().catch(() => null);
        if (huy) return;
        setPhien(moi);
        setTrangThai(moi ? 'da-dang-nhap' : 'khach');
      })();
    });

    return () => {
      huy = true;
      huyLangNghe();
    };
  }, []);

  const giaTri = useMemo<GiaTriXacThucKhachHang>(
    () => ({ trangThai, phien, lamMoiTrangThai, dangXuat }),
    [trangThai, phien, lamMoiTrangThai, dangXuat],
  );

  return (
    <XacThucKhachHangContext.Provider value={giaTri}>
      {children}
    </XacThucKhachHangContext.Provider>
  );
}
