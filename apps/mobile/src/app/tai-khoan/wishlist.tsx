import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  layWishlistTaiKhoanMobile,
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  xoaWishlistTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

export default function TrangWishlistTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
    queryFn: layWishlistTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const mutation = useMutation({
    mutationFn: xoaWishlistTaiKhoanMobile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
      });
    },
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={110} borderRadius={18} />
          <Skeleton height={160} borderRadius={18} />
          <Skeleton height={160} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem wishlist"
            description="Sản phẩm yêu thích được đồng bộ theo tài khoản."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được wishlist"
            description="Backend chưa trả được sản phẩm yêu thích."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Sản phẩm yêu thích</Text>
          <Text className="text-sm text-muted-foreground">
            {query.data.tong} sản phẩm trong wishlist Backend.
          </Text>
        </View>

        {query.data.duLieu.length === 0 ? (
          <EmptyState
            title="Wishlist đang trống"
            description="Thêm sản phẩm yêu thích từ trang chi tiết sản phẩm."
            actionLabel="Khám phá nông sản"
            onAction={() => router.push('/kham-pha')}
          />
        ) : (
          <View className="gap-3">
            {query.data.duLieu.map((item) => (
              <View
                key={item.sanPhamId}
                className="gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Text className="text-lg font-bold text-foreground">{item.ten}</Text>
                <Text className="text-sm text-muted-foreground">{item.tenTrangTrai}</Text>
                {item.moTa ? (
                  <Text numberOfLines={3} className="text-sm leading-5 text-muted-foreground">
                    {item.moTa}
                  </Text>
                ) : null}
                <View className="flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/san-pham/[id]',
                        params: { id: item.sanPhamId },
                      })
                    }
                    className="flex-1 items-center rounded-xl bg-primary px-3 py-2.5 active:opacity-80"
                  >
                    <Text className="font-semibold text-primary-foreground">Xem sản phẩm</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={mutation.isPending}
                    onPress={() => mutation.mutate(item.sanPhamId)}
                    className="items-center rounded-xl border border-danger px-3 py-2.5 active:opacity-80"
                  >
                    <Text className="font-semibold text-danger">Bỏ yêu thích</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
