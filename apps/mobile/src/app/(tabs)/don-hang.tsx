import {
  dinhDangGiaVND,
  maDonHangHienThi,
  metaTrangThaiDonHang,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Badge, EmptyState, ErrorState, Pagination, Skeleton } from '@/components/design-system';
import { SafeAreaScreen } from '@/components/layout/safe-area-screen';
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

type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

// Dung helper dung chung cua @agrimarket/api-client de quy tac lam tron
// va dinh dang vi-VN chi co mot noi dinh nghia.
const dinhDangGia = (value: number): string => `${dinhDangGiaVND(value)}đ`;

function dinhDangSoLuong(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
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
  // Dùng chung bảng nhãn/tone của `@agrimarket/api-client` thay vì bảng
  // `if` riêng — trước đây cùng một trạng thái có thể ra 2 màu khác nhau
  // giữa danh sách và chi tiết đơn.
  const tone = metaTrangThaiDonHang(trangThai).tone;
  if (tone === 'danger') return 'danger';
  if (tone === 'success') return 'success';
  if (tone === 'warning') return 'warning';
  if (tone === 'info') return 'info';
  return 'neutral';
}

function OrderSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton height={150} borderRadius={12} />
      <Skeleton height={150} borderRadius={12} />
      <Skeleton height={150} borderRadius={12} />
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
      <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={54} borderRadius={12} />
          <OrderSkeleton />
        </View>
      </SafeAreaScreen>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            icon="receipt-outline"
            title="Bạn chưa đăng nhập"
            description="Đăng nhập để theo dõi đơn hàng và tiến trình giao nhận trên mọi thiết bị."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/don-hang')}
            secondaryActionLabel="Xem nông sản trước"
            onSecondaryAction={() => moTabChinh(router, '/kham-pha')}
          />
        </View>
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-3 px-4 pb-3 pt-2">
          <MobileBrandBar />

          <View className="gap-0.5">
            <Text className="text-[24px] font-bold text-[#111827]">Đơn hàng</Text>
            <Text className="text-[13px] text-[#6B7280]">
              Theo dõi và quản lý các đơn hàng của bạn
            </Text>
          </View>

          <View className="min-h-[44px] flex-row items-center rounded-xl border border-[#E5E7EB] bg-white px-3">
            <Ionicons name="search-outline" size={19} color="#9AA39E" />
            <TextInput
              value={timKiem}
              onChangeText={setTimKiem}
              placeholder="Tìm theo mã đơn hàng..."
              placeholderTextColor="#9AA39E"
              autoCapitalize="none"
              className="min-h-[44px] flex-1 pl-2.5 text-[14px] text-[#111827]"
            />
            {timKiem ? (
              <Pressable hitSlop={8} onPress={() => setTimKiem('')}>
                <Ionicons name="close-circle" size={18} color="#9AA39E" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 4 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: trangThai === null }}
              onPress={() => {
                setTrangThai(null);
                setTrang(1);
              }}
              className={[
                'rounded-lg border px-3 py-1.5',
                trangThai === null
                  ? 'border-[#0B7A48] bg-[#0B7A48]'
                  : 'border-[#E5E7EB] bg-white',
              ].join(' ')}
            >
              <Text className={trangThai === null ? 'text-[12px] font-semibold text-white' : 'text-[12px] font-medium text-[#374151]'}>
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
                    'rounded-lg border px-3 py-1.5',
                    selected
                      ? 'border-[#0B7A48] bg-[#0B7A48]'
                      : 'border-[#E5E7EB] bg-white',
                  ].join(' ')}
                >
                  <Text className={selected ? 'text-[12px] font-semibold text-white' : 'text-[12px] font-medium text-[#374151]'}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="gap-3 px-4">
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
              className="rounded-xl border border-[#E5E7EB] bg-white active:bg-[#F9FAFB]"
            >
              <View className="p-4">
                <View className="flex-row items-center justify-between pb-3 border-b border-[#F3F4F6]">
                  <View className="min-w-0 flex-1 pr-2">
                    <Text className="text-[15px] font-bold text-[#111827]">
                      #{maDonHangHienThi(order.maDonHang)}
                    </Text>
                    <Text className="text-[12px] text-[#6B7280] mt-0.5">{dinhDangNgay(order.createdAt)}</Text>
                  </View>
                  <Badge variant={variantTrangThai(order.trangThai)}>
                    {nhanTrangThaiDonHangMobile(order.trangThai)}
                  </Badge>
                </View>

                <View className="gap-1 border-b border-[#F3F4F6] py-3">
                  <Text numberOfLines={1} className="text-[14px] font-semibold text-[#111827]">
                    {order.mucDaiDien?.tenSanPham ?? `${order.soMuc} sản phẩm`}
                  </Text>
                  <Text numberOfLines={1} className="text-[12px] text-[#6B7280]">
                    {order.mucDaiDien
                      ? `${dinhDangSoLuong(order.mucDaiDien.soLuong)} ${order.mucDaiDien.donVi} · ${order.mucDaiDien.tenTrangTrai}`
                      : `${order.soMuc} sản phẩm`}
                  </Text>
                  {order.soMuc > 1 ? (
                    <Text className="text-[12px] font-semibold text-[#0B7A48]">
                      +{order.soMuc - 1} sản phẩm khác
                    </Text>
                  ) : null}
                </View>

                <View className="flex-row items-center justify-between pt-3">
                  <View className="min-w-0 flex-1 pr-2">
                    <Text className="text-[11px] text-[#9CA3AF]">Tổng thanh toán</Text>
                    <Text className="text-[17px] font-bold text-[#111827]">
                      {dinhDangGia(order.tongTien)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    {order.coTheHuy ? (
                      <Text className="text-[13px] font-semibold text-[#B66A12]">
                        Có thể hủy · Chi tiết
                      </Text>
                    ) : (
                      <Text className="text-[13px] font-semibold text-[#0B7A48]">Chi tiết</Text>
                    )}
                    <Ionicons name="chevron-forward" size={14} color="#0B7A48" />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}

          {query.data && query.data.tong > query.data.gioiHan ? (
            <View className="items-center pt-2">
              <Pagination
                page={trang}
                total={Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan))}
                onChange={setTrang}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaScreen>
  );
}
