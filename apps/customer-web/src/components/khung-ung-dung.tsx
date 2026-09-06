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
      header={{ height: { base: 72, md: 128 } }}
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
        }}
      >
        <main className="farm-page-main" style={{ flex: 1 }}>
          {children}
        </main>
        <AgriFooter />
      </AppShell.Main>
    </AppShell>
  );
}
