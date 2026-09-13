import {
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

import { EmptyState, ErrorState, ProductCard, ProductCardSkeleton } from '@/components/design-system';
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

const GIOI_HAN = 12;
const PRIMARY = '#087A4B';

const BO_LOC_MAC_DINH: BoLocSanPhamMobile = {
  danhMuc: null,
  trangTraiId: null,
  tinhThanh: '',
  chungNhan: null,
  giaTu: '',
  giaDen: '',
  thuHoachTu: '',
  thuHoachDen: '',
  khaDung: 'TAT_CA',
  sapXep: 'PHU_HOP',
};

function soKhongAm(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function soBoLocDangDung(value: BoLocSanPhamMobile): number {
  return [
    value.danhMuc,
    value.trangTraiId,
    value.tinhThanh.trim() || null,
    value.chungNhan,
    value.giaTu.trim() || null,
    value.giaDen.trim() || null,
    value.thuHoachTu || null,
    value.thuHoachDen || null,
    value.khaDung !== 'TAT_CA' ? value.khaDung : null,
    value.sapXep !== 'PHU_HOP' ? value.sapXep : null,
  ].filter(Boolean).length;
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
  const params = useLocalSearchParams<{ danhMuc?: string }>();
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
    thuHoachTu: boLoc.thuHoachTu || undefined,
    thuHoachDen: boLoc.thuHoachDen || undefined,
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
  const categoryChips = useMemo(() => facets?.danhMuc?.slice(0, 8) ?? [], [facets?.danhMuc]);

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));
  const activeFilters = soBoLocDangDung(boLoc);

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

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <View className="border-b border-[#E3EBE6] bg-white px-4 pb-3 pt-2">
        <MobileBrandBar />
        <View className="mt-3 flex-row items-center gap-2">
          <View className="min-h-[50px] flex-1 flex-row items-center rounded-[16px] bg-[#F1F5F2] px-4">
            <Ionicons name="search-outline" size={21} color="#627168" />
            <TextInput
              value={timKiem}
              onChangeText={setTimKiem}
              onSubmitEditing={tim}
              returnKeyType="search"
              autoCapitalize="none"
              placeholder="Tìm nông sản, trang trại..."
              placeholderTextColor="#8A958E"
              className="min-h-[50px] flex-1 pl-3 text-[14px] text-[#17251C]"
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
                <Ionicons name="close-circle" size={20} color="#97A19B" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bộ lọc"
            onPress={moBoLoc}
            className="relative h-[50px] w-[50px] items-center justify-center rounded-[16px] border border-[#DDE7E1] bg-white"
          >
            <Ionicons name="options-outline" size={22} color={PRIMARY} />
            {activeFilters > 0 ? (
              <View className="absolute -right-1 -top-1 min-w-5 items-center rounded-full bg-[#087A4B] px-1 py-0.5">
                <Text className="text-[9px] font-extrabold text-white">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 11, paddingRight: 12 }}>
          <Pressable
            onPress={() => chonDanhMuc(null)}
            className={`rounded-full border px-4 py-2 ${boLoc.danhMuc === null ? 'border-[#087A4B] bg-[#087A4B]' : 'border-[#DEE8E2] bg-[#F8FAF9]'}`}
          >
            <Text className={`text-[12px] font-bold ${boLoc.danhMuc === null ? 'text-white' : 'text-[#405047]'}`}>Tất cả</Text>
          </Pressable>
          {categoryChips.map((item) => {
            const selected = boLoc.danhMuc === item.value;
            return (
              <Pressable
                key={item.value}
                onPress={() => chonDanhMuc(item.value)}
                className={`max-w-[170px] rounded-full border px-4 py-2 ${selected ? 'border-[#087A4B] bg-[#087A4B]' : 'border-[#DEE8E2] bg-[#F8FAF9]'}`}
              >
                <Text numberOfLines={1} className={`text-[12px] font-bold ${selected ? 'text-white' : 'text-[#405047]'}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 34, gap: 14, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-2 flex-row items-end justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Khám phá nông sản</Text>
              <Text className="mt-1 text-[12px] text-[#79857E]">
                {timKiemApDung ? `Kết quả cho “${timKiemApDung}”` : 'Sản phẩm công khai từ các trang trại'}
              </Text>
            </View>
            <Text className="text-[11px] font-bold text-[#66736B]">
              {isFetching && !isPending ? 'Đang cập nhật…' : `${response?.tong ?? 0} sản phẩm`}
            </Text>
          </View>
        }
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
              price={item.gia.tu}
              unit={dinhDangQuyCach(item.quyCach)}
              imageUrl={item.anhBiaUrl}
              badges={[{
                label: item.chungNhan[0]?.loai ?? item.danhMuc.ten,
                variant: item.chungNhan.length > 0 ? 'success' : 'neutral',
              }]}
              favorite={favoriteIds.has(item.id)}
              onFavorite={() => toggleFavorite(item.id)}
              disabled={themGioHangMutation.isPending || item.khaDung.coTheDatHang === false}
              onAddToCart={item.khaDung.coTheDatHang ? () => void themVaoGioHang(item.id) : undefined}
              onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        ListFooterComponent={
          tongTrang > 1 ? (
            <View className="mt-3 flex-row items-center gap-3">
              <Pressable
                disabled={trang <= 1}
                onPress={() => setTrang((current) => Math.max(1, current - 1))}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl border border-[#DDE7E1] bg-white ${trang <= 1 ? 'opacity-40' : ''}`}
              >
                <Text className="text-[12px] font-bold text-[#405047]">Trang trước</Text>
              </Pressable>
              <Text className="text-[11px] font-bold text-[#66736B]">{response?.trang ?? trang}/{tongTrang}</Text>
              <Pressable
                disabled={trang >= tongTrang}
                onPress={() => setTrang((current) => Math.min(tongTrang, current + 1))}
                className={`min-h-11 flex-1 items-center justify-center rounded-xl bg-[#087A4B] ${trang >= tongTrang ? 'opacity-40' : ''}`}
              >
                <Text className="text-[12px] font-bold text-white">Trang sau</Text>
              </Pressable>
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
        facetsLoading={facetsPending}
        facetsError={facetsIsError ? thongBaoLoiApi(facetsError, 'Không tải được danh mục, trang trại và chứng nhận.') : null}
        onRetryFacets={() => void refetchFacets()}
        onChange={setBoLocTam}
        onApply={apDungBoLoc}
        onReset={xoaBoLoc}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
