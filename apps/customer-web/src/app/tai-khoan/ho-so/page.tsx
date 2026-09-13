import type { Metadata } from 'next';

import { HoSoKhachHangContent } from '@/components/ho-so-khach-hang-content';
import { KhungTaiKhoan } from '@/components/khung-tai-khoan';

export const metadata: Metadata = {
  title: 'Hồ sơ cá nhân',
  description: 'Cập nhật họ tên, số điện thoại và ngày sinh của tài khoản AgriMarket.',
};

export default function TrangHoSo() {
  return (
    <KhungTaiKhoan>
      <HoSoKhachHangContent />
    </KhungTaiKhoan>
  );
}
