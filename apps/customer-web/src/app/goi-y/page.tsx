import type { Metadata } from 'next';

import { GoiYPageContent } from '@/components/goi-y-page-content';

export const metadata: Metadata = {
  title: 'Gợi ý cho bạn',
  description: 'Khám phá các sản phẩm AgriMarket được sắp xếp theo sở thích và lịch sử mua sắm.',
};

export default function TrangGoiY() {
  return <GoiYPageContent />;
}
