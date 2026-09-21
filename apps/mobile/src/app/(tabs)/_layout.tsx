import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

const ACTIVE = '#087A4B';
const INACTIVE = '#6E7D74';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: '#F7FAF8' },
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '800', marginTop: 2 },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          height: 74,
          paddingBottom: 9,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#DCE7DF',
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: '#173326',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -3 },
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kham-pha"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'basket' : 'basket-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quet-qr"
        options={{
          title: 'Quét QR',
          tabBarIcon: () => (
            <View
              style={{
                marginTop: -24,
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ACTIVE,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                shadowColor: '#173326',
                shadowOpacity: 0.2,
                shadowRadius: 9,
                shadowOffset: { width: 0, height: 4 },
                elevation: 9,
              }}
            >
              <Ionicons name="qr-code-outline" size={28} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="don-hang"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tai-khoan"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
