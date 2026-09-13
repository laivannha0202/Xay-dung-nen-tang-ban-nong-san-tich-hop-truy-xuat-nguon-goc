import {
  layChiTietSanPhamCongKhai,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  useLayDanhSachSanPhamCongKhai,
  useLayDanhSachTrangTraiCongKhai,
  useLayFacetsSanPhamCongKhai,
  useLayFlashSaleCongKhaiActive,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import { EmptyState, ErrorState, ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  anhDuPhongSanPhamMobile,
  anhDuPhongTrangTraiMobile,
  laSanPhamTestHomepage,
} from '@/lib/anh-du-phong';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
import { DIA_CHI_TAI_KHOAN_QUERY_KEY, layDiaChiTaiKhoanMobile } from '@/lib/api-tai-khoan';
import {
  FARM_STORIES,
  FEATURED_CATEGORIES_TABS,
  HERO_BANNERS,
  KNOWLEDGE_ARTICLES,
  KNOWLEDGE_TABS,
  PROMO_CARDS,
  QUICK_CATEGORIES,
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

/** Chuẩn hoá không dấu — port từ web để tab lọc khớp tên danh mục API 1:1. */
function chuanHoaKhongDau(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Fallback id (fs-*, fp-*) không phải id DB — bấm phải đi tìm kiếm, không 404. */
function laIdFallbackHomepage(id: string): boolean {
  return id.startsWith('fs-') || id.startsWith('fp-');
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

  const bannerScrollRef = useRef<ScrollView>(null);
  const bannerWidth = Math.max(screenWidth - 32, 280);

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
  // Flash Sale server-authoritative: giá/tồn/discount đều từ backend.
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  // Trang trại tiêu biểu trang chủ từ API thật (noiBat=true).
  // Lưu ý: OpenAPI backend mô tả sai kiểu trang/gioiHan (Object) ở endpoint
  // này nên ép kiểu transport-only; giá trị runtime vẫn là số đúng contract.
  const farmsQuery = useLayDanhSachTrangTraiCongKhai({
    trang: 1 as unknown as never,
    gioiHan: 6 as unknown as never,
    noiBat: true,
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
  // Phạm vi giao hàng duy nhất: Hưng Yên (khớp web + backend
  // PHAM_VI_GIAO_HANG_AGRIMARKET). Trước đây fallback cứng 'Hà Nội' — sai
  // vì Hà Nội ngoài phạm vi (backend thuocPhamViGiaoHangHungYen('Hà Nội') === false).
  const viTriGiaoHang =
    diaChiMacDinh?.tinhThanh || PHAM_VI_GIAO_HANG_AGRIMARKET.ten.replace(/^Tỉnh\s+/i, '');

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
    // Fallback homepage (fs-*/fp-*) không phải sản phẩm DB — đi khám phá thay vì
    // gọi chi tiết (tránh 404 /san-pham/fs-1 như bản cũ). Khớp web dùng
    // `/san-pham?q=ten` cho fallback.
    if (laIdFallbackHomepage(id)) {
      moKhamPha();
      return;
    }
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

  /** Thêm thẳng biến thể Flash Sale (đã có bienTheSanPhamId server) vào giỏ. */
  function themFlashSaleVaoGioHang(bienTheSanPhamId: string, sanPhamId: string) {
    if (!daDangNhap) {
      moDangNhap(router, `/san-pham/${encodeURIComponent(sanPhamId)}`, {
        loai: 'them-gio-hang',
        returnTo: `/san-pham/${encodeURIComponent(sanPhamId)}`,
        bienTheSanPhamId,
        soLuong: 1,
      });
      return;
    }
    themGioHangMutation.mutate({ bienTheSanPhamId });
  }

  function moSanPham(id: string) {
    if (laIdFallbackHomepage(id)) {
      moKhamPha();
      return;
    }
    router.push({ pathname: '/san-pham/[id]', params: { id } });
  }

  function moKhamPha(category?: string) {
    router.push({ pathname: '/kham-pha', params: category ? { danhMuc: category } : {} });
  }

  function moTrangTrai(id: string) {
    // Fallback homepage (farm-*) không phải id DB — đi khám phá thay vì 404.
    // Web fallback dùng link báo ngoài; mobile đi danh sách để giữ luồng.
    if (id.startsWith('farm-')) {
      moKhamPha();
      return;
    }
    router.push({ pathname: '/trang-trai/[id]', params: { id } });
  }

  function refreshHome() {
    void Promise.all([
      facetsQuery.refetch(),
      noiBatQuery.refetch(),
      flashSaleQuery.refetch(),
      farmsQuery.refetch(),
      daDangNhap ? diaChiQuery.refetch() : Promise.resolve(),
    ]);
  }

  const refreshing =
    facetsQuery.isFetching ||
    noiBatQuery.isFetching ||
    flashSaleQuery.isFetching ||
    farmsQuery.isFetching;

  const apiCategories = useMemo(
    () => (facetsQuery.data?.data?.danhMuc ?? []).slice(0, 10),
    [facetsQuery.data],
  );

  // Real products mapped from API if available — loại test seed (PHIEN/...) để
  // homepage khách hàng không bao giờ hiện "Sản phẩm A PHIEN 052" như ảnh lỗi.
  const apiProducts = useMemo(() => noiBatQuery.data?.data?.duLieu ?? [], [noiBatQuery.data]);
  const apiProductsSach = useMemo(
    () => apiProducts.filter((p) => !laSanPhamTestHomepage(p.ten ?? '')),
    [apiProducts],
  );
  const hasRealData = apiProductsSach.length > 0;

  // Flash Sale SERVER-AUTHORITATIVE: mọi giá/tồn/discount đều từ
  // GET /api/v1/flash-sale-cong-khai/active. Không suy ra từ product list,
  // không tự tính phần trăm, không fallback sản phẩm tĩnh.
  // Không có chiến dịch active → ẩn section. Lỗi → error/retry, không fake.
  const chienDichFlashSale = useMemo(
    () => flashSaleQuery.data?.data ?? [],
    [flashSaleQuery.data],
  );
  const flashSaleMuc = useMemo(
    () => chienDichFlashSale.flatMap((chienDich) => chienDich.muc ?? []),
    [chienDichFlashSale],
  );

  // Sản phẩm nổi bật CHỈ từ API thật. Loại món đang chạy Flash Sale
  // (theo sanPhamId server) để 2 hàng không trùng. Không có data → empty,
  // không dùng fixture tĩnh làm catalog.
  const featuredProducts = useMemo(() => {
    if (hasRealData) {
      const flashSaleIds = new Set(flashSaleMuc.map((muc) => muc.sanPhamId));
      const chuaHienThi = apiProductsSach.filter((p) => !flashSaleIds.has(p.id));
      const nguon = tabNoiBat === 'tat-ca' ? chuaHienThi.slice(0, 8) : chuaHienThi
        .filter((p) => {
          const slug = (p.danhMuc?.slug ?? '').toLowerCase();
          if (slug === tabNoiBat) return true;
          const cat = chuanHoaKhongDau(p.danhMuc?.ten ?? '');
          const tabNorm = tabNoiBat.replace(/-/g, ' ');
          if (tabNoiBat === 'organic') {
            const certs = (p.chungNhan ?? []).map((c) => chuanHoaKhongDau(c.loai ?? ''));
            return (
              certs.some((c) => c.includes('huu co') || c.includes('organic')) ||
              cat.includes('organic') ||
              cat.includes('huu co')
            );
          }
          if (tabNoiBat === 'vietgap') {
            const certs = (p.chungNhan ?? []).map((c) => chuanHoaKhongDau(c.loai ?? ''));
            return certs.some((c) => c.includes('vietgap'));
          }
          // Khớp chính xác hơn bản cũ (trước đây chỉ includes('rau') thô).
          if (tabNoiBat === 'rau-cu') return cat.includes('rau') || cat.includes('cu');
          if (tabNoiBat === 'trai-cay') return cat.includes('trai') || cat.includes('cay') || cat.includes('qua');
          if (tabNoiBat === 'thit-trung') return cat.includes('thit') || cat.includes('trung');
          if (tabNoiBat === 'thuy-san') return cat.includes('thuy') || cat.includes('hai') || cat.includes('ca');
          if (tabNoiBat === 'dac-san') return cat.includes('dac san');
          return cat.includes(tabNorm);
        })
        .slice(0, 8);

      return nguon;
    }

    return [];
  }, [hasRealData, apiProductsSach, flashSaleMuc, tabNoiBat]);

  // Trang trại tiêu biểu CHỈ từ API thật (noiBat=true). Rỗng/lỗi → ẩn section,
  // không dùng fixture tĩnh.
  const farmsHienThi = useMemo(
    () => farmsQuery.data?.data?.duLieu ?? [],
    [farmsQuery.data],
  );

  // Filtered knowledge articles
  const filteredArticles = useMemo(() => {
    if (tabKienThuc === 'tat-ca') return KNOWLEDGE_ARTICLES;
    return KNOWLEDGE_ARTICLES.filter((item) => item.tab === tabKienThuc);
  }, [tabKienThuc]);

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
                {/* Khớp web: nền mờ + ảnh contain để không crop chữ banner.
                    Web dùng blurred bg + `fit=contain`; mobile trước đây dùng
                    `cover` nên chữ trái/phải bị cắt ("ơn mỗi ngày"). */}
                <View
                  style={{
                    width: '100%',
                    height: 168,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: '#EAF3EC',
                  }}
                >
                  <Image
                    source={banner.image}
                    contentFit="cover"
                    blurRadius={18}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '100%',
                      height: 168,
                      opacity: 0.55,
                      transform: [{ scale: 1.15 }],
                    }}
                  />
                  <Image
                    source={banner.image}
                    contentFit="contain"
                    style={{ width: '100%', height: 168, borderRadius: 20 }}
                  />
                </View>
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

          {/* 2 Promo Mini Banners — khớp web: tiêu đề + giảm giá xanh + nút Xem ngay */}
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
                  <Text className="mt-0.5 text-[11px] font-extrabold text-[#0B7A48]">{promo.badge}</Text>
                  <View className="mt-1.5 self-start rounded-full bg-[#06633C] px-2.5 py-1">
                    <Text className="text-[10px] font-bold text-white">Xem ngay →</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 3. 12 QUICK CATEGORIES (DANH MỤC TRÒN CÓ ICON) */}
        <View className="mt-5 px-4">
          <SectionHeader
            title="Danh mục nông sản"
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
                {/* Icon vector nền màu giống web — PNG cũ 2-3KB mờ nhạt nhìn như ảnh vỡ */}
                <View
                  style={{ backgroundColor: cat.bg }}
                  className="h-14 w-14 items-center justify-center rounded-full"
                >
                  <Ionicons name={cat.icon} size={26} color={cat.color} />
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

        {/* 4. FLASH SALE — 100% SERVER-AUTHORITATIVE từ
            /api/v1/flash-sale-cong-khai/active. Không chiến dịch → ẩn section.
            Lỗi → error/retry. Không bao giờ fake giá/discount. */}
        {flashSaleQuery.isPending ? (
          <View className="mt-5 border-y border-[#FFE8E8] bg-[#FFF5F5] py-4">
            <View className="px-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 14 }}
              >
                {[0, 1, 2].map((key) => (
                  <View
                    key={key}
                    style={{ width: 154 }}
                    className="overflow-hidden rounded-[16px] border border-[#FAD6D6] bg-white p-2.5"
                  >
                    <ProductCardSkeleton />
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : flashSaleQuery.isError ? (
          <View className="mt-5 px-4">
            <ErrorState
              title="Không tải được Flash Sale"
              description="Chương trình giảm giá đang tạm thời không khả dụng."
              actionLabel="Thử lại"
              onAction={() => void flashSaleQuery.refetch()}
            />
          </View>
        ) : flashSaleMuc.length === 0 ? null : (
          <View className="mt-5 border-y border-[#FFE8E8] bg-[#FFF5F5] py-4">
            <View className="px-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="flash" size={20} color="#E53935" />
                  <Text className="text-[18px] font-black tracking-[-0.2px] text-[#E53935]">Flash Sale</Text>
                </View>

                <Pressable onPress={() => moKhamPha()} hitSlop={8} className="flex-row items-center gap-0.5">
                  <Text className="text-[12px] font-bold text-[#0B7A48]">Xem tất cả</Text>
                  <Ionicons name="chevron-forward" size={14} color="#0B7A48" />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 14 }}
              >
                {flashSaleMuc.map((muc) => {
                  const hetHang = muc.soLuongKhaDung <= 0;
                  return (
                    <View
                      key={muc.bienTheSanPhamId}
                      style={{ width: 154 }}
                      className="overflow-hidden rounded-[16px] border border-[#FAD6D6] bg-white"
                    >
                      <Pressable onPress={() => moSanPham(muc.sanPhamId)} className="active:opacity-85">
                        <View className="relative bg-[#F9F9F9]">
                          {muc.anhBiaUrl ? (
                            <Image
                              source={{ uri: muc.anhBiaUrl }}
                              contentFit="cover"
                              style={{ width: '100%', height: 116 }}
                            />
                          ) : (
                            <Image
                              source={anhDuPhongSanPhamMobile(muc.ten)}
                              contentFit="cover"
                              style={{ width: '100%', height: 116 }}
                            />
                          )}
                          <View className="absolute left-2 top-2 rounded-md bg-[#E52E2E] px-1.5 py-0.5">
                            <Text className="text-[10px] font-black text-white">-{muc.phanTramGiam}%</Text>
                          </View>
                        </View>

                        <View className="px-2.5 pt-2.5">
                          <Text numberOfLines={2} className="min-h-[34px] text-[13px] font-black leading-4 text-[#1F2E25]">
                            {muc.ten}
                          </Text>
                          <Text numberOfLines={1} className="mt-0.5 text-[10px] text-[#7A8780]">
                            {muc.trangTrai.ten}
                          </Text>
                        </View>
                      </Pressable>

                      <View className="flex-row items-end justify-between gap-1 p-2.5 pt-1.5">
                        <View className="min-w-0">
                          <Text className="text-[13.5px] font-black text-[#0B7A48]">
                            {dinhDangTien(muc.giaFlash)}
                          </Text>
                          <Text className="text-[10px] text-[#9EA9A2] line-through">
                            {dinhDangTien(muc.giaGoc)}
                          </Text>
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Thêm ${muc.ten} vào giỏ`}
                          accessibilityState={{ disabled: hetHang }}
                          disabled={hetHang || themGioHangMutation.isPending}
                          onPress={() => void themFlashSaleVaoGioHang(muc.bienTheSanPhamId, muc.sanPhamId)}
                          className={[
                            'h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[6px] bg-[#0B7A48] active:opacity-80',
                            hetHang || themGioHangMutation.isPending ? 'opacity-40' : '',
                          ].join(' ')}
                        >
                          <Ionicons name="cart-outline" size={15} color="#FFF" />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {/* 5. ⭐ SẢN PHẨM NỔI BẬT (FEATURED PRODUCTS + FILTER TABS) */}
        <View className="mt-5 px-4">
          <SectionHeader
            title="Sản phẩm nổi bật"
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

          {/* 2-Column Product Grid — CHỈ data API thật. Loading → skeleton,
              lỗi → retry, rỗng → empty. Không fixture tĩnh. */}
          {noiBatQuery.isPending ? (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[0, 1, 2, 3].map((key) => (
                <View key={key} style={{ width: cardColWidth }}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : noiBatQuery.isError ? (
            <ErrorState
              title="Không tải được sản phẩm nổi bật"
              description="Kiểm tra kết nối rồi thử lại."
              actionLabel="Thử lại"
              onAction={() => void noiBatQuery.refetch()}
            />
          ) : featuredProducts.length === 0 ? (
            <EmptyState
              title="Chưa có sản phẩm nổi bật"
              description="Hãy khám phá toàn bộ nông sản đang được bán."
              actionLabel="Khám phá nông sản"
              onAction={() => moKhamPha()}
            />
          ) : (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {featuredProducts.map((item) => {
                const id = item.id;
                const ten = item.ten;
                const gia = item.gia.tu;
                const trangTraiTen = item.trangTrai.ten;
                const diaChi = item.trangTrai.diaChi;
                const unit = dinhDangQuyCach(item.quyCach);
                // Badge chỉ từ chứng nhận API thật — không cert thì không badge.
                const nhanHieu = item.chungNhan[0]?.loai ?? null;
                // anhBiaUrl null → ảnh dự phòng theo tên (decorative, giống web).
                const imageSource = item.anhBiaUrl ? undefined : anhDuPhongSanPhamMobile(ten);
                const imageUrl = item.anhBiaUrl ?? undefined;
                const rating = item.danhGia?.diemTrungBinh ?? undefined;
                const reviewCount = item.danhGia?.tongLuot ?? 0;

                return (
                  <View key={id} style={{ width: cardColWidth }}>
                    <ProductCard
                      name={ten}
                      farmName={`${trangTraiTen}${diaChi ? ` · ${diaChi}` : ''}`}
                      price={gia}
                      unit={unit}
                      imageUrl={imageUrl}
                      imageSource={imageSource}
                      badges={nhanHieu ? [{ label: nhanHieu, variant: 'success' }] : []}
                      rating={rating}
                      reviewCount={reviewCount}
                      compact
                      onPress={() => moSanPham(id)}
                      onAddToCart={() => void themVaoGioHang(id)}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 6. 🌿 TRANG TRẠI TIÊU BIỂU — CHỈ từ API thật. Loading → skeleton,
            rỗng/lỗi → ẩn section. Không fixture tĩnh. */}
        {farmsQuery.isPending ? (
          <View className="mt-6 px-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 14 }}
            >
              {[0, 1].map((key) => (
                <View
                  key={key}
                  style={{ width: 236 }}
                  className="overflow-hidden rounded-[20px] border border-[#DDE7E1] bg-white p-3"
                >
                  <ProductCardSkeleton />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : farmsHienThi.length === 0 ? null : (
          <View className="mt-6 px-4">
            <SectionHeader
              title="Trang trại tiêu biểu"
              onViewAll={() => router.push('/kham-pha')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingRight: 14 }}
            >
              {farmsHienThi.map((farm) => (
                <View
                  key={farm.id}
                  style={{ width: 236 }}
                  className="overflow-hidden rounded-[20px] border border-[#DDE7E1] bg-white shadow-sm"
                >
                  <Pressable onPress={() => moTrangTrai(farm.id)} className="active:opacity-90">
                    <View className="bg-[#EEF6F1]">
                      {farm.anhBiaUrl ? (
                        <Image source={{ uri: farm.anhBiaUrl }} contentFit="cover" style={{ width: '100%', height: 114 }} />
                      ) : (
                        <Image source={anhDuPhongTrangTraiMobile(farm.ten)} contentFit="cover" style={{ width: '100%', height: 114 }} />
                      )}
                    </View>

                    <View className="px-3 pt-3">
                      <Text numberOfLines={2} className="min-h-[38px] text-[14px] font-black leading-5 text-[#17251C]">
                        {farm.ten}
                      </Text>
                      <View className="mt-1 flex-row items-center gap-1">
                        <Ionicons name="location-outline" size={13} color="#6F7E75" />
                        <Text numberOfLines={1} className="flex-1 text-[11px] text-[#6F7E75]">
                          {farm.diaChi}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  <View className="p-3 pt-0">
                    <Pressable
                      onPress={() => moTrangTrai(farm.id)}
                      className="mt-3 items-center justify-center rounded-[12px] bg-[#087A4B] py-2 active:opacity-80"
                    >
                      <Text className="text-[12px] font-extrabold text-white">Xem trang trại</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 7. 📖 KIẾN THỨC NÔNG SẢN (KNOWLEDGE ARTICLES) */}
        <View className="mt-6 px-4">
          <SectionHeader
            title="Kiến thức nông sản"
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

      </ScrollView>
    </View>
  );
}
