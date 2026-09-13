import type { Metadata } from 'next';

import { DanhSachDonHangContent } from '@/components/danh-sach-don-hang-content';
import { KhungTaiKhoan } from '@/components/khung-tai-khoan';

export const metadata: Metadata = {
  title: 'Đơn hàng của tôi',
  description: 'Danh sách và trạng thái đơn hàng của khách hàng AgriMarket.',
};

export default function TrangDonHang() {
  return (
    <KhungTaiKhoan>
      <DanhSachDonHangContent />
    </KhungTaiKhoan>
  );
}
