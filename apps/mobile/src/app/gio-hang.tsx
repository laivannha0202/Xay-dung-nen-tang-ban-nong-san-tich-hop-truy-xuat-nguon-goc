import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  capNhatMucGioHangMobile,
  GIO_HANG_MOBILE_QUERY_KEY,
  type GioHangMobile,
  layGioHangMobile,
  xoaMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { moDangNhap } from '@/lib/auth-navigation';
import { moTabChinh, quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type NhomNhaCungCap = {
  id: string;
  ten: string;
  muc: GioHangMobile['muc'];
};

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function dinhDangQuyCach(khoiLuong: number, donVi: string): string {
  const unit = donVi.trim().toLowerCase();
  if (unit === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((unit === 'l' || unit === 'lít' || unit === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }
  const amount = Number.isInteger(khoiLuong)
    ? String(khoiLuong)
    : String(Number(khoiLuong.toFixed(2)));
  return `${amount}${unit === 'quả' || unit === 'qua' ? ' quả' : unit}`;
}

function CartSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={150} borderRadius={20} />
      <Skeleton height={150} borderRadius={20} />
      <Skeleton height={130} borderRadius={20} />
    </View>
  );
}

export default function TrangGioHang() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
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
    onSuccess: (gioHang) => queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang),
  });

  const xoaMutation = useMutation({
    mutationFn: (id: string) => xoaMucGioHangMobile(id),
    onSuccess: (gioHang) => queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang),
  });

  const nhom = useMemo<NhomNhaCungCap[]>(() => {
    const values = new Map<string, NhomNhaCungCap>();
    for (const muc of query.data?.muc ?? []) {
      const supplier = muc.bienThe.sanPham.trangTrai.nhaCungCap;
      const current = values.get(supplier.id);
      if (current) current.muc.push(muc);
      else values.set(supplier.id, { id: supplier.id, ten: supplier.ten, muc: [muc] });
    }
    return [...values.values()];
  }, [query.data]);

  const tongSoLuong = useMemo(
    () => (query.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [query.data],
  );

  const tamTinh = useMemo(
    () =>
      (query.data?.muc ?? []).reduce(
        (tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong,
        0,
      ),
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
    ) return;

    capNhatMutation.mutate({ id, soLuong: soLuongMoi });
  }

  if (trangThai === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2"><MobileBrandBar /></View>
        <View className="flex-1 px-5 py-4"><CartSkeleton /></View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2"><MobileBrandBar /></View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem giỏ hàng"
            description="Giỏ hàng được đồng bộ theo tài khoản của bạn."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/gio-hang')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="border-b border-[#E7ECE9] bg-white px-5 pb-3 pt-2">
        <MobileBrandBar />
        <View className="mt-2 flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={() => quayLaiHoacVe(router, '/')}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-[#F2F7F4]"
            >
              <Ionicons name="chevron-back" size={26} color={PRIMARY} />
            </Pressable>
            <Text className="text-[27px] font-extrabold text-[#075E3B]">Giỏ hàng</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={query.isFetching}
            onPress={() => void query.refetch()}
            className={query.isFetching ? 'opacity-40' : 'active:opacity-70'}
          >
            <Text className="font-bold text-[#087A4B]">{query.isFetching ? 'Đang tải…' : 'Làm mới'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 36 }}
      >
        {query.isPending ? <CartSkeleton /> : null}

        {query.isError ? (
          <ErrorState
            title="Không đồng bộ được giỏ hàng"
            description="Phiên đăng nhập có thể đã hết hoặc dịch vụ đang tạm thời gián đoạn."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        ) : null}

        {capNhatMutation.isError || xoaMutation.isError ? (
          <View className="mb-4 gap-2 rounded-[18px] border border-[#F0C8C8] bg-[#FFF8F8] p-4">
            <Badge variant="danger">Không cập nhật được giỏ hàng</Badge>
            <Text className="text-sm leading-5 text-[#6B7470]">Hãy làm mới để lấy giá và tồn kho hiện tại.</Text>
          </View>
        ) : null}

        {query.data && query.data.muc.length === 0 ? (
          <EmptyState
            title="Giỏ hàng đang trống"
            description="Khám phá nông sản và chọn biến thể phù hợp để bắt đầu đơn hàng."
            actionLabel="Khám phá nông sản"
            onAction={() => moTabChinh(router, '/kham-pha')}
          />
        ) : null}

        {query.data && query.data.muc.length > 0 ? (
          <View className="gap-5">
            <View className="flex-row gap-3 rounded-[20px] bg-[#F1FAF5] p-4">
              <View className="flex-1">
                <Text className="text-[12px] text-[#718078]">Sản phẩm</Text>
                <Text className="mt-1 text-[22px] font-extrabold text-[#075E3B]">{tongSoLuong}</Text>
              </View>
              <View className="h-full w-px bg-[#D8E9DF]" />
              <View className="flex-[2]">
                <Text className="text-[12px] text-[#718078]">Tạm tính theo giá hiện tại</Text>
                <Text className="mt-1 text-[22px] font-extrabold text-[#075E3B]">{dinhDangGia(tamTinh)}</Text>
              </View>
            </View>

            {nhom.map((supplier) => (
              <View key={supplier.id} className="overflow-hidden rounded-[20px] border border-[#E1E8E3] bg-white">
                <View className="flex-row items-center justify-between gap-3 bg-[#F7FAF8] px-4 py-3">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <Ionicons name="storefront-outline" size={20} color={PRIMARY} />
                    <Text numberOfLines={1} className="font-extrabold text-[#263129]">{supplier.ten}</Text>
                  </View>
                  <Text className="text-[11px] text-[#7C8880]">{supplier.muc.length} mục</Text>
                </View>

                {supplier.muc.map((muc, index) => {
                  const max = Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung));
                  const coTheTang = muc.bienThe.coTheDatHang && muc.soLuong < max;
                  const quyCach = dinhDangQuyCach(muc.bienThe.khoiLuong, muc.bienThe.donVi);

                  return (
                    <View
                      key={muc.id}
                      className={[
                        'gap-3 p-4',
                        index > 0 ? 'border-t border-[#EEF2EF]' : '',
                      ].join(' ')}
                    >
                      <View className="flex-row gap-3">
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: muc.bienThe.sanPham.id } })}
                          className="h-[82px] w-[82px] items-center justify-center rounded-2xl bg-[#EAF5EE] active:opacity-80"
                        >
                          <Ionicons name="leaf-outline" size={34} color={PRIMARY} />
                        </Pressable>

                        <View className="min-w-0 flex-1">
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: muc.bienThe.sanPham.id } })}
                            className="active:opacity-75"
                          >
                            <Text numberOfLines={2} className="text-[16px] font-extrabold text-[#202A24]">{muc.bienThe.sanPham.ten}</Text>
                            <Text numberOfLines={1} className="mt-1 text-[12px] text-[#7C8880]">{muc.bienThe.sanPham.trangTrai.ten}</Text>
                          </Pressable>
                          <View className="mt-2 flex-row flex-wrap items-center gap-2">
                            <Text className="text-[16px] font-extrabold text-[#087A4B]">{dinhDangGia(muc.bienThe.giaHienTai)}</Text>
                            <Text className="text-[11px] text-[#8A948E]">/ {quyCach}</Text>
                          </View>
                          <Text className={muc.bienThe.coTheDatHang ? 'mt-1 text-[11px] text-[#168556]' : 'mt-1 text-[11px] text-[#D6454F]'}>
                            {muc.bienThe.coTheDatHang ? `Còn ${muc.bienThe.soLuongKhaDung} khả dụng` : 'Tạm không thể đặt hàng'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-row items-center overflow-hidden rounded-xl border border-[#DDE5E0] bg-white">
                          <Pressable
                            accessibilityRole="button"
                            disabled={dangCapNhat || muc.soLuong <= 1}
                            onPress={() => capNhatSoLuong(muc.id, muc.soLuong, muc.soLuong - 1, muc.bienThe.soLuongKhaDung)}
                            className={[
                              'h-10 w-11 items-center justify-center',
                              dangCapNhat || muc.soLuong <= 1 ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                            ].join(' ')}
                          >
                            <Ionicons name="remove" size={20} color="#334139" />
                          </Pressable>
                          <View className="h-10 min-w-12 items-center justify-center border-x border-[#DDE5E0] px-3">
                            <Text className="font-extrabold text-[#263129]">{muc.soLuong}</Text>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            disabled={dangCapNhat || !coTheTang}
                            onPress={() => capNhatSoLuong(muc.id, muc.soLuong, muc.soLuong + 1, muc.bienThe.soLuongKhaDung)}
                            className={[
                              'h-10 w-11 items-center justify-center',
                              dangCapNhat || !coTheTang ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                            ].join(' ')}
                          >
                            <Ionicons name="add" size={20} color="#334139" />
                          </Pressable>
                        </View>

                        <View className="flex-row items-center gap-3">
                          <Text className="text-[16px] font-extrabold text-[#075E3B]">{dinhDangGia(muc.bienThe.giaHienTai * muc.soLuong)}</Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Xóa ${muc.bienThe.sanPham.ten}`}
                            disabled={dangCapNhat}
                            onPress={() => xoaMutation.mutate(muc.id)}
                            className={dangCapNhat ? 'opacity-35' : 'active:opacity-65'}
                          >
                            <Ionicons name="trash-outline" size={21} color="#D6454F" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            <View className="gap-4 rounded-[20px] border border-[#CDE4D5] bg-[#F1FAF5] p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View>
                  <Text className="text-[12px] text-[#718078]">Tạm tính</Text>
                  <Text className="mt-1 text-[26px] font-extrabold text-[#075E3B]">{dinhDangGia(tamTinh)}</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
                  <Text className="max-w-[120px] text-right text-[11px] leading-4 text-[#617168]">Giá và tồn sẽ được xác nhận lại ở checkout</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/thanh-toan')}
                className="min-h-[56px] flex-row items-center justify-center gap-2 rounded-[18px] bg-primary px-4 active:opacity-80"
              >
                <Text className="text-[17px] font-extrabold text-white">Tiếp tục thanh toán</Text>
                <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
