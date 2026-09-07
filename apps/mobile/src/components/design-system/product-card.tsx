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
  sold?: number;
  delivery?: string;
  badges?: ProductCardBadge[];
  onPress?: () => void;
};

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

export function ProductCard({
  name,
  farmName,
  price,
  unit,
  imageUrl,
  rating = 4.8,
  sold = 0,
  delivery = 'Giao nhanh',
  badges = [],
  onPress,
}: ProductCardProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      className="active:opacity-80"
    >
      <Card className="overflow-hidden rounded-3xl bg-card border border-border p-0">
        {/* IMAGE */}
        <View className="relative">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={200}
              style={{ width: '100%', height: 190 }}
            />
          ) : (
            <View className="h-48 items-center justify-center bg-secondary">
              <Text>AgriMarket</Text>
            </View>
          )}

          {/* BADGE */}
          <View className="absolute left-3 top-3 flex-row gap-2">
            {badges.slice(0, 2).map((item) => (
              <Badge key={item.label} variant={item.variant}>
                {item.label}
              </Badge>
            ))}
          </View>
        </View>

        {/* CONTENT */}
        <View className="gap-2 p-4">
          <Text
            className="text-lg font-bold text-foreground"
            numberOfLines={2}
          >
            {name}
          </Text>

          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            🌱 {farmName}
          </Text>

          <View className="flex-row items-center gap-2">
            <Text className="font-semibold text-yellow-500">⭐ {rating}</Text>
            <Text className="text-sm text-muted-foreground">Đã bán {sold}</Text>
          </View>

          <View className="flex-row items-end gap-1">
            <Text className="text-xl font-bold text-primary">
              {formatVnd(price)}
            </Text>
            <Text className="text-sm text-muted-foreground">/{unit}</Text>
          </View>

          <View className="rounded-xl bg-secondary px-3 py-2">
            <Text className="text-sm text-secondary-foreground">
              🚚 {delivery}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export type { ProductCardProps, ProductCardBadge };
