import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
 return (
 <Tabs
      backBehavior="history"
 screenOptions={{
 headerShown: false,
 tabBarHideOnKeyboard: true,
 tabBarActiveTintColor: '#16a34a',
 tabBarInactiveTintColor: '#9ca3af',
 tabBarStyle: {
 height: 65,
 paddingBottom: 8,
 },
 }}
 >
 <Tabs.Screen
 name="index"
 options={{
 title: 'Trang chủ',
 tabBarIcon: ({ color, size }) => (
 <Ionicons name="home-outline" size={size} color={color} />
 ),
 }}
 />
 <Tabs.Screen
 name="kham-pha"
 options={{
 title: 'Khám phá',
 tabBarIcon: ({ color, size }) => (
 <Ionicons name="leaf-outline" size={size} color={color} />
 ),
 }}
 />
 <Tabs.Screen
 name="quet-qr"
 options={{
 title: 'Quét QR',
 tabBarIcon: ({ color, size }) => (
 <Ionicons name="qr-code-outline" size={size} color={color} />
 ),
 }}
 />
 <Tabs.Screen
 name="don-hang"
 options={{
 title: 'Đơn hàng',
 tabBarIcon: ({ color, size }) => (
 <Ionicons name="receipt-outline" size={size} color={color} />
 ),
 }}
 />
 <Tabs.Screen
 name="tai-khoan"
 options={{
 title: 'Tài khoản',
 tabBarIcon: ({ color, size }) => (
 <Ionicons name="person-outline" size={size} color={color} />
 ),
 }}
 />
 </Tabs>
 );
}
