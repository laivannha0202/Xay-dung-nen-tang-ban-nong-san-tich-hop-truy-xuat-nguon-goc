import type { Metadata } from 'next';

import { DanhSachKhieuNaiContent } from '@/components/danh-sach-khieu-nai-content';

export const metadata: Metadata = {
  title: 'Yêu cầu hỗ trợ',
  description: 'Theo dõi các yêu cầu hỗ trợ liên quan đến đơn hàng AgriMarket.',
};

export default function TrangKhieuNai() {
  return <DanhSachKhieuNaiContent />;
}
