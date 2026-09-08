import {
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CategoryGrid,
  HeroBanner,
  HomeHeader,
  QuickActions,
  SearchBar,
} from '@/components/home';

const GREEN = '#0B8F4D';
const GREEN_DARK = '#075E3B';

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
        <Text className="text-[22px] font-bold text-[#17251C]">{title}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={onViewAll}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="text-sm font-medium text-[#087744]">Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color="#087744" />
        </Pressable>
      </View>

      <Text className="text-sm text-[#7A857E]">{subtitle}</Text>
    </View>
  );
}

function ProductSkeleton({ width }: { width: number }) {
  return (
    <View
      style={{ width }}
      className="overflow-hidden rounded-2xl border border-[#EEF1EF] bg-white"
    >
      <View className="h-[108px] bg-[#EEF2EF]" />
      <View className="gap-2 p-3">
        <View className="h-4 w-4/5 rounded-full bg-[#EEF2EF]" />
        <View className="h-3 w-3/5 rounded-full bg-[#F2F4F2]" />
        <View className="mt-1 h-5 w-2/5 rounded-full bg-[#EAF4EE]" />
      </View>
    </View>
  );
}

function ProductCard({
  item,
  width,
  onPress,
}: {
  item: HomeProduct;
  width: number;
  onPress: () => void;
}) {
  const badge =
    item.chungNhan?.find((cert) => cert.loai)?.loai ??
    (item.khaDung?.coTheDatHang === false ? 'Tạm hết hàng' : 'Truy xuất được');

  return (
    <View
      style={{ width }}
      className="overflow-hidden rounded-2xl border border-[#E9EEEB] bg-white"
    >
      <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-90">
        <View className="relative h-[108px] overflow-hidden bg-[#EDF5F0]">
          {item.anhBiaUrl ? (
            <Image
              source={{ uri: item.anhBiaUrl }}
              contentFit="cover"
              transition={150}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="leaf-outline" size={36} color="#8ABBA0" />
            </View>
          )}

          <View className="absolute right-2 top-2 flex-row items-center gap-1 rounded-lg bg-[#E4F6EA] px-2 py-1">
            <Ionicons name="shield-checkmark" size={13} color={GREEN} />
            <Text numberOfLines={1} className="max-w-[105px] text-[10px] font-semibold text-[#087744]">
              {badge}
            </Text>
          </View>
        </View>

        <View className="gap-1 px-3 pt-2">
          <Text numberOfLines={1} className="text-[15px] font-bold text-[#202B24]">
            {item.ten}
          </Text>

          <Text numberOfLines={1} className="text-[12px] text-[#7A857E]">
            {item.trangTrai.ten}
            {item.trangTrai.diaChi ? ` · ${item.trangTrai.diaChi}` : ''}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-end justify-between gap-2 px-3 pb-3 pt-2">
        <View className="min-w-0 flex-1 flex-row items-end gap-1">
          <Text numberOfLines={1} className="text-[18px] font-extrabold text-[#087744]">
            {dinhDangGia(item.gia.tu)}
          </Text>
          <Text className="pb-[2px] text-[11px] text-[#7A857E]">/ đơn vị</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chọn ${item.ten}`}
          onPress={onPress}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#0B9B54] active:opacity-70"
        >
          <Ionicons name="add" size={25} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function TrustStrip({ onTrace, onFarm, onQuality }: {
  onTrace: () => void;
  onFarm: () => void;
  onQuality: () => void;
}) {
  const items = [
    {
      title: 'Truy xuất\nnguồn gốc',
      subtitle: 'Rõ ràng, minh bạch',
      icon: 'shield-checkmark-outline' as const,
      onPress: onTrace,
    },
    {
      title: 'Trang trại\nminh bạch',
      subtitle: 'Kết nối trực tiếp',
      icon: 'home-outline' as const,
      onPress: onFarm,
    },
    {
      title: 'Kiểm định\nchất lượng',
      subtitle: 'Vì sức khỏe cộng đồng',
      icon: 'ribbon-outline' as const,
      onPress: onQuality,
    },
  ];

  return (
    <View className="flex-row overflow-hidden rounded-2xl bg-[#EFFAF3]">
      {items.map((item, index) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          onPress={item.onPress}
          className={[
            'min-w-0 flex-1 flex-row items-center gap-2 px-3 py-4 active:opacity-70',
            index > 0 ? 'border-l border-[#D9EFE1]' : '',
          ].join(' ')}
        >
          <Ionicons name={item.icon} size={30} color={GREEN} />

          <View className="min-w-0 flex-1">
            <Text className="text-[12px] font-bold leading-[14px] text-[#075E3B]">
              {item.title}
            </Text>
            <Text numberOfLines={1} className="mt-1 text-[9px] text-[#7A857E]">
              {item.subtitle}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function TrangChu() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = Math.min(
    190,
    Math.max(164, (screenWidth - 40 - 12) / 2),
  );

  const facetsQuery = useLayFacetsSanPhamCongKhai();

  const thuHoachQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 6,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
    thuHoachTu: ngayIsoTruoc(30),
  });

  const moiNhatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 6,
    khaDung: 'CON_HANG',
    sapXep: 'MOI_NHAT',
  });

  const goiYQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 6,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });

  const categories = useMemo(() => {
    const apiCategories =
      facetsQuery.data?.data?.danhMuc?.slice(0, 8).map((item, index) => ({
        id: `${index}-${item.value}`,
        ten: item.label,
        slug: item.value,
      })) ?? [];

    return apiCategories;
  }, [facetsQuery.data]);

  const thuHoachApi =
    thuHoachQuery.data?.data?.duLieu?.length
      ? thuHoachQuery.data.data.duLieu
      : moiNhatQuery.data?.data?.duLieu ?? [];

  const goiYApi = goiYQuery.data?.data?.duLieu ?? [];

  const refreshing =
    facetsQuery.isFetching ||
    thuHoachQuery.isFetching ||
    moiNhatQuery.isFetching ||
    goiYQuery.isFetching;

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
    <SafeAreaView className="flex-1 bg-[#FFFFFF]" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshHome}
            tintColor={GREEN}
            colors={[GREEN]}
          />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="gap-4 px-5 pt-3">
          <HomeHeader
            location="Hà Nội"
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

          <View className="pt-2">
            <SectionHeader
              title="Mới thu hoạch"
              subtitle="Nông sản tươi ngon từ các trang trại uy tín"
              onViewAll={() => moKhamPha()}
            />

            {thuHoachQuery.isPending && moiNhatQuery.isPending ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                <ProductSkeleton width={cardWidth} />
                <ProductSkeleton width={cardWidth} />
                <ProductSkeleton width={cardWidth} />
              </ScrollView>
            ) : thuHoachApi.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                {thuHoachApi.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item as HomeProduct}
                    width={cardWidth}
                    onPress={() => moSanPham(item.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Pressable
                onPress={refreshHome}
                className="rounded-2xl border border-[#E5ECE8] bg-[#FAFCFB] px-4 py-5 active:opacity-70"
              >
                <Text className="font-semibold text-[#202B24]">Chưa có sản phẩm mới.</Text>
                <Text className="mt-1 text-sm text-[#7A857E]">Chạm để tải lại dữ liệu.</Text>
              </Pressable>
            )}
          </View>

          <View className="pt-2">
            <SectionHeader
              title="Gợi ý cho bạn"
              subtitle="Những sản phẩm phù hợp với nhu cầu của bạn"
              onViewAll={() => moKhamPha()}
            />

            {goiYQuery.isPending ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                <ProductSkeleton width={cardWidth} />
                <ProductSkeleton width={cardWidth} />
                <ProductSkeleton width={cardWidth} />
              </ScrollView>
            ) : goiYApi.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                {goiYApi.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item as HomeProduct}
                    width={cardWidth}
                    onPress={() => moSanPham(item.id)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Pressable
                onPress={refreshHome}
                className="rounded-2xl border border-[#E5ECE8] bg-[#FAFCFB] px-4 py-5 active:opacity-70"
              >
                <Text className="font-semibold text-[#202B24]">Chưa có gợi ý.</Text>
                <Text className="mt-1 text-sm text-[#7A857E]">Chạm để tải lại dữ liệu.</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
