import type { Metadata } from 'next';

import { ThongBaoContent } from '@/components/thong-bao-content';

export const metadata: Metadata = {
  title: 'Thông báo',
  description: 'Thông báo thu hoạch mới từ các trang trại khách hàng đang theo dõi.',
};

export default function TrangThongBao() {
  return <ThongBaoContent />;
}
