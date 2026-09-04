import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  DON_HANG_MOBILE_LIST_QUERY_KEY,
  LUA_CHON_TRANG_THAI_DON_HANG_MOBILE,
  layDanhSachDonHangMobile,
  nhanTrangThaiDonHangMobile,
  type TrangThaiDonHangMobile,
} from '@/lib/api-don-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GIOI_HAN = 10;

type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function variantTrangThai(trangThai: string): BadgeVariant {
  if (trangThai === 'DA_HUY') return 'danger';
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') {
    return 'success';
  }
  if (trangThai === 'DANG_GIAO') return 'info';
  if (trangThai === 'CHO_THANH_TOAN') return 'warning';
  return 'neutral';
}

function OrderSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={160} borderRadius={18} />
      <Skeleton height={160} borderRadius={18} />
      <Skeleton height={160} borderRadius={18} />
    </View>
  );
}

export default function TrangDonHang() {
  const router = useRouter();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [trang, setTrang] = useState(1);
  const [trangThai, setTrangThai] = useState<TrangThaiDonHangMobile | null>(null);

  const query = useQuery({
    queryKey: [...DON_HANG_MOBILE_LIST_QUERY_KEY, trang, trangThai],
    queryFn: () =>
      layDanhSachDonHangMobile({
        trang,
        gioiHan: GIOI_HAN,
        ...(trangThai ? { trangThai } : {}),
      }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 px-5 py-5">
          <OrderSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem đơn hàng"
            description="Danh sách đơn hàng chỉ hiển thị cho tài khoản khách hàng đã xác thực."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-3xl font-bold text-foreground">Đơn hàng của tôi</Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                Theo dõi danh sách, mở chi tiết và xem tiến trình từng đơn.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={query.isFetching}
              onPress={() => {
                void query.refetch();
              }}
              className={[
                'rounded-full border border-border bg-card px-4 py-2',
                query.isFetching ? 'opacity-50' : 'active:opacity-80',
              ].join(' ')}
            >
              <Text className="font-semibold text-primary">
                {query.isFetching ? 'Đang tải' : 'Làm mới'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: trangThai === null }}
              onPress={() => {
                setTrangThai(null);
                setTrang(1);
              }}
              className={[
                'rounded-full border px-4 py-2.5',
                trangThai === null ? 'border-primary bg-primary' : 'border-border bg-card',
              ].join(' ')}
            >
              <Text
                className={
                  trangThai === null
                    ? 'font-semibold text-primary-foreground'
                    : 'font-semibold text-foreground'
                }
              >
                Tất cả
              </Text>
            </Pressable>

            {LUA_CHON_TRANG_THAI_DON_HANG_MOBILE.map((option) => {
              const selected = trangThai === option.value;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setTrangThai(option.value);
                    setTrang(1);
                  }}
                  className={[
                    'rounded-full border px-4 py-2.5',
                    selected ? 'border-primary bg-primary' : 'border-border bg-card',
                  ].join(' ')}
                >
                  <Text
                    className={
                      selected
                        ? 'font-semibold text-primary-foreground'
                        : 'font-semibold text-foreground'
                    }
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {query.isPending ? <OrderSkeleton /> : null}

        {query.isError ? (
          <ErrorState
            title="Không tải được đơn hàng"
            description="Không thể đọc danh sách đơn hàng của tài khoản hiện tại."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        ) : null}

        {query.data && query.data.duLieu.length === 0 ? (
          <EmptyState
            title="Chưa có đơn hàng phù hợp"
            description={
              trangThai ? 'Không có đơn hàng ở trạng thái đã chọn.' : 'Bạn chưa có đơn hàng nào.'
            }
            actionLabel="Khám phá nông sản"
            onAction={() => router.push('/kham-pha')}
          />
        ) : null}

        {query.data && query.data.duLieu.length > 0 ? (
          <View className="gap-4">
            {query.data.duLieu.map((order) => (
              <Pressable
                key={order.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/don-hang/[id]',
                    params: { id: order.id },
                  })
                }
                className="gap-4 rounded-2xl border border-border bg-card p-4 active:opacity-80"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-lg font-bold text-foreground">{order.maDonHang}</Text>
                    <Text className="text-xs text-muted-foreground">
                      Tạo lúc {dinhDangNgay(order.createdAt)}
                    </Text>
                  </View>
                  <Badge variant={variantTrangThai(order.trangThai)}>
                    {nhanTrangThaiDonHangMobile(order.trangThai)}
                  </Badge>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-xl bg-background p-3">
                    <Text className="text-lg font-bold text-foreground">{order.soNhaCungCap}</Text>
                    <Text className="text-xs text-muted-foreground">Nhà cung cấp</Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-background p-3">
                    <Text className="text-lg font-bold text-foreground">{order.soMuc}</Text>
                    <Text className="text-xs text-muted-foreground">Mặt hàng</Text>
                  </View>
                </View>

                <View className="flex-row items-end justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text
                      className={
                        order.coTheHuy ? 'text-xs text-success' : 'text-xs text-muted-foreground'
                      }
                    >
                      {order.coTheHuy
                        ? 'Trạng thái hiện tại cho phép hủy'
                        : 'Không thể hủy trực tiếp'}
                    </Text>
                    <Text className="text-sm font-semibold text-primary">
                      Xem chi tiết và timeline
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-primary">
                    {dinhDangGia(order.tongTien)}
                  </Text>
                </View>
              </Pressable>
            ))}

            {query.data.tong > query.data.gioiHan ? (
              <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                <Pressable
                  accessibilityRole="button"
                  disabled={trang <= 1}
                  onPress={() => setTrang((value) => Math.max(1, value - 1))}
                  className={[
                    'rounded-xl border border-border px-4 py-3',
                    trang <= 1 ? 'opacity-40' : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-foreground">Trang trước</Text>
                </Pressable>

                <Text className="text-sm font-semibold text-foreground">
                  Trang {query.data.trang} /{' '}
                  {Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan))}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={trang >= Math.ceil(query.data.tong / query.data.gioiHan)}
                  onPress={() => setTrang((value) => value + 1)}
                  className={[
                    'rounded-xl border border-border px-4 py-3',
                    trang >= Math.ceil(query.data.tong / query.data.gioiHan)
                      ? 'opacity-40'
                      : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-foreground">Trang sau</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
