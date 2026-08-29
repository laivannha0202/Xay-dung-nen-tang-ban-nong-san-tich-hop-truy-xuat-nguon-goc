import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarLabel: 'Trang chủ' }} />
      <Tabs.Screen name="kham-pha" options={{ title: 'Khám phá', tabBarLabel: 'Khám phá' }} />
      <Tabs.Screen name="quet-qr" options={{ title: 'Quét QR', tabBarLabel: 'Quét QR' }} />
      <Tabs.Screen name="don-hang" options={{ title: 'Đơn hàng', tabBarLabel: 'Đơn hàng' }} />
      <Tabs.Screen name="tai-khoan" options={{ title: 'Tài khoản', tabBarLabel: 'Tài khoản' }} />
    </Tabs>
  );
}
