'use client';

import { AspectRatio, Badge, Box, Card, Group, Image, Stack, Text } from '@mantine/core';
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
  const danhMuc = nhan.find((item) => !item.toLowerCase().includes('hàng'));

  return (
    <Card
      component={Link}
      href={href}
      withBorder
      radius="md"
      padding={0}
      style={{
        height: '100%',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        borderColor: '#e1e3dc',
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(25, 50, 33, 0.035)',
      }}
    >
      <Box pos="relative" bg="gray.0">
        <AspectRatio ratio={4 / 3}>
          {anh ?? (
            <Image
              src={anhDuPhongSanPham(ten)}
              alt={ten}
              h="100%"
              w="100%"
              fit="cover"
              loading="lazy"
            />
          )}
        </AspectRatio>

        {danhMuc ? (
          <Badge
            pos="absolute"
            top={10}
            left={10}
            size="sm"
            radius="sm"
            color="white"
            c="agrimarket.9"
            variant="filled"
            styles={{
              root: {
                border: '1px solid rgba(34, 81, 48, 0.14)',
                boxShadow: '0 1px 4px rgba(0,0,0,.06)',
              },
            }}
          >
            {danhMuc}
          </Badge>
        ) : null}
      </Box>

      <Stack gap="sm" p="md">
        <Stack gap={4}>
          <Text fw={800} fz="md" lineClamp={2} lh={1.25}>
            {ten}
          </Text>

          <Group gap={5} wrap="nowrap">
            <IconMapPin size={14} stroke={1.8} color="#5d6c62" />
            <Text size="xs" c="dimmed" lineClamp={1}>
              {tenTrangTrai}
            </Text>
          </Group>
        </Stack>

        <Group justify="space-between" align="flex-end" gap="xs">
          <Stack gap={0}>
            <Text fw={900} fz="lg" c="agrimarket.8">
              {giaTu !== null && giaTu !== undefined ? `${dinhDangGia(giaTu)} ₫` : 'Đang cập nhật'}
            </Text>
            {giaTu !== null && giaTu !== undefined ? (
              <Text size="xs" c="dimmed">
                / {donVi}
              </Text>
            ) : null}
          </Stack>

          <Badge size="sm" radius="sm" variant="light" color={tamHetHang ? 'orange' : 'green'}>
            {tamHetHang ? 'Tạm hết' : 'Còn hàng'}
          </Badge>
        </Group>

        <Group gap={6} wrap="nowrap" pt={9} style={{ borderTop: '1px solid #eeeeea' }}>
          <IconShieldCheck size={15} stroke={1.8} color="#2f7d4d" />
          <Text size="xs" c="dimmed">
            Có thông tin nguồn gốc
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}
