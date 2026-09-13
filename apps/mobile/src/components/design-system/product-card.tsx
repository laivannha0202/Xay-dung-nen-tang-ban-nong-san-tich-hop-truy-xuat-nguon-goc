import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { anhDuPhongSanPhamMobile } from '@/lib/anh-du-phong';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

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
  imageSource?: any;
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
  /**
   * compact = true: thẻ gọn giống web trang chủ (ảnh + tên + giá + nút giỏ).
   * Ẩn dòng trang trại / đánh giá / xuất xứ-QR.
   */
  compact?: boolean;
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
  imageSource,
  rating,
  reviewCount,
  sold,
  delivery,
  distance,
  xuatXu,
  badges = [],
  onPress,
  onFavorite,
  onAddToCart,
  onQuetQR,
  favorite = false,
  disabled = false,
  compact = false,
}: ProductCardProps) {
  const imageUri = useMemo(() => chuanHoaUrlAnhMobile(imageUrl), [imageUrl]);
  // Khớp web `anhDuPhongSanPham(ten)`: khi API chưa có ảnh (null) thì dùng ảnh
  // dự phòng theo tên thay vì ô lá xám — hết lỗi leaf placeholder như ảnh báo.
  const fallbackSource = useMemo(() => anhDuPhongSanPhamMobile(name ?? ''), [name]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUri]);

  // LƯU Ý: không lồng Pressable trong Pressable. Trên native không sao nhưng
  // trên web render thành <button> trong <button> gây lỗi hydration
  // "cannot contain a nested button". Mọi nút là sibling của nhau.
  return (
    <View className="w-full overflow-hidden rounded-[18px] border border-[#DDE7E1] bg-white">
      <View style={{ height: 132 }} className="relative overflow-hidden bg-[#EEF6F1]">
        <Pressable
          disabled={!onPress}
          onPress={onPress}
          className="h-full w-full active:opacity-90"
          accessibilityRole={onPress ? 'button' : undefined}
          accessibilityLabel={`Xem ${name}`}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              contentFit="cover"
              transition={120}
              style={{ width: '100%', height: 132 }}
            />
          ) : imageUri && !imageFailed ? (
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
            <Image
              source={fallbackSource}
              contentFit="cover"
              transition={120}
              style={{ width: '100%', height: 132 }}
            />
          )}
        </Pressable>

        {/* Badge chứng nhận — khớp web: nền xanh đậm #186a3e, chữ trắng */}
        {badges[0]?.label ? (
          <View className="absolute left-2 top-2 max-w-[72%] rounded-[14px] bg-[#186a3e] px-2.5 py-1 shadow-sm">
            <Text numberOfLines={1} className="text-[11px] font-bold text-white">
              {badges[0].label}
            </Text>
          </View>
        ) : null}

        {onFavorite ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onPress={onFavorite}
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

      <Pressable
        disabled={!onPress}
        onPress={onPress}
        className="px-3 pb-2 pt-3 active:opacity-90"
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`Xem ${name}`}
      >
        <Text numberOfLines={2} className="min-h-[40px] text-[15px] font-extrabold leading-5 text-[#17251C]">
          {name}
        </Text>
        {compact ? null : (
          <Text numberOfLines={1} className="mt-1 text-[11px] text-[#758179]">
            {farmName}
          </Text>
        )}

        {/* Đánh giá — chỉ hiện khi có lượt thật, không bịa 4.8 (0)/(100). */}
        {compact ? null : rating !== undefined && (reviewCount ?? 0) > 0 ? (
          <View className="mt-1.5 flex-row items-center gap-1">
            <View className="flex-row items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name="star" size={11} color="#F59E0B" />
              ))}
            </View>
            <Text className="ml-1 text-[11px] font-semibold text-[#64748B]">
              {rating.toFixed(1)} ({reviewCount})
            </Text>
            {sold !== undefined ? (
              <Text className="text-[10px] text-[#7E8982]"> · Đã bán {sold}</Text>
            ) : null}
          </View>
        ) : compact ? null : sold !== undefined ? (
          <Text className="mt-1.5 text-[10px] text-[#7E8982]">Đã bán {sold}</Text>
        ) : null}

        {delivery ? (
          <View className="mt-2 flex-row items-center gap-1">
            <Ionicons name="car-outline" size={13} color="#087A4B" />
            <Text numberOfLines={1} className="flex-1 text-[10px] text-[#087A4B]">
              {delivery}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {/* Xuất xứ + Quét QR — chỉ màn chi tiết/danh sách, thẻ compact (trang chủ) ẩn */}
      {!compact && (xuatXu || onQuetQR) ? (
        <View className="mt-1 flex-row items-center justify-between gap-1.5 px-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color="#186a3e" />
            <Text numberOfLines={1} className="flex-1 text-[10.5px] text-[#64748B]">
              {xuatXu ? `Xuất xứ: ${xuatXu}` : farmName}
            </Text>
          </View>
          {onQuetQR ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quét QR truy xuất"
              onPress={onQuetQR}
              className="shrink-0 flex-row items-center gap-1 rounded-md border border-[#CBE7D4] bg-[#EAF5EE] px-1.5 py-1 active:opacity-75"
            >
              <Ionicons name="qr-code-outline" size={12} color="#186a3e" />
              <Text className="text-[9.5px] font-bold text-[#186a3e]">QR</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Giá + nút thêm — compact giống web: chỉ giá, không /đơn vị. */}
      <View className="flex-row items-end gap-2 px-3 pb-3 pt-1">
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[16px] font-extrabold text-[#0B7A48]">
            {compact ? formatVnd(price) : `${formatVnd(price)}/${unit}`}
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
              'h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#0B7A48] active:opacity-75',
              disabled ? 'opacity-40' : '',
            ].join(' ')}
          >
            <Ionicons name="cart-outline" size={17} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export type { ProductCardProps, ProductCardBadge };
