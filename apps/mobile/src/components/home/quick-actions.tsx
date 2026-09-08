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
      icon: 'receipt-outline',
      onPress: () => router.push('/don-hang'),
    },
    {
      label: 'Thông báo',
      icon: 'notifications-outline',
      onPress: () => router.push('/tai-khoan/thong-bao'),
    },
  ];

  return (
    <View className="rounded-2xl border border-border bg-card px-2 py-4">
      <View className="flex-row">
        {actions.map((action) => (
          <Pressable
            key={action.label}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            className="flex-1 items-center gap-2 active:opacity-70"
          >
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted">
              <Ionicons
                name={action.icon}
                size={23}
                className="text-primary"
              />
            </View>

            <Text
              numberOfLines={1}
              className="text-xs font-medium text-foreground"
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
