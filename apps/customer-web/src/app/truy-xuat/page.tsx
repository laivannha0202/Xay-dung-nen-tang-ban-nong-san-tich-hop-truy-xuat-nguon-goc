import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AgriContainer } from '@/components/agri-container';
import { AgriSkeleton } from '@/components/agri-skeleton';
import { TruyXuatContent } from '@/components/truy-xuat-content';

export const metadata: Metadata = {
  title: 'Truy xuất nguồn gốc',
  description: 'Nhập mã truy xuất để xem batch, farm, certificate, timeline và cảnh báo thu hồi.',
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
