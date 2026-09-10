import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  DON_HANG_MOBILE_LIST_QUERY_KEY,
  LUA_CHON_TRANG_THAI_DON_HANG_MOBILE,
  layDanhSachDonHangMobile,
  nhanTrangThaiDonHangMobile,
  type TrangThaiDonHangMobile,
} from '@/lib/api-don-hang';
import { moDangNhap } from '@/lib/auth-navigation';
import { moTabChinh } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GIOI_HAN = 10;
const PRIMARY = '#087A4B';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function variantTrangThai(trangThai: string): BadgeVariant {
  if (trangThai === 'DA_HUY') return 'danger';
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'success';
  if (trangThai === 'DANG_GIAO') return 'info';
  if (trangThai === 'CHO_THANH_TOAN') return 'warning';
  return 'neutral';
}

function OrderSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={188} borderRadius={18} />
      <Skeleton height={188} borderRadius={18} />
      <Skeleton height={188} borderRadius={18} />
    </View>
  );
}

export default function TrangDonHang() {
  const router = useRouter();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [trang, setTrang] = useState(1);
  const [trangThai, setTrangThai] = useState<TrangThaiDonHangMobile | null>(null);
  const [timKiem, setTimKiem] = useState('');

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

  const donHangHienThi = useMemo(() => {
    const keyword = timKiem.trim().toLowerCase();
    const list = query.data?.duLieu ?? [];
    if (!keyword) return list;
    return list.filter((order) => order.maDonHang.toLowerCase().includes(keyword));
  }, [query.data?.duLieu, timKiem]);

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={54} borderRadius={12} />
          <OrderSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem đơn hàng"
            description="Đơn hàng và tiến trình giao nhận được đồng bộ theo tài khoản khách hàng."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/don-hang')}
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-4 px-5 pb-4 pt-2">
          <MobileBrandBar />

          <View className="gap-1">
            <Text className="text-[32px] font-extrabold tracking-[-0.6px] text-[#075E3B]">
              Đơn hàng
            </Text>
            <Text className="text-[15px] text-[#7A857E]">
              Theo dõi và quản lý các đơn hàng của bạn
            </Text>
          </View>

          <View className="min-h-[52px] flex-row items-center rounded-2xl bg-[#F2F5F3] px-4">
            <Ionicons name="search-outline" size={22} color="#68756D" />
            <TextInput
              value={timKiem}
              onChangeText={setTimKiem}
              placeholder="Tìm theo mã đơn hàng..."
              placeholderTextColor="#929A95"
              autoCapitalize="none"
              className="min-h-[52px] flex-1 pl-3 text-[15px] text-[#263129]"
            />
            {timKiem ? (
              <Pressable hitSlop={8} onPress={() => setTimKiem('')}>
                <Ionicons name="close-circle" size={21} color="#9AA39E" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
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
                trangThai === null
                  ? 'border-primary bg-primary'
                  : 'border-[#E1E8E3] bg-[#F8FAF9]',
              ].join(' ')}
            >
              <Text className={trangThai === null ? 'font-bold text-white' : 'font-semibold text-[#445149]'}>
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
                    selected
                      ? 'border-primary bg-primary'
                      : 'border-[#E1E8E3] bg-[#F8FAF9]',
                  ].join(' ')}
                >
                  <Text className={selected ? 'font-bold text-white' : 'font-semibold text-[#445149]'}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="gap-4 px-5">
          {query.isPending ? <OrderSkeleton /> : null}

          {query.isError ? (
            <ErrorState
              title="Không tải được đơn hàng"
              description="Không thể đọc danh sách đơn hàng của tài khoản hiện tại."
              actionLabel="Thử lại"
              onAction={() => void query.refetch()}
            />
          ) : null}

          {query.data && query.data.duLieu.length === 0 ? (
            <EmptyState
              title="Chưa có đơn hàng phù hợp"
              description={trangThai ? 'Không có đơn hàng ở trạng thái đã chọn.' : 'Bạn chưa có đơn hàng nào.'}
              actionLabel="Khám phá nông sản"
              onAction={() => moTabChinh(router, '/kham-pha')}
            />
          ) : null}

          {query.data && query.data.duLieu.length > 0 && donHangHienThi.length === 0 ? (
            <EmptyState
              title="Không tìm thấy mã đơn"
              description="Từ khóa chỉ lọc trên trang đơn hàng hiện tại."
              actionLabel="Xóa từ khóa"
              onAction={() => setTimKiem('')}
            />
          ) : null}

          {donHangHienThi.map((order) => (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/don-hang/[id]', params: { id: order.id } })}
              className="overflow-hidden rounded-[20px] border border-[#E2E8E4] bg-white active:opacity-85"
            >
              <View className="gap-4 p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-[17px] font-extrabold text-[#202A24]">#{order.maDonHang}</Text>
                    <Text className="text-[12px] text-[#89918C]">Đặt ngày {dinhDangNgay(order.createdAt)}</Text>
                  </View>
                  <Badge variant={variantTrangThai(order.trangThai)}>
                    {nhanTrangThaiDonHangMobile(order.trangThai)}
                  </Badge>
                </View>

                <View className="flex-row gap-3 rounded-2xl bg-[#F7FAF8] p-3">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E4F5EA]">
                    <Ionicons name="leaf-outline" size={25} color={PRIMARY} />
                  </View>
                  <View className="min-w-0 flex-1 justify-center gap-1">
                    <Text className="font-bold text-[#263129]">
                      {order.soNhaCungCap} nhà cung cấp
                    </Text>
                    <Text className="text-sm text-[#7C8880]">
                      {order.soMuc} mặt hàng trong đơn
                    </Text>
                  </View>
                  <View className="items-end justify-center">
                    <Text className="text-xs text-[#89918C]">Tổng tiền</Text>
                    <Text className="mt-1 text-[22px] font-extrabold text-[#087A4B]">
                      {dinhDangGia(order.tongTien)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between gap-3 border-t border-[#EEF2EF] pt-3">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <Ionicons
                      name={order.coTheHuy ? 'information-circle-outline' : 'shield-checkmark-outline'}
                      size={18}
                      color={order.coTheHuy ? '#B97800' : PRIMARY}
                    />
                    <Text className="flex-1 text-[12px] text-[#69766E]">
                      {order.coTheHuy
                        ? 'Đơn hiện vẫn cho phép hủy theo chính sách.'
                        : 'Mở chi tiết để xem tiến trình và trạng thái giao hàng.'}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 rounded-xl bg-[#EAF7EF] px-3 py-2">
                    <Ionicons name="document-text-outline" size={17} color={PRIMARY} />
                    <Text className="font-bold text-[#087A4B]">Chi tiết</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}

          {query.data && query.data.tong > query.data.gioiHan ? (
            <View className="flex-row items-center gap-3 pt-2">
              <Pressable
                accessibilityRole="button"
                disabled={trang <= 1}
                onPress={() => setTrang((value) => Math.max(1, value - 1))}
                className={[
                  'min-h-12 flex-1 items-center justify-center rounded-xl border border-[#DDE7E1] bg-white',
                  trang <= 1 ? 'opacity-40' : 'active:opacity-80',
                ].join(' ')}
              >
                <Text className="font-semibold text-[#334139]">Trang trước</Text>
              </Pressable>
              <Text className="text-sm font-bold text-[#526158]">
                {query.data.trang}/{Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan))}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={trang >= Math.ceil(query.data.tong / query.data.gioiHan)}
                onPress={() => setTrang((value) => value + 1)}
                className={[
                  'min-h-12 flex-1 items-center justify-center rounded-xl bg-primary',
                  trang >= Math.ceil(query.data.tong / query.data.gioiHan)
                    ? 'opacity-40'
                    : 'active:opacity-80',
                ].join(' ')}
              >
                <Text className="font-semibold text-white">Trang sau</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
