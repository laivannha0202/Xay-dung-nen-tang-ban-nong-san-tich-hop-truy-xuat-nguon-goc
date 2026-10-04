import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundaryProps, Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const ACTIVE = '#087A4B';
const INACTIVE = '#6E7D74';

/**
 * Lưới an toàn cấp tab.
 *
 * Trước đây một lỗi render bất kỳ trong màn tab làm cả màn hình trắng trơn,
 * người dùng chỉ thấy thanh tab còn lại mà không có manh mối. Nay lỗi được
 * hiển thị kèm nút thử lại, đồng thời vẫn giữ thanh tab để thoát được.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-[#F7FAF8] px-5">
      <View className="w-full max-w-md gap-3 rounded-[22px] border border-[#F0C8C8] bg-white p-5">
        <Text className="text-[20px] font-extrabold text-[#17251C]">Màn hình gặp lỗi</Text>
        <Text selectable className="text-[13px] leading-5 text-[#6E7772]">
          {error instanceof Error ? error.message : 'Ứng dụng không tải được nội dung màn này.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Thử lại"
          onPress={() => void retry()}
          className="mt-1 min-h-12 items-center justify-center rounded-xl bg-[#087A4B] px-4 active:opacity-80"
        >
          <Text className="font-semibold text-white">Thử lại</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Về trang chủ"
          onPress={() => router.replace('/')}
          className="min-h-12 items-center justify-center rounded-xl border border-[#DCE7DF] bg-white px-4 active:opacity-80"
        >
          <Text className="font-semibold text-[#263129]">Về trang chủ</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
