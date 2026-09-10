import {
  layChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
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

import {
  CategoryGrid,
  HeroBanner,
  HomeHeader,
  HomeLowerSections,
  QuickActions,
  SearchBar,
  SmartProductImage,
} from '@/components/home';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  layGioHangMobile,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { GOI_Y_MOBILE_QUERY_KEY, layGoiYSanPhamMobile } from '@/lib/api-goi-y';
import { DIA_CHI_TAI_KHOAN_QUERY_KEY, layDiaChiTaiKhoanMobile } from '@/lib/api-tai-khoan';
import { THONG_BAO_IN_APP_QUERY_KEY, layThongBaoInAppMobile } from '@/lib/api-thong-bao';
import { laySanPhamDaXemGanDay } from '@/lib/da-xem-gan-day';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GREEN = '#087A4B';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type HomeProduct = {
  id: string;
  ten: string;
  anhBiaUrl?: string | null;
  gia: { tu: number };
  quyCach?: { khoiLuong: number; donVi: string };
  danhMuc?: { ten: string };
  trangTrai: { id?: string; ten: string; diaChi?: string | null };
  chungNhan?: Array<{ loai?: string | null }>;
  khaDung?: { coTheDatHang?: boolean };
};

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function dinhDangQuyCach(quyCach?: { khoiLuong: number; donVi: string }): string | null {
  if (!quyCach || !Number.isFinite(quyCach.khoiLuong) || quyCach.khoiLuong <= 0) return null;

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

function chuanHoaAnhUrl(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (raw.startsWith('data:') || raw.startsWith('file:')) return raw;

  if (/^https?:\/\//i.test(raw)) {
    return raw
      .replace('://localhost:', '://127.0.0.1:')
      .replace('://0.0.0.0:', '://127.0.0.1:');
  }

  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${path}`;
}

function SectionHeader({
  title,
  subtitle,
  onViewAll,
}: {
  title: string;
  subtitle: string;
  onViewAll: () => void;
}) {
  return (
    <View className="mb-3 gap-1">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[22px] font-extrabold tracking-[-0.4px] text-[#17251C]">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onViewAll}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-sm font-semibold text-[#087A4B]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color={GREEN} />
        </Pressable>
      </View>
      <Text className="text-sm text-[#89918C]">{subtitle}</Text>
    </View>
  );
}

function ProductSkeleton({ width }: { width: number }) {
  return (
    <View
      style={{ width }}
      className="overflow-hidden rounded-[18px] border border-[#EEF1EF] bg-white"
    >
      <View className="h-[112px] bg-[#EEF3EF]" />
      <View className="gap-2 p-3">
        <View className="h-4 w-4/5 rounded-full bg-[#E9EEEB]" />
        <View className="h-3 w-3/5 rounded-full bg-[#F0F3F1]" />
        <View className="mt-1 h-5 w-2/5 rounded-full bg-[#E8F5ED]" />
      </View>
    </View>
  );
}

function HomeProductCard({
  item,
  width,
  onPress,
  onAddToCart,
  isAdding,
}: {
  item: HomeProduct;
  width: number;
  onPress: () => void;
  onAddToCart: () => void;
  isAdding?: boolean;
}) {
  const certificate = item.chungNhan?.find((cert) => cert.loai)?.loai;
  const badge = certificate || item.danhMuc?.ten;
  const imageUri = chuanHoaAnhUrl(item.anhBiaUrl);
  const quyCach = dinhDangQuyCach(item.quyCach);
  const disabled = isAdding || item.khaDung?.coTheDatHang === false;

  return (
    <View
      style={{ width }}
      className="overflow-hidden rounded-[18px] border border-[#E8ECE9] bg-white"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem ${item.ten}`}
        onPress={onPress}
        className="active:opacity-90"
      >
        <View className="relative h-[118px] overflow-hidden bg-[#EAF5EE]">
          <SmartProductImage uri={imageUri} name={item.ten} />
          {badge ? (
            <View className="absolute left-2 top-2 max-w-[130px] flex-row items-center gap-1 rounded-lg bg-[#F1FAF5] px-2 py-[5px]">
              {certificate ? <Ionicons name="shield-checkmark" size={13} color={GREEN} /> : null}
              <Text numberOfLines={1} className="text-[10px] font-bold text-[#087A4B]">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1 px-3 pt-3">
          <Text numberOfLines={1} className="text-[15px] font-extrabold text-[#263129]">
            {item.ten}
          </Text>
          <Text numberOfLines={1} className="text-[12px] text-[#858D88]">
            {item.trangTrai.ten}
            {item.trangTrai.diaChi ? ` · ${item.trangTrai.diaChi}` : ''}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-end justify-between gap-2 px-3 pb-3 pt-3">
        <View className="min-w-0 flex-1 flex-row items-end">
          <Text numberOfLines={1} className="text-[19px] font-extrabold text-[#087A4B]">
            {dinhDangGia(item.gia.tu)}
          </Text>
          {quyCach ? (
            <Text className="pb-[2px] pl-1 text-[10px] text-[#89918C]">/ {quyCach}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${item.ten} vào giỏ`}
          onPress={onAddToCart}
          disabled={disabled}
          hitSlop={6}
          className={[
            'h-10 w-10 items-center justify-center rounded-full bg-[#087A4B] active:opacity-70',
            disabled ? 'opacity-40' : '',
          ].join(' ')}
        >
          <Ionicons name={isAdding ? 'hourglass' : 'add'} size={27} color="#FFFFFF" />
        </Pressable>
      </View>
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
  onRetry,
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
  onRetry: () => void;
  isAdding?: boolean;
}) {
  return (
    <View className="pt-1">
      <SectionHeader title={title} subtitle={subtitle} onViewAll={onViewAll} />
      {pending ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 8 }}
        >
          <ProductSkeleton width={cardWidth} />
          <ProductSkeleton width={cardWidth} />
        </ScrollView>
      ) : products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 8 }}
        >
          {products.map((item) => (
            <HomeProductCard
              key={item.id}
              item={item}
              width={cardWidth}
              onPress={() => onProductPress(item.id)}
              onAddToCart={() => onAddToCart(item.id)}
              isAdding={isAdding}
            />
          ))}
        </ScrollView>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          className="items-center rounded-[18px] border border-[#E6ECE8] bg-[#FAFCFB] px-4 py-7 active:opacity-70"
        >
          <Ionicons name="leaf-outline" size={26} color={GREEN} />
          <Text className="mt-2 font-bold text-[#263129]">Chưa có sản phẩm phù hợp</Text>
          <Text className="mt-1 text-sm text-[#89918C]">Chạm để tải lại dữ liệu</Text>
        </Pressable>
      )}
    </View>
  );
}

function TrustStrip({
  onTrace,
  onFarm,
  onQuality,
}: {
  onTrace: () => void;
  onFarm: () => void;
  onQuality: () => void;
}) {
  const items = [
    {
      title: 'Truy xuất nguồn gốc',
      subtitle: 'Rõ ràng, minh bạch',
      icon: 'shield-checkmark-outline' as const,
      onPress: onTrace,
    },
    {
      title: 'Trang trại minh bạch',
      subtitle: 'Kết nối trực tiếp',
      icon: 'home-outline' as const,
      onPress: onFarm,
    },
    {
      title: 'Kiểm định chất lượng',
      subtitle: 'Thông tin công khai',
      icon: 'ribbon-outline' as const,
      onPress: onQuality,
    },
  ];

  return (
    <View className="flex-row overflow-hidden rounded-[18px] bg-[#EFF9F2]">
      {items.map((item, index) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          accessibilityLabel={item.title}
          onPress={item.onPress}
          className={[
            'min-w-0 flex-1 items-center px-2 py-4 active:opacity-70',
            index > 0 ? 'border-l border-[#D8EDE0]' : '',
          ].join(' ')}
        >
          <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-white/70">
            <Ionicons name={item.icon} size={25} color={GREEN} />
          </View>
          <Text
            numberOfLines={2}
            className="min-h-[30px] text-center text-[10px] font-extrabold leading-[13px] text-[#075E3B]"
          >
            {item.title}
          </Text>
          <Text numberOfLines={1} className="mt-1 w-full text-center text-[8px] text-[#7C8880]">
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
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
  const cardWidth = Math.min(184, Math.max(166, (screenWidth - 58) / 2));

  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const thuHoachQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 8,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
    thuHoachTu: ngayIsoTruoc(30),
  });
  const moiNhatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 20,
    khaDung: 'CON_HANG',
    sapXep: 'MOI_NHAT',
  });
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 8,
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

  const categories = useMemo(
    () =>
      (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 8).map((item, index) => ({
        id: `${index}-${item.value}`,
        ten: item.label,
        slug: item.value,
      })),
    [facetsQuery.data],
  );

  const thuHoachApi = (
    thuHoachQuery.data?.data?.duLieu?.length
      ? thuHoachQuery.data.data.duLieu
      : (moiNhatQuery.data?.data?.duLieu ?? []).slice(0, 8)
  ) as HomeProduct[];
  const noiBatApi = (noiBatQuery.data?.data?.duLieu ?? []) as HomeProduct[];
  const moiNhatApi = (moiNhatQuery.data?.data?.duLieu ?? []) as HomeProduct[];
  const goiYApi = useMemo(
    () => (goiYQuery.data?.duLieu.map((item) => item.sanPham) ?? []) as HomeProduct[],
    [goiYQuery.data],
  );
  const coGoiYCaNhan = goiYQuery.data?.caNhanHoa === true && goiYApi.length > 0;
  const sanPhamNoiBat = coGoiYCaNhan ? goiYApi : noiBatApi;

  const recentIdsQuery = useQuery({
    queryKey: ['home-mobile', 'recent-product-ids'],
    queryFn: laySanPhamDaXemGanDay,
    staleTime: 0,
  });
  const recentProductQueries = useQueries({
    queries: (recentIdsQuery.data ?? []).slice(0, 4).map((productId) => ({
      queryKey: ['home-mobile', 'recent-product', productId],
      queryFn: () => layChiTietSanPhamCongKhai(productId),
      staleTime: 60_000,
    })),
  });
  const recentProducts = recentProductQueries
    .map((query) => query.data?.data as HomeProduct | undefined)
    .filter((item): item is HomeProduct => Boolean(item));

  const lowerProducts = useMemo(() => {
    const map = new Map<string, HomeProduct>();
    for (const item of [...goiYApi, ...noiBatApi, ...thuHoachApi, ...moiNhatApi]) {
      map.set(item.id, item);
    }
    return [...map.values()].slice(0, 24);
  }, [goiYApi, noiBatApi, thuHoachApi, moiNhatApi]);

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId, soLuong }: { bienTheSanPhamId: string; soLuong: number }) =>
      themMucGioHangMobile(bienTheSanPhamId, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
    },
  });

  const cartQuery = useQuery({
    queryKey: GIO_HANG_MOBILE_QUERY_KEY,
    queryFn: layGioHangMobile,
    enabled: daDangNhap,
    staleTime: 0,
  });
  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 60_000,
  });
  const thongBaoQuery = useQuery({
    queryKey: THONG_BAO_IN_APP_QUERY_KEY,
    queryFn: layThongBaoInAppMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const cartCount = useMemo(
    () => (cartQuery.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [cartQuery.data],
  );
  const diaChiMacDinh = useMemo(
    () => diaChiQuery.data?.find((diaChi) => diaChi.macDinh) ?? diaChiQuery.data?.[0] ?? null,
    [diaChiQuery.data],
  );
  const viTriGiaoHang =
    diaChiMacDinh?.tinhThanh || (daDangNhap ? 'Chọn địa chỉ' : 'Thiết lập địa chỉ');
  const soThongBao = daDangNhap ? thongBaoQuery.data?.tong ?? 0 : undefined;

  const refreshing =
    facetsQuery.isFetching ||
    thuHoachQuery.isFetching ||
    moiNhatQuery.isFetching ||
    noiBatQuery.isFetching ||
    (daDangNhap && goiYQuery.isFetching);

  async function themVaoGioHang(id: string) {
    let item;
    try {
      const response = await layChiTietSanPhamCongKhai(id);
      item = response.data;
    } catch {
      return;
    }

    if (!item || item.khaDung.coTheDatHang === false || item.khaDung.soLuongKhaDung <= 0) return;

    const bienTheHopLe = item.bienThe.filter((bienThe) => bienThe.soLuongKhaDung > 0);
    if (bienTheHopLe.length === 0) return;

    if (bienTheHopLe.length === 1) {
      if (!daDangNhap) {
        moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`, {
          loai: 'them-gio-hang',
          returnTo: `/san-pham/${encodeURIComponent(id)}`,
          bienTheSanPhamId: bienTheHopLe[0]!.id,
          soLuong: 1,
        });
        return;
      }

      themGioHangMutation.mutate({ bienTheSanPhamId: bienTheHopLe[0]!.id, soLuong: 1 });
      return;
    }

    router.push({ pathname: '/san-pham/[id]', params: { id } });
  }

  function moSanPham(id: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id } });
  }

  function moKhamPha(danhMuc?: string) {
    router.push({ pathname: '/kham-pha', params: danhMuc ? { danhMuc } : {} });
  }

  function refreshHome() {
    const queries: Promise<unknown>[] = [
      facetsQuery.refetch(),
      thuHoachQuery.refetch(),
      moiNhatQuery.refetch(),
      noiBatQuery.refetch(),
      recentIdsQuery.refetch(),
    ];

    if (daDangNhap) {
      queries.push(
        goiYQuery.refetch(),
        cartQuery.refetch(),
        diaChiQuery.refetch(),
        thongBaoQuery.refetch(),
      );
    }

    void Promise.all(queries);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHome}
            tintColor={GREEN}
            colors={[GREEN]}
          />
        }
        contentContainerStyle={{
          paddingBottom: Math.max(30, insets.bottom + 18),
          flexGrow: 1,
        }}
      >
        <View className="gap-4 px-5 pt-3">
          <HomeHeader
            location={viTriGiaoHang}
            notificationCount={soThongBao}
            cartCount={cartCount}
            onLocationPress={() =>
              daDangNhap ? router.push('/tai-khoan/dia-chi') : moDangNhap(router, '/')
            }
            onNotificationPress={() =>
              daDangNhap ? router.push('/tai-khoan/thong-bao') : moDangNhap(router, '/')
            }
            onCartPress={() => router.push('/gio-hang')}
          />

          <SearchBar placeholder="Tìm rau củ, trái cây, trang trại..." onPress={() => moKhamPha()} />
          <HeroBanner onPress={() => moKhamPha()} />
          <QuickActions />
          <CategoryGrid
            categories={categories}
            onPress={(slug) => moKhamPha(slug)}
            onViewAll={() => moKhamPha()}
          />
          <TrustStrip
            onTrace={() => router.push('/quet-qr')}
            onFarm={() => moKhamPha()}
            onQuality={() => moKhamPha()}
          />
          <ProductSection
            title="Mới thu hoạch"
            subtitle="Nông sản tươi từ dữ liệu công khai của trang trại"
            products={thuHoachApi}
            pending={thuHoachQuery.isPending && moiNhatQuery.isPending}
            cardWidth={cardWidth}
            onViewAll={() => moKhamPha()}
            onProductPress={moSanPham}
            onAddToCart={themVaoGioHang}
            onRetry={refreshHome}
            isAdding={themGioHangMutation.isPending}
          />
          <ProductSection
            title={coGoiYCaNhan ? 'Gợi ý cho bạn' : 'Sản phẩm nổi bật'}
            subtitle={
              coGoiYCaNhan
                ? 'Đề xuất theo lịch sử mua sắm, yêu thích và trang trại bạn quan tâm'
                : 'Những sản phẩm đang sẵn sàng đặt hàng'
            }
            products={sanPhamNoiBat}
            pending={noiBatQuery.isPending || (daDangNhap && goiYQuery.isPending)}
            cardWidth={cardWidth}
            onViewAll={() => (coGoiYCaNhan ? router.push('/goi-y') : moKhamPha())}
            onProductPress={moSanPham}
            onAddToCart={themVaoGioHang}
            onRetry={refreshHome}
            isAdding={themGioHangMutation.isPending}
          />
          <HomeLowerSections
            products={lowerProducts}
            recentProducts={recentProducts}
            onProductPress={moSanPham}
            onAddToCart={themVaoGioHang}
            isAdding={themGioHangMutation.isPending}
          />
        </View>
      </ScrollView>
    </View>
  );
}
