import {
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
  layChiTietSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  layGioHangMobile,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';
import { moDangNhap } from '@/lib/auth-navigation';

const GREEN = '#0B8F4D';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

type HomeProduct = {
  id: string;
  ten: string;
  anhBiaUrl?: string | null;
  gia: {
    tu: number;
  };
  trangTrai: {
    ten: string;
    diaChi?: string | null;
  };
  chungNhan?: Array<{
    loai?: string | null;
  }>;
  khaDung?: {
    coTheDatHang?: boolean;
  };
};

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
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

  if (raw.startsWith('data:') || raw.startsWith('file:')) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    // Khi backend trả localhost, Expo Go qua adb reverse vẫn truy cập host qua 127.0.0.1.
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
          <Text className="text-sm font-semibold text-[#087744]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={16} color="#087744" />
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
      className="overflow-hidden rounded-[20px] border border-[#EEF1EF] bg-white"
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

function ProductCard({
  item,
  width,
  onPress,
  onAddToCart,
  isAdding,
}: {
  item: HomeProduct;
  width: number;
  onPress: () => void;
  onAddToCart?: () => void;
  isAdding?: boolean;
}) {
  const badge =
    item.chungNhan?.find((cert) => cert.loai)?.loai ??
    (item.khaDung?.coTheDatHang === false ? 'Tạm hết hàng' : 'Truy xuất được');

  const imageUri = chuanHoaAnhUrl(item.anhBiaUrl);

  return (
    <View
      style={{ width }}
      className="overflow-hidden rounded-[20px] border border-[#E8ECE9] bg-white"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem ${item.ten}`}
        onPress={onPress}
        className="active:opacity-90"
      >
        <View className="relative h-[112px] overflow-hidden bg-[#EAF5EE]">
          <SmartProductImage uri={imageUri} name={item.ten} />

          <View className="absolute right-2 top-2 max-w-[125px] flex-row items-center gap-1 rounded-lg bg-[#E7F7EC] px-2 py-[5px]">
            <Ionicons name="shield-checkmark" size={13} color={GREEN} />
            <Text numberOfLines={1} className="text-[10px] font-bold text-[#087744]">
              {badge}
            </Text>
          </View>
        </View>

        <View className="gap-1 px-3 pt-3">
          <Text
            numberOfLines={1}
            className="text-[15px] font-extrabold text-[#263129]"
          >
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
          <Text numberOfLines={1} className="text-[19px] font-extrabold text-[#087744]">
            {dinhDangGia(item.gia.tu)}
          </Text>
          <Text className="pb-[2px] pl-1 text-[10px] text-[#89918C]">/ đơn vị</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${item.ten} vào giỏ`}
          onPress={onAddToCart}
          disabled={isAdding || item.khaDung?.coTheDatHang === false}
          hitSlop={6}
          className={[
            'h-10 w-10 items-center justify-center rounded-full active:opacity-70',
            isAdding || item.khaDung?.coTheDatHang === false
              ? 'opacity-40'
              : 'bg-[#0B9B54]',
          ].join(' ')}
        >
          <Ionicons
            name={isAdding ? 'hourglass' : 'add'}
            size={27}
            color={isAdding || item.khaDung?.coTheDatHang === false ? '#CCCCCC' : '#FFFFFF'}
          />
        </Pressable>
      </View>
    </View>
  );
}

