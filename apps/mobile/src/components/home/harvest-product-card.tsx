import { useLayChiTietSanPhamCongKhai } from '@agrimarket/api-client';

import { ProductCard, ProductCardSkeleton } from '@/components/design-system';

type HarvestProductCardProps = {
  id: string;
};

export function HarvestProductCard({ id }: HarvestProductCardProps) {
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
    />
  );
}

export type { HarvestProductCardProps };
