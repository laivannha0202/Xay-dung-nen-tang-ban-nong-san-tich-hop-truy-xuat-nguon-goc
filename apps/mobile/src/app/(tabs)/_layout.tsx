import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

const ACTIVE = '#0B8F4D';
const INACTIVE = '#36433B';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarStyle: {
          height: 72,
          paddingBottom: 8,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8ECE9',
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="kham-pha"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={size}
              color={color}
            />
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
                marginTop: -19,
                width: 58,
                height: 58,
                borderRadius: 29,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ACTIVE,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                shadowColor: '#000000',
                shadowOpacity: 0.14,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 7,
              }}
            >
              <Ionicons name="qr-code-outline" size={27} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="don-hang"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="tai-khoan"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
