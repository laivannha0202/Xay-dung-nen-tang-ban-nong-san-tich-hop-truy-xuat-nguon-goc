import { AntdRegistry } from '@ant-design/nextjs-registry';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { KhungQuanTri } from '@/components/khung-quan-tri';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'AgriMarket Admin',
    template: '%s | AgriMarket Admin',
  },
  description: 'Hệ thống quản trị AgriMarket.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="vi">
      <body>
        <AntdRegistry>
          <Providers>
            <KhungQuanTri>{children}</KhungQuanTri>
          </Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
