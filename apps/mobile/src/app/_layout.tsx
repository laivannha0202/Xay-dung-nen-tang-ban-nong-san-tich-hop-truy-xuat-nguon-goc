import '../global.css';

import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/app-providers';
import { khoiTaoThongBaoPushMobile } from '@/lib/thong-bao-push';

export default function RootLayout() {
  useEffect(() => khoiTaoThongBaoPushMobile(), []);

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </AppProviders>
  );
}
