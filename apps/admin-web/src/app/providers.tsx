'use client';

import '@ant-design/v5-patch-for-react-19';

import { cauHinhApiClient, THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { useState, type ReactNode } from 'react';

import { caiDatTuDongLamMoiPhienAdmin } from '@/lib/phien-dang-nhap-admin';

type ProvidersProps = {
  children: ReactNode;
};

function layApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const browserHost =
    typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : null;

  if (configured) {
    const normalized = configured.replace(/\/+$/, '');

    // AGRIMARKET-ADMIN-AUTH-LOOPBACK-SAME-HOST-V1
    // Refresh token WEB là HttpOnly + SameSite=Lax. localhost và 127.0.0.1
    // là hai site khác nhau, nên local dev phải đồng bộ host của API với
    // host đang mở Admin Web. Chỉ đổi loopback; production domain giữ nguyên.
    if (browserHost && ['localhost', '127.0.0.1'].includes(browserHost)) {
      try {
        const url = new URL(normalized);
        if (
          ['localhost', '127.0.0.1'].includes(url.hostname) &&
          url.hostname !== browserHost
        ) {
          url.hostname = browserHost;
          return url.toString().replace(/\/+$/, '');
        }
      } catch {
        // URL env sai sẽ được api-client báo rõ ở request thật.
      }
    }

    return normalized;
  }

  if (browserHost) {
    return `http://${browserHost}:3000`;
  }

  return 'http://127.0.0.1:3000';
}

cauHinhApiClient(layApiBaseUrl());
// Cài interceptor NGAY KHI module client được evaluate, trước effect của
// dashboard/con cháu để token cũ không tạo một "bão" request 401.
caiDatTuDongLamMoiPhienAdmin();

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
