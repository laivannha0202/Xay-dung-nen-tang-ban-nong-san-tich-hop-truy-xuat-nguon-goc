import type { Metadata } from 'next';

import { ChiTietKhieuNaiContent } from '@/components/chi-tiet-khieu-nai-content';
import { KhungTaiKhoan } from '@/components/khung-tai-khoan';

export const metadata: Metadata = {
  title: 'Chi tiết yêu cầu hỗ trợ',
  description: 'Chi tiết yêu cầu hỗ trợ và bằng chứng liên quan đến đơn hàng AgriMarket.',
};

type Params = Promise<{ id: string }>;

export default async function TrangChiTietKhieuNai({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <KhungTaiKhoan>
      <ChiTietKhieuNaiContent khieuNaiId={id} />
    </KhungTaiKhoan>
  );
}
