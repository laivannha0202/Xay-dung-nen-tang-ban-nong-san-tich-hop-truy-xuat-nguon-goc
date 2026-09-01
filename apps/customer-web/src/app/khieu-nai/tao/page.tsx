import type { Metadata } from 'next';

import { TaoKhieuNaiContent } from '@/components/tao-khieu-nai-content';

export const metadata: Metadata = {
  title: 'Gửi khiếu nại',
  description: 'Wizard gửi khiếu nại cho sản phẩm đã giao trong đơn hàng AgriMarket.',
};

type SearchParams = Promise<{ mucDonHangId?: string }>;

export default async function TrangTaoKhieuNai({ searchParams }: { searchParams: SearchParams }) {
  const { mucDonHangId } = await searchParams;
  return <TaoKhieuNaiContent mucDonHangId={mucDonHangId ?? ''} />;
}
