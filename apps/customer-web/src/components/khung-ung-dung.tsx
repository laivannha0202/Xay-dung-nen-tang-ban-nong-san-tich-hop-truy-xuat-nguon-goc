'use client';

import { AppShell, Burger, Container, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

import { useGiaoDienStore } from '@/stores/giao-dien.store';

type KhungUngDungProps = {
  children: ReactNode;
};

const mucDieuHuong = ['Trang chủ', 'Nông sản', 'Truy xuất', 'Đơn hàng', 'Tài khoản'];

export function KhungUngDung({ children }: KhungUngDungProps) {
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);
  const batTatMenuDiDong = useGiaoDienStore((state) => state.batTatMenuDiDong);
  const dongMenuDiDong = useGiaoDienStore((state) => state.dongMenuDiDong);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{
        width: 260,
        breakpoint: 'md',
        collapsed: { mobile: !moMenuDiDong },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="sm">
              <Burger
                opened={moMenuDiDong}
                onClick={batTatMenuDiDong}
                hiddenFrom="md"
                size="sm"
                aria-label="Mở điều hướng"
              />
              <Stack gap={0}>
                <Title order={3}>AgriMarket</Title>
                <Text size="xs" c="dimmed">
                  Nông sản minh bạch
                </Text>
              </Stack>
            </Group>
            <Text size="sm" visibleFrom="sm">
              Khách hàng
            </Text>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap="xs">
            {mucDieuHuong.map((nhan, index) => (
              <NavLink key={nhan} label={nhan} active={index === 0} onClick={dongMenuDiDong} />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Text size="xs" c="dimmed">
            Customer Web Foundation
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
