import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/components/design-system';
import {
  boTheoDoiTrangTraiTaiKhoanMobile,
  layTrangTraiTheoDoiTaiKhoanMobile,
  TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
} from '@/lib/api-tai-khoan';
import { thongBaoLoiApi } from '@/lib/api-error';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  moTabChinh,
  quayLaiHoacVe,
} from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const INITIAL_RENDER = 6;
const RENDER_BATCH = 6;
const WINDOW_SIZE = 7;

export default function TrangTrangTraiTheoDoiTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const trangThaiXacThuc =
    useXacThucStore(
      (state) => state.trangThai,
    );

  const daDangNhap =
    trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey:
      TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
    queryFn:
      layTrangTraiTheoDoiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const mutation = useMutation({
    mutationFn:
      boTheoDoiTrangTraiTaiKhoanMobile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY,
      });
    },
  });

  if (
    trangThaiXacThuc ===
      'dang-khoi-phuc'
    || query.isPending
  ) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        edges={['top', 'bottom']}
      >
        <View className="gap-4 px-5 py-5">
          <Skeleton
            height={110}
            borderRadius={18}
          />
          <Skeleton
            height={160}
            borderRadius={18}
          />
          <Skeleton
            height={160}
            borderRadius={18}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        edges={['top', 'bottom']}
      >
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem trang trại theo dõi"
            description="Danh sách theo dõi được lưu theo tài khoản của bạn."
            actionLabel="Đăng nhập"
            onAction={() =>
              moDangNhap(
                router,
                '/tai-khoan/trang-trai-theo-doi',
              )
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  if (
    query.isError
    || !query.data
  ) {
    return (
      <SafeAreaView
        className="flex-1 bg-background"
        edges={['top', 'bottom']}
      >
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được trang trại theo dõi"
            description={thongBaoLoiApi(
              query.error,
              'Không tải được danh sách trang trại đang theo dõi.',
            )}
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
    <SafeAreaView
      className="flex-1 bg-background"
      edges={['top', 'bottom']}
    >
      <FlatList
        data={query.data.duLieu}
        keyExtractor={(item) =>
          item.trangTraiId
        }
        initialNumToRender={
          INITIAL_RENDER
        }
        maxToRenderPerBatch={
          RENDER_BATCH
        }
        windowSize={WINDOW_SIZE}
        showsVerticalScrollIndicator={
          false
        }
        refreshing={
          query.isRefetching
        }
        onRefresh={() => {
          void query.refetch();
        }}
        contentContainerStyle={{
          gap: 12,
          padding: 20,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <View className="mb-2 gap-5">
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                quayLaiHoacVe(
                  router,
                  '/tai-khoan',
                )
              }
              className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
            >
              <Text className="font-semibold text-foreground">
                Quay lại
              </Text>
            </Pressable>

            <View className="gap-2">
              <Text className="text-3xl font-bold text-foreground">
                Trang trại theo dõi
              </Text>
              <Text className="text-sm text-muted-foreground">
                {query.data.tong}{' '}
                trang trại đang được bạn theo dõi.
              </Text>
            </View>

            {mutation.isError ? (
              <View className="rounded-2xl border border-danger bg-card p-4">
                <Text className="text-sm leading-5 text-danger">
                  {thongBaoLoiApi(
                    mutation.error,
                    'Không bỏ theo dõi được trang trại.',
                  )}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Chưa theo dõi trang trại nào"
            description="Mở trang trại để bắt đầu theo dõi."
            actionLabel="Khám phá"
            onAction={() =>
              moTabChinh(
                router,
                '/kham-pha',
              )
            }
          />
        }
        renderItem={({ item: farm }) => (
          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="gap-1">
              <Text className="text-lg font-bold text-foreground">
                {farm.ten}
              </Text>

              <Text className="text-xs text-muted-foreground">
                {farm.ma}
              </Text>

              <Text className="text-sm text-muted-foreground">
                {farm.diaChi}
              </Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname:
                      '/trang-trai/[id]',
                    params: {
                      id:
                        farm.trangTraiId,
                    },
                  })
                }
                className="flex-1 items-center rounded-xl bg-primary px-3 py-2.5 active:opacity-80"
              >
                <Text className="font-semibold text-primary-foreground">
                  Xem trang trại
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={
                  mutation.isPending
                }
                onPress={() =>
                  mutation.mutate(
                    farm.trangTraiId,
                  )
                }
                className={[
                  'items-center rounded-xl border border-danger px-3 py-2.5',
                  mutation.isPending
                    ? 'opacity-50'
                    : 'active:opacity-80',
                ].join(' ')}
              >
                <Text className="font-semibold text-danger">
                  Bỏ theo dõi
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
