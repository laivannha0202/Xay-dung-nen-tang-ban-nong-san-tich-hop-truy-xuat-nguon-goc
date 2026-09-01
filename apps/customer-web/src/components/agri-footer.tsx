'use client';

import { Anchor, Box, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

import { AgriContainer } from './agri-container';

const lienKet = [
  { nhan: 'Nông sản', href: '/san-pham' },
  { nhan: 'Truy xuất', href: '/truy-xuat' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
] as const;

export function AgriFooter() {
  return (
    <Box
      component="footer"
      mt={72}
      py={{ base: 36, md: 48 }}
      bg="var(--mantine-color-gray-0)"
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <AgriContainer>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
          <Stack gap="xs" maw={480}>
            <Title order={3} c="agrimarket.8">
              AgriMarket
            </Title>
            <Text c="dimmed" size="sm">
              Nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc.
            </Text>
          </Stack>

          <Stack gap="xs" align="flex-start">
            <Text fw={600}>Khám phá</Text>
            <Group gap="lg">
              {lienKet.map((item) => (
                <Anchor key={item.href} component={Link} href={item.href} c="dimmed" size="sm">
                  {item.nhan}
                </Anchor>
              ))}
            </Group>
          </Stack>
        </SimpleGrid>

        <Divider my="xl" />

        <Text size="xs" c="dimmed">
          © AgriMarket · Nông sản minh bạch, nguồn gốc rõ ràng.
        </Text>
      </AgriContainer>
    </Box>
  );
}
