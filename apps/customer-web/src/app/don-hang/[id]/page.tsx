import type { Metadata } from 'next';

import { ChiTietDonHangContent } from '@/components/chi-tiet-don-hang-content';

export const metadata: Metadata = {
  title: 'Chi tiết đơn hàng',
  description: 'Chi tiết, tiến trình và thao tác hủy đơn hàng AgriMarket.',
};

type Params = Promise<{ id: string }>;

export default async function TrangChiTietDonHang({ params }: { params: Params }) {
  const { id } = await params;
  return <ChiTietDonHangContent donHangId={id} />;
}
