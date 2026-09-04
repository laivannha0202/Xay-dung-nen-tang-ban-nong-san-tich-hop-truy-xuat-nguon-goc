import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { Badge, type BadgeVariant } from './badge';

type ProductCardBadge = {
  label: string;
  variant?: BadgeVariant;
};

type ProductCardProps = {
  name: string;
  farmName: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
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
  badges = [],
  onPress,
}: ProductCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, ${formatVnd(price)} trên ${unit}`}
      disabled={!onPress}
      onPress={onPress}
      className="w-full active:opacity-80"
    >
      <Card className="overflow-hidden border border-border bg-card p-0">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            transition={150}
            style={{ width: '100%', height: 176 }}
          />
        ) : (
          <View className="h-44 items-center justify-center bg-secondary">
            <Text className="text-sm font-semibold text-secondary-foreground">AgriMarket</Text>
          </View>
        )}

        <View className="gap-2 p-4">
          {badges.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge
                  key={`${badge.label}-${badge.variant ?? 'neutral'}`}
                  size="sm"
                  variant={badge.variant}
                >
                  {badge.label}
                </Badge>
              ))}
            </View>
          ) : null}

          <Text className="text-lg font-semibold text-foreground" numberOfLines={2}>
            {name}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {farmName}
          </Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-lg font-bold text-primary">{formatVnd(price)}</Text>
            <Text className="text-sm text-muted-foreground">/{unit}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export type { ProductCardBadge, ProductCardProps };
