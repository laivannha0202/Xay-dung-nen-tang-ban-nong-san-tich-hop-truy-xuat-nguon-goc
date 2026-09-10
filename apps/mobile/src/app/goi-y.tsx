import { dinhDangQuyCachSanPham } from '@agrimarket/api-client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { coNenThuLaiQueryApi, thongBaoLoiApi } from '@/lib/api-error';
import { GOI_Y_MOBILE_QUERY_KEY, layGoiYSanPhamMobile } from '@/lib/api-goi-y';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

export default function TrangGoiY() {
  const router = useRouter();
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

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
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

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>

        <View className="gap-1 px-5 pb-4 pt-5">
          <Text className="text-[28px] font-extrabold tracking-[-0.6px] text-[#17251C]">
            {query.data?.caNhanHoa ? 'Gợi ý cho bạn' : 'Có thể bạn quan tâm'}
          </Text>
          <Text className="text-[13px] leading-5 text-[#7C8880]">
            {query.data?.caNhanHoa
              ? 'Đề xuất được sắp xếp từ hành vi mua sắm và trang trại bạn quan tâm.'
              : 'Danh sách phổ biến dành cho tài khoản chưa có đủ lịch sử mua sắm.'}
          </Text>
        </View>

        <View className="gap-4 px-5">
          {query.isPending ? (
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          ) : null}

          {query.isError ? (
            <ErrorState
              title="Chưa tải được gợi ý"
              description={thongBaoLoiApi(
                query.error,
                'Không thể tải danh sách đề xuất lúc này. Vui lòng thử lại.',
              )}
              actionLabel="Thử lại"
              onAction={() => void thuLai()}
            />
          ) : null}

          {!query.isPending && !query.isError && (query.data?.duLieu.length ?? 0) === 0 ? (
            <EmptyState
              title="Chưa có sản phẩm phù hợp"
              description="Danh sách sẽ xuất hiện khi có sản phẩm công khai và còn khả dụng."
            />
          ) : null}

          {query.data?.duLieu.map(({ sanPham }) => (
            <ProductCard
              key={sanPham.id}
              name={sanPham.ten}
              farmName={sanPham.trangTrai.ten}
              price={sanPham.gia.tu}
              unit={dinhDangQuyCachSanPham(sanPham.quyCach)}
              imageUrl={sanPham.anhBiaUrl}
              badges={[
                { label: sanPham.danhMuc.ten, variant: 'neutral' },
                {
                  label: sanPham.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                  variant: sanPham.khaDung.coTheDatHang ? 'success' : 'warning',
                },
              ]}
              onPress={() =>
                router.push({ pathname: '/san-pham/[id]', params: { id: sanPham.id } })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
