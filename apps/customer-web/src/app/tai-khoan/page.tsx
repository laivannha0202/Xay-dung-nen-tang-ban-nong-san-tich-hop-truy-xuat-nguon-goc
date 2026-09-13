import type { Metadata } from 'next';

import { KhungTaiKhoan } from '@/components/khung-tai-khoan';
import { TongQuanTaiKhoanContent } from '@/components/tong-quan-tai-khoan-content';

export const metadata: Metadata = {
  title: 'Tài khoản của tôi',
  description: 'Tổng quan tài khoản AgriMarket: đơn hàng gần đây và lối tắt quản lý tài khoản.',
};

export default function TrangTaiKhoan() {
  return (
    <KhungTaiKhoan>
      <TongQuanTaiKhoanContent />
    </KhungTaiKhoan>
  );
}
