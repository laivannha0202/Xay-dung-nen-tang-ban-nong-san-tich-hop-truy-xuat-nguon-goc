import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  donHangMobileDetailQueryKey,
  layChiTietDonHangMobile,
  nhanTrangThaiDonHangMobile,
} from '@/lib/api-don-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';

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

function DetailSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={120} borderRadius={18} />
      <Skeleton height={240} borderRadius={18} />
      <Skeleton height={220} borderRadius={18} />
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietDonHang() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: donHangMobileDetailQueryKey(id),
    queryFn: () => layChiTietDonHangMobile(id),
    enabled: daDangNhap && id.length > 0,
    staleTime: 10_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
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
          <DetailSkeleton />
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
            title="Đăng nhập để xem đơn hàng"
            description="Chi tiết đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
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
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          <DetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
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
          <ErrorState
            title="Không tải được chi tiết đơn hàng"
            description="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc API đang tạm lỗi."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const order = query.data;

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
            {query.isFetching ? 'Đang tải' : 'Làm mới'}
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
          <Badge variant={variantTrangThai(order.trangThai)}>
            {nhanTrangThaiDonHangMobile(order.trangThai)}
          </Badge>
          <Text className="text-3xl font-bold text-foreground">{order.maDonHang}</Text>
          <Text className="text-sm text-muted-foreground">
            Tạo lúc {dinhDangNgay(order.createdAt)}
          </Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <Text className="text-2xl font-bold text-foreground">Tóm tắt</Text>

          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-muted-foreground">Trạng thái</Text>
            <Text className="font-bold text-foreground">
              {nhanTrangThaiDonHangMobile(order.trangThai)}
            </Text>
          </View>

          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-muted-foreground">Tổng tiền</Text>
            <Text className="text-xl font-bold text-primary">{dinhDangGia(order.tongTien)}</Text>
          </View>

          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-muted-foreground">Cập nhật</Text>
            <Text className="text-right text-foreground">{dinhDangNgay(order.updatedAt)}</Text>
          </View>

          <View className="h-px bg-border" />

          <Text
            className={order.coTheHuy ? 'text-sm text-success' : 'text-sm text-muted-foreground'}
          >
            {order.coTheHuy
              ? 'Backend cho biết đơn đang ở trạng thái có thể hủy.'
              : (order.lyDoKhongTheHuy ?? 'Đơn không thể hủy ở trạng thái hiện tại.')}
          </Text>

          <Text className="text-xs leading-5 text-muted-foreground">
            PHIEN-103 chỉ triển khai list/detail/timeline. Không thêm cancel mutation ngoài exact
            master.
          </Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-foreground">Timeline đơn hàng</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              Tiến trình được suy ra từ trạng thái hiện tại. Backend chưa lưu timestamp cho từng mốc
              nên Mobile không hiển thị thời gian giả.
            </Text>
          </View>

          <View>
            {order.tienTrinh.map((moc, index) => (
              <View key={`${moc.trangThai}-${index}`} className="flex-row gap-3">
                <View className="items-center">
                  <View
                    className={[
                      'h-5 w-5 items-center justify-center rounded-full border-2',
                      moc.hienTai
                        ? 'border-primary bg-primary'
                        : moc.daDat
                          ? 'border-success bg-success'
                          : 'border-border bg-background',
                    ].join(' ')}
                  >
                    <Text
                      className={[
                        'text-[9px] font-bold',
                        moc.hienTai || moc.daDat
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {index < order.tienTrinh.length - 1 ? (
                    <View
                      className={['w-0.5 flex-1', moc.daDat ? 'bg-success' : 'bg-border'].join(' ')}
                      style={{ minHeight: 54 }}
                    />
                  ) : null}
                </View>

                <View className="min-w-0 flex-1 gap-1 pb-5">
                  <Text
                    className={
                      moc.hienTai ? 'font-bold text-primary' : 'font-semibold text-foreground'
                    }
                  >
                    {nhanTrangThaiDonHangMobile(moc.trangThai)}
                  </Text>
                  <Text
                    className={
                      moc.hienTai
                        ? 'text-xs text-primary'
                        : moc.daDat
                          ? 'text-xs text-success'
                          : 'text-xs text-muted-foreground'
                    }
                  >
                    {moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã đạt' : 'Chưa tới'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground">Sản phẩm theo nhà cung cấp</Text>

          {order.donNhaCungCap.map((suborder) => (
            <View key={suborder.id} className="gap-4 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="text-lg font-bold text-foreground">
                    {suborder.tenNhaCungCap}
                  </Text>
                  <Text className="text-xs text-muted-foreground">{suborder.maDon}</Text>
                </View>

                <View className="items-end gap-2">
                  <Badge variant={variantTrangThai(suborder.trangThai)}>
                    {nhanTrangThaiDonHangMobile(suborder.trangThai)}
                  </Badge>
                  <Text className="font-bold text-primary">{dinhDangGia(suborder.tamTinh)}</Text>
                </View>
              </View>

              <View className="h-px bg-border" />

              <View className="gap-4">
                {suborder.muc.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/san-pham/[id]',
                        params: { id: item.sanPhamId },
                      })
                    }
                    className="gap-3 rounded-xl bg-background p-3 active:opacity-80"
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-bold text-foreground">{item.tenSanPham}</Text>
                        <Text className="text-xs text-muted-foreground">
                          SKU {item.sku} · {item.khoiLuong} {item.donVi} · SL {item.soLuong}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {item.tenTrangTrai} ({item.maTrangTrai})
                        </Text>
                      </View>
                      <Text className="font-bold text-foreground">
                        {dinhDangGia(item.thanhTien)}
                      </Text>
                    </View>

                    <Text className="text-xs font-semibold text-primary">
                      {dinhDangGia(item.donGia)} × {item.soLuong} · Xem sản phẩm
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className="gap-2 rounded-2xl border border-info bg-card p-4">
          <Badge variant="info">PHIEN-104 – Mobile Complaint/Review</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            Khiếu nại, đánh giá và camera/gallery evidence thuộc phiên tiếp theo; PHIEN-103 không
            triển khai các action này.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
