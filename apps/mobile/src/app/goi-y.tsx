import { dinhDangQuyCachSanPham, layChiTietSanPhamCongKhai } from '@agrimarket/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { coNenThuLaiQueryApi, thongBaoLoiApi } from '@/lib/api-error';
import { GIO_HANG_MOBILE_QUERY_KEY, themMucGioHangMobile } from '@/lib/api-gio-hang';
import { GOI_Y_MOBILE_QUERY_KEY, layGoiYSanPhamMobile } from '@/lib/api-goi-y';
import {
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  layWishlistTaiKhoanMobile,
  themWishlistTaiKhoanMobile,
  xoaWishlistTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

export default function TrangGoiY() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: [...GOI_Y_MOBILE_QUERY_KEY, 12],
    queryFn: () => layGoiYSanPhamMobile(12),
    enabled: daDangNhap,
    staleTime: 60_000,
    retry: coNenThuLaiQueryApi,
  });
  const { refetch: thuLai } = query;

  const wishlistQuery = useQuery({
    queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
    queryFn: layWishlistTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const favoriteIds = useMemo(
    () => new Set(wishlistQuery.data?.duLieu.map((item) => item.sanPhamId) ?? []),
    [wishlistQuery.data?.duLieu],
  );

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId }: { bienTheSanPhamId: string }) =>
      themMucGioHangMobile(bienTheSanPhamId, 1),
    onSuccess: (gioHang) => queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang),
  });

  const wishlistMutation = useMutation({
    mutationFn: ({ sanPhamId, favorite }: { sanPhamId: string; favorite: boolean }) =>
      favorite ? xoaWishlistTaiKhoanMobile(sanPhamId) : themWishlistTaiKhoanMobile(sanPhamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY });
    },
  });

  function toggleFavorite(sanPhamId: string) {
    if (trangThaiXacThuc !== 'da-dang-nhap') {
      moDangNhap(router, '/goi-y');
      return;
    }
    if (!wishlistMutation.isPending) {
      wishlistMutation.mutate({ sanPhamId, favorite: favoriteIds.has(sanPhamId) });
    }
  }

  async function themVaoGioHang(sanPhamId: string) {
    let chiTiet;
    try {
      const responseChiTiet = await layChiTietSanPhamCongKhai(sanPhamId);
      chiTiet = responseChiTiet.data;
    } catch {
      return;
    }

    if (!chiTiet?.khaDung.coTheDatHang) return;
    const bienTheHopLe = chiTiet.bienThe.filter((item) => item.soLuongKhaDung > 0);
    if (bienTheHopLe.length === 0) return;

    if (bienTheHopLe.length > 1) {
      router.push({ pathname: '/san-pham/[id]', params: { id: sanPhamId } });
      return;
    }

    const bienThe = bienTheHopLe[0];
    if (!bienThe) return;

    if (trangThaiXacThuc !== 'da-dang-nhap') {
      moDangNhap(router, '/goi-y', {
        loai: 'them-gio-hang',
        returnTo: '/goi-y',
        bienTheSanPhamId: bienThe.id,
        soLuong: 1,
      });
      return;
    }

    themGioHangMutation.mutate({ bienTheSanPhamId: bienThe.id });
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="border-b border-[#E3EBE6] bg-white px-4 pb-3 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-row gap-3 px-4 pt-5">
          <View className="flex-1"><ProductCardSkeleton /></View>
          <View className="flex-1"><ProductCardSkeleton /></View>
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="border-b border-[#E3EBE6] bg-white px-4 pb-3 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để nhận gợi ý"
            description="AgriMarket dùng lịch sử mua hàng, yêu thích, đánh giá và trang trại bạn theo dõi để sắp xếp sản phẩm phù hợp hơn."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/goi-y')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const header = (
    <View className="gap-4 pb-4">
      <View className="border-b border-[#E3EBE6] bg-white px-4 pb-3 pt-2">
        <MobileBrandBar />
      </View>
      <View className="mx-4 overflow-hidden rounded-[22px] border border-[#CDE4D5] bg-[#F1FAF5] p-4">
        <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-white">
          <Text className="text-[18px]">🌱</Text>
        </View>
        <Text className="text-[27px] font-extrabold tracking-[-0.6px] text-[#075E3B]">
          {query.data?.caNhanHoa ? 'Gợi ý cho bạn' : 'Có thể bạn quan tâm'}
        </Text>
        <Text className="mt-1 text-[13px] leading-5 text-[#637168]">
          {query.data?.caNhanHoa
            ? 'Đề xuất được sắp xếp từ hành vi mua sắm và trang trại bạn quan tâm.'
            : 'Danh sách phổ biến dành cho tài khoản chưa có đủ lịch sử mua sắm.'}
        </Text>
      </View>
      <View className="flex-row items-end justify-between px-4">
        <View>
          <Text className="text-[19px] font-extrabold text-[#17251C]">Nông sản phù hợp</Text>
          <Text className="mt-0.5 text-[11px] text-[#7A8780]">
            {query.data?.duLieu.length ?? 0} sản phẩm
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={query.isFetching}
          onPress={() => void thuLai()}
          className={query.isFetching ? 'opacity-40' : 'active:opacity-65'}
        >
          <Text className="text-[12px] font-extrabold text-[#087A4B]">
            {query.isFetching ? 'Đang làm mới…' : 'Làm mới'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (query.isError) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
        {header}
        <View className="flex-1 justify-center px-5 pb-20">
          <ErrorState
            title="Chưa tải được gợi ý"
            description={thongBaoLoiApi(
              query.error,
              'Không thể tải danh sách đề xuất lúc này. Vui lòng thử lại.',
            )}
            actionLabel="Thử lại"
            onAction={() => void thuLai()}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!query.isPending && (query.data?.duLieu.length ?? 0) === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
        {header}
        <View className="flex-1 justify-center px-5 pb-20">
          <EmptyState
            title="Chưa có sản phẩm phù hợp"
            description="Danh sách sẽ xuất hiện khi có sản phẩm công khai và còn khả dụng."
            actionLabel="Khám phá nông sản"
            onAction={() => router.push('/kham-pha')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
        {header}
        <View className="flex-row gap-3 px-4">
          <View className="flex-1"><ProductCardSkeleton /></View>
          <View className="flex-1"><ProductCardSkeleton /></View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <FlatList
        data={query.data?.duLieu ?? []}
        keyExtractor={(item) => item.sanPham.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 36 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: { sanPham } }) => (
          <View className="flex-1">
            <ProductCard
              name={sanPham.ten}
              farmName={sanPham.trangTrai.ten}
              price={sanPham.gia.tu}
              unit={dinhDangQuyCachSanPham(sanPham.quyCach)}
              imageUrl={sanPham.anhBiaUrl}
              favorite={favoriteIds.has(sanPham.id)}
              badges={[
                { label: sanPham.danhMuc.ten, variant: 'neutral' },
                {
                  label: sanPham.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                  variant: sanPham.khaDung.coTheDatHang ? 'success' : 'warning',
                },
              ]}
              disabled={themGioHangMutation.isPending || !sanPham.khaDung.coTheDatHang}
              onFavorite={() => toggleFavorite(sanPham.id)}
              onAddToCart={
                sanPham.khaDung.coTheDatHang ? () => void themVaoGioHang(sanPham.id) : undefined
              }
              onPress={() =>
                router.push({ pathname: '/san-pham/[id]', params: { id: sanPham.id } })
              }
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
