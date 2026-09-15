'use client';

import { layThanhToanDonHangCuaToi, taoThanhToan } from '@agrimarket/api-client';

import { thucThiApiKhachHang } from './xac-thuc-khach-hang';

type HttpResponse<T> = {
  data: T;
};

function duLieu<T>(response: T | HttpResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return (response as HttpResponse<T>).data;
  }

  return response as T;
}

export type ThanhToanKhach = {
  id: string;
  donHangId: string;
  maDonHang: string;
  soTien: number;
  phuongThuc: string;
  trangThai: string;
  giaoDich: {
    id: string;
    maGiaoDich: string;
    soTien: number;
    phuongThuc: string;
    trangThai: string;
    thoiGian: string;
  };
  datCho: {
    id: string;
    trangThai: string;
    hetHanLuc: string;
  };
  paymentUrl?: string;
  expiresAt?: string;
};

export const THANH_TOAN_KHACH_QUERY_KEY = ['thanh-toan-khach'] as const;

/**
 * LOCAL/DEMO:
 * - MOCK: không gọi VNPAY Internet; Backend xử lý Mock Payment thật.
 * - VNPAY: giữ nguyên tích hợp VNPAY_SANDBOX.
 *
 * NEXT_PUBLIC_* được dev-stack nạp từ root .env và truyền cho Customer Web.
 */
export const THANH_TOAN_WEB_DANG_MOCK =
  (process.env.NEXT_PUBLIC_PAYMENT_MODE ?? 'VNPAY').trim().toUpperCase() === 'MOCK';

export function thanhToanDonHangKhachQueryKey(donHangId: string) {
  return [...THANH_TOAN_KHACH_QUERY_KEY, 'don-hang', donHangId] as const;
}

export async function layThanhToanDonHangKhach(donHangId: string): Promise<ThanhToanKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    layThanhToanDonHangCuaToi(donHangId, tuyChon),
  );
  return duLieu(response) as ThanhToanKhach;
}

export async function taoThanhToanCodWebKhach(
  donHangId: string,
  maYeuCau: string,
): Promise<ThanhToanKhach> {
  const response = await thucThiApiKhachHang((tuyChon) =>
    taoThanhToan(
      {
        donHangId,
        maYeuCau,
        phuongThuc: 'COD',
      },
      tuyChon,
    ),
  );
  return duLieu(response) as ThanhToanKhach;
}

export async function taoThanhToanVnPayWebKhach(
  donHangId: string,
  maYeuCau: string,
): Promise<ThanhToanKhach> {
  // Khi demo hoàn toàn trên localhost, dùng gateway MOCK đã có sẵn ở Backend.
  // Backend vẫn chạy đầy đủ nghiệp vụ Payment: idempotency, trạng thái PAID,
  // inventory reservation và transaction; chỉ bỏ bước redirect ra Internet.
  if (THANH_TOAN_WEB_DANG_MOCK) {
    const response = await thucThiApiKhachHang((tuyChon) =>
      taoThanhToan(
        {
          donHangId,
          maYeuCau,
          phuongThuc: 'MOCK',
          ketQuaMock: 'THANH_CONG',
        },
        tuyChon,
      ),
    );

    return duLieu(response) as ThanhToanKhach;
  }

  // Sandbox thật: giữ nguyên đường tích hợp VNPAY hiện có.
  const body = {
    donHangId,
    maYeuCau,
    phuongThuc: 'VNPAY_SANDBOX',
    kenhTraVe: 'WEB',
  } as Parameters<typeof taoThanhToan>[0] & {
    kenhTraVe: 'WEB';
  };

  const response = await thucThiApiKhachHang((tuyChon) => taoThanhToan(body, tuyChon));
  return duLieu(response) as ThanhToanKhach;
}
