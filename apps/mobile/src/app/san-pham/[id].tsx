import {
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductCardSkeleton,
  Skeleton,
} from '@/components/design-system';
import { GIO_HANG_MOBILE_QUERY_KEY, themMucGioHangMobile } from '@/lib/api-gio-hang';
import {
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  layWishlistTaiKhoanMobile,
  themWishlistTaiKhoanMobile,
  xoaWishlistTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import {
  layVaXoaHanhDongSauDangNhap,
  moDangNhap,
} from '@/lib/auth-navigation';
import { ghiNhanSanPhamDaXem } from '@/lib/da-xem-gan-day';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function dinhDangSoLuong(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function dinhDangQuyCach(khoiLuong: number, donVi: string): string {
  const unit = donVi.trim().toLowerCase();
  if (unit === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((unit === 'l' || unit === 'lít' || unit === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }
  return `${dinhDangSoLuong(khoiLuong)}${unit === 'quả' || unit === 'qua' ? ' quả' : unit}`;
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7ED]">
          <Ionicons name={icon} size={22} color={PRIMARY} />
        </View>
        <Text className="text-[21px] font-extrabold text-[#17251C]">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietSanPham() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);
  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);

  const wishlistQuery = useQuery({
    queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
    queryFn: layWishlistTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId, soLuong }: { bienTheSanPhamId: string; soLuong: number }) =>
      themMucGioHangMobile(bienTheSanPhamId, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
      setCtaMessage('Đã thêm vào giỏ hàng.');
    },
    onError: () => {
      setCtaMessage('Không thêm được vào giỏ. Hãy kiểm tra giá và tồn kho hiện tại.');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: ({ favorite }: { favorite: boolean }) =>
      favorite ? xoaWishlistTaiKhoanMobile(id) : themWishlistTaiKhoanMobile(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!daDangNhap || !id || themGioHangMutation.isPending) return;
    const returnTo = `/san-pham/${encodeURIComponent(id)}`;
    const pendingAction = layVaXoaHanhDongSauDangNhap(returnTo);
    if (!pendingAction || pendingAction.loai !== 'them-gio-hang') return;

    themGioHangMutation.mutate({
      bienTheSanPhamId: pendingAction.bienTheSanPhamId,
      soLuong: pendingAction.soLuong,
    });
  }, [daDangNhap, id]);

  const item = data?.data;

  useEffect(() => {
    if (!item?.id) return;
    void ghiNhanSanPhamDaXem(item.id);
  }, [item?.id]);

  const favorite = useMemo(
    () => wishlistQuery.data?.duLieu.some((wishlistItem) => wishlistItem.sanPhamId === id) ?? false,
    [id, wishlistQuery.data?.duLieu],
  );

  const bienTheDaChon = useMemo(() => {
    if (!item) return null;
    return item.bienThe.find((bienThe) => bienThe.id === bienTheDaChonId) ?? item.bienThe[0] ?? null;
  }, [item, bienTheDaChonId]);

  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort(
      (a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu,
    );
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;
  const related = relatedData?.data.duLieu ?? [];
  const thuHoach = item?.thuHoachGanNhatTaiTrangTrai ?? null;
  const coTheDatHang = Boolean(bienTheDaChon) && (bienTheDaChon?.soLuongKhaDung ?? 0) > 0;

  function moSanPham(productId: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id: productId } });
  }

  function toggleFavorite() {
    if (!id) return;
    if (!daDangNhap) {
      moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`);
      return;
    }
    if (!wishlistMutation.isPending) wishlistMutation.mutate({ favorite });
  }

  function themVaoGioHang() {
    if (!bienTheDaChon || !coTheDatHang) return;

    if (!daDangNhap) {
      const returnTo = `/san-pham/${encodeURIComponent(id)}`;
      setCtaMessage('Hãy đăng nhập để tiếp tục thêm sản phẩm vào giỏ.');
      moDangNhap(router, returnTo, {
        loai: 'them-gio-hang',
        returnTo,
        bienTheSanPhamId: bienTheDaChon.id,
        soLuong: 1,
      });
      return;
    }

    themGioHangMutation.mutate({ bienTheSanPhamId: bienTheDaChon.id, soLuong: 1 });
  }

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 py-3"><Skeleton height={46} borderRadius={14} /></View>
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 20, padding: 20 }}>
          <Skeleton height={340} borderRadius={24} />
          <Skeleton width="85%" height={34} />
          <Skeleton width="60%" height={24} />
          <ProductCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !item) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => quayLaiHoacVe(router, '/kham-pha')}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name="chevron-back" size={28} color={PRIMARY} />
          </Pressable>
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được sản phẩm"
            description="Sản phẩm có thể không còn công khai hoặc API đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-[#E7ECE9] bg-white px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => quayLaiHoacVe(router, '/kham-pha')}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
        >
          <Ionicons name="chevron-back" size={28} color={PRIMARY} />
        </Pressable>
        <Text numberOfLines={1} className="mx-2 flex-1 text-center text-[18px] font-extrabold text-[#17452F]">
          Chi tiết nông sản
        </Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onPress={toggleFavorite}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={25} color={favorite ? '#E6535F' : PRIMARY} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Giỏ hàng"
            onPress={() => router.push('/gio-hang')}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F2F7F4]"
          >
            <Ionicons name="cart-outline" size={25} color={PRIMARY} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 26, paddingBottom: 118 }}
      >
        <View className="gap-3">
          <View className="overflow-hidden bg-[#EFF6F1]">
            {anhDangXem ? (
              <Image
                source={{ uri: anhDangXem.url }}
                contentFit="cover"
                transition={150}
                style={{ width: '100%', height: 360 }}
              />
            ) : (
              <View className="h-[360px] items-center justify-center bg-[#EAF5EE]">
                <Ionicons name="leaf-outline" size={58} color={PRIMARY} />
                <Text className="mt-3 font-bold text-[#075E3B]">AgriMarket</Text>
                <Text className="mt-1 text-sm text-[#7C8880]">Sản phẩm chưa có ảnh công khai</Text>
              </View>
            )}

            <View className="absolute left-4 top-4 flex-row flex-wrap gap-2">
              {item.chungNhan.slice(0, 2).map((chungNhan) => (
                <View key={`${chungNhan.loai}-${chungNhan.ma}`} className="flex-row items-center gap-1.5 rounded-full bg-white/95 px-3 py-2">
                  <Ionicons name="shield-checkmark" size={15} color={PRIMARY} />
                  <Text className="text-[11px] font-extrabold text-[#075E3B]">{chungNhan.loai}</Text>
                </View>
              ))}
            </View>
          </View>

          {anhSapXep.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {anhSapXep.map((anh) => {
                const selected = anh.url === anhDangXem?.url;
                return (
                  <Pressable
                    key={`${anh.url}-${anh.thuTu}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setAnhDaChonUrl(anh.url)}
                    className={[
                      'overflow-hidden rounded-xl border-2',
                      selected ? 'border-primary' : 'border-[#E1E8E3]',
                    ].join(' ')}
                  >
                    <Image source={{ uri: anh.url }} contentFit="cover" style={{ width: 70, height: 70 }} />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View className="gap-4 px-5">
          <View className="flex-row flex-wrap gap-2">
            <Badge variant="neutral">{item.danhMuc.ten}</Badge>
            <Badge variant={item.khaDung.coTheDatHang ? 'success' : 'warning'}>
              {item.khaDung.coTheDatHang ? 'Có thể đặt hàng' : 'Tạm chưa thể đặt'}
            </Badge>
          </View>

          <Text className="text-[29px] font-extrabold leading-9 text-[#17251C]">{item.ten}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: item.trangTrai.id } })}
            className="flex-row items-center gap-2 active:opacity-70"
          >
            <Ionicons name="storefront-outline" size={18} color={PRIMARY} />
            <Text numberOfLines={1} className="flex-1 font-semibold text-[#4D5C53]">{item.trangTrai.ten} · {item.trangTrai.diaChi}</Text>
            <Ionicons name="chevron-forward" size={17} color={PRIMARY} />
          </Pressable>

          <View className="flex-row items-end gap-2 rounded-[18px] bg-[#F1FAF5] p-4">
            <Text className="text-[30px] font-extrabold text-[#087A4B]">
              {bienTheDaChon ? dinhDangGia(bienTheDaChon.gia) : dinhDangGia(item.gia.tu)}
            </Text>
            {bienTheDaChon ? (
              <Text className="pb-1 text-[12px] text-[#7C8880]">/ {dinhDangQuyCach(bienTheDaChon.khoiLuong, bienTheDaChon.donVi)}</Text>
            ) : null}
          </View>

          {item.moTa ? <Text className="text-[14px] leading-6 text-[#5F6D64]">{item.moTa}</Text> : null}
        </View>

        <View className="px-5">
          <Section title="Chọn quy cách" icon="options-outline">
            {item.bienThe.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {item.bienThe.map((bienThe) => {
                  const selected = bienThe.id === bienTheDaChon?.id;
                  const outOfStock = bienThe.soLuongKhaDung <= 0;
                  return (
                    <Pressable
                      key={bienThe.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: outOfStock }}
                      disabled={outOfStock}
                      onPress={() => {
                        setBienTheDaChonId(bienThe.id);
                        setCtaMessage(null);
                      }}
                      className={[
                        'min-w-[112px] rounded-[16px] border px-4 py-3',
                        selected ? 'border-primary bg-[#EAF7EF]' : 'border-[#DDE5E0] bg-white',
                        outOfStock ? 'opacity-40' : 'active:opacity-80',
                      ].join(' ')}
                    >
                      <Text className={selected ? 'font-extrabold text-[#075E3B]' : 'font-bold text-[#334139]'}>
                        {dinhDangQuyCach(bienThe.khoiLuong, bienThe.donVi)}
                      </Text>
                      <Text className="mt-1 text-[11px] text-[#7C8880]">{dinhDangGia(bienThe.gia)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState title="Chưa có biến thể" description="Hệ thống chưa trả biến thể có thể bán cho sản phẩm này." />
            )}
          </Section>
        </View>

        <View className="px-5">
          <Section title="Thông tin sản phẩm" icon="information-circle-outline">
            <View className="overflow-hidden rounded-[18px] border border-[#E1E8E3] bg-white">
              <View className="flex-row items-center justify-between gap-3 p-4">
                <Text className="text-[13px] text-[#718078]">Tồn khả dụng</Text>
                <Text className={coTheDatHang ? 'font-extrabold text-[#087A4B]' : 'font-extrabold text-[#D6454F]'}>
                  {bienTheDaChon ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} đơn vị` : item.khaDung.lyDo}
                </Text>
              </View>
              <View className="h-px bg-[#EEF2EF]" />
              <View className="flex-row items-center justify-between gap-3 p-4">
                <Text className="text-[13px] text-[#718078]">Mã trang trại</Text>
                <Text className="font-bold text-[#334139]">{item.trangTrai.ma}</Text>
              </View>
              {item.gia.tu !== item.gia.den ? (
                <>
                  <View className="h-px bg-[#EEF2EF]" />
                  <View className="flex-row items-center justify-between gap-3 p-4">
                    <Text className="text-[13px] text-[#718078]">Khoảng giá</Text>
                    <Text className="font-bold text-[#334139]">{dinhDangGia(item.gia.tu)} – {dinhDangGia(item.gia.den)}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Trang trại" icon="business-outline">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: item.trangTrai.id } })}
              className="flex-row items-center gap-4 rounded-[20px] border border-[#DCE7DF] bg-[#F7FAF8] p-4 active:opacity-80"
            >
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E1F2E7]">
                <Ionicons name="leaf" size={32} color={PRIMARY} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-extrabold text-[#202A24]">{item.trangTrai.ten}</Text>
                <Text numberOfLines={2} className="mt-1 text-[12px] leading-5 text-[#718078]">{item.trangTrai.diaChi}</Text>
                <Text className="mt-2 font-bold text-[#087A4B]">Xem trang trại →</Text>
              </View>
            </Pressable>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Thu hoạch" icon="basket-outline">
            {thuHoach ? (
              <View className="gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
                    <Text className="text-[11px] text-[#859088]">Ngày thu hoạch</Text>
                    <Text className="mt-1 font-extrabold text-[#263129]">{thuHoach.ngayThuHoach}</Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-[#F7FAF8] p-3">
                    <Text className="text-[11px] text-[#859088]">Phân loại</Text>
                    <Text className="mt-1 font-extrabold text-[#263129]">{thuHoach.phanLoai}</Text>
                  </View>
                </View>
                <Text className="text-[13px] text-[#617168]">{thuHoach.cayTrong} · giống {thuHoach.giong}</Text>
              </View>
            ) : (
              <EmptyState title="Chưa có thông tin thu hoạch" description="Hệ thống chưa trả dữ liệu thu hoạch gần nhất cho trang trại này." />
            )}
          </Section>
        </View>

        {item.chungNhan.length > 0 ? (
          <View className="px-5">
            <Section title="Chứng nhận" icon="ribbon-outline">
              <View className="gap-3">
                {item.chungNhan.map((chungNhan) => (
                  <View key={`${chungNhan.loai}-${chungNhan.ma}`} className="flex-row items-start gap-3 rounded-[18px] border border-[#DCE7DF] bg-white p-4">
                    <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E8F7ED]">
                      <Ionicons name="shield-checkmark" size={23} color={PRIMARY} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-extrabold text-[#075E3B]">{chungNhan.loai}</Text>
                      <Text className="mt-1 text-[12px] text-[#55635A]">{chungNhan.donViCap}</Text>
                      <Text className="mt-1 text-[11px] text-[#879189]">Mã {chungNhan.ma} · hết hạn {chungNhan.ngayHetHan}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          </View>
        ) : null}

        <View className="px-5">
          <Section title="Truy xuất nguồn gốc" icon="qr-code-outline">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/quet-qr')}
              className="flex-row items-center gap-4 rounded-[20px] bg-[#075E3B] p-5 active:opacity-85"
            >
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <Ionicons name="qr-code-outline" size={32} color="#FFFFFF" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[17px] font-extrabold text-white">Quét đúng mã trên lô bạn đang cầm</Text>
                <Text className="mt-1 text-[12px] leading-5 text-white/75">Mã truy xuất thuộc từng lô/QR cụ thể, không gán giả cho toàn bộ sản phẩm.</Text>
              </View>
              <Ionicons name="chevron-forward" size={23} color="#FFFFFF" />
            </Pressable>
          </Section>
        </View>

        <View className="px-5">
          <Section title="Có thể bạn cũng quan tâm" icon="sparkles-outline">
            {relatedPending ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                <View style={{ width: 220 }}><ProductCardSkeleton /></View>
                <View style={{ width: 220 }}><ProductCardSkeleton /></View>
              </ScrollView>
            ) : related.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
                {related.map((product) => (
                  <View key={product.id} style={{ width: 220 }}>
                    <ProductCard
                      name={product.ten}
                      farmName={product.trangTrai.ten}
                      price={product.gia.tu}
                      unit={dinhDangQuyCach(product.quyCach.khoiLuong, product.quyCach.donVi)}
                      imageUrl={product.anhBiaUrl}
                      badges={[{ label: product.chungNhan[0]?.loai ?? product.danhMuc.ten, variant: product.chungNhan.length > 0 ? 'success' : 'neutral' }]}
                      favorite={wishlistQuery.data?.duLieu.some((wish) => wish.sanPhamId === product.id) ?? false}
                      onFavorite={() => {
                        if (!daDangNhap) {
                          moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`);
                          return;
                        }
                        const isFavorite = wishlistQuery.data?.duLieu.some((wish) => wish.sanPhamId === product.id) ?? false;
                        const action = isFavorite ? xoaWishlistTaiKhoanMobile(product.id) : themWishlistTaiKhoanMobile(product.id);
                        void action.then(() => queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY }));
                      }}
                      onPress={() => moSanPham(product.id)}
                    />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <EmptyState title="Chưa có sản phẩm liên quan" description="Hệ thống chưa trả sản phẩm liên quan cho danh mục này." />
            )}
          </Section>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-[#E4EAE6] bg-white px-5 pb-3 pt-3">
        {ctaMessage ? <Text className="mb-2 text-center text-[11px] text-[#68756D]">{ctaMessage}</Text> : null}
        <View className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[11px] text-[#7C8880]">
              {bienTheDaChon ? dinhDangQuyCach(bienTheDaChon.khoiLuong, bienTheDaChon.donVi) : 'Chưa có biến thể'}
            </Text>
            <Text className="text-[21px] font-extrabold text-[#087A4B]">
              {bienTheDaChon ? dinhDangGia(bienTheDaChon.gia) : dinhDangGia(item.gia.tu)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!coTheDatHang || themGioHangMutation.isPending}
            onPress={themVaoGioHang}
            className={[
              'min-h-[54px] min-w-[170px] flex-row items-center justify-center gap-2 rounded-[18px] bg-primary px-5',
              coTheDatHang && !themGioHangMutation.isPending ? 'active:opacity-80' : 'opacity-40',
            ].join(' ')}
          >
            <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
            <Text className="font-extrabold text-white">
              {themGioHangMutation.isPending ? 'Đang thêm…' : coTheDatHang ? 'Thêm vào giỏ' : 'Tạm hết hàng'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
