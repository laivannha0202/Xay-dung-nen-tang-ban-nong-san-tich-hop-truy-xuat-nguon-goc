import {
  layChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import heroImage from '../../../assets/images/home/hero-agri.png';
import { ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { GOI_Y_MOBILE_QUERY_KEY, layGoiYSanPhamMobile } from '@/lib/api-goi-y';
import { DIA_CHI_TAI_KHOAN_QUERY_KEY, layDiaChiTaiKhoanMobile } from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GREEN = '#087A4B';

const CATEGORY_ICONS = [
  'leaf-outline',
  'nutrition-outline',
  'basket-outline',
  'flower-outline',
  'water-outline',
  'restaurant-outline',
  'sunny-outline',
  'storefront-outline',
] as const;

const TRUST_ITEMS = [
  { icon: 'shield-checkmark-outline', title: 'Nguồn gốc', subtitle: 'Minh bạch' },
  { icon: 'storefront-outline', title: 'Trang trại', subtitle: 'Xác thực' },
  { icon: 'ribbon-outline', title: 'Chất lượng', subtitle: 'Công khai' },
] as const;

type HomeProduct = {
  id: string;
  ten: string;
  anhBiaUrl?: string | null;
  gia: { tu: number };
  quyCach?: { khoiLuong: number; donVi: string };
  danhMuc?: { ten: string };
  trangTrai: { id?: string; ten: string; diaChi?: string | null };
  chungNhan?: Array<{ loai?: string | null }>;
  khaDung?: { coTheDatHang?: boolean; soLuongKhaDung?: number };
};

function dinhDangQuyCach(quyCach?: { khoiLuong: number; donVi: string }): string {
  if (!quyCach || !Number.isFinite(quyCach.khoiLuong) || quyCach.khoiLuong <= 0) {
    return 'sản phẩm';
  }

  const donVi = quyCach.donVi.trim().toLowerCase();
  const khoiLuong = quyCach.khoiLuong;
  if (donVi === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((donVi === 'l' || donVi === 'lít' || donVi === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }

  const soLuong = Number.isInteger(khoiLuong)
    ? String(khoiLuong)
    : String(Number(khoiLuong.toFixed(2)));
  return `${soLuong}${donVi === 'quả' || donVi === 'qua' ? ' quả' : donVi}`;
}

function ngayIsoTruoc(soNgay: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - soNgay);
  return date.toISOString().slice(0, 10);
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'qr-code-outline' | 'compass-outline' | 'receipt-outline' | 'notifications-outline';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-1 items-center active:opacity-70"
    >
      <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-[#EDF8F2]">
        <Ionicons name={icon} size={25} color={GREEN} />
      </View>
      <Text numberOfLines={1} className="mt-2 text-[11px] font-bold text-[#34443B]">
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeader({ title, subtitle, onViewAll }: { title: string; subtitle: string; onViewAll: () => void }) {
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[21px] font-extrabold tracking-[-0.3px] text-[#17251C]">{title}</Text>
        <Pressable onPress={onViewAll} hitSlop={7} className="flex-row items-center gap-1 active:opacity-65">
          <Text className="text-[12px] font-bold text-[#087A4B]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color={GREEN} />
        </Pressable>
      </View>
      <Text className="mt-1 text-[12px] leading-4 text-[#7C8880]">{subtitle}</Text>
    </View>
  );
}

function ProductSection({
  title,
  subtitle,
  products,
  pending,
  cardWidth,
  onViewAll,
  onProductPress,
  onAddToCart,
  isAdding,
}: {
  title: string;
  subtitle: string;
  products: HomeProduct[];
  pending: boolean;
  cardWidth: number;
  onViewAll: () => void;
  onProductPress: (id: string) => void;
  onAddToCart: (id: string) => void;
  isAdding: boolean;
}) {
  if (!pending && products.length === 0) return null;

  return (
    <View>
      <SectionHeader title={title} subtitle={subtitle} onViewAll={onViewAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 18 }}
      >
        {pending
          ? [0, 1].map((key) => (
              <View key={key} style={{ width: cardWidth }}>
                <ProductCardSkeleton />
              </View>
            ))
          : products.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <ProductCard
                  name={item.ten}
                  farmName={`${item.trangTrai.ten}${item.trangTrai.diaChi ? ` · ${item.trangTrai.diaChi}` : ''}`}
                  price={item.gia.tu}
                  unit={dinhDangQuyCach(item.quyCach)}
                  imageUrl={item.anhBiaUrl}
                  badges={[
                    {
                      label: item.chungNhan?.[0]?.loai ?? item.danhMuc?.ten ?? 'Nông sản',
                      variant: item.chungNhan?.length ? 'success' : 'neutral',
                    },
                  ]}
                  disabled={isAdding || item.khaDung?.coTheDatHang === false}
                  onAddToCart={() => onAddToCart(item.id)}
                  onPress={() => onProductPress(item.id)}
                />
              </View>
            ))}
      </ScrollView>
    </View>
  );
}

export default function TrangChu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';
  const cardWidth = Math.min(182, Math.max(158, (screenWidth - 50) / 2));

  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const thuHoachQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 8,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
    thuHoachTu: ngayIsoTruoc(30),
  });
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 12,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });
  const goiYQuery = useQuery({
    queryKey: [...GOI_Y_MOBILE_QUERY_KEY, 8],
    queryFn: () => layGoiYSanPhamMobile(8),
    enabled: daDangNhap,
    staleTime: 60_000,
    retry: 1,
  });
  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 60_000,
  });

  const categories = useMemo(
    () => (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 10),
    [facetsQuery.data],
  );
  const thuHoach = (thuHoachQuery.data?.data?.duLieu ?? []) as HomeProduct[];
  const thuHoachIds = useMemo(() => new Set(thuHoach.map((item) => item.id)), [thuHoach]);
  const noiBat = useMemo(
    () => ((noiBatQuery.data?.data?.duLieu ?? []) as HomeProduct[]).filter((item) => !thuHoachIds.has(item.id)),
    [noiBatQuery.data, thuHoachIds],
  );
  const goiY = useMemo(
    () => (goiYQuery.data?.duLieu.map((item) => item.sanPham) ?? []) as HomeProduct[],
    [goiYQuery.data],
  );

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId }: { bienTheSanPhamId: string }) =>
      themMucGioHangMobile(bienTheSanPhamId, 1),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
    },
  });

  const diaChiMacDinh = useMemo(
    () => diaChiQuery.data?.find((diaChi) => diaChi.macDinh) ?? diaChiQuery.data?.[0] ?? null,
    [diaChiQuery.data],
  );
  const viTriGiaoHang = diaChiMacDinh?.tinhThanh || (daDangNhap ? 'Chọn địa chỉ giao hàng' : 'Thiết lập địa chỉ');

  async function themVaoGioHang(id: string) {
    let item;
    try {
      const response = await layChiTietSanPhamCongKhai(id);
      item = response.data;
    } catch {
      return;
    }

    if (!item?.khaDung.coTheDatHang || item.khaDung.soLuongKhaDung <= 0) return;
    const bienTheHopLe = item.bienThe.filter((bienThe) => bienThe.soLuongKhaDung > 0);
    if (bienTheHopLe.length === 0) return;

    if (bienTheHopLe.length > 1) {
      router.push({ pathname: '/san-pham/[id]', params: { id } });
      return;
    }

    const bienThe = bienTheHopLe[0];
    if (!bienThe) return;

    if (!daDangNhap) {
      moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`, {
        loai: 'them-gio-hang',
        returnTo: `/san-pham/${encodeURIComponent(id)}`,
        bienTheSanPhamId: bienThe.id,
        soLuong: 1,
      });
      return;
    }

    themGioHangMutation.mutate({ bienTheSanPhamId: bienThe.id });
  }

  function moSanPham(id: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id } });
  }

  function moKhamPha(danhMuc?: string) {
    router.push({ pathname: '/kham-pha', params: danhMuc ? { danhMuc } : {} });
  }

  function refreshHome() {
    void Promise.all([
      facetsQuery.refetch(),
      thuHoachQuery.refetch(),
      noiBatQuery.refetch(),
      daDangNhap ? goiYQuery.refetch() : Promise.resolve(),
      daDangNhap ? diaChiQuery.refetch() : Promise.resolve(),
    ]);
  }

  const refreshing =
    facetsQuery.isFetching ||
    thuHoachQuery.isFetching ||
    noiBatQuery.isFetching ||
    (daDangNhap && goiYQuery.isFetching);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAF8', paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshHome} tintColor={GREEN} colors={[GREEN]} />}
        contentContainerStyle={{ paddingBottom: Math.max(28, insets.bottom + 18) }}
      >
        <View className="bg-white px-5 pb-4 pt-2">
          <MobileBrandBar />

          <Pressable
            accessibilityRole="button"
            onPress={() => (daDangNhap ? router.push('/tai-khoan/dia-chi') : moDangNhap(router, '/'))}
            className="mt-3 flex-row items-center gap-2 active:opacity-70"
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-[#EDF8F2]">
              <Ionicons name="location" size={17} color={GREEN} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[10px] font-semibold uppercase tracking-[0.6px] text-[#839087]">Giao đến</Text>
              <Text numberOfLines={1} className="mt-0.5 text-[14px] font-extrabold text-[#213128]">{viTriGiaoHang}</Text>
            </View>
            <Ionicons name="chevron-down" size={17} color="#5C6A61" />
          </Pressable>

          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Tìm nông sản"
            onPress={() => moKhamPha()}
            className="mt-4 flex-row items-center gap-3 rounded-[16px] bg-[#F1F5F2] px-4 py-3.5 active:opacity-75"
          >
            <Ionicons name="search-outline" size={21} color="#68776E" />
            <Text className="flex-1 text-[14px] text-[#87928B]">Tìm rau củ, trái cây, trang trại...</Text>
          </Pressable>
        </View>

        <View className="gap-6 px-5 pt-5">
          <Pressable onPress={() => moKhamPha()} className="overflow-hidden rounded-[22px] active:opacity-95">
            <Image source={heroImage} contentFit="cover" style={{ width: '100%', aspectRatio: 712 / 274 }} />
          </Pressable>

          <View className="flex-row justify-between gap-2">
            <QuickAction label="Quét QR" icon="qr-code-outline" onPress={() => router.push('/quet-qr')} />
            <QuickAction label="Khám phá" icon="compass-outline" onPress={() => moKhamPha()} />
            <QuickAction label="Đơn hàng" icon="receipt-outline" onPress={() => router.push('/don-hang')} />
            <QuickAction label="Thông báo" icon="notifications-outline" onPress={() => router.push('/tai-khoan/thong-bao')} />
          </View>

          <View>
            <SectionHeader title="Danh mục" subtitle="Khám phá nông sản theo nhóm" onViewAll={() => moKhamPha()} />
            {facetsQuery.isPending ? (
              <View className="flex-row gap-3">
                {[0, 1, 2, 3].map((key) => <View key={key} className="h-[82px] w-[72px] rounded-[18px] bg-[#EEF3F0]" />)}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 18 }}>
                {categories.map((item, index) => (
                  <Pressable
                    key={item.value}
                    onPress={() => moKhamPha(item.value)}
                    style={{ width: 76 }}
                    className="items-center active:opacity-70"
                  >
                    <View className="h-14 w-14 items-center justify-center rounded-[18px] border border-[#DFEAE3] bg-[#F1F8F4]">
                      <Ionicons name={CATEGORY_ICONS[index % CATEGORY_ICONS.length]} size={24} color={GREEN} />
                    </View>
                    <Text numberOfLines={2} className="mt-2 min-h-[30px] text-center text-[10px] font-bold leading-[13px] text-[#425047]">
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View className="flex-row overflow-hidden rounded-[18px] border border-[#DDEBE2] bg-[#EFF8F3]">
            {TRUST_ITEMS.map((item, index) => (
              <View key={item.title} className={`flex-1 items-center px-2 py-4 ${index > 0 ? 'border-l border-[#DDEBE2]' : ''}`}>
                <Ionicons name={item.icon} size={22} color={GREEN} />
                <Text className="mt-2 text-[10px] font-extrabold text-[#17613F]">{item.title}</Text>
                <Text className="mt-0.5 text-[9px] text-[#7B8880]">{item.subtitle}</Text>
              </View>
            ))}
          </View>

          <ProductSection
            title="Mới thu hoạch"
            subtitle="Nông sản tươi đang sẵn sàng đặt hàng"
            products={thuHoach}
            pending={thuHoachQuery.isPending}
            cardWidth={cardWidth}
            onViewAll={() => moKhamPha()}
            onProductPress={moSanPham}
            onAddToCart={(id) => void themVaoGioHang(id)}
            isAdding={themGioHangMutation.isPending}
          />

          <ProductSection
            title="Sản phẩm nổi bật"
            subtitle="Gợi ý từ nguồn cung đang hoạt động"
            products={noiBat}
            pending={noiBatQuery.isPending}
            cardWidth={cardWidth}
            onViewAll={() => moKhamPha()}
            onProductPress={moSanPham}
            onAddToCart={(id) => void themVaoGioHang(id)}
            isAdding={themGioHangMutation.isPending}
          />

          {daDangNhap ? (
            <ProductSection
              title="Dành cho bạn"
              subtitle="Cá nhân hóa theo hoạt động mua sắm của bạn"
              products={goiY}
              pending={goiYQuery.isPending}
              cardWidth={cardWidth}
              onViewAll={() => router.push('/goi-y')}
              onProductPress={moSanPham}
              onAddToCart={(id) => void themVaoGioHang(id)}
              isAdding={themGioHangMutation.isPending}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
