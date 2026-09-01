'use client';

import { AppShell, Burger, Button, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

import { useGiaoDienStore } from '@/stores/giao-dien.store';

import { AgriContainer } from './agri-container';

const dieuHuong = [
  { nhan: 'Trang chủ', href: '/' },
  { nhan: 'Nông sản', href: '/san-pham' },
  { nhan: 'Truy xuất', href: '/truy-xuat' },
  { nhan: 'Giỏ hàng', href: '/gio-hang' },
  { nhan: 'Đơn hàng', href: '/don-hang' },
  { nhan: 'Tài khoản', href: '/tai-khoan' },
] as const;

export function AgriHeader() {
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);

  return (
    <>
      <AppShell.Header
        bg="var(--mantine-color-body)"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <AgriContainer h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={moMenuDiDong}
                onClick={batTatMenuDiDong}
                hiddenFrom="md"
                size="sm"
                aria-label="Mở điều hướng"
              />

              <Stack gap={0}>
                <Title order={3} c="agrimarket.8">
                  AgriMarket
                </Title>
                <Text size="xs" c="dimmed">
                  Nông sản minh bạch
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" visibleFrom="md">
              {dieuHuong.slice(0, 5).map((item) => (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  variant="subtle"
                  color="dark"
                  size="compact-sm"
                >
                  {item.nhan}
                </Button>
              ))}
            </Group>

            <Group gap="xs" visibleFrom="sm">
              <Button component={Link} href="/tai-khoan" variant="default" size="compact-sm">
                Tài khoản
              </Button>
            </Group>
          </Group>
        </AgriContainer>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap="xs">
            {dieuHuong.map((item) => (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.nhan}
                onClick={dongMenuDiDong}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Text size="xs" c="dimmed">
            AgriMarket Customer Web
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>
    </>
  );
}
