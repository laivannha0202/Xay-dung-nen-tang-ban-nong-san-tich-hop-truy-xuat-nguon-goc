import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';

export const metadata: Metadata = {
  title: 'Địa chỉ giao hàng',
  description: 'Quản lý các địa chỉ giao hàng của bạn.',
};

export default function TrangDiaChi() {
  return (
    <KhungTaiKhoan>
      <SoDiaChiContent />
    </KhungTaiKhoan>
  );
}
