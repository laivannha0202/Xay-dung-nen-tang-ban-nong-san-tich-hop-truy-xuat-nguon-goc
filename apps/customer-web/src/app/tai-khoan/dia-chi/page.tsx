import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { SoDiaChiContent } from '@/components/so-dia-chi-content';

export const metadata: Metadata = {
  title: 'Sổ địa chỉ',
  description: 'Quản lý địa chỉ nhận hàng AgriMarket trong phạm vi Hưng Yên.',
};

export default function TrangDiaChi() {
  return (
    <KhungTaiKhoan>
      <SoDiaChiContent />
    </KhungTaiKhoan>
  );
}
