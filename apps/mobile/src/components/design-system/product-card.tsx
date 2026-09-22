import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageProps } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { hienThiKhoangGia } from '@agrimarket/api-client';

import { anhDuPhongSanPhamMobile } from '@/lib/anh-du-phong';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

type ProductCardBadge = { label: string; variant?: 'success' | 'warning' | 'info' | 'neutral' };

type ProductCardProps = {
  name: string;
  farmName: string;
  price: number;
  unit: string;
  imageUrl?: string | null;
  imageSource?: ImageProps['source'];
  rating?: number;
  reviewCount?: number;
  sold?: number;
  delivery?: string;
  distance?: string;
  xuatXu?: string;
  badges?: ProductCardBadge[];
  onPress?: () => void;
  onFavorite?: () => void;
  onAddToCart?: () => void;
  onQuetQR?: () => void;
  favorite?: boolean;
  disabled?: boolean;
  compact?: boolean;
  originalPrice?: number | null;
  discountPercent?: number | null;
  stockText?: string | null;
  priceTo?: number | null;
  hetHang?: boolean;
};

function formatVnd(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

// không lồng Pressable trong Pressable: các vùng điều hướng, yêu thích, CTA
// phải là các Pressable sibling để RN Web không sinh <button> lồng <button>.
export function ProductCard({
  name, farmName, price, unit, imageUrl, imageSource, rating, reviewCount, sold, delivery,
  distance, xuatXu, badges = [], onPress, onFavorite, onAddToCart, onQuetQR,
  favorite = false, disabled = false, compact = false, originalPrice, discountPercent, stockText,
  priceTo, hetHang,
}: ProductCardProps) {
  const imageUri = useMemo(() => chuanHoaUrlAnhMobile(imageUrl), [imageUrl]);
  const fallbackSource = useMemo(() => anhDuPhongSanPhamMobile(name ?? ''), [name]);
  const [imageFailed, setImageFailed] = useState(false);
  const hasDiscount =
    typeof discountPercent === 'number' && discountPercent > 0 &&
    typeof originalPrice === 'number' && originalPrice > price;
  const coKhoangGia =
    typeof priceTo === 'number' && Number.isFinite(priceTo) && priceTo > price;
  const chuoiGia = coKhoangGia
    ? hienThiKhoangGia(price, priceTo)
    : formatVnd(price);

  useEffect(() => setImageFailed(false), [imageUri]);

  const imageHeight = compact ? 108 : undefined;
  const cardRadius = compact ? 8 : 12;
  const ctaLabel = onAddToCart && !hetHang ? 'Thêm vào giỏ' : hetHang ? 'Hết hàng' : 'Xem sản phẩm';

  return (
    <View style={{ borderRadius: cardRadius }} className="relative w-full overflow-hidden border border-[#E5EAE6] bg-white">
      {/* Image area */}
      <View className={`relative overflow-hidden ${compact ? 'bg-white' : 'bg-[#EEF6F1]'}`} style={{ height: imageHeight, aspectRatio: compact ? undefined : '16/11' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onPress}
          disabled={disabled || !onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={`Xem ${name}`}
          className="active:opacity-80"
        />
        <Image
          source={imageSource || (imageUri && !imageFailed ? { uri: imageUri } : fallbackSource)}
          alt={name}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={120}
          onError={() => setImageFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
        {badges.length > 0 || hasDiscount ? (
          <View className="absolute left-2 top-2 max-w-[80%] flex-row flex-wrap items-center gap-1">
            {badges.slice(0, 2).map((badge, index) =>
              badge?.label ? (
                <View key={`${badge.label}-${index}`} className="max-w-[120px] rounded-[6px] bg-[#087A4B] px-2 py-0.5">
                  <Text numberOfLines={1} className="text-[11px] font-bold text-white">{badge.label}</Text>
                </View>
              ) : null,
            )}
            {badges.length > 2 ? (
              <View className="rounded-[6px] bg-[#06663F] px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-white">+{badges.length - 2}</Text>
              </View>
            ) : null}
            {hasDiscount ? (
              <View className="rounded-[4px] bg-[#E53935] px-1.5 py-0.5">
                <Text className="text-[10px] font-extrabold text-white">-{Math.round(discountPercent as number)}%</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {hetHang === true ? (
          <View className="absolute bottom-2 left-2 rounded-[4px] bg-[rgba(239,68,68,0.92)] px-2 py-0.5">
            <Text className="text-[11px] font-bold text-white">Tạm hết hàng</Text>
          </View>
        ) : null}
      </View>

      {/* Wishlist — sibling Pressable */}
      {onFavorite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          onPress={onFavorite}
          hitSlop={4}
          className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-white/95"
        >
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? '#D94E5D' : '#425249'} />
        </Pressable>
      ) : null}

      {/* Content */}
      <View className={`${compact ? 'px-2.5 pb-2 pt-2' : 'px-3 pb-3 pt-3'}`}>
        <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`Xem ${name}`}>
          <Text numberOfLines={2} className={`${compact ? 'min-h-[34px] text-[12px] leading-[17px]' : 'min-h-[40px] text-[15px] leading-5'} font-extrabold text-[#17251C]`}>
            {name}
          </Text>
        </Pressable>

        {typeof rating === 'number' && Number.isFinite(rating) && (reviewCount ?? 0) > 0 ? (
          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text className="text-[12px] font-bold text-[#1E293B]">{rating.toFixed(1)}</Text>
            <Text className="text-[12px] text-[#64748B]">({reviewCount})</Text>
            {sold !== undefined ? <Text className="text-[10px] text-[#7E8982]"> · Đã bán {sold}</Text> : null}
          </View>
        ) : (
          <Text className="mt-1.5 text-[11.5px] font-medium text-[#94A3B8]">Chưa có đánh giá</Text>
        )}

        <View className={`mt-1.5 flex-row items-baseline gap-1.5`}>
          <Text numberOfLines={1} className={`${compact ? 'text-[13.5px]' : 'text-[16px]'} font-extrabold text-[#0B7A48]`}>
            {chuoiGia}
          </Text>
          {hasDiscount ? (
            <View className="flex-row flex-wrap items-center gap-1">
              <Text className="text-[10px] text-[#87918B] line-through">{formatVnd(originalPrice)}</Text>
              <Text className="text-[10px] font-extrabold text-[#E53935]">-{Math.round(discountPercent)}%</Text>
            </View>
          ) : null}
        </View>

        {xuatXu || farmName ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color="#186a3e" />
            <Text numberOfLines={1} className="flex-1 text-[10.5px] text-[#64748B]">{xuatXu || farmName}</Text>
          </View>
        ) : null}

        {!compact && unit ? (
          <Text numberOfLines={1} className="mt-0.5 text-[10px] text-[#7E8982]">Quy cách: {unit}</Text>
        ) : null}

        {stockText ? (
          <Text numberOfLines={1} className="mt-0.5 text-[10px] font-extrabold text-[#B66A12]">{stockText}</Text>
        ) : null}

        {hetHang === true ? (
          <Text numberOfLines={1} className="mt-0.5 text-[11.5px] font-extrabold text-[#D92D20]">Tạm hết hàng</Text>
        ) : null}

        {!compact ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ctaLabel === 'Thêm vào giỏ' ? `Thêm ${name} vào giỏ` : `Xem ${name}`}
            onPress={onAddToCart || onPress}
            disabled={disabled}
            className="mt-2 min-h-[32px] items-center justify-center rounded-[8px] bg-[#087A4B] active:opacity-75"
          >
            <Text className="text-[13px] font-extrabold text-white">{ctaLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type { ProductCardProps, ProductCardBadge };
