import '@mantine/core/styles.css';

import { ColorSchemeScript, mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { KhungUngDung } from '@/components/khung-ung-dung';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'AgriMarket',
    template: '%s | AgriMarket',
  },
  description: 'Nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>
          <KhungUngDung>{children}</KhungUngDung>
        </Providers>
      </body>
    </html>
  );
}
