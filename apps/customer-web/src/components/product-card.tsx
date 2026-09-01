'use client';

import { AspectRatio, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AgriBadge } from './agri-badge';

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
  return (
    <Card
      component={Link}
      href={href}
      withBorder
      radius="lg"
      padding="md"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
      }}
    >
      <Card.Section>
        <AspectRatio ratio={4 / 3}>
          {anh ?? (
            <Box
              bg="agrimarket.0"
              style={{
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Text fw={700} c="agrimarket.7">
                AgriMarket
              </Text>
            </Box>
          )}
        </AspectRatio>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Group gap="xs">
          {nhan.slice(0, 2).map((item) => (
            <AgriBadge key={item}>{item}</AgriBadge>
          ))}
        </Group>

        <Stack gap={4}>
          <Title order={3} fz="lg" lineClamp={2}>
            {ten}
          </Title>
          <Text size="sm" c="dimmed" lineClamp={1}>
            {tenTrangTrai}
          </Text>
        </Stack>

        <Text fw={700} c="agrimarket.8">
          {giaTu !== null && giaTu !== undefined
            ? `Từ ${dinhDangGia(giaTu)} ₫/${donVi}`
            : 'Giá đang cập nhật'}
        </Text>
      </Stack>
    </Card>
  );
}
