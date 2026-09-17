'use client';

import { cauHinhApiClient } from '@agrimarket/api-client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';
import { theme } from '@/theme';
import { PhienKhachHangProvider } from '@/components/phien-khach-hang-provider';

type ProvidersProps = {
  children: ReactNode;
};

function layApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const browserHost =
    typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : null;

  if (configured) {
    const normalized = configured.replace(/\/+$/, '');

    // AGRIMARKET-AUTH-LOOPBACK-SAME-HOST-V1
    // Cookie refresh WEB là HttpOnly cookie. Trong local dev, nếu Customer Web
    // mở bằng localhost nhưng API env lại trỏ 127.0.0.1 (hoặc ngược lại),
    // browser coi đó là hai host khác nhau và cookie có thể không đi cùng request.
    // Chỉ đồng bộ hai loopback host; production domain giữ nguyên tuyệt đối.
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
        // URL env sai sẽ được api-client báo rõ ở bước gọi API.
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

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // 401 = token hết hạn/không hợp lệ: retry cũng 401 tiếp, chỉ
            // nhân đôi dòng lỗi trong console. Lỗi khác giữ retry 1 lần.
            retry: (soLanThatBai, loi) =>
              laLoiPhienHetHan(loi) ? false : soLanThatBai < 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} forceColorScheme="light">
        <PhienKhachHangProvider>{children}</PhienKhachHangProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}
