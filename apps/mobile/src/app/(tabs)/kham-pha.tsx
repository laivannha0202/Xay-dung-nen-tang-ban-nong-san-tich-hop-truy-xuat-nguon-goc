import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductCardSkeleton,
} from '@/components/design-system';
import {
  FilterBottomSheet,
  type BoLocSanPhamMobile,
  type FilterOption,
} from '@/components/search-filter/filter-bottom-sheet';

const GIOI_HAN = 12;

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
  sapXep: 'TEN_AZ',
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
    value.sapXep !== 'TEN_AZ' ? value.sapXep : null,
  ].filter(Boolean).length;
}

export default function TrangKhamPha() {
  const router = useRouter();
  const [timKiem, setTimKiem] = useState('');
  const [timKiemApDung, setTimKiemApDung] = useState('');
  const [trang, setTrang] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [boLoc, setBoLoc] = useState<BoLocSanPhamMobile>(BO_LOC_MAC_DINH);
  const [boLocTam, setBoLocTam] = useState<BoLocSanPhamMobile>(BO_LOC_MAC_DINH);

  const query = {
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

  const { data, isPending, isError, refetch, isFetching } = useLayDanhSachSanPhamCongKhai(query);

  const { data: facetData } = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: 100,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  const facets = facetData?.data.duLieu ?? [];

  const categories = useMemo<FilterOption[]>(
    () =>
      Array.from(
        new Map(
          facets.map((item) => [
            item.danhMuc.slug,
            {
              value: item.danhMuc.slug,
              label: item.danhMuc.ten,
            },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [facets],
  );

  const farms = useMemo<FilterOption[]>(
    () =>
      Array.from(
        new Map(
          facets.map((item) => [
            item.trangTrai.id,
            {
              value: item.trangTrai.id,
              label: item.trangTrai.ten,
            },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, 'vi')),
    [facets],
  );

  const certificates = useMemo<FilterOption[]>(
    () =>
      Array.from(
        new Set(facets.flatMap((item) => item.chungNhan.map((certificate) => certificate.loai))),
      )
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((value) => ({ value, label: value })),
    [facets],
  );

  const response = data?.data;
  const items = response?.duLieu ?? [];
  const tongTrang = Math.max(1, Math.ceil((response?.tong ?? 0) / GIOI_HAN));
  const activeFilters = soBoLocDangDung(boLoc);

  function tim() {
    setTrang(1);
    setTimKiemApDung(timKiem.trim());
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-4 border-b border-border bg-background px-5 pb-4 pt-4">
        <View className="gap-1">
          <Badge variant="success">Search / List / Filter</Badge>
          <Text className="text-3xl font-bold text-foreground">Khám phá nông sản</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Tìm kiếm và lọc trực tiếp trên dữ liệu sản phẩm công khai.
          </Text>
        </View>

        <View className="flex-row gap-2">
          <TextInput
            value={timKiem}
            onChangeText={setTimKiem}
            onSubmitEditing={tim}
            returnKeyType="search"
            autoCapitalize="none"
            placeholder="Tên nông sản"
            placeholderTextColor="#718078"
            className="min-h-12 flex-1 rounded-xl border border-border bg-card px-4 text-foreground"
          />
          <Pressable
            accessibilityRole="button"
            onPress={tim}
            className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 active:opacity-80"
          >
            <Text className="font-semibold text-primary-foreground">Tìm</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={moBoLoc}
            className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Bộ lọc</Text>
            {activeFilters > 0 ? (
              <View className="min-w-6 items-center rounded-full bg-primary px-2 py-0.5">
                <Text className="text-xs font-bold text-primary-foreground">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>

          <Text className="text-sm text-muted-foreground">
            {isFetching && !isPending ? 'Đang cập nhật...' : `${response?.tong ?? 0} sản phẩm`}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isPending ? (
          <View className="gap-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </View>
        ) : isError ? (
          <ErrorState
            title="Không tải được danh sách sản phẩm"
            description="Kiểm tra API hoặc điều kiện bộ lọc rồi thử lại."
            actionLabel="Thử lại"
            onAction={() => {
              void refetch();
            }}
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
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted-foreground">
                Trang {response?.trang ?? trang} / {tongTrang}
              </Text>
              {timKiemApDung ? <Badge variant="info">“{timKiemApDung}”</Badge> : null}
            </View>

            <View className="gap-4">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  name={item.ten}
                  farmName={item.trangTrai.ten}
                  price={item.gia.tu}
                  unit="đơn vị"
                  imageUrl={item.anhBiaUrl}
                  badges={[
                    { label: item.danhMuc.ten, variant: 'neutral' },
                    {
                      label: item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                      variant: item.khaDung.coTheDatHang ? 'success' : 'warning',
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/san-pham/[id]',
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </View>

            {tongTrang > 1 ? (
              <View className="flex-row gap-3 pt-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={trang <= 1}
                  onPress={() => setTrang((current) => Math.max(1, current - 1))}
                  className={[
                    'min-h-12 flex-1 items-center justify-center rounded-xl border border-border bg-card px-4',
                    trang <= 1 ? 'opacity-40' : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-foreground">Trang trước</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={trang >= tongTrang}
                  onPress={() => setTrang((current) => Math.min(tongTrang, current + 1))}
                  className={[
                    'min-h-12 flex-1 items-center justify-center rounded-xl bg-primary px-4',
                    trang >= tongTrang ? 'opacity-40' : 'active:opacity-80',
                  ].join(' ')}
                >
                  <Text className="font-semibold text-primary-foreground">Trang sau</Text>
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
        onChange={setBoLocTam}
        onApply={apDungBoLoc}
        onReset={xoaBoLoc}
        onClose={() => setSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
