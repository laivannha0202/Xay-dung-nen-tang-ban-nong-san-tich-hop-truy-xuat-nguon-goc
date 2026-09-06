'use client';

import { Card, Group, Image, Stack, Text } from '@mantine/core';
import { IconMapPin, IconCircleCheck } from '@tabler/icons-react';
import Link from 'next/link';

import { anhDuPhongTrangTrai } from '@/lib/demo-images';

export type FarmCardProps = {
  ten: string;
  diaChi: string;
  moTa?: string;
  soSanPham?: number;
  href?: string;
  daXacMinh?: boolean;
};

export function FarmCard({
  ten,
  diaChi,
  moTa,
  soSanPham,
  href = '#',
  daXacMinh = false,
}: FarmCardProps) {
  return (
    <Card
      component={Link}
      href={href}
      withBorder
      padding={0}
      className="farm-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Image src={anhDuPhongTrangTrai(ten)} alt="" className="farm-card-photo" loading="lazy" />

      <Stack gap="sm" p="lg">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text
            fw={850}
            fz="xl"
            className="farm-display"
            lineClamp={2}
            style={{ lineHeight: 1.05 }}
          >
            {ten}
          </Text>
          {daXacMinh ? <IconCircleCheck size={20} stroke={1.7} color="#35633e" /> : null}
        </Group>

        <Group gap={6} wrap="nowrap" align="flex-start">
          <IconMapPin size={15} stroke={1.7} color="#687268" style={{ marginTop: 2 }} />
          <Text size="sm" c="dimmed" lineClamp={2}>
            {diaChi}
          </Text>
        </Group>

        {moTa ? (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {moTa}
          </Text>
        ) : null}

        <Group justify="space-between" className="farm-product-footer">
          <Text size="sm" fw={800} c="agrimarket.8">
            {soSanPham !== undefined ? `${soSanPham} sản phẩm` : 'Hồ sơ trang trại'}
          </Text>
          <Text size="sm" fw={800}>
            Xem trang trại →
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
