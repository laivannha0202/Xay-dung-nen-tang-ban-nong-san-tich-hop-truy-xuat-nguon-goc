import type { Metadata } from 'next';

import { ChiTietTrangTraiContent } from '@/components/chi-tiet-trang-trai-content';

export const metadata: Metadata = {
  title: 'Chi tiết trang trại',
  description: 'Xem giới thiệu, sản phẩm, chứng nhận và mùa vụ của trang trại trên AgriMarket.',
};

export default function TrangChiTietTrangTrai() {
  return <ChiTietTrangTraiContent />;
}
