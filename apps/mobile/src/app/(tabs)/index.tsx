import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
 Pressable,
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
  HomeHeader,
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
          farmName={item.trangTrai.ten}
          price={item.gia.tu}
          unit="kg"
          imageUrl={item.anhBiaUrl}
          rating={4.8}
          sold={1200}
          delivery="Giao trong ngày"
          badges={badgesSanPham(item, custom)}
          onPress={() =>
            router.push({
              pathname: '/san-pham/[id]',
              params: { id: item.id },
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

 return (
 <SafeAreaView
 className="flex-1 bg-background"
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
 >
<View className="gap-6 px-5 pb-8 pt-5">
        <HomeHeader />

        <SearchBar />

        <HeroBanner />

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

        <View className="flex-row rounded-2xl bg-secondary p-4">
          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-foreground">
              {feed?.tong ?? 0}
            </Text>
            <Text className="text-xs text-muted-foreground">
              sản phẩm công khai
            </Text>
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-foreground">
              {tongConHang}
            </Text>
            <Text className="text-xs text-muted-foreground">
              còn hàng
            </Text>
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-xl font-bold text-foreground">
              {tongThuHoachGanDay}
            </Text>
            <Text className="text-xs text-muted-foreground">
              thu hoạch gần đây
            </Text>
 </View>
 </View>

 {dangTaiTrangChu ? (
 <HomeSection
 label="Đang tải"
 title="Nông sản từ AgriMarket"
 description="Đang lấy dữ liệu công khai từ hệ thống."
 >
 <SectionSkeleton />
 </HomeSection>
 ) : loiTrangChu ? (
 <ErrorState
 title="Không tải được Trang chủ"
 description="Không thể lấy dữ liệu sản phẩm công khai từ hệ thống."
 actionLabel="Thử lại"
 onAction={
 refetchTrangChu
 }
 />
 ) : (
 <View className="gap-12">
 <HomeSection
 label="Phù hợp"
 title="Sản phẩm đang có thể đặt"
 description="Ưu tiên sản phẩm còn hàng, có nguồn thu hoạch gần đây và được đánh giá tốt."
 >
 {phuHopQuery.isPending ? (
 <SectionSkeleton />
 ) : phuHop.length ===
 0 ? (
 <EmptyState
 title="Chưa có sản phẩm phù hợp"
 description="Hiện chưa có sản phẩm công khai còn hàng."
 />
 ) : (
 <HorizontalProductList>
 {phuHop.map(
 (item) =>
 cardSanPham(
 item,
 ),
 )}
 </HorizontalProductList>
 )}
 </HomeSection>

 <HomeSection
 label="Mới công khai"
 title="Sản phẩm mới nhất"
 description="Dùng sapXep=MOI_NHAT của API sản phẩm công khai; không gọi đây là thu hoạch mới."
 >
 {moiCongKhaiQuery.isPending ? (
 <SectionSkeleton />
 ) : moiCongKhai.length ===
 0 ? (
 <EmptyState
 title="Chưa có sản phẩm mới"
 description="Hiện chưa có sản phẩm công khai còn hàng."
 />
 ) : (
 <HorizontalProductList>
 {moiCongKhai.map(
 (item) =>
 cardSanPham(
 item,
 [
 {
 label:
 'Mới công khai',
 variant:
 'info',
 },
 {
 label:
 item
 .danhMuc
 .ten,
 variant:
 'neutral',
 },
 ],
 ),
 )}
 </HorizontalProductList>
 )}
 </HomeSection>

 <HomeSection
 label={`Thu hoạch ${SO_NGAY_THU_HOACH_GAN_DAY} ngày`}
 title="Nguồn cung từ trang trại có thu hoạch gần đây"
 description={`Chỉ hiển thị sản phẩm từ trang trại có thu hoạch từ ${thuHoachTu}; thẻ chi tiết đọc ngày thu hoạch gần nhất thật từ hệ thống.`}
 >
 {thuHoachGanDayQuery.isPending ? (
 <SectionSkeleton />
 ) : thuHoachGanDay.length ===
 0 ? (
 <EmptyState
 title="Chưa có nguồn cung thu hoạch gần đây"
 description="Không gắn nhãn thu hoạch mới nếu hệ thống không có bản ghi trong khoảng thời gian này."
 />
 ) : (
 <HorizontalProductList>
 {thuHoachGanDay.map(
 (item) => (
 <View
 key={item.id}
 style={{
 width: 280,
 }}
 >
 <HarvestProductCard
 id={
 item.id
 }
 />
 </View>
 ),
 )}
 </HorizontalProductList>
 )}
 </HomeSection>

 <HomeSection
 label="Organic"
 title="Sản phẩm có chứng nhận Organic"
 description="Chỉ hiển thị sản phẩm có chứng nhận Organic còn hiệu lực."
 >
 {organicQuery.isPending ? (
 <SectionSkeleton />
 ) : organic.length ===
 0 ? (
 <EmptyState
 title="Chưa có sản phẩm Organic"
 description="Không hiển thị nhãn Organic nếu API chưa trả chứng nhận phù hợp."
 />
 ) : (
 <HorizontalProductList>
 {organic.map(
 (item) =>
 cardSanPham(
 item,
 [
 {
 label:
 'Organic',
 variant:
 'success',
 },
 {
 label:
 item
 .danhMuc
 .ten,
 variant:
 'neutral',
 },
 ],
 ),
 )}
 </HorizontalProductList>
 )}
 </HomeSection>

 <HomeSection
 label="Danh mục trong feed"
 title="Khám phá theo nhóm nông sản"
 description={`Danh mục dưới đây chỉ được tổng hợp từ tối đa ${GIOI_HAN_FEED_NGUON_CUNG} sản phẩm public đang tải; không đại diện tổng danh mục quản trị.`}
 >
 {danhMuc.length ===
 0 ? (
 <EmptyState
 title="Chưa có danh mục trong feed"
 description="Khi sản phẩm public có danh mục, dữ liệu sẽ xuất hiện tại đây."
 />
 ) : (
 <ScrollView
 horizontal
 showsHorizontalScrollIndicator={
 false
 }
 contentContainerStyle={{
 gap: 10,
 paddingRight: 20,
 }}
 >
 {danhMuc.map(
 (item) => (
 <Pressable
 key={
 item.id
 }
 accessibilityRole="button"
 onPress={() =>
 router.push({
 pathname:
 '/kham-pha',
 params: {
 danhMuc:
 item.slug,
 },
 })
 }
 className="min-w-[150px] gap-1 rounded-2xl border border-border bg-card p-4 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 {item.ten}
 </Text>
 <Text className="text-sm text-muted-foreground">
 Xem sản phẩm
 </Text>
 </Pressable>
 ),
 )}
 </ScrollView>
 )}
 </HomeSection>

 <HomeSection
 label="Nguồn cung trong feed"
 title="Trang trại đang có sản phẩm công khai"
 description="Danh sách theo tên trang trại xuất hiện trong feed public; không xếp hạng 'nổi bật' ở phía Mobile."
 >
 {trangTrai.length ===
 0 ? (
 <EmptyState
 title="Chưa có trang trại trong feed"
 description="Hiện chưa có trang trại có sản phẩm công khai."
 />
 ) : (
 <View className="gap-3">
 {trangTrai.map(
 (item) => (
 <FarmCard
 key={
 item.id
 }
 name={
 item.ten
 }
 address={
 item.diaChi
 }
 certification={
 item.chungNhan
 }
 onPress={() =>
 router.push({
 pathname:
 '/trang-trai/[id]',
 params: {
 id:
 item.id,
 },
 })
 }
 />
 ),
 )}
 </View>
 )}
 </HomeSection>
 </View>
 )}
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}
