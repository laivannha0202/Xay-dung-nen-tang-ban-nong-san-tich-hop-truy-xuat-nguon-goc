import type { Metadata } from 'next';

import { DoiMatKhauContent } from '@/components/doi-mat-khau-content';
import { KhungTaiKhoan } from '@/components/khung-tai-khoan';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu',
  description: 'Đổi mật khẩu tài khoản AgriMarket.',
};

export default function TrangDoiMatKhau() {
  return (
    <KhungTaiKhoan>
      <DoiMatKhauContent />
    </KhungTaiKhoan>
  );
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
