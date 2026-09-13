import '@mantine/core/styles.css';
import './globals.css';
import './brand-sync.css';
import './commerce-layout.css';

import { mantineHtmlProps } from '@mantine/core';
import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import type { ReactNode } from 'react';

import { KhungUngDung } from '@/components/khung-ung-dung';

import { Providers } from './providers';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['vietnamese', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans-vi',
});

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
    <html lang="vi" {...mantineHtmlProps} suppressHydrationWarning className={beVietnamPro.variable}>
      <body suppressHydrationWarning className={beVietnamPro.className}>
        <Providers>
          <KhungUngDung>{children}</KhungUngDung>
        </Providers>
      </body>
    </html>
  );
}
