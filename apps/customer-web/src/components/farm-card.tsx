'use client';

import { Avatar, Card, Group, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

import { AgriBadge } from './agri-badge';

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
      radius="lg"
      padding="lg"
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Stack gap="md">
        <Group align="flex-start" wrap="nowrap">
          <Avatar size={52} radius="xl" color="agrimarket">
            {ten.slice(0, 1).toUpperCase()}
          </Avatar>

          <Stack gap={4} style={{ flex: 1 }}>
            <Group gap="xs">
              <Title order={3} fz="lg">
                {ten}
              </Title>
              {daXacMinh ? <AgriBadge loai="chung-nhan">Đã xác minh</AgriBadge> : null}
            </Group>
            <Text size="sm" c="dimmed">
              {diaChi}
            </Text>
          </Stack>
        </Group>

        {moTa ? (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {moTa}
          </Text>
        ) : null}

        {soSanPham !== undefined ? (
          <Text size="sm" fw={600} c="agrimarket.8">
            {soSanPham} sản phẩm đang giới thiệu
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
