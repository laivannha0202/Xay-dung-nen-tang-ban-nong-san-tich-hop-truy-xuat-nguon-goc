'use client';

import '@ant-design/v5-patch-for-react-19';

import { cauHinhApiClient } from '@agrimarket/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';

import { caiDatTuDongLamMoiPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ProvidersProps = {
  children: ReactNode;
};

cauHinhApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000');

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    caiDatTuDongLamMoiPhienAdmin();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#0B8F4D',
            colorInfo: '#0B8F4D',
            colorLink: '#087744',
            borderRadius: 10,
            colorBgLayout: '#F4F7F5',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          components: {
            Layout: {
              bodyBg: '#F4F7F5',
              siderBg: '#FFFFFF',
              headerBg: '#FFFFFF',
            },
            Menu: {
              itemSelectedBg: '#EAF7EF',
              itemSelectedColor: '#087744',
              itemHoverColor: '#087744',
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
