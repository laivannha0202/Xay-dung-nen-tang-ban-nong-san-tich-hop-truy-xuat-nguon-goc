import type { Metadata } from 'next';

import { DanhSachBaiVietContent } from '@/components/danh-sach-bai-viet-content';

export const metadata: Metadata = {
  title: 'Kiến thức',
  description: 'Kỹ thuật trồng trọt, dinh dưỡng và mẹo chọn nông sản trên AgriMarket.',
};

export default function TrangKienThuc() {
  return <DanhSachBaiVietContent cheDo="kien-thuc" />;
}
