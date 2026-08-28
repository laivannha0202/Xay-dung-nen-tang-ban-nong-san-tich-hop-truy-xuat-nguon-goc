'use client';

import '@ant-design/v5-patch-for-react-19';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import { useState, type ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 8,
          },
        }}
      >
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
