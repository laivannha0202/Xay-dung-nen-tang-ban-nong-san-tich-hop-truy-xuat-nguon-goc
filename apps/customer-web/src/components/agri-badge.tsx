import { Badge } from '@mantine/core';
import type { BadgeProps } from '@mantine/core';

export type LoaiAgriBadge = 'truy-xuat' | 'chung-nhan' | 'tuoi-moi' | 'canh-bao';

type AgriBadgeProps = Omit<BadgeProps, 'color' | 'variant'> & {
  loai?: LoaiAgriBadge;
};

const mauTheoLoai: Record<LoaiAgriBadge, string> = {
  'truy-xuat': 'agrimarket',
  'chung-nhan': 'teal',
  'tuoi-moi': 'lime',
  'canh-bao': 'orange',
};

export function AgriBadge({ loai = 'truy-xuat', children, ...props }: AgriBadgeProps) {
  return (
    <Badge color={mauTheoLoai[loai]} variant="light" radius="xl" {...props}>
      {children}
    </Badge>
  );
}
