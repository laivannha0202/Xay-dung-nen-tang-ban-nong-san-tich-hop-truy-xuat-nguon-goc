import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import {
 ActivityIndicator,
 Pressable,
 RefreshControl,
 ScrollView,
 Text,
 View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  FarmCard,
  ProductCard,
  ProductCardSkeleton,
  type ProductCardBadge,
} from '@/components/design-system';
import {
  CategoryGrid,
  HeroBanner,
  MarketplaceHeader,
  QuickActions,
  SearchBar,
} from '@/components/home';
import { HarvestProductCard } from '@/components/home/harvest-product-card';
import { HomeSection } from '@/components/home/home-section';

const SO_SAN_PHAM_SECTION = 6;
const GIOI_HAN_FEED_NGUON_CUNG = 100;
const SO_DANH_MUC_HIEN_THI = 8;
const SO_TRANG_TRAI_HIEN_THI = 4;
const SO_NGAY_THU_HOACH_GAN_DAY = 30;

function ngayIsoTruoc(
 soNgay: number,
): string {
 const date = new Date();
 date.setHours(0, 0, 0, 0);
 date.setDate(
 date.getDate() - soNgay,
 );

 return date
 .toISOString()
 .slice(0, 10);
}

function HorizontalProductList({
 children,
}: {
 children: ReactNode;
}) {
 return (
 <ScrollView
 horizontal
 showsHorizontalScrollIndicator={false}
 contentContainerStyle={{
 gap: 12,
 paddingRight: 20,
 }}
 >
 {children}
 </ScrollView>
 );
}

function SectionSkeleton() {
 return (
 <View className="gap-3">
 <ProductCardSkeleton />
 <ProductCardSkeleton />
 </View>
 );
}

