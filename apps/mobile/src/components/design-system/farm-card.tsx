import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

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
  const imageUri = useMemo(() => chuanHoaUrlAnhMobile(imageUrl), [imageUrl]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${name}, ${address}`}
      disabled={!onPress}
      onPress={onPress}
      className="w-full active:opacity-80"
    >
      <View className="flex-row gap-3 rounded-[18px] border border-[#DDE7E1] bg-white p-3">
        {imageUri && !imageFailed ? (
          <Image
            source={{ uri: imageUri }}
            cachePolicy="memory-disk"
            recyclingKey={imageUri}
            contentFit="cover"
            transition={120}
            onError={() => setImageFailed(true)}
            style={{ width: 88, height: 88, borderRadius: 14 }}
          />
        ) : (
          <View className="h-[88px] w-[88px] items-center justify-center rounded-[14px] bg-[#EEF6F1]">
            <Ionicons name="leaf-outline" size={29} color="#78AA8C" />
          </View>
        )}

        <View className="min-w-0 flex-1 justify-center">
          <Text className="text-[16px] font-extrabold text-[#17251C]" numberOfLines={1}>
            {name}
          </Text>
          <View className="mt-1 flex-row items-start gap-1">
            <Ionicons name="location-outline" size={14} color="#748078" />
            <Text className="flex-1 text-[12px] leading-4 text-[#748078]" numberOfLines={2}>
              {address}
            </Text>
          </View>
          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            {certification ? <Badge variant="success">{certification}</Badge> : null}
            {typeof followerCount === 'number' ? (
              <Badge>{followerCount.toLocaleString('vi-VN')} theo dõi</Badge>
            ) : null}
          </View>
        </View>

        <View className="justify-center">
          <Ionicons name="chevron-forward" size={18} color="#97A29B" />
        </View>
      </View>
    </Pressable>
  );
}

export type { FarmCardProps };
