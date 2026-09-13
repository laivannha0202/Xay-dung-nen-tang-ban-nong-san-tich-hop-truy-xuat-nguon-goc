import type { Metadata } from 'next';

import { DiemThuongContent } from '@/components/diem-thuong-content';
import { KhungTaiKhoan } from '@/components/khung-tai-khoan';

export const metadata: Metadata = {
  title: 'Điểm thưởng',
  description: 'Xem số dư và lịch sử điểm thưởng của tài khoản AgriMarket.',
};

export default function TrangDiemThuong() {
  return (
    <KhungTaiKhoan>
      <DiemThuongContent />
    </KhungTaiKhoan>
  );
}
