import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { cauHinhApiMobile } from '@/lib/api-runtime';
import { coNenThuLaiQueryApi } from '@/lib/api-error';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { khoiPhucPhienMobile } from '@/lib/phien-xac-thuc';
import { SessionAuthNotice } from '@/components/auth/session-auth-notice';
import { dangKyThongBaoPushMobile } from '@/lib/thong-bao-push';
import { useXacThucStore } from '@/stores/xac-thuc.store';
import { AppState, Platform, type AppStateStatus } from 'react-native';

function capNhatFocusQuery(status: AppStateStatus): void {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

type AppProvidersProps = { children: ReactNode };

cauHinhApiMobile();

export function AppProviders({ children }: AppProvidersProps) {
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnReconnect: true,
            retry: coNenThuLaiQueryApi,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    capNhatFocusQuery(AppState.currentState);

    const subscription = AppState.addEventListener('change', capNhatFocusQuery);

    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);

  useEffect(() => {
    void khoiPhucPhienMobile();
  }, []);

  useEffect(() => {
    if (trangThaiXacThuc !== 'da-dang-nhap') {
      return;
    }

    void dangKyThongBaoPushMobile({
      xinQuyen: false,
    });
  }, [trangThaiXacThuc]);

  return (
    <GluestackUIProvider>
      <SessionAuthNotice />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </GluestackUIProvider>
  );
}
