import {
  hienThiTonKhaDung,
  layChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Pagination, ProductCard, ProductCardSkeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  FilterBottomSheet,
  type BoLocSanPhamMobile,
  type FilterOption,
} from '@/components/search-filter/filter-bottom-sheet';
import { thongBaoLoiApi } from '@/lib/api-error';
import { GIO_HANG_MOBILE_QUERY_KEY, themMucGioHangMobile } from '@/lib/api-gio-hang';
import {
  WISHLIST_TAI_KHOAN_QUERY_KEY,
  layWishlistTaiKhoanMobile,
  themWishlistTaiKhoanMobile,
  xoaWishlistTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GIOI_HAN = 16;
const PRIMARY = '#087A4B';

const BO_LOC_MAC_DINH: BoLocSanPhamMobile = {
  danhMuc: null,
  trangTraiId: null,
  tinhThanh: '',
  chungNhan: null,
  giaTu: '',
  giaDen: '',
  khaDung: 'TAT_CA',
  sapXep: 'MOI_NHAT',
};

function soKhongAm(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function soBoLocDangDung(value: BoLocSanPhamMobile, tuKhoa: string): number {
  let count = 0;
  if (tuKhoa.trim()) count += 1;
  if (value.danhMuc) count += 1;
  if (value.trangTraiId) count += 1;
  if (value.tinhThanh.trim()) count += 1;
  if (value.chungNhan) count += 1;
  if (value.giaTu.trim() || value.giaDen.trim()) count += 1;
  if (value.khaDung !== 'TAT_CA') count += 1;
  return count;
}

function facetOptions(
  items: Array<{ value: string; label: string; soSanPham: number }> | undefined,
): FilterOption[] {
  return items?.map((item) => ({ value: item.value, label: `${item.label} (${item.soSanPham})` })) ?? [];
}

function dinhDangQuyCach(value: { khoiLuong: number; donVi: string }): string {
  const donVi = value.donVi.trim().toLowerCase();
  const khoiLuong = value.khoiLuong;
  if (donVi === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((donVi === 'l' || donVi === 'lít' || donVi === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }
  const soLuong = Number.isInteger(khoiLuong) ? String(khoiLuong) : String(Number(khoiLuong.toFixed(2)));
  return `${soLuong}${donVi === 'quả' || donVi === 'qua' ? ' quả' : donVi}`;
}

export default function TrangKhamPha() {
  const router = useRouter();
  const params = useLocalSearchParams<{ danhMuc?: string; q?: string }>();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const [timKiem, setTimKiem] = useState('');
  const [timKiemApDung, setTimKiemApDung] = useState('');
  const [trang, setTrang] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [boLoc, setBoLoc] = useState<BoLocSanPhamMobile>(BO_LOC_MAC_DINH);
  const [boLocTam, setBoLocTam] = useState<BoLocSanPhamMobile>(BO_LOC_MAC_DINH);

  useEffect(() => {
    const danhMuc = typeof params.danhMuc === 'string' ? params.danhMuc : null;
    if (!danhMuc) return;
    setBoLoc((current) => ({ ...current, danhMuc }));
    setBoLocTam((current) => ({ ...current, danhMuc }));
    setTrang(1);
  }, [params.danhMuc]);

  useEffect(() => {
    const q = typeof params.q === 'string' ? params.q.trim() : '';
    if (!q) return;
    setTimKiem(q);
    setTimKiemApDung(q);
    setTrang(1);
  }, [params.q]);

  const queryParams = {
    trang,
    gioiHan: GIOI_HAN,
    timKiem: timKiemApDung || undefined,
    danhMuc: boLoc.danhMuc || undefined,
    trangTraiId: boLoc.trangTraiId || undefined,
    tinhThanh: boLoc.tinhThanh.trim() || undefined,
    chungNhan: boLoc.chungNhan || undefined,
    giaTu: soKhongAm(boLoc.giaTu),
    giaDen: soKhongAm(boLoc.giaDen),
    khaDung: boLoc.khaDung,
    sapXep: boLoc.sapXep,
  };

  const { data, isPending, isError, refetch, isFetching } = useLayDanhSachSanPhamCongKhai(queryParams);
  const {
    data: facetData,
    isPending: facetsPending,
    isError: facetsIsError,
    error: facetsError,
    refetch: refetchFacets,
  } = useLayFacetsSanPhamCongKhai();

  const wishlistQuery = useQuery({
    queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY,
    queryFn: layWishlistTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const favoriteIds = useMemo(
    () => new Set(wishlistQuery.data?.duLieu.map((item) => item.sanPhamId) ?? []),
    [wishlistQuery.data?.duLieu],
  );

  const facets = facetData?.data;
  const categories = facetOptions(facets?.danhMuc);
  const farms = facetOptions(facets?.trangTrai);
  const certificates = facetOptions(facets?.chungNhan);
  const regions = facetOptions(facets?.tinhThanh);
  const categoryChips = useMemo(() => facets?.danhMuc?.slice(0, 8) ?? [], [facets?.danhMuc]);
  const tenDanhMucHienTai = useMemo(
    () => facets?.danhMuc?.find((item) => item.value === boLoc.danhMuc)?.label ?? null,
    [facets?.danhMuc, boLoc.danhMuc],
  );

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));
  const activeFilters = soBoLocDangDung(boLoc, timKiemApDung);

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId }: { bienTheSanPhamId: string }) => themMucGioHangMobile(bienTheSanPhamId, 1),
    onSuccess: (gioHang) => queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang),
  });

  const wishlistMutation = useMutation({
    mutationFn: ({ sanPhamId, favorite }: { sanPhamId: string; favorite: boolean }) =>
      favorite ? xoaWishlistTaiKhoanMobile(sanPhamId) : themWishlistTaiKhoanMobile(sanPhamId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WISHLIST_TAI_KHOAN_QUERY_KEY });
    },
  });

  function tim() {
    setTrang(1);
    setTimKiemApDung(timKiem.trim());
  }

  function chonDanhMuc(value: string | null) {
    setBoLoc((current) => ({ ...current, danhMuc: value }));
    setBoLocTam((current) => ({ ...current, danhMuc: value }));
    setTrang(1);
  }

  function moBoLoc() {
    setBoLocTam(boLoc);
    setSheetOpen(true);
  }

  function apDungBoLoc() {
    setBoLoc(boLocTam);
    setTrang(1);
    setSheetOpen(false);
  }

  function xoaBoLoc() {
    setBoLoc(BO_LOC_MAC_DINH);
    setBoLocTam(BO_LOC_MAC_DINH);
    setTrang(1);
    setSheetOpen(false);
  }

  function toggleFavorite(sanPhamId: string) {
    if (!daDangNhap) {
      moDangNhap(router, '/kham-pha');
      return;
    }
    if (!wishlistMutation.isPending) {
      wishlistMutation.mutate({ sanPhamId, favorite: favoriteIds.has(sanPhamId) });
    }
  }

  async function themVaoGioHang(sanPhamId: string) {
    let chiTiet;
    try {
      const responseChiTiet = await layChiTietSanPhamCongKhai(sanPhamId);
      chiTiet = responseChiTiet.data;
    } catch {
      return;
    }

    if (!chiTiet?.khaDung.coTheDatHang) return;
    const bienTheHopLe = chiTiet.bienThe.filter((item) => item.soLuongKhaDung > 0);
    if (bienTheHopLe.length === 0) return;
    if (bienTheHopLe.length > 1) {
      router.push({ pathname: '/san-pham/[id]', params: { id: sanPhamId } });
      return;
    }

    const bienThe = bienTheHopLe[0];
    if (!bienThe) return;
    if (!daDangNhap) {
      moDangNhap(router, '/kham-pha', {
        loai: 'them-gio-hang',
        returnTo: '/kham-pha',
        bienTheSanPhamId: bienThe.id,
        soLuong: 1,
      });
      return;
    }
    themGioHangMutation.mutate({ bienTheSanPhamId: bienThe.id });
  }

  const sortOptions = [
    { value: 'PHU_HOP', label: 'Phù hợp nhất' },
    { value: 'MOI_NHAT', label: 'Mới nhất' },
    { value: 'TEN_AZ', label: 'Tên A → Z' },
    { value: 'TEN_ZA', label: 'Tên Z → A' },
    { value: 'GIA_TANG', label: 'Giá thấp → cao' },
    { value: 'GIA_GIAM', label: 'Giá cao → thấp' },
  ] as const;
  const [sortOpen, setSortOpen] = useState(false);

  function toggleSort() {
    setSortOpen((v) => !v);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAF8]" edges={['top']}>
      {/* Global header */}
      <View className="border-b border-[#E3EBE6] bg-white px-4 pb-2 pt-2">
        <MobileBrandBar />
        <View className="mt-2 flex-row items-center gap-2">
          <View className="min-h-[40px] flex-1 flex-row items-center rounded-[12px] bg-[#F1F5F2] px-3">
            <Ionicons name="search-outline" size={18} color="#627168" />
            <TextInput
              value={timKiem}
              onChangeText={setTimKiem}
              onSubmitEditing={tim}
              returnKeyType="search"
              autoCapitalize="none"
              placeholder="Tìm nông sản, trang trại..."
              placeholderTextColor="#8A958E"
              className="min-h-[40px] flex-1 pl-2 text-[14px] text-[#17251C]"
            />
            {timKiem ? (
              <Pressable
                hitSlop={7}
                onPress={() => {
                  setTimKiem('');
                  setTimKiemApDung('');
                  setTrang(1);
                }}
              >
                <Ionicons name="close-circle" size={18} color="#97A19B" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bộ lọc"
            onPress={moBoLoc}
            className="relative h-[40px] w-[40px] items-center justify-center rounded-[12px] border border-[#DDE7E1] bg-white"
          >
            <Ionicons name="options-outline" size={20} color={PRIMARY} />
            {activeFilters > 0 ? (
              <View className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-[#087A4B] px-1 py-0.5">
                <Text className="text-[9px] font-extrabold text-white">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Toolbar */}
      <View className="px-4 pt-3">
        <View className="rounded-[12px] border border-[#E2EAE4] bg-white p-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="text-[17px] font-extrabold text-[#1e293b]">
              {tenDanhMucHienTai || (timKiemApDung ? `Kết quả cho "${timKiemApDung}"` : 'Tất cả nông sản')}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bộ lọc"
                onPress={moBoLoc}
                className="rounded-[8px] border border-[#E2EAE4] bg-[#F8FAF8] px-2.5 py-1.5 active:opacity-75"
              >
                <Text className="text-[12px] font-semibold text-[#0B7A48]">Bộ lọc</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sắp xếp"
                onPress={toggleSort}
                className="rounded-[8px] border border-[#E2EAE4] bg-[#F8FAF8] px-2.5 py-1.5 active:opacity-75"
              >
                <Text className="text-[12px] font-semibold text-[#0B7A48]">Sắp xếp</Text>
              </Pressable>
            </View>
          </View>
          <View className="mt-1.5 flex-row items-center justify-between">
            <Text className="text-[12px] text-[#79857E]">
              {response?.tong ?? 0} sản phẩm
            </Text>
            {isFetching && !isPending ? (
              <Text className="text-[11px] text-[#79857E]">Đang cập nhật…</Text>
            ) : null}
          </View>
        </View>

        {/* Category chips — secondary quick-filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingTop: 8, paddingBottom: 4 }}
        >
          <Pressable
            onPress={() => chonDanhMuc(null)}
            className={`rounded-[8px] border px-3 py-1.5 ${boLoc.danhMuc === null ? 'border-[#087A4B] bg-[#087A4B]' : 'border-[#E2EAE4] bg-white'}`}
          >
            <Text className={`text-[11px] font-bold ${boLoc.danhMuc === null ? 'text-white' : 'text-[#405047]'}`}>Tất cả</Text>
          </Pressable>
          {categoryChips.map((item) => {
            const selected = boLoc.danhMuc === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => chonDanhMuc(item.value)}
                className={`rounded-[8px] border px-3 py-1.5 ${selected ? 'border-[#087A4B] bg-[#087A4B]' : 'border-[#E2EAE4] bg-white'}`}
              >
                <Text numberOfLines={1} className={`text-[11px] font-bold ${selected ? 'text-white' : 'text-[#405047]'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {sortOpen ? (
        <View className="mx-4 mb-2 rounded-[12px] border border-[#E2EAE4] bg-white p-2">
          {sortOptions.map((opt) => {
            const selected = boLoc.sapXep === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setBoLoc((c) => ({ ...c, sapXep: opt.value }));
                  setTrang(1);
                  setSortOpen(false);
                }}
                className={`flex-row items-center justify-between rounded-[8px] px-3 py-2 ${selected ? 'bg-[#EBF5EE]' : ''}`}
              >
                <Text className={`text-[13px] ${selected ? 'font-bold text-[#0B7A48]' : 'text-[#334155]'}`}>{opt.label}</Text>
                {selected ? <Text className="text-[12px] font-bold text-[#0B7A48]">✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 14, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={null}
        ListEmptyComponent={
          isPending ? (
            <View className="flex-row flex-wrap justify-between gap-y-4">
              {[0, 1, 2, 3].map((key) => (
                <View key={key} style={{ width: '48.2%' }}><ProductCardSkeleton /></View>
              ))}
            </View>
          ) : isError ? (
            <ErrorState
              title="Không tải được danh sách sản phẩm"
              description="Kiểm tra kết nối API rồi thử lại."
              actionLabel="Thử lại"
              onAction={() => void refetch()}
            />
          ) : (
            <EmptyState
              title="Không tìm thấy nông sản"
              description="Hãy đổi từ khóa hoặc điều kiện bộ lọc."
              actionLabel={timKiemApDung || activeFilters > 0 ? 'Xóa điều kiện' : undefined}
              onAction={timKiemApDung || activeFilters > 0 ? () => {
                setTimKiem('');
                setTimKiemApDung('');
                xoaBoLoc();
              } : undefined}
            />
          )
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '50%' }}>
            <ProductCard
              name={item.ten}
              farmName={`${item.trangTrai.ten}${item.trangTrai.diaChi ? ` · ${item.trangTrai.diaChi}` : ''}`}
              price={item.giaBan?.tu ?? item.gia.tu}
              priceTo={(item.giaBan?.den ?? item.gia.den ?? 0) > (item.giaBan?.tu ?? item.gia.tu ?? 0)
                ? (item.giaBan?.den ?? item.gia.den)
                : undefined}
              originalPrice={
                item.giaBan?.dangGiam === true && item.giaBan.loaiGia === 'FLASH_SALE'
                  ? item.giaBan.giaGocDaiDien
                  : undefined
              }
              discountPercent={
                item.giaBan?.dangGiam === true && item.giaBan.loaiGia === 'FLASH_SALE'
                  ? item.giaBan.phanTramGiam
                  : undefined
              }
              unit={dinhDangQuyCach(item.quyCach)}
              imageUrl={item.anhBiaUrl}
              badges={item.chungNhan
                .map((c) => ({ label: c.loai, variant: 'success' as const }))
                .filter((b) => b.label)}
              rating={item.danhGia?.diemTrungBinh ?? undefined}
              reviewCount={item.danhGia?.tongLuot ?? 0}
              stockText={
                item.khaDung.coTheDatHang &&
                item.khaDung.soLuongKhaDung > 0 &&
                item.khaDung.soLuongKhaDung <= 10
                  ? `Chỉ còn ${hienThiTonKhaDung(item.khaDung.soLuongKhaDung)}`
                  : null
              }
              xuatXu={item.trangTrai.diaChi ?? item.trangTrai.ten}
              hetHang={!item.khaDung.coTheDatHang}
              favorite={favoriteIds.has(item.id)}
              onFavorite={() => toggleFavorite(item.id)}
              disabled={themGioHangMutation.isPending || item.khaDung.coTheDatHang === false}
              onAddToCart={item.khaDung.coTheDatHang ? () => void themVaoGioHang(item.id) : undefined}
              onQuetQR={() => router.push('/quet-qr')}
              onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListFooterComponent={
          tongTrang > 1 ? (
            <View className="mt-3 items-center">
              <Pagination page={trang} total={tongTrang} onChange={setTrang} />
            </View>
          ) : null
        }
      />

      <FilterBottomSheet
        open={sheetOpen}
        value={boLocTam}
        categories={categories}
        farms={farms}
        certificates={certificates}
        regions={regions}
        facetsLoading={facetsPending}
        facetsError={facetsIsError ? thongBaoLoiApi(facetsError, 'Không tải được danh mục, trang trại, khu vực và chứng nhận.') : null}
        onRetryFacets={() => void refetchFacets()}
        onChange={setBoLocTam}
        onApply={apDungBoLoc}
        onReset={xoaBoLoc}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
