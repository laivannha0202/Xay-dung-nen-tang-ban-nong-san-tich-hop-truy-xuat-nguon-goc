'use client';

import { AppShell } from '@mantine/core';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useGiaoDienStore } from '@/stores/giao-dien.store';
import { cuonToiNeoOnDinh } from '@/lib/cuon-den-neo';

import { AgriFooter } from './agri-footer';
import { AgriHeader } from './agri-header';

type KhungUngDungProps = {
  children: ReactNode;
};

/**
 * Next.js Link với href dạng /#neo không tự cuộn (URL đổi nhưng trang đứng yên).
 * Component này lắng nghe hash hiện tại sau mỗi lần đổi route + sự kiện
 * hashchange (bấm link neo khi đang ở cùng trang) rồi cuộn tay tới đúng section.
 */
function CuonTheoHash() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    const timer = setTimeout(() => cuonToiNeoOnDinh(hash), 60);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const xuLyHashChange = () => {
      const hash = window.location.hash?.slice(1);
      if (hash) cuonToiNeoOnDinh(hash);
    };
    window.addEventListener('hashchange', xuLyHashChange);
    return () => window.removeEventListener('hashchange', xuLyHashChange);
  }, []);

  return null;
}

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

      <CuonTheoHash />
      <AppShell.Main className="farm-page-main">
        <main style={{ minHeight: 'calc(100dvh - 112px)' }}>{children}</main>
        <AgriFooter />
      </AppShell.Main>
    </AppShell>
  );
}
