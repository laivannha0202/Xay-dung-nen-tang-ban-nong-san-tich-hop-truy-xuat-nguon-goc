'use client';

import '@ant-design/v5-patch-for-react-19';

import { cauHinhApiClient, THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useEffect, useState, type ReactNode } from 'react';

import { caiDatTuDongLamMoiPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ProvidersProps = {
  children: ReactNode;
};

function layApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || '127.0.0.1';
    return `http://${hostname}:3000`;
  }

  return 'http://127.0.0.1:3000';
}

cauHinhApiClient(layApiBaseUrl());

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
            colorPrimary: THUONG_HIEU_AGRIMARKET.primary,
            colorInfo: THUONG_HIEU_AGRIMARKET.primary,
            colorSuccess: THUONG_HIEU_AGRIMARKET.success,
            colorWarning: THUONG_HIEU_AGRIMARKET.warning,
            colorError: THUONG_HIEU_AGRIMARKET.danger,
            colorLink: THUONG_HIEU_AGRIMARKET.primary,
            borderRadius: 10,
            colorBgLayout: THUONG_HIEU_AGRIMARKET.page,
            colorBgContainer: THUONG_HIEU_AGRIMARKET.card,
            colorBorderSecondary: THUONG_HIEU_AGRIMARKET.border,
            colorText: THUONG_HIEU_AGRIMARKET.text,
            colorTextSecondary: THUONG_HIEU_AGRIMARKET.mutedText,
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          components: {
            Layout: {
              bodyBg: THUONG_HIEU_AGRIMARKET.page,
              headerBg: THUONG_HIEU_AGRIMARKET.card,
              siderBg: THUONG_HIEU_AGRIMARKET.primaryDark,
            },
            Menu: {
              darkItemBg: 'transparent',
              darkSubMenuItemBg: 'rgba(0,0,0,.08)',
              darkItemSelectedBg: 'rgba(189,233,207,.20)',
              darkItemSelectedColor: '#FFFFFF',
              darkItemColor: 'rgba(255,255,255,.86)',
              darkItemHoverColor: '#FFFFFF',
              itemBorderRadius: 10,
            },
            Card: {
              borderRadiusLG: 12,
            },
            Input: {
              borderRadius: 10,
            },
            Select: {
              borderRadius: 10,
            },
            Button: {
              borderRadius: 10,
            },
            Table: {
              headerBg: THUONG_HIEU_AGRIMARKET.softest,
              headerColor: THUONG_HIEU_AGRIMARKET.text,
              borderColor: '#E4ECE7',
            },
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
