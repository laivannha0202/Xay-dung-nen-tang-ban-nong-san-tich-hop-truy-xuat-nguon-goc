'use client';

import { AspectRatio, Box, Card, Group, Image, Stack, Text } from '@mantine/core';
import { IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { anhDuPhongSanPham } from '@/lib/demo-images';

export type ProductCardProps = {
  ten: string;
  tenTrangTrai: string;
  giaTu?: number | null;
  donVi?: string;
  anh?: ReactNode;
  href?: string;
  nhan?: string[];
};

function dinhDangGia(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function ProductCard({
  ten,
  tenTrangTrai,
  giaTu,
  donVi = 'kg',
  anh,
  href = '#',
  nhan = [],
}: ProductCardProps) {
  const tamHetHang = nhan.some((item) => item.toLowerCase().includes('hết hàng'));
  const nhanChinh = nhan.find((item) => !item.toLowerCase().includes('hàng')) ?? nhan[0];

  return (
    <Card
      component={Link}
      href={href}
      withBorder
      padding={0}
      className="farm-product-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box className="farm-product-image-wrap">
        <AspectRatio ratio={1}>
          {anh ?? (
            <Image
              src={anhDuPhongSanPham(ten)}
              alt={ten}
              h="100%"
              w="100%"
              fit="cover"
              loading="lazy"
              className="farm-product-image"
            />
          )}
        </AspectRatio>

        {nhanChinh ? <span className="farm-product-label">{nhanChinh}</span> : null}
      </Box>

      <Stack gap="sm" p="md">
        <Stack gap={5}>
          <Text className="farm-product-name" lineClamp={2}>
            {ten}
          </Text>

          <Group gap={5} wrap="nowrap">
            <IconMapPin size={14} stroke={1.8} color="#55705d" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {tenTrangTrai}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="flex-end" gap="xs">
          <Stack gap={0}>
            <Text className="farm-product-price">
              {giaTu !== null && giaTu !== undefined ? `${dinhDangGia(giaTu)} ₫` : 'Đang cập nhật'}
            </Text>
            {giaTu !== null && giaTu !== undefined ? (
              <Text size="xs" c="dimmed">
                / {donVi}
              </Text>
            ) : null}
          </Stack>

          <Text size="xs" fw={800} c={tamHetHang ? 'orange.8' : 'agrimarket.8'}>
            {tamHetHang ? 'Tạm hết hàng' : 'Xem chi tiết'}
          </Text>
        </Group>

        <Group className="farm-product-footer" gap={6} wrap="nowrap">
          <IconShieldCheck size={15} stroke={1.7} color="#35633e" />
          <Text className="farm-product-origin">Có thông tin nguồn gốc</Text>
        </Group>
      </Stack>
    </Card>
  );
}
