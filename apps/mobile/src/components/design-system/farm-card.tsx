import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

import { Badge } from './badge';

type FarmCardProps = {
  name: string;
  address: string;
  imageUrl?: string | null;
  certification?: string | null;
  followerCount?: number;
  onPress?: () => void;
};

export function FarmCard({
  name,
  address,
  imageUrl,
  certification,
  followerCount,
  onPress,
}: FarmCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, ${address}`}
      disabled={!onPress}
      onPress={onPress}
      className="w-full active:opacity-80"
    >
      <Card className="flex-row gap-3 border border-border bg-card p-3">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            transition={150}
            style={{ width: 88, height: 88, borderRadius: 14 }}
          />
        ) : (
          <View className="h-[88px] w-[88px] items-center justify-center rounded-2xl bg-secondary">
            <Text className="text-base font-bold text-secondary-foreground">AG</Text>
          </View>
        )}

        <View className="min-w-0 flex-1 justify-center gap-1.5">
          <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {address}
          </Text>
          <View className="flex-row flex-wrap items-center gap-1.5">
            {certification ? (
              <Badge size="sm" variant="success">
                {certification}
              </Badge>
            ) : null}
            {typeof followerCount === 'number' ? (
              <Badge size="sm">{followerCount.toLocaleString('vi-VN')} theo dõi</Badge>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export type { FarmCardProps };
