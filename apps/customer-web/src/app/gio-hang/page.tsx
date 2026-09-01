import type { Metadata } from 'next';

import { GioHangContent } from '@/components/gio-hang-content';

export const metadata: Metadata = {
  title: 'Giỏ hàng',
  description: 'Giỏ hàng AgriMarket được đồng bộ từ Backend theo tài khoản khách hàng.',
};

export default function TrangGioHang() {
  return <GioHangContent />;
}
