import type { Metadata } from 'next';

import { CheckoutContent } from '@/components/checkout-content';

export const metadata: Metadata = {
  title: 'Thanh toán',
  description:
    'Checkout AgriMarket hiển thị địa chỉ, sản phẩm, vận chuyển, voucher, thanh toán và tổng kết theo dữ liệu Backend.',
};

export default function TrangThanhToan() {
  return <CheckoutContent />;
}
