'use client';

import { ActionIcon, AspectRatio, Badge, Box, Card, Group, Image, Stack, Text } from '@mantine/core';
import { IconMapPin, IconShoppingCart } from '@tabler/icons-react';
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
  donVi,
  anh,
  href = '#',
  nhan = [],
}: ProductCardProps) {
  const tamHetHang = nhan.some((item) => item.toLowerCase().includes('hết hàng'));
  const danhMuc = nhan.find((item) => !item.toLowerCase().includes('hàng'));
  const donViHienThi = donVi?.trim() && donVi.trim().toLowerCase() !== 'đơn vị' ? donVi.trim() : null;

  return (
    <Card
      component={Link}
      href={href}
      withBorder
      radius="md"
      padding={0}
      className="market-product-card"
      style={{ height: '100%', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
    >
      <Box pos="relative" bg="#F4F7F5">
        <AspectRatio ratio={1}>
          {anh ?? (
            <Image src={anhDuPhongSanPham(ten)} alt={ten} h="100%" w="100%" fit="cover" loading="lazy" />
          )}
        </AspectRatio>
        {danhMuc ? (
          <Badge pos="absolute" top={9} left={9} size="xs" color="white" c="agrimarket.8" variant="filled">
            {danhMuc}
          </Badge>
        ) : null}
      </Box>

      <Stack gap={7} p="sm">
        <Text fw={800} fz={{ base: 13, sm: 14 }} lineClamp={2} lh={1.3} mih={36}>
          {ten}
        </Text>
        <Group gap={4} wrap="nowrap">
          <IconMapPin size={13} stroke={1.8} color="#748078" />
          <Text size="11px" c="dimmed" lineClamp={1}>{tenTrangTrai}</Text>
        </Group>
        <Group justify="space-between" align="flex-end" gap={6} wrap="nowrap">
          <Stack gap={0} style={{ minWidth: 0 }}>
            <Text fw={900} fz={{ base: 15, sm: 17 }} c="agrimarket.7" lh={1.1}>
              {giaTu !== null && giaTu !== undefined ? `${dinhDangGia(giaTu)}đ` : 'Đang cập nhật'}
            </Text>
            {giaTu !== null && giaTu !== undefined && donViHienThi ? (
              <Text size="10px" c="dimmed">/ {donViHienThi}</Text>
            ) : null}
          </Stack>
          <ActionIcon
            component="span"
            color={tamHetHang ? 'gray' : 'agrimarket'}
            variant={tamHetHang ? 'light' : 'filled'}
            size={32}
            radius="md"
            aria-label={tamHetHang ? 'Tạm hết hàng' : 'Xem sản phẩm'}
          >
            <IconShoppingCart size={16} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}
