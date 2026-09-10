import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

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
  const imageUri = useMemo(() => chuanHoaUrlAnhMobile(imageUrl), [imageUrl]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  return (
    <View className="w-full overflow-hidden rounded-[18px] border border-[#DDE7E1] bg-white">
      <Pressable
        disabled={!onPress}
        onPress={onPress}
        className="active:opacity-90"
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`Xem ${name}`}
      >
        <View style={{ height: 132 }} className="relative overflow-hidden bg-[#EEF6F1]">
          {imageUri && !imageFailed ? (
            <Image
              source={{ uri: imageUri }}
              cachePolicy="memory-disk"
              recyclingKey={imageUri}
              contentFit="cover"
              transition={120}
              onError={() => setImageFailed(true)}
              style={{ width: '100%', height: 132 }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center bg-[#EEF6F1]">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                <Ionicons name="leaf-outline" size={27} color="#78AA8C" />
              </View>
            </View>
          )}

          {badges[0]?.label ? (
            <View className="absolute left-2 top-2 max-w-[72%]">
              <Badge variant={badges[0].variant}>{badges[0].label}</Badge>
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
              hitSlop={4}
              className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-white/95"
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={favorite ? '#D94E5D' : '#425249'}
              />
            </Pressable>
          ) : null}

          {distance ? (
            <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-white/95 px-2 py-1">
              <Ionicons name="location-outline" size={12} color="#46554D" />
              <Text className="text-[10px] font-semibold text-[#46554D]">{distance}</Text>
            </View>
          ) : null}
        </View>

        <View className="px-3 pb-2 pt-3">
          <Text numberOfLines={2} className="min-h-[40px] text-[15px] font-extrabold leading-5 text-[#17251C]">
            {name}
          </Text>
          <Text numberOfLines={1} className="mt-1 text-[11px] text-[#758179]">
            {farmName}
          </Text>

          {rating !== undefined || sold !== undefined ? (
            <View className="mt-2 flex-row items-center gap-2">
              {rating !== undefined ? (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={13} color="#E7A126" />
                  <Text className="text-[11px] font-semibold text-[#38473F]">
                    {rating.toFixed(1)}{reviewCount !== undefined ? ` (${reviewCount})` : ''}
                  </Text>
                </View>
              ) : null}
              {sold !== undefined ? (
                <Text className="text-[10px] text-[#7E8982]">Đã bán {sold}</Text>
              ) : null}
            </View>
          ) : null}

          {delivery ? (
            <View className="mt-2 flex-row items-center gap-1">
              <Ionicons name="car-outline" size={13} color="#087A4B" />
              <Text numberOfLines={1} className="flex-1 text-[10px] text-[#087A4B]">
                {delivery}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View className="flex-row items-end gap-2 px-3 pb-3 pt-1">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[18px] font-extrabold text-[#087A4B]">
            {formatVnd(price)}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[10px] text-[#818B85]">
            / {unit}
          </Text>
        </View>

        {onAddToCart ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${name} vào giỏ`}
            onPress={onAddToCart}
            disabled={disabled}
            hitSlop={5}
            className={[
              'h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#087A4B] active:opacity-75',
              disabled ? 'opacity-40' : '',
            ].join(' ')}
          >
            <Ionicons name="add" size={25} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type { ProductCardProps, ProductCardBadge };
