import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

const ACTIVE = '#087A4B';
const INACTIVE = '#3B4840';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        sceneStyle: {
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarStyle: {
          height: 76,
          paddingBottom: 9,
          paddingTop: 5,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7ECE9',
          borderTopWidth: 1,
          elevation: 12,
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
                marginTop: -20,
                width: 62,
                height: 62,
                borderRadius: 31,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: ACTIVE,
                borderWidth: 4,
                borderColor: '#FFFFFF',
                shadowColor: '#000000',
                shadowOpacity: 0.16,
                shadowRadius: 9,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              <Ionicons name="qr-code-outline" size={29} color="#FFFFFF" />
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
