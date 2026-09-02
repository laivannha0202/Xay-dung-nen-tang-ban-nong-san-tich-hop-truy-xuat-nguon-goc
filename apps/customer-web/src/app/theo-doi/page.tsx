import type { Metadata } from 'next';

import { AgriContainer } from '@/components/agri-container';
import { TheoDoiTrangTraiContent } from '@/components/theo-doi-trang-trai-content';

export const metadata: Metadata = {
  title: 'Trang trại theo dõi',
  description: 'Trang trại đang theo dõi và thông báo thu hoạch mới trên AgriMarket.',
};

export default function TrangTheoDoiTrangTrai() {
  return (
    <AgriContainer py="xl">
      <TheoDoiTrangTraiContent />
    </AgriContainer>
  );
}
