import type { Metadata } from 'next';

import { AgriContainer } from '@/components/agri-container';
import { WishlistContent } from '@/components/wishlist-content';

export const metadata: Metadata = {
  title: 'Sản phẩm yêu thích',
  description: 'Danh sách nông sản yêu thích của khách hàng AgriMarket.',
};

export default function TrangYeuThich() {
  return (
    <AgriContainer py="xl">
      <WishlistContent />
    </AgriContainer>
  );
}
