import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

const ACTIVE = '#087A4B';
const INACTIVE = '#607067';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        sceneStyle: { backgroundColor: '#F7FAF8' },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          height: 72,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2EAE5',
          borderTopWidth: 1,
          elevation: 10,
          shadowColor: '#173326',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
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
          title: 'Khám phá',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
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
                marginTop: -22,
                width: 58,
                height: 58,
                borderRadius: 29,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ACTIVE,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                shadowColor: '#173326',
                shadowOpacity: 0.18,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
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
