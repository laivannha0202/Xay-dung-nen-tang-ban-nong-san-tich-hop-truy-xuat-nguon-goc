import type { Metadata } from 'next';

import { DanhSachKhuyenMaiContent } from '@/components/danh-sach-khuyen-mai-content';

export const metadata: Metadata = {
  title: 'Khuyến mãi',
  description: 'Lưu voucher, săn Flash Sale và chọn ưu đãi khi thanh toán trên AgriMarket.',
};

export default function TrangKhuyenMai() {
  return <DanhSachKhuyenMaiContent />;
}
