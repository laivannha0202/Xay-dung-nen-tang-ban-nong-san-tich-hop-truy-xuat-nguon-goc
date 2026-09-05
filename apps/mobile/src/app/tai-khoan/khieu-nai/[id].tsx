import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  khieuNaiTaiKhoanDetailQueryKey,
  layChiTietKhieuNaiTaiKhoanMobile,
  nhanLyDoKhieuNaiTaiKhoan,
} from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

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

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietKhieuNaiTaiKhoan() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: khieuNaiTaiKhoanDetailQueryKey(id),
    queryFn: () => layChiTietKhieuNaiTaiKhoanMobile(id),
    enabled: daDangNhap && id.length > 0,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={120} borderRadius={18} />
          <Skeleton height={260} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem khiếu nại"
            description="Chi tiết complaint chỉ hiển thị cho chủ tài khoản."
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
            title="Không tải được chi tiết khiếu nại"
            description="Khiếu nại không tồn tại, không thuộc tài khoản hoặc API đang lỗi."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const complaint = query.data;

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

        <View className="gap-3">
          <Badge variant="warning">{nhanLyDoKhieuNaiTaiKhoan(complaint.lyDo)}</Badge>
          <Text className="text-3xl font-bold text-foreground">
            {complaint.mucDonHang.tenSanPham}
          </Text>
          <Text className="text-sm text-muted-foreground">
            Tạo lúc {dinhDangNgay(complaint.createdAt)}
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Nội dung khiếu nại</Text>
          <Text className="text-sm leading-6 text-foreground">{complaint.moTa}</Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Đơn hàng và sản phẩm</Text>
          <Text className="text-sm text-foreground">Đơn: {complaint.donHang.maDonHang}</Text>
          <Text className="text-sm text-foreground">
            Nhà cung cấp: {complaint.donNhaCungCap.tenNhaCungCap}
          </Text>
          <Text className="text-sm text-foreground">SKU: {complaint.mucDonHang.sku}</Text>
          <Text className="text-sm text-foreground">
            SL {complaint.mucDonHang.soLuong} · {dinhDangGia(complaint.mucDonHang.thanhTien)}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/don-hang/[id]',
                params: { id: complaint.donHang.id },
              })
            }
            className="items-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-primary-foreground">Mở đơn hàng</Text>
          </Pressable>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Bằng chứng</Text>
          {complaint.bangChung.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Không có bằng chứng đính kèm.</Text>
          ) : (
            complaint.bangChung.map((evidence) => (
              <View key={evidence.id} className="gap-1 rounded-xl bg-background p-3">
                <Text className="font-semibold text-foreground">{evidence.tenGoc}</Text>
                <Text className="text-xs text-muted-foreground">{evidence.mimeType}</Text>
              </View>
            ))
          )}
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Phân bổ / vận chuyển</Text>
          <Text className="text-sm text-muted-foreground">
            {complaint.phanBo.length} phân bổ · {complaint.vanChuyen.length} vận chuyển liên quan
          </Text>
          {complaint.vanChuyen.map((shipment) => (
            <View key={shipment.id} className="gap-1 rounded-xl bg-background p-3">
              <Text className="font-semibold text-foreground">{shipment.maVanDon}</Text>
              <Text className="text-xs text-muted-foreground">{shipment.trangThai}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