function EmptyProductState({
  title,
  onRetry,
}: {
  title: string;
  onRetry: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onRetry}
      className="items-center rounded-[20px] border border-[#E6ECE8] bg-[#FAFCFB] px-4 py-7 active:opacity-70"
    >
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-[#EAF6EE]">
        <Ionicons name="leaf-outline" size={26} color={GREEN} />
      </View>
      <Text className="font-bold text-[#263129]">{title}</Text>
      <Text className="mt-1 text-sm text-[#89918C]">Chạm để tải lại dữ liệu</Text>
    </Pressable>
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
      subtitle: 'Vì sức khỏe cộng đồng',
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

          <Text
            numberOfLines={1}
            className="mt-1 w-full text-center text-[8px] text-[#7C8880]"
          >
            {item.subtitle}
          </Text>
        </Pressable>
      ))}
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
  onAddToCart?: (id: string) => void;
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
            <ProductCard
              key={item.id}
              item={item}
              width={cardWidth}
              onPress={() => onProductPress(item.id)}
              onAddToCart={() => onAddToCart?.(item.id)}
              isAdding={isAdding}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyProductState title="Chưa có sản phẩm phù hợp" onRetry={onRetry} />
      )}
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

  const cardWidth = Math.min(
    184,
    Math.max(166, (screenWidth - 58) / 2),
  );

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
    gioiHan: 8,
    khaDung: 'CON_HANG',
    sapXep: 'MOI_NHAT',
  });

  const goiYQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 8,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });

  const categories = useMemo(() => {
    return (
      facetsQuery.data?.data?.danhMuc?.slice(0, 8).map((item, index) => ({
        id: `${index}-${item.value}`,
        ten: item.label,
        slug: item.value,
      })) ?? []
    );
  }, [facetsQuery.data]);

  const thuHoachApi = (
    thuHoachQuery.data?.data?.duLieu?.length
      ? thuHoachQuery.data.data.duLieu
      : moiNhatQuery.data?.data?.duLieu ?? []
  ) as HomeProduct[];

  const goiYApi = (goiYQuery.data?.data?.duLieu ?? []) as HomeProduct[];

  const refreshing =
    facetsQuery.isFetching ||
    thuHoachQuery.isFetching ||
    moiNhatQuery.isFetching ||
    goiYQuery.isFetching;

  const themGioHangMutation = useMutation({
    mutationFn: ({
      bienTheSanPhamId,
      soLuong,
    }: {
      bienTheSanPhamId: string;
      soLuong: number;
    }) => themMucGioHangMobile(bienTheSanPhamId, soLuong),
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

  const cartCount = useMemo(
    () => (cartQuery.data?.muc ?? []).reduce((tong, muc) => tong + muc.soLuong, 0),
    [cartQuery.data],
  );

  async function themVaoGioHang(id: string) {
    let item;

    try {
      const response = await layChiTietSanPhamCongKhai(id);
      item = response.data;
    } catch {
      return;
    }

    if (!item) {
      return;
    }

    const hetHang =
      item.khaDung.coTheDatHang === false || item.khaDung.soLuongKhaDung <= 0;

    if (hetHang) {
      return;
    }

    const bienTheHopLe = item.bienThe.filter(
      (bt) => bt.soLuongKhaDung > 0,
    );

    if (bienTheHopLe.length === 0) {
      return;
    }

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

      themGioHangMutation.mutate({
        bienTheSanPhamId: bienTheHopLe[0]!.id,
        soLuong: 1,
      });
    } else {
      router.push({
        pathname: '/san-pham/[id]',
        params: { id },
      });
    }
  }

  function moSanPham(id: string) {
    router.push({
      pathname: '/san-pham/[id]',
      params: { id },
    });
  }

  function moKhamPha(danhMuc?: string) {
    router.push({
      pathname: '/kham-pha',
      params: danhMuc ? { danhMuc } : {},
    });
  }

  function refreshHome() {
    void Promise.all([
      facetsQuery.refetch(),
      thuHoachQuery.refetch(),
      moiNhatQuery.refetch(),
      goiYQuery.refetch(),
    ]);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: insets.top,
      }}
    >
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
            location="Hà Nội"
            notificationCount={0}
            cartCount={cartCount}
            onNotificationPress={() => router.push('/tai-khoan/thong-bao')}
            onCartPress={() => router.push('/gio-hang')}
          />

          <SearchBar
            placeholder="Tìm rau củ, trái cây, trang trại..."
            onPress={() => moKhamPha()}
          />

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
            subtitle="Nông sản tươi ngon từ các trang trại uy tín"
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
            title="Gợi ý cho bạn"
            subtitle="Những sản phẩm phù hợp với nhu cầu của bạn"
            products={goiYApi}
            pending={goiYQuery.isPending}
            cardWidth={cardWidth}
            onViewAll={() => moKhamPha()}
            onProductPress={moSanPham}
            onAddToCart={themVaoGioHang}
            onRetry={refreshHome}
            isAdding={themGioHangMutation.isPending}
          />

          <HomeLowerSections />
        </View>
      </ScrollView>
    </View>
  );
}
