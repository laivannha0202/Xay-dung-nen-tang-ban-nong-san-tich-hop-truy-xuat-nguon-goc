import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { TaoKhieuNaiContent } from '@/components/tao-khieu-nai-content';

export const metadata: Metadata = {
  title: 'Gửi yêu cầu hỗ trợ',
  description: 'Gửi yêu cầu hỗ trợ cho sản phẩm đã giao trong đơn hàng AgriMarket.',
};

type SearchParams = Promise<{ mucDonHangId?: string }>;

export default async function TrangTaoKhieuNai({ searchParams }: { searchParams: SearchParams }) {
  const { mucDonHangId } = await searchParams;
  return (
    <KhungTaiKhoan>
      <TaoKhieuNaiContent mucDonHangId={mucDonHangId ?? ''} />
    </KhungTaiKhoan>
  );
}
