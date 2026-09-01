import type { Metadata } from 'next';

import { TrangChuContent } from '@/components/trang-chu-content';

export const metadata: Metadata = {
  title: 'Trang chủ',
  description: 'Khám phá nông sản, trang trại và thông tin truy xuất nguồn gốc trên AgriMarket.',
};

export default function TrangChu() {
  return <TrangChuContent />;
}
