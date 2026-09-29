import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { TruyXuatContent } from '@/components/truy-xuat-content';

export const metadata: Metadata = {
  title: 'Truy xuất nguồn gốc',
  description:
    'Tra cứu nguồn gốc theo mã trên tem sản phẩm để xem lô, trang trại, mùa vụ, thu hoạch, kiểm định, chứng nhận, hành trình và cảnh báo thu hồi.',
};

export default function TrangTruyXuat() {
  return (
    <Suspense
      fallback={
        <AgriContainer py={{ base: 36, md: 56 }}>
          <AgriSkeleton soLuong={3} />
        </AgriContainer>
      }
    >
      <TruyXuatContent />
    </Suspense>
  );
}
