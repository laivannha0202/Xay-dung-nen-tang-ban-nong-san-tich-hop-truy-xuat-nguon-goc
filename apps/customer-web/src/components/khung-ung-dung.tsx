'use client';

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
      header={{ height: 72 }}
      navbar={{
        width: 280,
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
        }}
      >
        <main style={{ flex: 1 }}>{children}</main>
        <AgriFooter />
      </AppShell.Main>
    </AppShell>
  );
}
