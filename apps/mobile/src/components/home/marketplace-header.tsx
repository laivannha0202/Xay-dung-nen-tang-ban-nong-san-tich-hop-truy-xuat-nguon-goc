import { Pressable, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '@/components/ui/text';

type MarketplaceHeaderProps = {
  location?: string;
  notificationCount?: number;
  cartCount?: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
};

export function MarketplaceHeader({
  location = 'Hà Nội',
  notificationCount,
  cartCount,
  onLocationPress,
  onNotificationPress,
  onCartPress,
}: MarketplaceHeaderProps) {
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Giao đến ${location}`}
          onPress={onLocationPress}
          className="flex-row items-center gap-1"
        >
          <MaterialIcons name="location-on" size={16} color="#1C6F45" />
          <Text className="text-sm text-muted-foreground">{location}</Text>
        </Pressable>

        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thông báo"
            onPress={onNotificationPress}
            className="relative"
          >
            <MaterialIcons name="notifications-none" size={24} color="#17251C" />
            {typeof notificationCount === 'number' && notificationCount > 0 ? (
              <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-danger">
                <Text className="text-xs font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Giỏ hàng"
            onPress={onCartPress}
            className="relative"
          >
            <MaterialIcons name="shopping-cart" size={24} color="#17251C" />
            {typeof cartCount === 'number' && cartCount > 0 ? (
              <View className="absolute -top-1 -right-1 h-4 w-4 items-center justify-center rounded-full bg-danger">
                <Text className="text-xs font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <Text className="text-2xl font-bold text-foreground">
        Xin chào 👋
      </Text>

      <Text className="text-sm text-muted-foreground">
        Nông sản sạch từ trang trại minh bạch
      </Text>
    </View>
  );
}
