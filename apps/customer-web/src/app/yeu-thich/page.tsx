import type { Metadata } from 'next';

import { WishlistContent } from '@/components/wishlist-content';

export const metadata: Metadata = {
  title: 'Sản phẩm yêu thích',
  description: 'Danh sách nông sản yêu thích của khách hàng AgriMarket.',
};

export default function TrangYeuThich() {
  return <WishlistContent />;
}
