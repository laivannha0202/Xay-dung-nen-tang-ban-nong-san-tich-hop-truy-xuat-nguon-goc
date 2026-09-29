import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { VoucherCuaToiContent } from '@/components/voucher-cua-toi-content';

export const metadata: Metadata = {
  title: 'Kho voucher',
  description: 'Quản lý voucher đã lưu và lịch sử sử dụng trên AgriMarket.',
};

export default function TrangVoucherCuaToi() {
  return (
    <KhungTaiKhoan>
      <VoucherCuaToiContent />
    </KhungTaiKhoan>
  );
}
