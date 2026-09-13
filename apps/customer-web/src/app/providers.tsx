'use client';

import { cauHinhApiClient } from '@agrimarket/api-client';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { laLoiPhienHetHan } from '@/lib/phien-khach-hang';
import { theme } from '@/theme';

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
      <MantineProvider theme={theme}>{children}</MantineProvider>
    </QueryClientProvider>
  );
}
