import type { Metadata } from 'next';

import { TrangChuContent } from '@/components/trang-chu-content';

export const metadata: Metadata = {
  title: 'Trang chủ',
  description: 'Mua nông sản từ trang trại, xem sản phẩm nổi bật và truy xuất nguồn gốc trên AgriMarket.',
};

export default function TrangChu() {
  return <TrangChuContent />;
}
