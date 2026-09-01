import { Suspense } from 'react';
import type { Metadata } from 'next';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { DanhSachSanPhamContent } from '@/components/danh-sach-san-pham-content';

export const metadata: Metadata = {
  title: 'Nông sản',
  description: 'Tìm kiếm và lọc nông sản công khai trên AgriMarket.',
};

export default function TrangDanhSachSanPham() {
  return (
    <Suspense
      fallback={
        <AgriContainer py={{ base: 36, md: 56 }}>
          <AgriSkeleton soLuong={6} />
        </AgriContainer>
      }
    >
      <DanhSachSanPhamContent />
    </Suspense>
  );
}
