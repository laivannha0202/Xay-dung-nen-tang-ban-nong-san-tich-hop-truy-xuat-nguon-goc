import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

type QuickAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function QuickActions() {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      label: 'Quét QR',
      icon: 'qr-code-outline',
      onPress: () => router.push('/quet-qr'),
    },
    {
      label: 'Khám phá',
      icon: 'compass-outline',
      onPress: () => router.push('/kham-pha'),
    },
    {
      label: 'Đơn hàng',
      icon: 'clipboard-outline',
      onPress: () => router.push('/don-hang'),
    },
    {
      label: 'Thông báo',
      icon: 'notifications-outline',
      onPress: () => router.push('/tai-khoan/thong-bao'),
    },
  ];

  return (
    <View className="flex-row py-1">
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          className="flex-1 items-center gap-2 active:opacity-65"
        >
          <View className="h-[58px] w-[58px] items-center justify-center rounded-2xl bg-[#F2FAF5]">
            <Ionicons name={action.icon} size={29} color="#0B8F4D" />
          </View>
          <Text className="text-[13px] font-medium text-[#202B24]">
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
