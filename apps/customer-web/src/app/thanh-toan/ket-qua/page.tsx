import type { Metadata } from 'next';

import {
  PaymentResultContent,
  type TrangThaiKetQuaThanhToan,
} from '@/components/payment-result-content';

export const metadata: Metadata = {
  title: 'Kết quả thanh toán',
  description: 'Kết quả thanh toán AgriMarket với ba trạng thái success, failure và pending.',
};

type SearchParams = Promise<{
  trangThai?: string | string[];
  maDonHang?: string | string[];
  maGiaoDich?: string | string[];
}>;

function layGiaTri(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function chuanHoaTrangThai(value: string | undefined): TrangThaiKetQuaThanhToan {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'success' || normalized === 'failure' || normalized === 'pending') {
    return normalized;
  }

  return 'pending';
}

export default async function TrangKetQuaThanhToan({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <PaymentResultContent
      trangThai={chuanHoaTrangThai(layGiaTri(params.trangThai))}
      maDonHang={layGiaTri(params.maDonHang)}
      maGiaoDich={layGiaTri(params.maGiaoDich)}
    />
  );
}
