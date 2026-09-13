import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import logoImage from '../../../assets/images/home/agrimarket-logo.png';
import { GIO_HANG_MOBILE_QUERY_KEY, layGioHangMobile } from '@/lib/api-gio-hang';
import { THONG_BAO_IN_APP_QUERY_KEY, layThongBaoInAppMobile } from '@/lib/api-thong-bao';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function IconButton({
  icon,
  label,
  count,
  onPress,
}: {
  icon: 'notifications-outline' | 'cart-outline';
  label: string;
  count?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="relative h-10 w-10 items-center justify-center rounded-xl border border-[#E1E9E4] bg-[#F8FBF9] active:opacity-70"
    >
      <Ionicons name={icon} size={21} color={THUONG_HIEU_AGRIMARKET.text} />
      {typeof count === 'number' && count > 0 ? (
        <View className="absolute -right-1 -top-1 min-w-5 items-center justify-center rounded-full bg-[#087A4B] px-1 py-[2px]">
          <Text className="text-[9px] font-extrabold text-white">{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function MobileBrandBar() {
  const router = useRouter();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const cartQuery = useQuery({
    queryKey: GIO_HANG_MOBILE_QUERY_KEY,
    queryFn: layGioHangMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const notificationQuery = useQuery({
    queryKey: THONG_BAO_IN_APP_QUERY_KEY,
    queryFn: layThongBaoInAppMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const cartCount = daDangNhap
    ? (cartQuery.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0)
    : undefined;
  const notificationCount = daDangNhap ? notificationQuery.data?.tong ?? 0 : undefined;

  return (
    <View className="flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Về trang chủ AgriMarket"
        onPress={() => router.replace('/')}
        className="min-w-0 flex-1 active:opacity-75"
      >
        <Image
          source={logoImage}
          contentFit="contain"
          contentPosition="left center"
          style={{ width: 178, maxWidth: '100%', height: 43 }}
        />
      </Pressable>

      <View className="flex-row items-center gap-2">
        <IconButton
          icon="notifications-outline"
          label="Thông báo"
          count={notificationCount}
          onPress={() => router.push('/tai-khoan/thong-bao')}
        />
        <IconButton
          icon="cart-outline"
          label="Giỏ hàng"
          count={cartCount}
          onPress={() => router.push('/gio-hang')}
        />
      </View>
    </View>
  );
}
