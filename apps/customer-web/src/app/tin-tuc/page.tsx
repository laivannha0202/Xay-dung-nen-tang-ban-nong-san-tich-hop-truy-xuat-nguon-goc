import type { Metadata } from 'next';

import { DanhSachBaiVietContent } from '@/components/danh-sach-bai-viet-content';

export const metadata: Metadata = {
  title: 'Tin tức',
  description: 'Tin tức nông sản và câu chuyện trang trại trên AgriMarket.',
};

export default function TrangTinTuc() {
  return <DanhSachBaiVietContent cheDo="tin-tuc" />;
}
