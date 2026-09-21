import {
  hienThiTonKhaDung,
  useLayDanhSachSanPhamCongKhai,
  useLayDanhSachTrangTraiCongKhai,
  useLayFacetsSanPhamCongKhai,
  useLayFlashSaleCongKhaiActive,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArticleCardMobile } from '@/components/content/article-card';
import { EmptyState, ErrorState, ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { anhDuPhongTrangTraiMobile, laSanPhamTestHomepage } from '@/lib/anh-du-phong';
import { KNOWLEDGE_FALLBACK_MOBILE, NEWS_FALLBACK_MOBILE, type BaiVietMobile } from '@/lib/bai-viet-mobile';
import { HERO_BANNERS, PROMO_CARDS } from '@/lib/homepage-data';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';

const GREEN = '#087A4B';
const HERO_INTERVAL_MS = 3000;

const FEATURED_TABS = [
  { id: 'tat-ca', label: 'Tất cả' },
  { id: 'rau-cu', label: 'Rau củ' },
  { id: 'trai-cay', label: 'Trái cây' },
  { id: 'thit-trung', label: 'Thịt, trứng' },
  { id: 'thuy-san', label: 'Thủy sản' },
  { id: 'dac-san', label: 'Đặc sản' },
  { id: 'organic', label: 'Organic' },
  { id: 'vietgap', label: "VietGAP" },
] as const;

const KNOWLEDGE_TABS = [
  { id: 'tat-ca', label: 'Tất cả' },
  { id: 'ky-thuat', label: 'Kỹ thuật trồng trọt' },
  { id: 'dinh-duong', label: 'Dinh dưỡng' },
  { id: 'meo-chon', label: 'Mẹo chọn mua' },
  { id: 'cau-chuyen', label: 'Câu chuyện nông dân' },
] as const;

function dinhDangQuyCach(item: { khoiLuong: number; donVi: string }): string {
  const donVi = item.donVi.trim().toLowerCase();
  if (donVi === 'kg' && item.khoiLuong < 1) return `${Math.round(item.khoiLuong * 1000)}g`;
  if ((donVi === 'l' || donVi === 'lít' || donVi === 'lit') && item.khoiLuong < 1) return `${Math.round(item.khoiLuong * 1000)}ml`;
  const soLuong = Number.isInteger(item.khoiLuong) ? String(item.khoiLuong) : String(Number(item.khoiLuong.toFixed(2)));
  return `${soLuong}${donVi === 'quả' || donVi === 'qua' ? ' quả' : donVi}`;
}

function chuanHoaKhongDau(value: string): string {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function articleMatchesTab(article: BaiVietMobile, tab: string): boolean {
  if (tab === 'tat-ca') return true;
  const text = chuanHoaKhongDau(`${article.tag} ${article.title} ${article.moTa}`);
  const keywords: Record<string, string[]> = {
    'ky-thuat': ['ky thuat', 'trong trot', 'canh tac', 'thuy canh', 'nha mang'],
    'dinh-duong': ['dinh duong', 'suc khoe', 'vitamin', 'khau phan'],
    'meo-chon': ['meo', 'chon', 'bao quan', 'an toan', 'mua'],
    'cau-chuyen': ['cau chuyen', 'nong dan', 'ky su', 'trang trai'],
  };
  return (keywords[tab] ?? []).some((keyword) => text.includes(keyword));
}

function SectionHeader({ icon, title, action, onAction, danger = false }: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  action?: string;
  onAction?: () => void;
  danger?: boolean;
}) {
  return (
    <View className="mb-2.5 flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
        {icon ? <Ionicons name={icon} size={20} color={danger ? '#E53935' : GREEN} /> : null}
        <Text className={`text-[18px] font-black ${danger ? 'text-[#E53935]' : 'text-[#173126]'}`}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} className="flex-row items-center gap-1 active:opacity-60">
          <Text className="text-[12px] font-bold text-[#0B7A48]">{action}</Text>
          <Ionicons name="chevron-forward" size={13} color={GREEN} />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function TrangChu() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [timKiem, setTimKiem] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [tabNoiBat, setTabNoiBat] = useState('tat-ca');
  const [tabKienThuc, setTabKienThuc] = useState('tat-ca');
  const heroRef = useRef<ScrollView>(null);

  const facetsQuery = useLayFacetsSanPhamCongKhai();
  const noiBatQuery = useLayDanhSachSanPhamCongKhai({ trang: 1, gioiHan: 16, khaDung: 'CON_HANG', sapXep: 'PHU_HOP' });
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();
  const farmsQuery = useLayDanhSachTrangTraiCongKhai({ trang: 1, gioiHan: 6, noiBat: true });

  const heroWidth = Math.max(280, windowWidth - 32);

  useEffect(() => {
    if (heroPaused || HERO_BANNERS.length <= 1) return;
    const id = setInterval(() => {
      setHeroIndex((current) => {
        const next = (current + 1) % HERO_BANNERS.length;
        heroRef.current?.scrollTo({ x: next * heroWidth, animated: true });
        return next;
      });
    }, HERO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [heroPaused, heroWidth]);

  const apiProducts = useMemo(
    () => (noiBatQuery.data?.data?.duLieu ?? []).filter((item) => !laSanPhamTestHomepage(item.ten ?? '')),
    [noiBatQuery.data],
  );

  const flashSaleMuc = useMemo(
    () => (flashSaleQuery.data?.data ?? []).flatMap((campaign) => campaign.muc ?? []),
    [flashSaleQuery.data],
  );

  const featuredProducts = useMemo(() => {
    const flashSaleIds = new Set(flashSaleMuc.map((muc) => muc.sanPhamId));
    const withoutFlash = apiProducts.filter((item) => !flashSaleIds.has(item.id));

    if (tabNoiBat === 'tat-ca') return withoutFlash.slice(0, 8);

    return withoutFlash.filter((item) => {
      const slug = (item.danhMuc?.slug || '').toLowerCase();
      if (slug === tabNoiBat) return true;
      const category = chuanHoaKhongDau(item.danhMuc?.ten || '');
      const tabNorm = tabNoiBat.replace(/-/g, ' ');
      if (tabNoiBat === 'organic') {
        const certs = (item.chungNhan ?? []).map((cert) => chuanHoaKhongDau(cert.loai || ''));
        return certs.some((cert) => cert.includes('huu co') || cert.includes('organic')) || category.includes('organic') || category.includes('huu co');
      }
      if (tabNoiBat === 'vietgap') {
        return (item.chungNhan ?? []).map((cert) => chuanHoaKhongDau(cert.loai || '')).some((cert) => cert.includes('vietgap'));
      }
      return category.includes(tabNorm);
    }).slice(0, 8);
  }, [apiProducts, flashSaleMuc, tabNoiBat]);

  const farms = useMemo(() => farmsQuery.data?.data?.duLieu ?? [], [farmsQuery.data]);
  const knowledgePreview = useMemo(() => KNOWLEDGE_FALLBACK_MOBILE.filter((article) => articleMatchesTab(article, tabKienThuc)).slice(0, 4), [tabKienThuc]);

  const refreshing = facetsQuery.isFetching || noiBatQuery.isFetching || flashSaleQuery.isFetching || farmsQuery.isFetching;
  const refreshAll = useCallback(() => {
    void Promise.all([facetsQuery.refetch(), noiBatQuery.refetch(), flashSaleQuery.refetch(), farmsQuery.refetch()]);
  }, [facetsQuery, noiBatQuery, flashSaleQuery, farmsQuery]);

  function timSanPham() {
    const q = timKiem.trim();
    router.push(q ? ({ pathname: '/kham-pha', params: { q } } as Href) : '/kham-pha');
  }

  function giaTriDanhMuc(label: string, slug: string): string {
    const facets = facetsQuery.data?.data.danhMuc ?? [];
    const labelNorm = chuanHoaKhongDau(label);
    const slugNorm = chuanHoaKhongDau(slug);
    return facets.find((item) => {
      const valueNorm = chuanHoaKhongDau(item.value);
      const itemLabel = chuanHoaKhongDau(item.label);
      return valueNorm === labelNorm || itemLabel === labelNorm || valueNorm === slugNorm || itemLabel === slugNorm;
    })?.value ?? label;
  }

  function moDanhMuc(label: string, slug: string) {
    router.push({ pathname: '/kham-pha', params: { danhMuc: giaTriDanhMuc(label, slug) } });
  }

  function moHero(category: string) {
    const labels: Record<string, string> = {
      'rau-cu': 'Rau củ',
      'trai-cay': 'Trái cây',
      'thit-trung': 'Thịt, trứng',
      'dac-san': 'Đặc sản',
      'combo': 'Combo',
    };
    if (category === 'tat-ca') return router.push('/kham-pha');
    moDanhMuc(labels[category] ?? category, category);
  }

  async function moArticle(article: BaiVietMobile) {
    if (!article.href) return;
    if (/^https?:\/\//i.test(article.href)) return Linking.openURL(article.href);
    router.push(article.href as Href);
  }

  function onHeroMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / heroWidth);
    if (next >= 0 && next < HERO_BANNERS.length) setHeroIndex(next);
    setHeroPaused(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FBF7]" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={GREEN} />}
        contentContainerStyle={{ paddingBottom: 34 }}
      >
        <View className="border-b border-[#E1EAE4] bg-white px-4 pb-4 pt-2">
          <MobileBrandBar />
          <View className="mt-3 flex-row items-center gap-2">
            <View className="min-h-[50px] flex-1 flex-row items-center rounded-[16px] border border-[#DCE7DF] bg-[#F7FAF8] px-4">
              <Ionicons name="search-outline" size={21} color="#607067" />
              <TextInput value={timKiem} onChangeText={setTimKiem} onSubmitEditing={timSanPham} returnKeyType="search" placeholder="Tìm nông sản, trang trại..." placeholderTextColor="#89958E" className="min-h-[48px] flex-1 pl-3 text-[14px] text-[#17251C]" />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Quét QR truy xuất" onPress={() => router.push('/quet-qr')} className="h-[50px] w-[50px] items-center justify-center rounded-[16px] bg-[#087A4B] active:opacity-75">
              <Ionicons name="qr-code-outline" size={23} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <View className="px-4 pt-3">
          <View>
            <View className="overflow-hidden rounded-[6px] bg-[#EAF3EC]">
              <ScrollView ref={heroRef} horizontal pagingEnabled decelerationRate="fast" showsHorizontalScrollIndicator={false} onScrollBeginDrag={() => setHeroPaused(true)} onMomentumScrollEnd={onHeroMomentumEnd}>
                {HERO_BANNERS.map((banner) => (
                  <Pressable key={banner.id} onPress={() => moHero(banner.category)} style={{ width: heroWidth, aspectRatio: 4 }} className="bg-[#EAF3EC] active:opacity-90">
                    <Image source={banner.image} contentFit="cover" style={{ width: '100%', height: '100%' }} />
                  </Pressable>
                ))}
              </ScrollView>
              <View className="absolute bottom-2 left-0 right-0 flex-row justify-center gap-1.5">
                {HERO_BANNERS.map((banner, index) => (
                  <Pressable key={`dot-${banner.id}`} onPress={() => { setHeroIndex(index); heroRef.current?.scrollTo({ x: index * heroWidth, animated: true }); }} style={{ width: heroIndex === index ? 20 : 6, height: 6 }} className={heroIndex === index ? 'rounded-full bg-[#0B7A48]' : 'rounded-full bg-white/80'} />
                ))}
              </View>
            </View>

            <View className="mt-3 gap-3">
              {PROMO_CARDS.slice(0, 2).map((promo, index) => (
                <Pressable
                  key={promo.id}
                  onPress={() => moDanhMuc(index === 0 ? 'Rau củ' : 'Trái cây', promo.category)}
                  className="relative h-[148px] overflow-hidden rounded-[8px] border border-[#E2EAE4] bg-white active:opacity-90"
                >
                  <Image
                    source={promo.image}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="high"
                    transition={0}
                    allowDownscaling={false}
                    style={{ width: '100%', height: 148 }}
                  />

                  {/* Mobile: giữ sản phẩm/hoa quả rõ ở phần phải, chữ nằm trên
                      một panel sáng bán trong suốt thay vì phủ trực tiếp lên ảnh. */}
                  <View
                    className="absolute bottom-0 left-0 top-0 justify-center px-4"
                    style={{
                      width: '58%',
                      backgroundColor:
                        index === 0
                          ? 'rgba(244,250,245,0.90)'
                          : 'rgba(255,248,240,0.90)',
                    }}
                  >
                    <Text
                      numberOfLines={2}
                      className="text-[15px] font-black leading-5 text-[#173126]"
                    >
                      {promo.title}
                    </Text>
                    <Text className="mt-1 text-[12px] font-extrabold text-[#0B7A48]">
                      {index === 0 ? 'Tươi ngon mỗi ngày' : 'Ngọt lành tự nhiên'}
                    </Text>
                    <View className="mt-2 self-start rounded-full bg-[#06633C] px-3 py-1.5">
                      <Text className="text-[10px] font-extrabold text-white">
                        Xem ngay →
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Web hiện tại đã gỡ TRUST STRIP / SIDEBAR / QUICK CATEGORIES — đi thẳng Flash Sale. */}
          {flashSaleQuery.isPending ? (
            <View className="mt-6">
              <SectionHeader icon="flash" title="Flash Sale" danger />
              <View className="flex-row flex-wrap justify-between gap-y-2.5">{[0,1,2,3].map((key) => <View key={key} style={{ width: '48.6%' }}><ProductCardSkeleton /></View>)}</View>
            </View>
          ) : flashSaleQuery.isError ? (
            <View className="mt-6"><ErrorState title="Không tải được Flash Sale" description="Chương trình giảm giá đang tạm thời không khả dụng." actionLabel="Thử lại" onAction={() => void flashSaleQuery.refetch()} /></View>
          ) : flashSaleMuc.length === 0 ? null : (
            <View className="mt-6">
              <SectionHeader icon="flash" title="Flash Sale" danger action="Xem tất cả" onAction={() => router.push('/khuyen-mai')} />
              <View className="flex-row flex-wrap justify-between gap-y-2.5">
                {flashSaleMuc.map((muc) => (
                  <View key={muc.bienTheSanPhamId} style={{ width: '48.6%' }}>
                    <ProductCard
                      compact
                      name={muc.ten}
                      farmName={`${muc.trangTrai.ten} · ${muc.khoiLuong} ${muc.donVi}`}
                      price={muc.giaFlash}
                      originalPrice={muc.giaGoc}
                      discountPercent={muc.phanTramGiam}
                      unit={`${muc.khoiLuong} ${muc.donVi}`}
                      imageUrl={muc.anhBiaUrl}
                      stockText={muc.soLuongKhaDung <= 0 ? 'Hết hàng' : muc.soLuongKhaDung <= 10 ? `Chỉ còn ${hienThiTonKhaDung(muc.soLuongKhaDung)}` : null}
                      onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: muc.sanPhamId } })}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="mt-6">
            <SectionHeader icon="star" title="Sản phẩm nổi bật" action="Xem tất cả" onAction={() => router.push('/kham-pha')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10, paddingRight: 12 }}>
              {FEATURED_TABS.map((tab) => {
                const active = tabNoiBat === tab.id;
                return <Pressable key={tab.id} onPress={() => setTabNoiBat(tab.id)} className={active ? 'rounded-full bg-[#06633C] px-3 py-1.5' : 'rounded-full bg-[#EEF5F0] px-3 py-1.5'}><Text className={active ? 'text-[11px] font-bold text-white' : 'text-[11px] font-semibold text-[#455E51]'}>{tab.label}</Text></Pressable>;
              })}
            </ScrollView>

            {noiBatQuery.isPending ? (
              <View className="flex-row flex-wrap justify-between gap-y-2.5">{[0,1,2,3].map((key) => <View key={key} style={{ width: '48.6%' }}><ProductCardSkeleton /></View>)}</View>
            ) : noiBatQuery.isError ? (
              <ErrorState title="Không tải được sản phẩm nổi bật" description="Danh sách sản phẩm đang tạm thời không khả dụng." actionLabel="Thử lại" onAction={() => void noiBatQuery.refetch()} />
            ) : featuredProducts.length === 0 ? (
              <EmptyState title="Chưa có sản phẩm nổi bật" description="Hiện chưa có sản phẩm phù hợp với bộ lọc đã chọn." />
            ) : (
              <View className="flex-row flex-wrap justify-between gap-y-2.5">
                {featuredProducts.map((item) => {
                  const effectivePrice = typeof item.giaBan?.tu === 'number' && item.giaBan.tu > 0 ? item.giaBan.tu : item.gia.tu;
                  const discountPercent = typeof item.giaBan?.phanTramGiam === 'number' && item.giaBan.phanTramGiam > 0 ? item.giaBan.phanTramGiam : null;
                  const originalPrice = discountPercent !== null && typeof item.giaBan?.giaGocDaiDien === 'number' && item.giaBan.giaGocDaiDien > effectivePrice ? item.giaBan.giaGocDaiDien : null;
                  const nhanHieu = item.chungNhan[0]?.loai ?? null;
                  void nhanHieu;
                  return (
                    <View key={item.id} style={{ width: '48.6%' }}>
                      <ProductCard
                        compact
                        name={item.ten}
                        farmName={item.trangTrai?.ten?.trim() || ''}
                        price={effectivePrice}
                        originalPrice={originalPrice}
                        discountPercent={discountPercent}
                        unit={dinhDangQuyCach(item.quyCach)}
                        imageUrl={item.anhBiaUrl}
                        stockText={item.khaDung.soLuongKhaDung > 0 && item.khaDung.soLuongKhaDung <= 10 ? `Chỉ còn ${hienThiTonKhaDung(item.khaDung.soLuongKhaDung)}` : null}
                        onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.id } })}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {farmsQuery.isPending ? (
            <View className="mt-6"><SectionHeader icon="leaf" title="Trang trại tiêu biểu" /><View className="rounded-[8px] border border-[#DDE8DF] bg-white p-4"><Text className="text-[12px] text-[#6E7D74]">Đang tải trang trại...</Text></View></View>
          ) : farmsQuery.isError || farms.length === 0 ? null : (
            <View className="mt-6">
              <SectionHeader icon="leaf" title="Trang trại tiêu biểu" action="Xem tất cả" onAction={() => router.push('/trang-trai')} />
              <View className="gap-2.5">
                {farms.map((farm) => {
                  const imageUri = chuanHoaUrlAnhMobile(farm.anhBiaUrl);
                  return (
                    <Pressable key={farm.id} onPress={() => router.push({ pathname: '/trang-trai/[id]', params: { id: farm.id } })} className="overflow-hidden rounded-[8px] border border-[#DDE8DF] bg-white active:opacity-80">
                      {imageUri ? <Image source={{ uri: imageUri }} contentFit="cover" style={{ width: '100%', height: 150 }} /> : <Image source={anhDuPhongTrangTraiMobile(farm.ten)} contentFit="cover" style={{ width: '100%', height: 150 }} />}
                      <View className="p-3">
                        <Text numberOfLines={2} className="text-[14px] font-black text-[#173126]">{farm.ten}</Text>
                        <View className="mt-1 flex-row items-start gap-1"><Ionicons name="location-outline" size={13} color="#687268" /><Text numberOfLines={2} className="flex-1 text-[11px] leading-4 text-[#687268]">{farm.diaChi}</Text></View>
                        {farm.chungNhan.length > 0 ? (
                          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                            <View className="rounded-[4px] bg-[#EBF5EE] px-2 py-1"><Text className="text-[10px] font-bold text-[#0B7A48]">{farm.chungNhan[0]?.loai}</Text></View>
                            {farm.chungNhan.length > 1 ? <Text className="text-[10px] text-[#7E8982]">+{farm.chungNhan.length - 1} chứng nhận</Text> : null}
                          </View>
                        ) : null}
                        <View className="mt-3 items-center rounded-[4px] bg-[#06633C] py-2"><Text className="text-[11px] font-bold text-white">Xem trang trại</Text></View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View className="mt-6">
            <SectionHeader icon="ribbon" title="Kiến thức nông sản" action="Xem tất cả" onAction={() => router.push('/kien-thuc')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10, paddingRight: 12 }}>
              {KNOWLEDGE_TABS.map((tab) => {
                const active = tabKienThuc === tab.id;
                return <Pressable key={tab.id} onPress={() => setTabKienThuc(tab.id)} className={active ? 'rounded-full bg-[#06633C] px-3 py-1.5' : 'rounded-full bg-[#EEF5F0] px-3 py-1.5'}><Text className={active ? 'text-[11px] font-bold text-white' : 'text-[11px] font-semibold text-[#455E51]'}>{tab.label}</Text></Pressable>;
              })}
            </ScrollView>
            <View className="gap-3">{knowledgePreview.map((article) => <ArticleCardMobile key={article.id} article={article} onPress={() => void moArticle(article)} />)}</View>
          </View>

          <View className="mt-6 pb-2">
            <SectionHeader title="Tin tức" action="Xem tất cả" onAction={() => router.push('/tin-tuc')} />
            <View className="gap-3">{NEWS_FALLBACK_MOBILE.slice(0, 4).map((article) => <ArticleCardMobile key={article.id} article={article} onPress={() => void moArticle(article)} />)}</View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-CURRENT-WEB-HOME-V2
