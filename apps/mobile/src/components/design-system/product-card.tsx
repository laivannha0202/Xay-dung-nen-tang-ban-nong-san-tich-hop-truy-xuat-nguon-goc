import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { Badge } from './badge';

type ProductCardBadge = {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'neutral';
};

type ProductCardProps = {
  name: string;
  farmName: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  delivery?: string;
  distance?: string;
  badges?: ProductCardBadge[];
  onPress?: () => void;
  onFavorite?: () => void;
  onAddToCart?: () => void;
  favorite?: boolean;
  disabled?: boolean;
};

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

export function ProductCard({
  name,
  farmName,
  price,
  unit,
  imageUrl,
  rating,
  reviewCount,
  sold,
  delivery,
  distance,
  badges = [],
  onPress,
  onFavorite,
  onAddToCart,
  favorite = false,
  disabled = false,
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden rounded-[18px] border border-border bg-card p-0">
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        className="active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={`Xem ${name}`}
      >
        <View className="relative">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={160}
              style={{ width: '100%', height: 156 }}
            />
          ) : (
            <View className="h-[156px] items-center justify-center bg-[#EAF5EE]">
              <Ionicons name="leaf-outline" size={34} color="#087A4B" />
              <Text className="mt-2 text-xs font-semibold text-primary">AgriMarket</Text>
            </View>
          )}

          {badges.length > 0 ? (
            <View className="absolute left-2 top-2 max-w-[75%] flex-row gap-1">
              {badges.slice(0, 2).map((item) => (
                <Badge key={item.label} variant={item.variant}>
                  {item.label}
                </Badge>
              ))}
            </View>
          ) : null}

          {onFavorite ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              onPress={(event) => {
                event.stopPropagation();
                onFavorite();
              }}
              className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-white/95 active:opacity-75"
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={21}
                color={favorite ? '#E6535F' : '#3B4840'}
              />
            </Pressable>
          ) : null}

          {distance ? (
            <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-lg bg-white/95 px-2 py-1">
              <Ionicons name="location" size={13} color="#49574F" />
              <Text className="text-[10px] font-semibold text-[#49574F]">{distance}</Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1.5 px-3 pb-2 pt-3">
          <Text className="text-[16px] font-extrabold text-foreground" numberOfLines={2}>
            {name}
          </Text>

          <Text className="text-[12px] text-muted-foreground" numberOfLines={1}>
            {farmName}
          </Text>

          {rating !== undefined || sold !== undefined ? (
            <View className="flex-row items-center gap-3">
              {rating !== undefined ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={14} color="#F2A51A" />
                  <Text className="text-xs font-semibold text-foreground">
                    {rating.toFixed(1)}
                    {reviewCount !== undefined ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
              ) : null}
              {sold !== undefined ? (
                <Text className="text-xs text-muted-foreground">Đã bán {sold}</Text>
              ) : null}
            </View>
          ) : null}

          {delivery ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="car-outline" size={13} color="#087A4B" />
              <Text className="text-xs text-primary">{delivery}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View className="flex-row items-end justify-between gap-2 px-3 pb-3">
        <View className="min-w-0 flex-1 flex-row items-end">
          <Text className="text-[20px] font-extrabold text-primary">{formatVnd(price)}</Text>
          <Text className="pb-[2px] pl-1 text-[11px] text-muted-foreground">/ {unit}</Text>
        </View>

        {onAddToCart ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${name} vào giỏ`}
            onPress={onAddToCart}
            disabled={disabled}
            className={[
              'h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-75',
              disabled ? 'opacity-40' : '',
            ].join(' ')}
          >
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

export type { ProductCardProps, ProductCardBadge };
