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
      header={{ height: { base: 68, md: 112 } }}
      navbar={{
        width: 320,
        breakpoint: 'md',
        collapsed: { mobile: !moMenuDiDong, desktop: true },
      }}
      padding={0}
    >
      <AgriHeader />

      <AppShell.Main className="farm-page-main">
        <main style={{ minHeight: 'calc(100dvh - 112px)' }}>{children}</main>
        <AgriFooter />
      </AppShell.Main>
    </AppShell>
  );
}
