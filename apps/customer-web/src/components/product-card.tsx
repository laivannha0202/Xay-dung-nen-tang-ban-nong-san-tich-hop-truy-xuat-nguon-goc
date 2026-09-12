'use client';

import { AspectRatio, Badge, Box, Card, Group, Image, Stack, Text } from '@mantine/core';
import { IconArrowUpRight, IconLeaf, IconMapPin, IconPackage } from '@tabler/icons-react';
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
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
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
      padding={0}
      className="agri-product-card"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <Box className="agri-product-media">
        <AspectRatio ratio={4 / 3}>
          {anh ?? (
            <Image src={anhDuPhongSanPham(ten)} alt={ten} h="100%" w="100%" fit="cover" loading="lazy" />
          )}
        </AspectRatio>
        {danhMuc ? (
          <Badge
            className="agri-product-badge"
            pos="absolute"
            top={10}
            left={10}
            size="sm"
            color="white"
            c="agrimarket.9"
            variant="filled"
            styles={{ root: { border: '1px solid rgba(34, 81, 48, 0.12)' } }}
          >
            {danhMuc}
          </Badge>
        ) : null}

        <Badge
          pos="absolute"
          top={10}
          right={10}
          size="sm"
          variant="filled"
          color={tamHetHang ? 'orange' : 'agrimarket'}
        >
          {tamHetHang ? 'Tạm hết' : 'Còn hàng'}
        </Badge>
      </Box>

      <Stack gap="md" p="md" style={{ flex: 1 }}>
        <Stack gap={6}>
          <Text className="agri-product-name" fz="md" lineClamp={2}>
            {ten}
          </Text>

          <Group gap={5} wrap="nowrap">
            <IconMapPin size={14} stroke={1.8} color="#68766D" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {tenTrangTrai}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="flex-end" gap="xs" mt="auto">
          <Stack gap={1}>
            <Text className="agri-product-price" fz="lg">
              {giaTu !== null && giaTu !== undefined ? `${dinhDangGia(giaTu)} ₫` : 'Đang cập nhật'}
            </Text>
            {giaTu !== null && giaTu !== undefined && donViHienThi ? (
              <Group gap={4}>
                <IconPackage size={13} color="#68766D" />
                <Text size="xs" c="dimmed">/ {donViHienThi}</Text>
              </Group>
            ) : null}
          </Stack>

          <Box
            w={34}
            h={34}
            c="agrimarket.7"
            bg="agrimarket.0"
            style={{ display: 'grid', placeItems: 'center', borderRadius: 10 }}
            aria-hidden
          >
            <IconArrowUpRight size={17} />
          </Box>
        </Group>

        <Group gap={6} wrap="nowrap" pt={10} style={{ borderTop: '1px solid #EEF2EF' }}>
          <IconLeaf size={15} stroke={1.8} color="#2F7D4D" />
          <Text size="xs" c="dimmed" lineClamp={1}>
            Xem quy cách, tồn kho và thông tin trang trại
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}