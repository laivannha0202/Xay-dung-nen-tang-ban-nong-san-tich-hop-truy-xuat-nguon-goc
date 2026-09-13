'use client';

import { Box, Card, Group, Image, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconBuildingStore, IconMapPin } from '@tabler/icons-react';
import Link from 'next/link';

export type FarmCardProps = {
  ten: string;
  diaChi: string;
  moTa?: string;
  soSanPham?: number;
  href?: string;
  anhUrl?: string | null;
};

export function FarmCard({ ten, diaChi, moTa, soSanPham, href = '#', anhUrl }: FarmCardProps) {
  return (
    <Card
      component={Link}
      href={href}
      withBorder
      padding={0}
      radius="md"
      className="farm-card"
      style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}
    >
      {anhUrl ? (
        <Image src={anhUrl} alt={ten} h={170} fit="cover" loading="lazy" />
      ) : (
        <Box
          h={170}
          bg="gray.1"
          style={{ display: 'grid', placeItems: 'center' }}
          aria-label="Trang trại chưa có ảnh công khai"
        >
          <ThemeIcon size={52} radius="xl" variant="light" color="agrimarket">
            <IconBuildingStore size={26} />
          </ThemeIcon>
        </Box>
      )}

      <Stack gap="sm" p="lg">
        <Text fw={850} fz="xl" className="farm-display" lineClamp={2} style={{ lineHeight: 1.05 }}>
          {ten}
        </Text>

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
