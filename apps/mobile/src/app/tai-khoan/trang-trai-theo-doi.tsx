import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, FarmCard, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  boTheoDoiTrangTraiTaiKhoanMobile,
  layTrangTraiTheoDoiTaiKhoanMobile,
  TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { moTabChinh, quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const INITIAL_RENDER = 6;
const RENDER_BATCH = 6;
const WINDOW_SIZE = 7;
const PRIMARY = '#087A4B';

export default function TrangTrangTraiTheoDoiTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
    queryFn: layTrangTraiTheoDoiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const mutation = useMutation({
    mutationFn: boTheoDoiTrangTraiTaiKhoanMobile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
      });
    },
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={86} borderRadius={18} />
          <Skeleton height={114} borderRadius={18} />
          <Skeleton height={114} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem trang trại theo dõi"
            description="Các trang trại bạn quan tâm được đồng bộ theo tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/trang-trai-theo-doi')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={86} borderRadius={18} />
          <Skeleton height={114} borderRadius={18} />
          <Skeleton height={114} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được trang trại theo dõi"
            description={thongBaoLoiApi(
              query.error,
              'Không tải được danh sách trang trại đang theo dõi.',
            )}
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <FlatList
        data={query.data.duLieu}
        keyExtractor={(item) => item.trangTraiId}
        initialNumToRender={INITIAL_RENDER}
        maxToRenderPerBatch={RENDER_BATCH}
        windowSize={WINDOW_SIZE}
        showsVerticalScrollIndicator={false}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={{
          gap: 12,
          paddingHorizontal: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View className="mb-2 gap-5 pt-2">
            <MobileBrandBar />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại tài khoản"
              onPress={() => quayLaiHoacVe(router, '/tai-khoan')}
              className="self-start flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
            >
              <Ionicons name="chevron-back" size={18} color={PRIMARY} />
              <Text className="text-[13px] font-bold text-[#087A4B]">Tài khoản</Text>
            </Pressable>

            <View className="gap-2">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F5EA]">
                  <Ionicons name="business-outline" size={26} color={PRIMARY} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[28px] font-extrabold tracking-[-0.5px] text-[#17251C]">
                    Trang trại theo dõi
                  </Text>
                  <Text className="mt-1 text-[13px] leading-5 text-[#748078]">
                    {query.data.tong} trang trại đang được bạn quan tâm.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start gap-2 rounded-2xl border border-[#DCE8E1] bg-white p-3">
                <Ionicons name="notifications-outline" size={19} color={PRIMARY} />
                <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#617168]">
                  Theo dõi trang trại giúp bạn nhận cập nhật thu hoạch mới từ dữ liệu hệ thống.
                </Text>
              </View>
            </View>

            {mutation.isError ? (
              <View className="rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-4">
                <Text className="text-sm leading-5 text-[#C93445]">
                  {thongBaoLoiApi(mutation.error, 'Không bỏ theo dõi được trang trại.')}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center py-10">
            <EmptyState
              title="Chưa theo dõi trang trại nào"
              description="Khám phá nông sản và mở trang trại để bắt đầu theo dõi."
              actionLabel="Khám phá nông sản"
              onAction={() => moTabChinh(router, '/kham-pha')}
            />
          </View>
        }
        renderItem={({ item: farm }) => (
          <View className="gap-2 rounded-[20px] bg-white p-2 shadow-sm">
            <FarmCard
              name={farm.ten}
              address={farm.diaChi}
              imageUrl={farm.anhBiaUrl}
              onPress={() =>
                router.push({
                  pathname: '/trang-trai/[id]',
                  params: { id: farm.trangTraiId },
                })
              }
            />

            <View className="flex-row items-center justify-between gap-3 px-2 pb-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
                <Ionicons name="shield-checkmark-outline" size={16} color="#6C7A72" />
                <Text numberOfLines={1} className="text-[11px] text-[#7A857E]">
                  Mã trang trại {farm.ma}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Bỏ theo dõi ${farm.ten}`}
                disabled={mutation.isPending}
                onPress={() => mutation.mutate(farm.trangTraiId)}
                className={[
                  'flex-row items-center gap-1 rounded-xl border border-[#F0C8C8] bg-[#FFF8F8] px-3 py-2',
                  mutation.isPending ? 'opacity-45' : 'active:opacity-75',
                ].join(' ')}
              >
                <Ionicons name="remove-circle-outline" size={16} color="#C93445" />
                <Text className="text-[12px] font-bold text-[#C93445]">Bỏ theo dõi</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
