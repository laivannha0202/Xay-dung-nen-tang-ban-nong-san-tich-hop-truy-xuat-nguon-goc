import { useLayChiTietSanPhamCongKhai } from '@agrimarket/api-client';
import { useRouter } from 'expo-router';

import { ProductCard, ProductCardSkeleton } from '@/components/design-system';

type HarvestProductCardProps = {
  id: string;
};

export function HarvestProductCard({ id }: HarvestProductCardProps) {
  const router = useRouter();
  const { data, isPending, isError } = useLayChiTietSanPhamCongKhai(id);
  const item = data?.data;

  if (isPending) {
    return <ProductCardSkeleton />;
  }

  if (isError || !item?.thuHoachGanNhatTaiTrangTrai) {
    return null;
  }

  const thuHoach = item.thuHoachGanNhatTaiTrangTrai;

  return (
    <ProductCard
      name={item.ten}
      farmName={item.trangTrai.ten}
      price={item.gia.tu}
      unit="đơn vị"
      imageUrl={item.anhBiaUrl}
      badges={[
        { label: `Thu hoạch ${thuHoach.ngayThuHoach}`, variant: 'success' },
        { label: thuHoach.cayTrong, variant: 'neutral' },
      ]}
      onPress={() =>
        router.push({
          pathname: '/san-pham/[id]',
          params: { id },
        })
      }
    />
  );
}

export type { HarvestProductCardProps };
