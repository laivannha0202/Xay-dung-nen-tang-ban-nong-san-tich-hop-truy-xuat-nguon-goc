import type { Metadata } from 'next';

import { DanhSachKhuyenMaiContent } from '@/components/danh-sach-khuyen-mai-content';

export const metadata: Metadata = {
  title: 'Khuyến mãi',
  description: 'Săn Flash Sale nông sản giảm giá từ các trang trại trên AgriMarket.',
};

export default function TrangKhuyenMai() {
  return <DanhSachKhuyenMaiContent />;
}
