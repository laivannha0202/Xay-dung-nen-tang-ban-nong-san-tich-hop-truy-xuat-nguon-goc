import { cauHinhApiClient } from '@agrimarket/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

type AppProvidersProps = {
  children: ReactNode;
};

cauHinhApiClient(process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3000');

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  return (
    <GluestackUIProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GluestackUIProvider>
  );
}
