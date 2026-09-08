import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

type HomeHeaderProps = {
  location?: string;
  notificationCount?: number;
  cartCount?: number;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onCartPress?: () => void;
};

function HeaderIcon({
  icon,
  count,
  dot,
  label,
  onPress,
}: {
  icon: 'notifications-outline' | 'cart-outline';
  count?: number;
  dot?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="relative h-11 w-11 items-center justify-center rounded-full active:bg-[#F1F6F3]"
    >
      <Ionicons name={icon} size={27} color="#153D2B" />

      {typeof count === 'number' && count > 0 ? (
        <View className="absolute right-0 top-0 min-w-5 items-center justify-center rounded-full bg-[#15945B] px-1 py-[2px]">
          <Text className="text-[10px] font-extrabold text-white">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : dot ? (
        <View className="absolute right-[5px] top-[4px] h-3 w-3 rounded-full border-2 border-white bg-[#FF5B4D]" />
      ) : null}
    </Pressable>
  );
}

export function HomeHeader({
  location = 'Hà Nội',
  notificationCount,
  cartCount,
  onLocationPress,
  onNotificationPress,
  onCartPress,
}: HomeHeaderProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 pr-2">
          <Image
            source={require('../../../assets/images/home/agrimarket-logo.png')}
            contentFit="contain"
            contentPosition="left center"
            style={{ width: 220, maxWidth: '100%', height: 53 }}
          />
        </View>

        <View className="flex-row items-center gap-1">
          <HeaderIcon
            icon="notifications-outline"
            label="Thông báo"
            dot={typeof notificationCount !== 'number'}
            count={notificationCount}
            onPress={onNotificationPress}
          />
          <HeaderIcon
            icon="cart-outline"
            label="Giỏ hàng"
            count={cartCount}
            onPress={onCartPress}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Giao đến ${location}`}
        onPress={onLocationPress}
        disabled={!onLocationPress}
        className="self-start flex-row items-center gap-2 active:opacity-70"
      >
        <Ionicons name="location" size={25} color="#087744" />

        <View>
          <Text className="text-[12px] font-medium text-[#68756D]">Giao đến</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-[16px] font-extrabold text-[#234234]">
              {location}
            </Text>
            {onLocationPress ? (
              <Ionicons name="chevron-down" size={15} color="#234234" />
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}
