'use client';

import '@ant-design/v5-patch-for-react-19';

import { cauHinhApiClient } from '@agrimarket/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
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
        locale={viVN}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#087A4B',
            colorInfo: '#087A4B',
            colorSuccess: '#16A365',
            colorWarning: '#E99A32',
            colorError: '#E6535F',
            colorLink: '#087A4B',
            borderRadius: 8,
            colorBgLayout: '#F4F7F5',
            colorBorderSecondary: '#E9EEEB',
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          components: {
            Layout: {
              bodyBg: '#F4F7F5',
              headerBg: '#FFFFFF',
              siderBg: '#075D3A',
            },
            Menu: {
              darkItemBg: 'transparent',
              darkSubMenuItemBg: 'rgba(0,0,0,.08)',
              darkItemSelectedBg: 'rgba(139,224,178,.22)',
              darkItemSelectedColor: '#FFFFFF',
              darkItemColor: 'rgba(255,255,255,.84)',
              darkItemHoverColor: '#FFFFFF',
              itemBorderRadius: 7,
            },
            Card: {
              borderRadiusLG: 9,
            },
            Input: {
              borderRadius: 7,
            },
            Button: {
              borderRadius: 7,
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
