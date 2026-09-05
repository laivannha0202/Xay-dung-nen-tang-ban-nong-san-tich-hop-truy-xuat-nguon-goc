import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY,
  layKhieuNaiTaiKhoanMobile,
  nhanLyDoKhieuNaiTaiKhoan,
} from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GIOI_HAN = 20;

function dinhDangNgay(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function TrangKhieuNaiTaiKhoan() {
  const router = useRouter();
  const [trang, setTrang] = useState(1);
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: [...KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY, trang],
    queryFn: () =>
      layKhieuNaiTaiKhoanMobile({
        trang,
        gioiHan: GIOI_HAN,
      }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={110} borderRadius={18} />
          <Skeleton height={150} borderRadius={18} />
          <Skeleton height={150} borderRadius={18} />
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
            description="Complaint history chỉ hiển thị cho chủ tài khoản."
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
            title="Không tải được khiếu nại"
            description="Backend chưa trả được complaint history."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));

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
          <Text className="text-3xl font-bold text-foreground">Khiếu nại của tôi</Text>
          <Text className="text-sm text-muted-foreground">
            {query.data.tong} complaint đã được Backend ghi nhận.
          </Text>
        </View>

        {query.data.items.length === 0 ? (
          <EmptyState
            title="Chưa có khiếu nại"
            description="Khi đủ điều kiện, bạn có thể tạo khiếu nại từ chi tiết đơn hàng."
            actionLabel="Xem đơn hàng"
            onAction={() => router.push('/don-hang')}
          />
        ) : (
          <View className="gap-3">
            {query.data.items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/tai-khoan/khieu-nai/[id]',
                    params: { id: item.id },
                  })
                }
                className="gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-lg font-bold text-foreground">{item.tenSanPham}</Text>
                    <Text className="text-xs text-muted-foreground">Đơn {item.maDonHang}</Text>
                  </View>
                  <Badge variant="warning">{nhanLyDoKhieuNaiTaiKhoan(item.lyDo)}</Badge>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {item.soBangChung} bằng chứng · {dinhDangNgay(item.createdAt)}
                </Text>
                <Text className="text-sm font-semibold text-primary">Xem chi tiết →</Text>
              </Pressable>
            ))}
          </View>
        )}

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
              {query.data.trang}/{tongTrang}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={trang >= tongTrang}
              onPress={() => setTrang((value) => value + 1)}
              className={[
                'rounded-xl border border-border px-4 py-3',
                trang >= tongTrang ? 'opacity-40' : 'active:opacity-80',
              ].join(' ')}
            >
              <Text className="font-semibold text-foreground">Trang sau</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
