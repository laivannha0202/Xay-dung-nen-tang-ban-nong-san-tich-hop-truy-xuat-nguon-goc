import type { Metadata } from 'next';

import { ChiTietSanPhamContent } from '@/components/chi-tiet-san-pham-content';

export const metadata: Metadata = {
  title: 'Chi tiết sản phẩm',
  description:
    'Xem hình ảnh, biến thể, giá, tồn kho, trang trại và thông tin nguồn gốc của nông sản.',
};

export default function TrangChiTietSanPham() {
  return <ChiTietSanPhamContent />;
}
