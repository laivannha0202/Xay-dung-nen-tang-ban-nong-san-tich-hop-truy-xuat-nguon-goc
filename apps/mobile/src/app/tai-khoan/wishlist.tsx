import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  layWishlistTaiKhoanMobile,
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  xoaWishlistTaiKhoanMobile,
  type SanPhamYeuThichTaiKhoan,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { moTabChinh, quayLaiHoacVe } from '@/lib/navigation-mobile';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const INITIAL_RENDER = 6;
const RENDER_BATCH = 6;
const WINDOW_SIZE = 7;
const PRIMARY = '#087A4B';

type SanPhamYeuThichCoAnh = SanPhamYeuThichTaiKhoan & {
  anhBiaUrl?: string | null;
};

function AnhWishlist({ item }: { item: SanPhamYeuThichCoAnh }) {
  const uri = useMemo(() => chuanHoaUrlAnhMobile(item.anhBiaUrl), [item.anhBiaUrl]);
  const [loiAnh, setLoiAnh] = useState(false);

  useEffect(() => setLoiAnh(false), [uri]);

  return (
    <View className="h-[108px] w-[108px] shrink-0 overflow-hidden rounded-[18px] bg-[#EEF6F1]">
      {uri && !loiAnh ? (
        <Image
          source={{ uri }}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          contentFit="cover"
          transition={120}
          onError={() => setLoiAnh(true)}
          style={{ width: 108, height: 108 }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="leaf-outline" size={34} color="#78AA8C" />
        </View>
      )}
    </View>
  );
}

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
      await queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY });
    },
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="gap-4 px-4 py-5">
          <Skeleton height={72} borderRadius={18} />
          <Skeleton height={140} borderRadius={20} />
          <Skeleton height={140} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem sản phẩm yêu thích"
            description="Sản phẩm yêu thích được đồng bộ theo tài khoản AgriMarket của bạn."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/wishlist')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được sản phẩm yêu thích"
            description={thongBaoLoiApi(query.error, 'Không tải được danh sách sản phẩm yêu thích.')}
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const items = query.data.duLieu as SanPhamYeuThichCoAnh[];

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.sanPhamId}
        initialNumToRender={INITIAL_RENDER}
        maxToRenderPerBatch={RENDER_BATCH}
        windowSize={WINDOW_SIZE}
        showsVerticalScrollIndicator={false}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={
          <View className="mb-2 gap-4">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quay lại tài khoản"
                onPress={() => quayLaiHoacVe(router, '/tai-khoan')}
                className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-75"
              >
                <Ionicons name="chevron-back" size={26} color={PRIMARY} />
              </Pressable>
              <View className="min-w-0 flex-1">
                <Text className="text-[26px] font-extrabold tracking-[-0.5px] text-[#17251C]">Yêu thích</Text>
                <Text className="mt-0.5 text-[12px] text-[#7A8780]">{query.data.tong} sản phẩm đã lưu</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-3 rounded-[18px] bg-[#F1FAF5] p-4">
              <Ionicons name="heart" size={21} color="#D94E5D" />
              <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#617168]">
                Lưu nông sản bạn quan tâm để quay lại nhanh và so sánh trước khi đặt hàng.
              </Text>
            </View>

            {mutation.isError ? (
              <View className="rounded-[16px] border border-[#F0C8C8] bg-[#FFF8F8] p-4">
                <Text className="text-[12px] leading-5 text-[#C93445]">
                  {thongBaoLoiApi(mutation.error, 'Không bỏ được sản phẩm khỏi danh sách yêu thích.')}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Danh sách yêu thích đang trống"
            description="Chạm biểu tượng trái tim ở sản phẩm để lưu nông sản bạn quan tâm."
            actionLabel="Khám phá nông sản"
            onAction={() => moTabChinh(router, '/kham-pha')}
          />
        }
        renderItem={({ item }) => (
          <View className="rounded-[20px] border border-[#DCE7DF] bg-white p-3">
            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xem ${item.ten}`}
                onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}
                className="active:opacity-80"
              >
                <AnhWishlist item={item} />
              </Pressable>

              <View className="min-w-0 flex-1 py-1">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}
                  className="active:opacity-75"
                >
                  <Text numberOfLines={2} className="text-[16px] font-extrabold leading-5 text-[#17251C]">{item.ten}</Text>
                </Pressable>
                <View className="mt-2 flex-row items-center gap-1.5">
                  <Ionicons name="business-outline" size={14} color={PRIMARY} />
                  <Text numberOfLines={1} className="flex-1 text-[12px] font-semibold text-[#587064]">{item.tenTrangTrai}</Text>
                </View>
                {item.moTa ? (
                  <Text numberOfLines={2} className="mt-2 text-[11px] leading-4 text-[#7A8780]">{item.moTa}</Text>
                ) : null}
              </View>
            </View>

            <View className="mt-3 flex-row gap-2 border-t border-[#EEF2EF] pt-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}
                className="min-h-11 flex-1 items-center justify-center rounded-[14px] bg-[#EAF7EF] px-3 active:opacity-75"
              >
                <Text className="text-[12px] font-extrabold text-[#087A4B]">Xem sản phẩm</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Bỏ yêu thích ${item.ten}`}
                disabled={mutation.isPending}
                onPress={() => mutation.mutate(item.sanPhamId)}
                className={[
                  'h-11 w-11 items-center justify-center rounded-[14px] border border-[#F0C8C8] bg-[#FFF8F8]',
                  mutation.isPending ? 'opacity-40' : 'active:opacity-75',
                ].join(' ')}
              >
                <Ionicons name="heart-dislike-outline" size={20} color="#D94E5D" />
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
