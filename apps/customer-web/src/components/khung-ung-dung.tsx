'use client';

import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { AppShell } from '@mantine/core';
import type { ReactNode } from 'react';

import { useGiaoDienStore } from '@/stores/giao-dien.store';

import { AgriFooter } from './agri-footer';
import { AgriHeader } from './agri-header';

type KhungUngDungProps = {
  children: ReactNode;
};

export function KhungUngDung({ children }: KhungUngDungProps) {
  const moMenuDiDong = useGiaoDienStore((state) => state.moMenuDiDong);

  return (
    <AppShell
      header={{ height: { base: 68, md: 142 } }}
      navbar={{
        width: 300,
        breakpoint: 'md',
        collapsed: { mobile: !moMenuDiDong, desktop: true },
      }}
      padding={0}
    >
      <AgriHeader />

      <AppShell.Main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          background: THUONG_HIEU_AGRIMARKET.page,
        }}
      >
        <main style={{ flex: 1 }}>{children}</main>
        <AgriFooter />
      </AppShell.Main>
    </AppShell>
  );
}
