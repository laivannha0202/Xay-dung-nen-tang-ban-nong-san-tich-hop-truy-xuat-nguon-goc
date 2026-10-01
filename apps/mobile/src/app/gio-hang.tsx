import { THUONG_HIEU_AGRIMARKET, dinhDangGiaVND } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

// Lấy từ brand token dùng chung (packages/api-client/domain-ui) để đổi màu
// thương hiệu chỉ sửa một chỗ. Trước đây 19 file hard-code '#087A4B'.
const PRIMARY = THUONG_HIEU_AGRIMARKET.primary;

type NhomNhaCungCap = {
  id: string;
  ten: string;
  muc: GioHangMobile['muc'];
};

// Dùng helper dùng chung của @agrimarket/api-client để quy tắc làm tròn
// và định dạng vi-VN chỉ có một nơi định nghĩa.
const dinhDangGia = (value: number): string => `${dinhDangGiaVND(value)}đ`;

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

function AnhSanPhamGioHang({
  url,
  ten,
  onPress,
}: {
  url: string | null;
  ten: string;
  onPress: () => void;
}) {
  const uri = useMemo(() => chuanHoaUrlAnhMobile(url), [url]);
  const [loiAnh, setLoiAnh] = useState(false);

  useEffect(() => setLoiAnh(false), [uri]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem ${ten}`}
      onPress={onPress}
      className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-[#EAF5EE] active:opacity-80"
    >
      {uri && !loiAnh ? (
        <Image
          source={{ uri }}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          contentFit="cover"
          transition={120}
          onError={() => setLoiAnh(true)}
          style={{ width: 72, height: 72 }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="leaf-outline" size={30} color={PRIMARY} />
        </View>
      )}
    </Pressable>
  );
}

function CartSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton height={140} borderRadius={14} />
      <Skeleton height={140} borderRadius={14} />
      <Skeleton height={130} borderRadius={14} />
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

  const danhSachMuc = query.data?.muc ?? [];

  const mucHopLe = useMemo(
    () => danhSachMuc.filter((muc) => muc.bienThe.coTheDatHang),
    [danhSachMuc],
  );

  const mucLoi = useMemo(
    () => danhSachMuc.filter((muc) => !muc.bienThe.coTheDatHang),
    [danhSachMuc],
  );

  const tongSoLuong = useMemo(
    () => danhSachMuc.reduce((tong, muc) => tong + muc.soLuong, 0),
    [danhSachMuc],
  );

  const tamTinh = useMemo(
    () =>
      danhSachMuc.reduce(
        (tong, muc) => tong + muc.bienThe.giaHienTai * muc.soLuong,
        0,
      ),
    [danhSachMuc],
  );

  const dangCapNhat = capNhatMutation.isPending || xoaMutation.isPending;

  // Rule checkout: giỏ có món AND tất cả món đều orderable AND không pending mutation.
  // Backend vẫn là final authority ở bước thanh toán.
  const choPhepThanhToan =
    danhSachMuc.length > 0 && mucLoi.length === 0 && !dangCapNhat && !query.isPending;

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
            icon="cart-outline"
            title="Bạn chưa đăng nhập"
            description="Đăng nhập để đồng bộ giỏ hàng theo tài khoản của bạn trên mọi thiết bị."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/gio-hang')}
            secondaryActionLabel="Xem nông sản trước"
            onSecondaryAction={() => moTabChinh(router, '/kham-pha')}
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
            <View>
              {/* Số lượng chỉ hiện ở đây — không lặp tổng tiền ở đầu trang. */}
              <Text className="text-[24px] font-extrabold text-[#075E3B]">Giỏ hàng</Text>
              {tongSoLuong > 0 ? (
                <Text className="text-[12px] text-[#7C8880]">
                  {tongSoLuong} sản phẩm
                </Text>
              ) : null}
            </View>
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
          <View className="mb-4 gap-2 rounded-[14px] border border-[#F0C8C8] bg-[#FFF8F8] p-4">
            <Badge variant="danger">Không cập nhật được giỏ hàng</Badge>
            <Text className="text-sm leading-5 text-[#6B7470]">Hãy làm mới để lấy giá và tồn kho hiện tại.</Text>
          </View>
        ) : null}

        {query.data && query.data.muc.length === 0 ? (
          <EmptyState
            title="Giỏ hàng của bạn đang trống"
            description="Khám phá nông sản sạch và thêm sản phẩm bạn yêu thích."
            actionLabel="Xem sản phẩm"
            onAction={() => moTabChinh(router, '/kham-pha')}
          />
        ) : null}

        {query.data && query.data.muc.length > 0 ? (
          <View className="gap-4">
            {mucLoi.length > 0 ? (
              <View className="gap-2 rounded-[14px] border border-[#F0D9A8] bg-[#FFFBF0] p-4">
                <Badge variant="warning">
                  {mucLoi.length === danhSachMuc.length
                    ? 'Giỏ hàng chưa thể thanh toán'
                    : `${mucLoi.length} sản phẩm cần kiểm tra lại`}
                </Badge>
                <Text className="text-[13px] leading-5 text-[#6B7470]">
                  {mucLoi.length === danhSachMuc.length
                    ? 'Tất cả sản phẩm trong giỏ hiện không đủ tồn kho hoặc không còn khả dụng. Vui lòng xóa khỏi giỏ hoặc quay lại sau.'
                    : `Có ${mucLoi.length} sản phẩm tạm hết hàng hoặc không còn khả dụng. Hãy xóa các mục lỗi khỏi giỏ để tiếp tục thanh toán ${mucHopLe.length} sản phẩm còn lại.`}
                </Text>
              </View>
            ) : null}

            {nhom.map((supplier) => (
              <View key={supplier.id} className="overflow-hidden rounded-[20px] border border-[#E1E8E3] bg-white">
                <View className="flex-row items-center justify-between gap-3 bg-[#F7FAF8] px-4 py-2.5">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <Ionicons name="storefront-outline" size={18} color={PRIMARY} />
                    <Text numberOfLines={1} className="text-[15px] font-extrabold text-[#263129]">{supplier.ten}</Text>
                  </View>
                  <Text className="text-[11px] text-[#7C8880]">{supplier.muc.length} mục</Text>
                </View>

                {supplier.muc.map((muc, index) => {
                  const max = Math.max(1, Math.floor(muc.bienThe.soLuongKhaDung));
                  const coTheTang = muc.bienThe.coTheDatHang && muc.soLuong < max;
                  const quyCach = dinhDangQuyCach(muc.bienThe.khoiLuong, muc.bienThe.donVi);
                  const moChiTiet = () =>
                    router.push({ pathname: '/san-pham/[id]', params: { id: muc.bienThe.sanPham.id } });

                  return (
                    <View
                      key={muc.id}
                      className={[
                        'gap-3 p-3.5',
                        index > 0 ? 'border-t border-[#EEF2EF]' : '',
                      ].join(' ')}
                    >
                      <View className="flex-row gap-3">
                        <AnhSanPhamGioHang
                          url={muc.bienThe.sanPham.anhBiaUrl}
                          ten={muc.bienThe.sanPham.ten}
                          onPress={moChiTiet}
                        />

                        <View className="min-w-0 flex-1">
                          <Pressable accessibilityRole="button" onPress={moChiTiet} className="active:opacity-75">
                            <Text numberOfLines={2} className="text-[15px] font-bold text-[#202A24]">{muc.bienThe.sanPham.ten}</Text>
                            <Text numberOfLines={1} className="mt-0.5 text-[12px] text-[#7C8880]">{muc.bienThe.sanPham.trangTrai.ten}</Text>
                          </Pressable>
                          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
                            <Text className="text-[15px] font-extrabold text-[#087A4B]">{dinhDangGia(muc.bienThe.giaHienTai)}</Text>
                            {muc.bienThe.loaiGia === 'FLASH_SALE' && muc.bienThe.giaGoc > muc.bienThe.giaHienTai ? (
                              <Text className="text-[12px] text-[#8A948E] line-through">{dinhDangGia(muc.bienThe.giaGoc)}</Text>
                            ) : null}
                            <Text className="text-[11px] text-[#8A948E]">/ {quyCach}</Text>
                          </View>
                          {muc.bienThe.loaiGia === 'FLASH_SALE' && muc.bienThe.giaGoc > muc.bienThe.giaHienTai ? (
                            <View className="mt-1 self-start rounded-full bg-[#FFF3E6] px-2 py-0.5">
                              <Text className="text-[10px] font-extrabold text-[#B26A00]">Flash Sale</Text>
                            </View>
                          ) : null}
                          <Text className={muc.bienThe.coTheDatHang ? 'mt-1 text-[11px] text-[#168556]' : 'mt-1 text-[11px] text-[#D6454F]'}>
                            {muc.bienThe.coTheDatHang ? `Còn ${muc.bienThe.soLuongKhaDung} khả dụng` : 'Tạm không thể đặt hàng'}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center justify-between gap-3">
                        <View className="flex-row items-center overflow-hidden rounded-xl border border-[#DDE5E0] bg-white">
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Giảm số lượng ${muc.bienThe.sanPham.ten}`}
                            disabled={dangCapNhat || muc.soLuong <= 1}
                            onPress={() => capNhatSoLuong(muc.id, muc.soLuong, muc.soLuong - 1, muc.bienThe.soLuongKhaDung)}
                            className={[
                              'h-11 w-11 items-center justify-center',
                              dangCapNhat || muc.soLuong <= 1 ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                            ].join(' ')}
                          >
                            <Ionicons name="remove" size={19} color="#334139" />
                          </Pressable>
                          <View className="h-11 min-w-11 items-center justify-center border-x border-[#DDE5E0] px-2">
                            <Text className="text-[15px] font-extrabold text-[#263129]">{muc.soLuong}</Text>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Tăng số lượng ${muc.bienThe.sanPham.ten}`}
                            disabled={dangCapNhat || !coTheTang}
                            onPress={() => capNhatSoLuong(muc.id, muc.soLuong, muc.soLuong + 1, muc.bienThe.soLuongKhaDung)}
                            className={[
                              'h-11 w-11 items-center justify-center',
                              dangCapNhat || !coTheTang ? 'opacity-35' : 'active:bg-[#F1F7F3]',
                            ].join(' ')}
                          >
                            <Ionicons name="add" size={19} color="#334139" />
                          </Pressable>
                        </View>

                        <View className="flex-row items-center gap-1">
                          <Text className="text-[15px] font-extrabold text-[#075E3B]">{dinhDangGia(muc.bienThe.giaHienTai * muc.soLuong)}</Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Xóa ${muc.bienThe.sanPham.ten}`}
                            disabled={dangCapNhat}
                            onPress={() => xoaMutation.mutate(muc.id)}
                            className={['h-11 w-11 items-center justify-center rounded-full', dangCapNhat ? 'opacity-35' : 'active:bg-[#FDF1F1]'].join(' ')}
                          >
                            <Ionicons name="trash-outline" size={20} color="#D6454F" />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Tóm tắt đơn hàng — cùng terminology với Customer Web. */}
            <View className="gap-3 rounded-[14px] border border-[#E1E8E3] bg-white p-4">
              <Text className="text-[17px] font-extrabold text-[#202A24]">Tóm tắt đơn hàng</Text>

              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-[13px] text-[#6B7A71]">Số lượng</Text>
                <Text className="text-[14px] font-bold text-[#263129]">{tongSoLuong}</Text>
              </View>
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-[13px] text-[#6B7A71]">Tạm tính</Text>
                <Text className="text-[14px] font-extrabold text-[#263129]">{dinhDangGia(tamTinh)}</Text>
              </View>
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-[13px] text-[#6B7A71]">Phí giao hàng</Text>
                <Text className="text-[13px] font-semibold text-[#405047]">Tính ở bước thanh toán</Text>
              </View>

              <View className="h-px bg-[#E3E9E5]" />

              <View className="flex-row items-end justify-between gap-3">
                <Text className="text-[15px] font-extrabold text-[#17251C]">Tổng dự kiến</Text>
                <Text className="text-[20px] font-extrabold text-[#075E3B]">{dinhDangGia(tamTinh)}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tiến hành thanh toán"
                accessibilityState={{ disabled: !choPhepThanhToan }}
                disabled={!choPhepThanhToan}
                onPress={() => router.push('/thanh-toan')}
                className={[
                  'min-h-[52px] flex-row items-center justify-center gap-2 rounded-xl bg-primary px-4',
                  choPhepThanhToan ? 'active:opacity-80' : 'opacity-40',
                ].join(' ')}
              >
                <Text className="text-[16px] font-extrabold text-white">Tiến hành thanh toán</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </Pressable>

              <Text className="text-[11px] leading-4 text-[#7C8880]">
                Giá và tồn kho được kiểm tra lại khi thanh toán.
              </Text>

              {!choPhepThanhToan && danhSachMuc.length > 0 ? (
                <Text className="text-[12px] leading-5 text-[#9A6B1A]">
                  {dangCapNhat
                    ? 'Đang cập nhật giỏ hàng…'
                    : `Có ${mucLoi.length} mục cần xử lý trước khi thanh toán.`}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
