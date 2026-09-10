import {
  layChiTietSanPhamCongKhai,
  useLayDanhSachSanPhamCongKhai,
  useLayFacetsSanPhamCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductCardSkeleton,
} from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  FilterBottomSheet,
  type BoLocSanPhamMobile,
  type FilterOption,
} from '@/components/search-filter/filter-bottom-sheet';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  GIO_HANG_MOBILE_QUERY_KEY,
  themMucGioHangMobile,
} from '@/lib/api-gio-hang';
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
  items:
    | Array<{
        value: string;
        label: string;
        soSanPham: number;
      }>
    | undefined,
): FilterOption[] {
  return (
    items?.map((item) => ({
      value: item.value,
      label: `${item.label} (${item.soSanPham})`,
    })) ?? []
  );
}

function dinhDangQuyCach(value: { khoiLuong: number; donVi: string }): string {
  const donVi = value.donVi.trim().toLowerCase();
  const khoiLuong = value.khoiLuong;

  if (donVi === 'kg' && khoiLuong < 1) return `${Math.round(khoiLuong * 1000)}g`;
  if ((donVi === 'l' || donVi === 'lít' || donVi === 'lit') && khoiLuong < 1) {
    return `${Math.round(khoiLuong * 1000)}ml`;
  }

  const soLuong = Number.isInteger(khoiLuong)
    ? String(khoiLuong)
    : String(Number(khoiLuong.toFixed(2)));
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

  const { data, isPending, isError, refetch, isFetching } =
    useLayDanhSachSanPhamCongKhai(queryParams);

  const {
    data: facetData,
    isPending: facetsPending,
    isError: facetsIsError,
    error: facetsError,
    refetch: refetchFacets,
  } = useLayFacetsSanPhamCongKhai();

  const facets = facetData?.data;
  const categories = facetOptions(facets?.danhMuc);
  const farms = facetOptions(facets?.trangTrai);
  const certificates = facetOptions(facets?.chungNhan);
  const categoryChips = useMemo(() => facets?.danhMuc?.slice(0, 5) ?? [], [facets?.danhMuc]);

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));
  const activeFilters = soBoLocDangDung(boLoc);

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId }: { bienTheSanPhamId: string }) =>
      themMucGioHangMobile(bienTheSanPhamId, 1),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="border-b border-[#E7ECE9] bg-white px-5 pb-3 pt-2">
        <MobileBrandBar />

        <View className="mt-3 flex-row items-center gap-2">
          <View className="min-h-[52px] flex-1 flex-row items-center rounded-2xl bg-[#F2F5F3] px-4">
            <Ionicons name="search-outline" size={22} color="#526158" />
            <TextInput
              value={timKiem}
              onChangeText={setTimKiem}
              onSubmitEditing={tim}
              returnKeyType="search"
              autoCapitalize="none"
              placeholder="Tìm rau củ, trái cây, trang trại..."
              placeholderTextColor="#8A948E"
              className="min-h-[52px] flex-1 pl-3 text-[16px] text-foreground"
            />
            {timKiem ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa từ khóa"
                hitSlop={8}
                onPress={() => {
                  setTimKiem('');
                  setTimKiemApDung('');
                  setTrang(1);
                }}
              >
                <Ionicons name="close-circle" size={22} color="#9AA39E" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quét QR"
            onPress={() => router.push('/quet-qr')}
            className="h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[#DDE7E1] bg-white active:opacity-70"
          >
            <Ionicons name="scan-outline" size={25} color={PRIMARY} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12, paddingRight: 4 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: boLoc.danhMuc === null }}
            onPress={() => chonDanhMuc(null)}
            className={[
              'flex-row items-center gap-1.5 rounded-full border px-4 py-2.5',
              boLoc.danhMuc === null
                ? 'border-primary bg-primary'
                : 'border-[#E1E8E3] bg-[#F8FAF9]',
            ].join(' ')}
          >
            <Ionicons
              name="leaf-outline"
              size={16}
              color={boLoc.danhMuc === null ? '#FFFFFF' : PRIMARY}
            />
            <Text
              className={
                boLoc.danhMuc === null
                  ? 'font-bold text-white'
                  : 'font-semibold text-[#334139]'
              }
            >
              Tất cả
            </Text>
          </Pressable>

          {categoryChips.map((item) => {
            const selected = boLoc.danhMuc === item.value;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => chonDanhMuc(item.value)}
                className={[
                  'rounded-full border px-4 py-2.5',
                  selected
                    ? 'border-primary bg-primary'
                    : 'border-[#E1E8E3] bg-[#F8FAF9]',
                ].join(' ')}
              >
                <Text className={selected ? 'font-bold text-white' : 'font-semibold text-[#334139]'}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            onPress={moBoLoc}
            className="flex-row items-center gap-1.5 rounded-full border border-[#E1E8E3] bg-[#F8FAF9] px-4 py-2.5 active:opacity-75"
          >
            <Ionicons name="options-outline" size={17} color="#334139" />
            <Text className="font-semibold text-[#334139]">Bộ lọc</Text>
            {activeFilters > 0 ? (
              <View className="min-w-5 items-center rounded-full bg-primary px-1.5 py-0.5">
                <Text className="text-[10px] font-extrabold text-white">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-4 flex-row items-end justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[23px] font-extrabold text-[#17251C]">Khám phá nông sản</Text>
            <Text className="mt-1 text-sm text-[#7C8880]">
              {timKiemApDung ? `Kết quả cho “${timKiemApDung}”` : 'Dữ liệu sản phẩm công khai từ AgriMarket'}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-[#526158]">
            {isFetching && !isPending ? 'Đang cập nhật…' : `${response?.tong ?? 0} sản phẩm`}
          </Text>
        </View>

        {isPending ? (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={{ width: '48.4%' }}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : isError ? (
          <ErrorState
            title="Không tải được danh sách sản phẩm"
            description="Kiểm tra API hoặc điều kiện bộ lọc rồi thử lại."
            actionLabel="Thử lại"
            onAction={() => void refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Không tìm thấy nông sản"
            description="Hãy thay đổi từ khóa hoặc điều kiện bộ lọc."
            actionLabel={timKiemApDung || activeFilters > 0 ? 'Xóa điều kiện' : undefined}
            onAction={
              timKiemApDung || activeFilters > 0
                ? () => {
                    setTimKiem('');
                    setTimKiemApDung('');
                    xoaBoLoc();
                  }
                : undefined
            }
          />
        ) : (
          <View className="gap-5">
            {timKiemApDung ? (
              <View className="self-start">
                <Badge variant="info">“{timKiemApDung}”</Badge>
              </View>
            ) : null}

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {items.map((item) => (
                <View key={item.id} style={{ width: '48.4%' }}>
                  <ProductCard
                    name={item.ten}
                    farmName={`${item.trangTrai.ten}${item.trangTrai.diaChi ? ` · ${item.trangTrai.diaChi}` : ''}`}
                    price={item.gia.tu}
                    unit={dinhDangQuyCach(item.quyCach)}
                    imageUrl={item.anhBiaUrl}
                    badges={[
                      {
                        label: item.chungNhan[0]?.loai ?? item.danhMuc.ten,
                        variant: item.chungNhan.length > 0 ? 'success' : 'neutral',
                      },
                    ]}
                    disabled={
                      themGioHangMutation.isPending || item.khaDung.coTheDatHang === false
                    }
                    onAddToCart={
                      item.khaDung.coTheDatHang
                        ? () => void themVaoGioHang(item.id)
                        : undefined
                    }
                    onPress={() =>
                      router.push({ pathname: '/san-pham/[id]', params: { id: item.id } })
                    }
                  />
                </View>
              ))}
            </View>

            {tongTrang > 1 ? (
              <View className="flex-row items-center gap-3 pt-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={trang <= 1}
                  onPress={() => setTrang((current) => Math.max(1, current - 1))}
                  className={[
                    'min-h-12 flex-1 items-center justify-center rounded-xl border border-[#DDE7E1] bg-white px-4',
                    trang <= 1 ? 'opacity-40' : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-[#334139]">Trang trước</Text>
                </Pressable>
                <Text className="text-sm font-bold text-[#526158]">
                  {response?.trang ?? trang}/{tongTrang}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={trang >= tongTrang}
                  onPress={() => setTrang((current) => Math.min(tongTrang, current + 1))}
                  className={[
                    'min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-4',
                    trang >= tongTrang ? 'opacity-40' : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-white">Trang sau</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <FilterBottomSheet
        open={sheetOpen}
        value={boLocTam}
        categories={categories}
        farms={farms}
        certificates={certificates}
        facetsLoading={facetsPending}
        facetsError={
          facetsIsError
            ? thongBaoLoiApi(
                facetsError,
                'Không tải được danh mục, trang trại và chứng nhận.',
              )
            : null
        }
        onRetryFacets={() => void refetchFacets()}
        onChange={setBoLocTam}
        onApply={apDungBoLoc}
        onReset={xoaBoLoc}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
