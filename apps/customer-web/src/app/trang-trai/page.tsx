import type { Metadata } from 'next';

import { DanhSachTrangTraiContent } from '@/components/danh-sach-trang-trai-content';

export const metadata: Metadata = {
  title: 'Trang trại',
  description: 'Khám phá các trang trại đang có nông sản công khai trên AgriMarket.',
};

export default function TrangDanhSachTrangTrai() {
  return <DanhSachTrangTraiContent />;
}
