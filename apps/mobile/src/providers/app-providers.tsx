import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';

type AppProvidersProps = {
  children: ReactNode;
};

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