export default function TrangChu() {
 const router = useRouter();

 const thuHoachTu =
 ngayIsoTruoc(
 SO_NGAY_THU_HOACH_GAN_DAY,
 );

 const feedQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan:
 GIOI_HAN_FEED_NGUON_CUNG,
 sapXep: 'TEN_AZ',
 khaDung: 'TAT_CA',
 });

 const conHangQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan: 1,
 khaDung: 'CON_HANG',
 sapXep: 'PHU_HOP',
 });

 const phuHopQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan:
 SO_SAN_PHAM_SECTION,
 khaDung: 'CON_HANG',
 sapXep: 'PHU_HOP',
 });

 const moiCongKhaiQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan:
 SO_SAN_PHAM_SECTION,
 khaDung: 'CON_HANG',
 sapXep: 'MOI_NHAT',
 });

 const thuHoachGanDayQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan:
 SO_SAN_PHAM_SECTION,
 khaDung: 'CON_HANG',
 sapXep: 'PHU_HOP',
 thuHoachTu,
 });

 const organicQuery =
 useLayDanhSachSanPhamCongKhai({
 trang: 1,
 gioiHan:
 SO_SAN_PHAM_SECTION,
 khaDung: 'CON_HANG',
 sapXep: 'PHU_HOP',
 chungNhan: 'Organic',
 });

 const feed =
 feedQuery.data?.data;

 const sanPhamFeed =
 feed?.duLieu ?? [];

 const phuHop =
 phuHopQuery.data?.data
 ?.duLieu ?? [];

 const moiCongKhai =
 moiCongKhaiQuery.data?.data
 ?.duLieu ?? [];

 const thuHoachGanDay =
 thuHoachGanDayQuery.data
 ?.data?.duLieu ?? [];

 const organic =
 organicQuery.data?.data
 ?.duLieu ?? [];

 const tongConHang =
 conHangQuery.data?.data
 ?.tong ?? 0;

 const tongThuHoachGanDay =
 thuHoachGanDayQuery.data
 ?.data?.tong ?? 0;

 const danhMuc = Array.from(
  sanPhamFeed
 .reduce(
 (map, item) => {
 if (
 !map.has(
 item.danhMuc.id,
 )
 ) {
 map.set(
 item.danhMuc.id,
 item.danhMuc,
 );
 }

 return map;
 },
 new Map<
 string,
 (typeof sanPhamFeed)[number]['danhMuc']
 >(),
 )
 .values(),
 )
 .sort((a, b) =>
 a.ten.localeCompare(
 b.ten,
 'vi',
 ),
 )
 .slice(
 0,
 SO_DANH_MUC_HIEN_THI,
 );

 const trangTrai =
 Array.from(
 sanPhamFeed
 .reduce(
 (map, item) => {
 const current =
 map.get(
 item.trangTrai.id,
 );

 map.set(
 item.trangTrai.id,
 {
 id:
 item.trangTrai.id,
 ten:
 item.trangTrai.ten,
 diaChi:
 item.trangTrai
 .diaChi,
 chungNhan:
 current
 ?.chungNhan ??
 item.chungNhan[0]
 ?.loai ??
 null,
 },
 );

 return map;
 },
 new Map<
 string,
 {
 id: string;
 ten: string;
 diaChi: string;
 chungNhan:
 | string
 | null;
 }
 >(),
 )
 .values(),
 )
 .sort((a, b) =>
 a.ten.localeCompare(
 b.ten,
 'vi',
 ),
 )
 .slice(
 0,
 SO_TRANG_TRAI_HIEN_THI,
 );

  useEffect(() => {
    console.log('[AgriMarket] feedQuery:', {
      isPending: feedQuery.isPending,
      isError: feedQuery.isError,
      hasData: !!feedQuery.data,
    });
    console.log('[AgriMarket] phuHopQuery:', {
      isPending: phuHopQuery.isPending,
      isError: phuHopQuery.isError,
      hasData: !!phuHopQuery.data,
    });
  }, [feedQuery.isPending, feedQuery.isError, phuHopQuery.isPending, phuHopQuery.isError]);

  function badgesSanPham(
 item: (typeof sanPhamFeed)[number],
 custom?: ProductCardBadge[],
 ): ProductCardBadge[] {
 if (custom) {
 return custom;
 }

 const badges: ProductCardBadge[] =
 [
 {
 label:
 item.danhMuc.ten,
 variant: 'neutral',
 },
 ];

 if (
 item.chungNhan[0]?.loai
 ) {
 badges.push({
 label:
 item.chungNhan[0]
 .loai,
 variant: 'success',
 });
 }

 if (
 !item.khaDung
 .coTheDatHang
 ) {
 badges.push({
 label:
 'Tạm hết hàng',
 variant: 'warning',
 });
 }

 return badges.slice(0, 2);
 }

 function cardSanPham(
 item: (typeof sanPhamFeed)[number],
 custom?: ProductCardBadge[],
 ) {
 return (
 <View
 key={item.id}
 style={{ width: 280 }}
 >
 <ProductCard
 name={item.ten}
 farmName={
 item.trangTrai.ten
 }
 price={item.gia.tu}
 unit="đơn vị"
 imageUrl={
 item.anhBiaUrl
 }
 badges={badgesSanPham(
 item,
 custom,
 )}
 onPress={() =>
 router.push({
 pathname:
 '/san-pham/[id]',
 params: {
 id: item.id,
 },
 })
 }
 />
 </View>
 );
 }

 const dangTaiTrangChu =
 feedQuery.isPending &&
 phuHopQuery.isPending;

 const loiTrangChu =
 feedQuery.isError &&
 phuHopQuery.isError;

 function refetchTrangChu() {
 void Promise.all([
 feedQuery.refetch(),
 conHangQuery.refetch(),
 phuHopQuery.refetch(),
 moiCongKhaiQuery.refetch(),
 thuHoachGanDayQuery.refetch(),
 organicQuery.refetch(),
 ]);
 }

 if (feedQuery.isPending) {
 return (
 <SafeAreaView
 className="flex-1 bg-background"
 edges={['top']}
 >
 <View className="flex-1 items-center justify-center gap-3">
 <ActivityIndicator size="large" color="#16a34a" />
 <Text className="text-muted-foreground text-sm">
 Đang tải sản phẩm...
 </Text>
 </View>
 </SafeAreaView>
 );
 }

 if (feedQuery.isError) {
 return (
 <SafeAreaView
 className="flex-1 bg-background"
 edges={['top']}
 >
 <View className="flex-1 items-center justify-center gap-4 px-8">
 <Text className="text-foreground text-center text-lg font-bold">
 Không tải được dữ liệu
 </Text>
 <Text className="text-muted-foreground text-center text-sm">
 Vui lòng kiểm tra kết nối mạng và thử lại.
 </Text>
 <Pressable
 onPress={refetchTrangChu}
 className="rounded-xl bg-primary px-6 py-3"
 >
 <Text className="text-primary-foreground font-semibold">
 Thử lại
 </Text>
 </Pressable>
 </View>
 </SafeAreaView>
 );
 }

 return (
 <SafeAreaView
 className="flex-1 bg-background"
 style={{ flex: 1 }}
 edges={['top']}
 >
 <ScrollView
 className="flex-1"
 contentContainerStyle={{
 paddingBottom: 40,
 }}
 showsVerticalScrollIndicator={
 false
 }
 refreshControl={
 <RefreshControl
 refreshing={feedQuery.isFetching}
 onRefresh={refetchTrangChu}
 />
 }
 >
<View className="gap-6 px-5 pb-8 pt-5">
        <MarketplaceHeader />

        <SearchBar />

        <HeroBanner />

        <QuickActions />

        <CategoryGrid
          categories={danhMuc}
          onPress={(slug) =>
            router.push({
              pathname:
                '/kham-pha',
              params: {
                danhMuc: slug,
              },
            })
          }
        />

        {phuHop.map((item) => cardSanPham(item))}
      </View>
    </ScrollView>
  </SafeAreaView>
 );
}
