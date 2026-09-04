import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  capNhatMucGioHangMobile,
  GIO_HANG_MOBILE_QUERY_KEY,
  type GioHangMobile,
  layGioHangMobile,
  xoaMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';

type NhomNhaCungCap = {
  id: string;
  ten: string;
  muc: GioHangMobile['muc'];
};

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function CartSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={90} borderRadius={18} />
      <Skeleton height={190} borderRadius={18} />
      <Skeleton height={190} borderRadius={18} />
    </View>
  );
}

export default function TrangGioHang() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const nguoiDung = useXacThucStore((state) => state.nguoiDung);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const query = useQuery({
    queryKey: GIO_HANG_MOBILE_QUERY_KEY,
    queryFn: layGioHangMobile,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const capNhatMutation = useMutation({
    mutationFn: ({ id, soLuong }: { id: string; soLuong: number }) =>
      capNhatMucGioHangMobile(id, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
    },
  });

  const xoaMutation = useMutation({
    mutationFn: (id: string) => xoaMucGioHangMobile(id),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
    },
  });

  const nhom = useMemo<NhomNhaCungCap[]>(() => {
    const values = new Map<string, NhomNhaCungCap>();

    for (const muc of query.data?.muc ?? []) {
      const supplier = muc.bienThe.sanPham.trangTrai.nhaCungCap;
      const current = values.get(supplier.id);

      if (current) {
        current.muc.push(muc);
      } else {
        values.set(supplier.id, {
          id: supplier.id,
          ten: supplier.ten,
          muc: [muc],
        });
      }
    }

    return [...values.values()];
  }, [query.data]);

  const tongSoLuong = useMemo(
    () => (query.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [query.data],
  );

  const dangCapNhat = capNhatMutation.isPending || xoaMutation.isPending;

  function capNhatSoLuong(
    id: string,
    soLuongHienTai: number,
    soLuongMoi: number,
    soLuongKhaDung: number,
  ) {
    const max = Math.max(1, Math.floor(soLuongKhaDung));

    if (
      dangCapNhat ||
      soLuongMoi === soLuongHienTai ||
      !Number.isInteger(soLuongMoi) ||
      soLuongMoi < 1 ||
      soLuongMoi > max
    ) {
      return;
    }

    capNhatMutation.mutate({
      id,
      soLuong: soLuongMoi,
    });
  }

  if (trangThai === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <View className="flex-1 px-5 py-4">
          <CartSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem giỏ hàng"
            description="Giỏ hàng Mobile được lưu và đồng bộ từ Backend theo tài khoản."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>

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
            {query.isFetching ? 'Đang đồng bộ' : 'Đồng bộ lại'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 24,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-3">
          <View className="self-start">
            <Badge variant="success">Backend Cart</Badge>
          </View>
          <Text className="text-3xl font-bold text-foreground">Giỏ hàng của bạn</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Đang đồng bộ theo phiên Mobile
            {nguoiDung?.email ? ` · ${nguoiDung.email}` : ''}.
          </Text>

          {query.data ? (
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-border bg-card p-4">
                <Text className="text-2xl font-bold text-foreground">{query.data.muc.length}</Text>
                <Text className="text-xs text-muted-foreground">Dòng sản phẩm</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-border bg-card p-4">
                <Text className="text-2xl font-bold text-foreground">{tongSoLuong}</Text>
                <Text className="text-xs text-muted-foreground">Tổng số lượng</Text>
              </View>
            </View>
          ) : null}
        </View>

        {query.isPending ? <CartSkeleton /> : null}

        {query.isError ? (
          <ErrorState
            title="Không đồng bộ được giỏ hàng"
            description="Phiên đăng nhập có thể đã hết hoặc Backend đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        ) : null}

        {capNhatMutation.isError || xoaMutation.isError ? (
          <View className="gap-2 rounded-2xl border border-danger bg-card p-4">
            <Badge variant="danger">Không cập nhật được giỏ hàng</Badge>
            <Text className="text-sm leading-5 text-muted-foreground">
              Backend đã từ chối thay đổi. Hãy đồng bộ lại để lấy giá và tồn khả dụng hiện tại.
            </Text>
          </View>
        ) : null}

        {query.data && query.data.muc.length === 0 ? (
          <EmptyState
            title="Giỏ hàng đang trống"
            description="Chọn một biến thể sản phẩm để thêm vào giỏ."
            actionLabel="Khám phá nông sản"
            onAction={() => router.push('/kham-pha')}
          />
        ) : null}

        {query.data && query.data.muc.length > 0 ? (
          <View className="gap-5">
            {nhom.map((supplier) => (
              <View
                key={supplier.id}
                className="gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-xs text-muted-foreground">Nhà cung cấp</Text>
                    <Text className="text-xl font-bold text-foreground">{supplier.ten}</Text>
                  </View>
                  <Badge variant="neutral">{supplier.muc.length} mục</Badge>
                </View>

                {supplier.muc.map((muc) => {
                  const max = Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung));
                  const coTheTang = muc.bienThe.coTheDatHang && muc.soLuong < max;

                  return (
                    <View
                      key={muc.id}
                      className="gap-4 rounded-2xl border border-border bg-background p-4"
                    >
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: '/san-pham/[id]',
                            params: {
                              id: muc.bienThe.sanPham.id,
                            },
                          })
                        }
                        className="gap-1 active:opacity-80"
                      >
                        <Text className="text-lg font-bold text-foreground">
                          {muc.bienThe.sanPham.ten}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {muc.bienThe.sanPham.trangTrai.ten}
                        </Text>
                      </Pressable>

                      <View className="gap-2">
                        <Text className="text-sm text-foreground">
                          {muc.bienThe.khoiLuong} {muc.bienThe.donVi} · SKU {muc.bienThe.sku}
                        </Text>
                        <Text className="text-lg font-bold text-primary">
                          {dinhDangGia(muc.bienThe.giaHienTai)} / đơn vị
                        </Text>
                        <Text
                          className={
                            muc.bienThe.coTheDatHang
                              ? 'text-sm text-success'
                              : 'text-sm text-danger'
                          }
                        >
                          Tồn khả dụng hiện tại: {muc.bienThe.soLuongKhaDung}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            accessibilityRole="button"
                            disabled={dangCapNhat || muc.soLuong <= 1}
                            onPress={() =>
                              capNhatSoLuong(
                                muc.id,
                                muc.soLuong,
                                muc.soLuong - 1,
                                muc.bienThe.soLuongKhaDung,
                              )
                            }
                            className={[
                              'h-11 w-11 items-center justify-center rounded-xl border border-border bg-card',
                              dangCapNhat || muc.soLuong <= 1 ? 'opacity-40' : 'active:opacity-80',
                            ].join(' ')}
                          >
                            <Text className="text-xl font-bold text-foreground">−</Text>
                          </Pressable>

                          <View className="min-w-12 items-center">
                            <Text className="text-lg font-bold text-foreground">{muc.soLuong}</Text>
                            <Text className="text-[10px] text-muted-foreground">Số lượng</Text>
                          </View>

                          <Pressable
                            accessibilityRole="button"
                            disabled={dangCapNhat || !coTheTang}
                            onPress={() =>
                              capNhatSoLuong(
                                muc.id,
                                muc.soLuong,
                                muc.soLuong + 1,
                                muc.bienThe.soLuongKhaDung,
                              )
                            }
                            className={[
                              'h-11 w-11 items-center justify-center rounded-xl border border-border bg-card',
                              dangCapNhat || !coTheTang ? 'opacity-40' : 'active:opacity-80',
                            ].join(' ')}
                          >
                            <Text className="text-xl font-bold text-foreground">+</Text>
                          </Pressable>
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          disabled={dangCapNhat}
                          onPress={() => xoaMutation.mutate(muc.id)}
                          className={[
                            'rounded-xl border border-danger px-4 py-3',
                            dangCapNhat ? 'opacity-40' : 'active:opacity-80',
                          ].join(' ')}
                        >
                          <Text className="font-semibold text-danger">Xóa</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            <View className="gap-3 rounded-2xl border border-info bg-card p-4">
              <View className="self-start">
                <Badge variant="info">PHIEN-101 – Mobile Checkout</Badge>
              </View>
              <Text className="text-sm leading-5 text-muted-foreground">
                Địa chỉ, giao hàng, voucher và payment sẽ dùng Checkout Backend ở phiên tiếp theo.
                PHIEN-100 chỉ đồng bộ giỏ hàng.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
