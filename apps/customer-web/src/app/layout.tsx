import '@mantine/core/styles.css';
import './globals.css';
import './brand-sync.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { KhungUngDung } from '@/components/khung-ung-dung';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'AgriMarket — Nông sản từ trang trại',
    template: '%s | AgriMarket',
  },
  description:
    'Mua nông sản từ trang trại, theo dõi đơn hàng và kiểm tra nguồn gốc theo từng lô sản phẩm.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" {...mantineHtmlProps} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <KhungUngDung>{children}</KhungUngDung>
        </Providers>
      </body>
    </html>
  );
}
