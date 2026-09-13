import {
  layChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { DIA_CHI_TAI_KHOAN_QUERY_KEY, layDiaChiTaiKhoanMobile } from '@/lib/api-tai-khoan';
import {
  FARM_STORIES,
  FEATURED_CATEGORIES_TABS,
  FEATURED_FARMS,
  FEATURED_PRODUCTS_FALLBACK,
  FLASH_SALE_ITEMS,
  HERO_BANNERS,
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_TABS,
  PROMO_CARDS,
  QUICK_CATEGORIES,
  SERVICE_COMMITMENTS,
  TRUST_BADGES,
} from '@/lib/homepage-data';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GREEN = '#087A4B';
const GREEN_DARK = '#065F3A';
const GREEN_LIGHT = '#EDF8F2';
const TEXT_DARK = '#17251C';
const TEXT_MUTED = '#68776E';
const BORDER_COLOR = '#DDE7E1';

function dinhDangTien(so: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(so))}đ`;
}

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

function SectionHeader({
  title,
  subtitle,
  onViewAll,
  viewAllText = 'Xem tất cả',
}: {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllText?: string;
}) {
  return (
    <View className="mb-3 flex-row items-end justify-between">
      <View className="flex-1 pr-2">
        <Text className="text-[19px] font-black tracking-[-0.3px] text-[#17251C]">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-[12px] leading-4 text-[#758179]">{subtitle}</Text> : null}
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll} hitSlop={8} className="flex-row items-center gap-1 active:opacity-60">
          <Text className="text-[12px] font-bold text-[#087A4B]">{viewAllText}</Text>
          <Ionicons name="chevron-forward" size={14} color={GREEN} />
        </Pressable>
      ) : null}
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

  // State
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [tabNoiBat, setTabNoiBat] = useState('tat-ca');
  const [tabKienThuc, setTabKienThuc] = useState('tat-ca');
  const [flashSaleSeconds, setFlashSaleSeconds] = useState(3600 * 2 + 45 * 60 + 18); // 02:45:18

  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerWidth = Math.max(screenWidth - 32, 280);

  // Countdown timer for Flash Sale
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashSaleSeconds((prev) => (prev > 0 ? prev - 1 : 3600 * 4));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatFlashSaleTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return {
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0'),
    };
  }, []);

  // Auto scroll banners
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % HERO_BANNERS.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * bannerWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3800);
    return () => clearInterval(interval);
  }, [bannerWidth]);

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / bannerWidth);
    if (index >= 0 && index < HERO_BANNERS.length && index !== activeBannerIndex) {
      setActiveBannerIndex(index);
    }
  };

  // Queries
  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 16,
    khaDung: 'CON_HANG',
    sapXep: 'PHU_HOP',
  });

  const diaChiQuery = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 60_000,
  });

  const diaChiMacDinh = useMemo(
    () => diaChiQuery.data?.find((d) => d.macDinh) ?? diaChiQuery.data?.[0] ?? null,
    [diaChiQuery.data],
  );
  const viTriGiaoHang = diaChiMacDinh?.tinhThanh || 'Hà Nội';

  // Add to cart mutation
  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId }: { bienTheSanPhamId: string }) =>
      themMucGioHangMobile(bienTheSanPhamId, 1),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng!');
    },
    onError: (err) => {
      Alert.alert('Thông báo', 'Không thể thêm sản phẩm lúc này.');
    },
  });

  async function themVaoGioHang(id: string) {
    let bienTheId = '';
    try {
      const res = await layChiTietSanPhamCongKhai(id);
      const sp = res.data;
      const bienThe = sp.bienThe?.find((b) => b.soLuongKhaDung > 0);
      if (bienThe) {
        bienTheId = bienThe.id;
      }
    } catch {
      // ignore
    }

    if (!daDangNhap) {
      if (bienTheId) {
        moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`, {
          loai: 'them-gio-hang',
          returnTo: `/san-pham/${encodeURIComponent(id)}`,
          bienTheSanPhamId: bienTheId,
          soLuong: 1,
        });
      } else {
        moDangNhap(router, `/san-pham/${encodeURIComponent(id)}`);
      }
      return;
    }

    if (bienTheId) {
      themGioHangMutation.mutate({ bienTheSanPhamId: bienTheId });
    } else {
      router.push({ pathname: '/san-pham/[id]', params: { id } });
    }
  }

  function moSanPham(id: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id } });
  }

  function moKhamPha(category?: string) {
    router.push({ pathname: '/kham-pha', params: category ? { danhMuc: category } : {} });
  }

  function moTrangTrai(id: string) {
    router.push({ pathname: '/trang-trai/[id]', params: { id } });
  }

  function refreshHome() {
    void Promise.all([
      facetsQuery.refetch(),
      noiBatQuery.refetch(),
      daDangNhap ? diaChiQuery.refetch() : Promise.resolve(),
    ]);
  }

  const refreshing = facetsQuery.isFetching || noiBatQuery.isFetching;

  const apiCategories = useMemo(
    () => (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 10),
    [facetsQuery.data],
  );

  // Real products mapped from API if available
  const apiProducts = useMemo(() => noiBatQuery.data?.data?.duLieu ?? [], [noiBatQuery.data]);
  const hasRealData = apiProducts.length > 0;

  // Filtered featured products
  const featuredProducts = useMemo(() => {
    if (hasRealData) {
      if (tabNoiBat === 'tat-ca') return apiProducts.slice(0, 8);
      return apiProducts
        .filter((p) => {
          const dm = p.danhMuc?.ten?.toLowerCase() || '';
          if (tabNoiBat === 'rau-cu') return dm.includes('rau') || dm.includes('củ');
          if (tabNoiBat === 'trai-cay') return dm.includes('trái') || dm.includes('quả');
          if (tabNoiBat === 'thit-trung') return dm.includes('thịt') || dm.includes('trứng');
          if (tabNoiBat === 'thuy-san') return dm.includes('thủy') || dm.includes('hải');
          if (tabNoiBat === 'dac-san') return dm.includes('đặc sản');
          if (tabNoiBat === 'organic') return p.chungNhan?.some((c) => c.loai?.toLowerCase().includes('organic'));
          if (tabNoiBat === 'vietgap') return p.chungNhan?.some((c) => c.loai?.toLowerCase().includes('vietgap'));
          return true;
        })
        .slice(0, 8);
    }

    if (tabNoiBat === 'tat-ca') return FEATURED_PRODUCTS_FALLBACK;
    return FEATURED_PRODUCTS_FALLBACK.filter((item) => {
      if (tabNoiBat === 'rau-cu') return item.category === 'rau-cu';
      if (tabNoiBat === 'trai-cay') return item.category === 'trai-cay';
      if (tabNoiBat === 'thuy-san') return item.category === 'thuy-san';
      if (tabNoiBat === 'dac-san') return item.category === 'dac-san';
      if (tabNoiBat === 'organic') return item.badge === 'Organic';
      if (tabNoiBat === 'vietgap') return item.badge === 'VietGAP';
      return true;
    });
  }, [hasRealData, apiProducts, tabNoiBat]);

  // Filtered knowledge articles
  const filteredArticles = useMemo(() => {
    if (tabKienThuc === 'tat-ca') return KNOWLEDGE_ARTICLES;
    return KNOWLEDGE_ARTICLES.filter((item) => item.tab === tabKienThuc);
  }, [tabKienThuc]);

  const countdown = formatFlashSaleTime(flashSaleSeconds);
  const cardColWidth = (screenWidth - 42) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: '#F7FAF8', paddingTop: insets.top }}>
      {/* STICKY TOP BRAND & SEARCH BAR */}
      <View className="border-b border-[#E8EFEA] bg-white px-4 pb-3 pt-2">
        <MobileBrandBar />

        {/* Delivery Address Row */}
        <Pressable
          accessibilityRole="button"
          onPress={() => (daDangNhap ? router.push('/tai-khoan/dia-chi') : moDangNhap(router, '/'))}
          className="mt-2.5 flex-row items-center gap-1.5 active:opacity-75"
        >
          <View className="h-6 w-6 items-center justify-center rounded-full bg-[#EDF8F2]">
            <Ionicons name="location-sharp" size={14} color={GREEN} />
          </View>
          <Text className="text-[12px] text-[#718077]">Giao đến:</Text>
          <Text numberOfLines={1} className="max-w-[200px] text-[12.5px] font-extrabold text-[#17251C]">
            {viTriGiaoHang}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#5C6A61" />
        </Pressable>

        {/* Search Bar with QR shortcut */}
        <View className="mt-3 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Tìm kiếm nông sản"
            onPress={() => moKhamPha()}
            className="flex-1 flex-row items-center gap-2.5 rounded-[14px] bg-[#F1F5F2] px-3.5 py-2.5 active:opacity-75"
          >
            <Ionicons name="search-outline" size={19} color="#68776E" />
            <Text numberOfLines={1} className="flex-1 text-[13.5px] text-[#818E86]">
              Tìm rau củ, trái cây, thịt, trứng...
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quét mã QR truy xuất"
            onPress={() => router.push('/quet-qr')}
            className="h-10 w-10 items-center justify-center rounded-[14px] bg-[#EDF8F2] active:opacity-75"
          >
            <Ionicons name="qr-code-outline" size={21} color={GREEN} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshHome} tintColor={GREEN} colors={[GREEN]} />}
        contentContainerStyle={{ paddingBottom: Math.max(36, insets.bottom + 24) }}
      >
        {/* 1. HERO BANNER CAROUSEL */}
        <View className="mt-3 px-4">
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleBannerScroll}
            decelerationRate="fast"
            snapToInterval={bannerWidth}
            snapToAlignment="center"
          >
            {HERO_BANNERS.map((banner, index) => (
              <Pressable
                key={banner.id}
                onPress={() => moKhamPha(banner.category)}
                style={{ width: bannerWidth }}
                className="overflow-hidden rounded-[20px] active:opacity-95"
              >
                <Image
                  source={banner.image}
                  contentFit="cover"
                  style={{ width: '100%', height: 168, borderRadius: 20 }}
                />
              </Pressable>
            ))}
          </ScrollView>

          {/* Pagination dots */}
          <View className="mt-2.5 flex-row items-center justify-center gap-1.5">
            {HERO_BANNERS.map((_, index) => (
              <View
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeBannerIndex ? 'w-5 bg-[#087A4B]' : 'w-1.5 bg-[#D2DFD7]'
                }`}
              />
            ))}
          </View>

          {/* 2 Promo Mini Banners */}
          <View className="mt-3 flex-row gap-2.5">
            {PROMO_CARDS.map((promo) => (
              <Pressable
                key={promo.id}
                onPress={() => moKhamPha(promo.category)}
                className="flex-1 overflow-hidden rounded-[16px] border border-[#E0EBE4] bg-white active:opacity-90"
              >
                <Image source={promo.image} contentFit="cover" style={{ width: '100%', height: 72 }} />
                <View className="bg-white p-2">
                  <Text numberOfLines={1} className="text-[12px] font-black text-[#17251C]">
                    {promo.title}
                  </Text>
                  <Text className="mt-0.5 text-[11px] font-extrabold text-[#D9383A]">{promo.badge}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 2. TRUST BADGES STRIP (4 CAM KẾT CỐT LÕI) */}
        <View className="mx-4 mt-4 overflow-hidden rounded-[18px] border border-[#DDEBE2] bg-[#EFF8F3]">
          <View className="flex-row flex-wrap">
            {TRUST_BADGES.map((item, idx) => (
              <View
                key={item.title}
                className={`w-1/2 flex-row items-center gap-2.5 p-3 ${
                  idx % 2 === 0 ? 'border-r border-[#DDEBE2]' : ''
                } ${idx >= 2 ? 'border-t border-[#DDEBE2]' : ''}`}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Ionicons name={item.icon} size={20} color={GREEN} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-[11.5px] font-black text-[#17613F]">
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} className="text-[10px] text-[#697970]">
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. 12 QUICK CATEGORIES (DANH MỤC TRÒN CÓ ICON) */}
        <View className="mt-5 px-4">
          <SectionHeader
            title="Danh mục nông sản"
            subtitle="Chọn nông sản theo nhu cầu mỗi ngày"
            onViewAll={() => moKhamPha()}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 12 }}
          >
            {QUICK_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.slug}
                onPress={() => moKhamPha(cat.slug)}
                style={{ width: 68 }}
                className="items-center active:opacity-75"
              >
                <View
                  style={{ backgroundColor: cat.bg }}
                  className="h-14 w-14 items-center justify-center rounded-full border border-[#D8E6DE]"
                >
                  <Image source={cat.image} contentFit="contain" style={{ width: 34, height: 34 }} />
                </View>
                <Text
                  numberOfLines={2}
                  className="mt-1.5 min-h-[28px] text-center text-[10.5px] font-bold leading-3 text-[#2F3F35]"
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 4. FLASH SALE (NÔNG SẢN GIÁ SỐC) */}
        <View className="mt-5 border-y border-[#FFE8E8] bg-[#FFF5F5] py-4">
          <View className="px-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-1 rounded-full bg-[#E52E2E] px-2.5 py-1">
                  <Ionicons name="flash" size={14} color="#FFF" />
                  <Text className="text-[12px] font-black uppercase text-white">Flash Sale</Text>
                </View>

                {/* Countdown badges */}
                <View className="flex-row items-center gap-1">
                  <View className="rounded bg-[#202020] px-1.5 py-0.5">
                    <Text className="text-[11px] font-black text-white">{countdown.h}</Text>
                  </View>
                  <Text className="font-bold text-[#666]">:</Text>
                  <View className="rounded bg-[#202020] px-1.5 py-0.5">
                    <Text className="text-[11px] font-black text-white">{countdown.m}</Text>
                  </View>
                  <Text className="font-bold text-[#666]">:</Text>
                  <View className="rounded bg-[#202020] px-1.5 py-0.5">
                    <Text className="text-[11px] font-black text-white">{countdown.s}</Text>
                  </View>
                </View>
              </View>

              <Pressable onPress={() => moKhamPha()} hitSlop={8} className="flex-row items-center gap-0.5">
                <Text className="text-[12px] font-bold text-[#E52E2E]">Xem tất cả</Text>
                <Ionicons name="chevron-forward" size={14} color="#E52E2E" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 14 }}
            >
              {FLASH_SALE_ITEMS.map((item) => (
                <View
                  key={item.id}
                  style={{ width: 154 }}
                  className="overflow-hidden rounded-[16px] border border-[#FAD6D6] bg-white"
                >
                  <Pressable onPress={() => moSanPham(item.id)} className="active:opacity-85">
                    <View className="relative bg-[#F9F9F9]">
                      <Image source={item.image} contentFit="cover" style={{ width: '100%', height: 116 }} />
                      <View className="absolute left-2 top-2 rounded-md bg-[#E52E2E] px-1.5 py-0.5">
                        <Text className="text-[10px] font-black text-white">{item.giam}</Text>
                      </View>
                    </View>

                    <View className="p-2.5">
                      <Text numberOfLines={1} className="text-[13px] font-black text-[#1F2E25]">
                        {item.ten}
                      </Text>
                      <Text numberOfLines={1} className="mt-0.5 text-[10px] text-[#7A8780]">
                        {item.trangTraiTen}
                      </Text>
                      <View className="mt-1.5 flex-row items-baseline gap-1">
                        <Text className="text-[14px] font-black text-[#E52E2E]">
                          {dinhDangTien(item.gia)}
                        </Text>
                        <Text className="text-[10px] text-[#9EA9A2] line-through">
                          {dinhDangTien(item.giaCu)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <View className="px-2.5 pb-2.5 pt-0">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void themVaoGioHang(item.id)}
                      className="flex-row items-center justify-center gap-1 rounded-[10px] bg-[#087A4B] py-1.5 active:opacity-80"
                    >
                      <Ionicons name="cart-outline" size={14} color="#FFF" />
                      <Text className="text-[11px] font-bold text-white">Thêm</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 5. ⭐ SẢN PHẨM NỔI BẬT (FEATURED PRODUCTS + FILTER TABS) */}
        <View className="mt-5 px-4">
          <SectionHeader
            title="Sản phẩm nổi bật"
            subtitle="Nông sản đạt chứng nhận VietGAP, Organic uy tín"
            onViewAll={() => moKhamPha(tabNoiBat !== 'tat-ca' ? tabNoiBat : undefined)}
          />

          {/* Category Tabs Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          >
            {FEATURED_CATEGORIES_TABS.map((tab) => {
              const active = tabNoiBat === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setTabNoiBat(tab.id)}
                  className={`rounded-full px-3.5 py-1.5 ${
                    active ? 'bg-[#087A4B]' : 'border border-[#D9E5DE] bg-white'
                  } active:opacity-75`}
                >
                  <Text className={`text-[12px] font-bold ${active ? 'text-white' : 'text-[#44534A]'}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2-Column Product Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {featuredProducts.map((item: any) => {
              const id = item.id;
              const ten = item.ten;
              const gia = typeof item.gia === 'number' ? item.gia : item.gia?.tu ?? 30000;
              const trangTraiTen = item.trangTrai?.ten || item.trangTraiTen || 'Trang trại chuẩn VietGAP';
              const diaChi = item.trangTrai?.diaChi || item.diaChi;
              const unit = item.quyCach ? dinhDangQuyCach(item.quyCach) : item.donVi || '500g';
              const badgeLabel = item.chungNhan?.[0]?.loai || item.badge || 'VietGAP';
              const imageSource = item.image;
              const imageUrl = item.anhBiaUrl;

              return (
                <View key={id} style={{ width: cardColWidth }}>
                  <ProductCard
                    name={ten}
                    farmName={`${trangTraiTen}${diaChi ? ` · ${diaChi}` : ''}`}
                    price={gia}
                    unit={unit}
                    imageUrl={imageUrl}
                    imageSource={imageSource}
                    badges={[{ label: badgeLabel, variant: 'success' }]}
                    onPress={() => moSanPham(id)}
                    onAddToCart={() => void themVaoGioHang(id)}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* 6. 🌿 TRANG TRẠI TIÊU BIỂU (FEATURED FARMS) */}
        <View className="mt-6 px-4">
          <SectionHeader
            title="Trang trại tiêu biểu"
            subtitle="Nguồn cung ứng nông sản minh bạch, an toàn"
            onViewAll={() => router.push('/kham-pha')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingRight: 14 }}
          >
            {FEATURED_FARMS.map((farm) => (
              <View
                key={farm.id}
                style={{ width: 236 }}
                className="overflow-hidden rounded-[20px] border border-[#DDE7E1] bg-white shadow-sm"
              >
                <Pressable onPress={() => moTrangTrai(farm.id)} className="active:opacity-90">
                  <View className="relative bg-[#EEF6F1]">
                    <Image source={farm.image} contentFit="cover" style={{ width: '100%', height: 114 }} />
                    <View className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5">
                      <Text className="text-[9.5px] font-bold text-white">{farm.chungNhan}</Text>
                    </View>
                  </View>

                  <View className="p-3">
                    <Text numberOfLines={1} className="text-[14px] font-black text-[#17251C]">
                      {farm.ten}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <Ionicons name="location-outline" size={13} color="#6F7E75" />
                      <Text numberOfLines={1} className="flex-1 text-[11px] text-[#6F7E75]">
                        {farm.diaChi}
                      </Text>
                    </View>
                    <View className="mt-1.5 flex-row items-center gap-1">
                      <Ionicons name="star" size={13} color="#E7A126" />
                      <Text className="text-[11px] font-bold text-[#35433B]">
                        {farm.sao} ({farm.soDanhGia} đánh giá)
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => moTrangTrai(farm.id)}
                      className="mt-3 items-center justify-center rounded-[12px] bg-[#087A4B] py-2 active:opacity-80"
                    >
                      <Text className="text-[12px] font-extrabold text-white">Xem trang trại</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 7. 📖 KIẾN THỨC NÔNG SẢN (KNOWLEDGE ARTICLES) */}
        <View className="mt-6 px-4">
          <SectionHeader
            title="Kiến thức nông sản"
            subtitle="Mẹo hay chọn nông sản sạch, tươi ngon cho bữa cơm gia đình"
            onViewAll={() => router.push('/kham-pha')}
          />

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {KNOWLEDGE_TABS.map((tab) => {
              const active = tabKienThuc === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setTabKienThuc(tab.id)}
                  className={`rounded-full px-3 py-1 ${
                    active ? 'bg-[#087A4B]' : 'border border-[#D9E5DE] bg-white'
                  } active:opacity-75`}
                >
                  <Text className={`text-[11.5px] font-bold ${active ? 'text-white' : 'text-[#44534A]'}`}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Article Cards Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 12 }}
          >
            {filteredArticles.map((art) => (
              <View
                key={art.id}
                style={{ width: 220 }}
                className="overflow-hidden rounded-[18px] border border-[#DDE7E1] bg-white"
              >
                <View className="relative bg-[#EEF6F1]">
                  <Image source={art.image} contentFit="cover" style={{ width: '100%', height: 110 }} />
                  <View className="absolute left-2 top-2 rounded-md bg-[#087A4B] px-1.5 py-0.5">
                    <Text className="text-[9.5px] font-black uppercase text-white">{art.tag}</Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text numberOfLines={2} className="min-h-[36px] text-[13px] font-black leading-4 text-[#17251C]">
                    {art.title}
                  </Text>
                  <Text numberOfLines={2} className="mt-1 min-h-[30px] text-[11px] leading-4 text-[#7A8780]">
                    {art.moTa}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between border-t border-[#EEF3F0] pt-2">
                    <Text className="text-[10px] text-[#8C9891]">{art.date}</Text>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="eye-outline" size={12} color="#8C9891" />
                      <Text className="text-[10px] text-[#8C9891]">{art.views}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 8. 🌾 CÂU CHUYỆN TỪ TRANG TRẠI (FARM STORIES) */}
        <View className="mt-6 px-4">
          <SectionHeader
            title="Câu chuyện từ trang trại"
            subtitle="Những con người thật, nông sản thật, giá trị thật"
            onViewAll={() => router.push('/kham-pha')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 12 }}
          >
            {FARM_STORIES.map((story) => (
              <View
                key={story.id}
                style={{ width: 230 }}
                className="overflow-hidden rounded-[18px] border border-[#DDE7E1] bg-white"
              >
                <View className="relative bg-[#EEF6F1]">
                  <Image source={story.image} contentFit="cover" style={{ width: '100%', height: 115 }} />
                  <View className="absolute left-2 top-2 rounded-md bg-[#137333] px-1.5 py-0.5">
                    <Text className="text-[9.5px] font-black uppercase text-white">{story.tag}</Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text numberOfLines={2} className="min-h-[38px] text-[13px] font-black leading-4 text-[#17251C]">
                    {story.title}
                  </Text>
                  <Text numberOfLines={2} className="mt-1 min-h-[30px] text-[11px] leading-4 text-[#7A8780]">
                    {story.moTa}
                  </Text>
                  <View className="mt-2.5 flex-row items-center justify-between border-t border-[#EEF3F0] pt-2">
                    <Text className="text-[11px] font-extrabold text-[#087A4B]">Xem câu chuyện →</Text>
                    <Text className="text-[10px] text-[#8C9891]">{story.views}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 9. CAM KẾT DỊCH VỤ (SERVICE COMMITMENTS) */}
        <View className="mx-4 mt-6 rounded-[20px] border border-[#D8E6DE] bg-white p-4">
          <Text className="text-center text-[13px] font-black uppercase tracking-[0.5px] text-[#087A4B]">
            Cam kết chất lượng AgriMarket
          </Text>
          <View className="mt-3 flex-row flex-wrap">
            {SERVICE_COMMITMENTS.map((svc, idx) => (
              <View key={svc.title} className="w-1/2 p-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#EDF8F2]">
                  <Ionicons name={svc.icon} size={18} color={GREEN} />
                </View>
                <Text className="mt-1.5 text-[11.5px] font-extrabold text-[#1F3025]">{svc.title}</Text>
                <Text className="mt-0.5 text-[10px] leading-3 text-[#7B8981]">{svc.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 10. APP BRAND FOOTER */}
        <View className="mt-6 border-t border-[#E5EDE7] bg-[#F1F6F3] px-6 py-6 items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-[#087A4B]">
            <Ionicons name="leaf" size={22} color="#FFF" />
          </View>
          <Text className="mt-2 text-[16px] font-black tracking-[-0.2px] text-[#17251C]">
            AgriMarket
          </Text>
          <Text className="text-[12px] font-semibold text-[#087A4B]">
            Nông sản sạch, cuộc sống xanh
          </Text>
          <Text className="mt-2 text-center text-[11px] leading-4 text-[#7B8780]">
            Nền tảng thương mại điện tử nông sản tích hợp truy xuất nguồn gốc minh bạch bằng mã QR.
          </Text>
          <Text className="mt-3 text-[10.5px] font-bold text-[#939F97]">
            © 2026 AgriMarket · Vì nông sản Việt, vì tương lai xanh
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
