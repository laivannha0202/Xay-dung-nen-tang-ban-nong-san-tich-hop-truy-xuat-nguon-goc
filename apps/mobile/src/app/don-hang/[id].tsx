import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { DanhGiaMucDonHangMobile } from '@/components/orders/danh-gia-muc-don-hang';
import {
 donHangMobileDetailQueryKey,
 layChiTietDonHangMobile,
 nhanTrangThaiDonHangMobile,
} from '@/lib/api-don-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';
import { moDangNhap } from '@/lib/auth-navigation';
import { layTrangThaiHttp } from '@/lib/api-error';
import {
 giaoHangDonHangMobileQueryKey,
 layGiaoHangDonHangMobile,
} from '@/lib/api-giao-hang';
import {
 layThanhToanDonHangMobile,
 thanhToanDonHangMobileQueryKey,
} from '@/lib/api-thanh-toan';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

function dinhDangGia(value: number): string {
 return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function dinhDangNgay(value: string): string {
 const date = new Date(value);

 if (Number.isNaN(date.getTime())) return value;

 return new Intl.DateTimeFormat('vi-VN', {
 dateStyle: 'medium',
 timeStyle: 'short',
 }).format(date);
}

function variantTrangThai(trangThai: string): BadgeVariant {
 if (trangThai === 'DA_HUY') return 'danger';
 if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') {
 return 'success';
 }
 if (trangThai === 'DANG_GIAO') return 'info';
 if (trangThai === 'CHO_THANH_TOAN') return 'warning';
 return 'neutral';
}

function variantThanhToan(trangThai: string): BadgeVariant {
 if (trangThai === 'PAID') return 'success';
 if (trangThai === 'FAILED' || trangThai === 'CANCELLED') return 'danger';
 if (trangThai === 'REFUNDED' || trangThai === 'PARTIALLY_REFUNDED') {
 return 'info';
 }
 if (trangThai === 'PENDING' || trangThai === 'CREATED') return 'warning';
 return 'neutral';
}

function nhanThanhToan(trangThai: string): string {
 const labels: Record<string, string> = {
 CREATED: 'Đã tạo',
 PENDING: 'Chờ thanh toán',
 PAID: 'Đã thanh toán',
 FAILED: 'Thanh toán thất bại',
 CANCELLED: 'Đã hủy',
 REFUNDED: 'Đã hoàn tiền',
 PARTIALLY_REFUNDED: 'Hoàn tiền một phần',
 };

 return labels[trangThai] ?? trangThai;
}

function variantDatCho(trangThai: string): BadgeVariant {
 if (trangThai === 'DA_BAN') return 'success';
 if (trangThai === 'DA_GIAI_PHONG' || trangThai === 'HET_HAN') {
 return 'danger';
 }
 if (trangThai === 'DANG_GIU') return 'warning';
 return 'neutral';
}

function nhanDatCho(trangThai: string): string {
 const labels: Record<string, string> = {
 DANG_GIU: 'Đang giữ tồn',
 DA_BAN: 'Đã ghi nhận bán',
 DA_GIAI_PHONG: 'Đã giải phóng',
 HET_HAN: 'Đã hết hạn',
 };

 return labels[trangThai] ?? trangThai;
}

function variantGiaoHang(trangThai: string): BadgeVariant {
 if (trangThai === 'DA_GIAO') return 'success';
 if (
 trangThai === 'GIAO_THAT_BAI' ||
 trangThai === 'DA_HUY' ||
 trangThai === 'HOAN_HANG'
 ) {
 return 'danger';
 }
 if (trangThai === 'DANG_GIAO' || trangThai === 'DA_LAY_HANG') {
 return 'info';
 }
 return 'warning';
}

function nhanGiaoHang(trangThai: string): string {
 const labels: Record<string, string> = {
 CREATED: 'Đã tạo vận đơn',
 CHO_LAY_HANG: 'Chờ lấy hàng',
 DA_LAY_HANG: 'Đã lấy hàng',
 DANG_GIAO: 'Đang giao',
 DA_GIAO: 'Đã giao',
 GIAO_THAT_BAI: 'Giao thất bại',
 DA_HUY: 'Đã hủy',
 HOAN_HANG: 'Hoàn hàng',
 };

 return labels[trangThai] ?? trangThai;
}

function DetailSkeleton() {
 return (
 <View className="gap-4">
 <Skeleton height={120} borderRadius={18} />
 <Skeleton height={240} borderRadius={18} />
 <Skeleton height={220} borderRadius={18} />
 </View>
 );
}

export async function generateStaticParams() {
 return [];
}

export default function TrangChiTietDonHang() {
 const router = useRouter();
 const params = useLocalSearchParams<{ id: string }>();
 const id = typeof params.id === 'string' ? params.id : '';

 const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
 const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

 const query = useQuery({
 queryKey: donHangMobileDetailQueryKey(id),
 queryFn: () => layChiTietDonHangMobile(id),
 enabled: daDangNhap && id.length > 0,
 staleTime: 10_000,
 });

const paymentQuery = useQuery({
 queryKey: thanhToanDonHangMobileQueryKey(id),
 queryFn: () => layThanhToanDonHangMobile(id),
 enabled: daDangNhap && id.length > 0,
 staleTime: 5_000,
 retry: false,
 });

 const shipmentQuery = useQuery({
 queryKey: giaoHangDonHangMobileQueryKey(id),
 queryFn: () => layGiaoHangDonHangMobile(id),
 enabled: daDangNhap && id.length > 0,
 staleTime: 5_000,
 });

 if (trangThaiXacThuc === 'dang-khoi-phuc') {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/don-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">Quay lại</Text>
 </Pressable>
 </View>
 <View className="flex-1 px-5 py-4">
 <DetailSkeleton />
 </View>
 </SafeAreaView>
 );
 }

 if (!daDangNhap) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/don-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">Quay lại</Text>
 </Pressable>
 </View>

 <View className="flex-1 justify-center px-5">
 <EmptyState
 title="Đăng nhập để xem đơn hàng"
 description="Chi tiết đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
 actionLabel="Đăng nhập"
 onAction={() => moDangNhap(router, `/don-hang/${encodeURIComponent(id)}`)}
 />
 </View>
 </SafeAreaView>
 );
 }

 if (query.isPending) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/don-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">Quay lại</Text>
 </Pressable>
 </View>
 <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
 <DetailSkeleton />
 </ScrollView>
 </SafeAreaView>
 );
 }

 if (query.isError || !query.data) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/don-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">Quay lại</Text>
 </Pressable>
 </View>

 <View className="flex-1 justify-center px-5">
 <ErrorState
 title="Không tải được chi tiết đơn hàng"
 description="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc API đang tạm lỗi."
 actionLabel="Thử lại"
 onAction={() => {
 void query.refetch();
 }}
 />
 </View>
 </SafeAreaView>
 );
 }

 const order = query.data;

 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/don-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">Quay lại</Text>
 </Pressable>

 <Pressable
 accessibilityRole="button"
 disabled={query.isFetching}
 onPress={() => {
 void Promise.all([
 query.refetch(),
 paymentQuery.refetch(),
 shipmentQuery.refetch(),
 ]);
 }}
 className={[
 'rounded-full border border-border bg-card px-4 py-2',
 query.isFetching ? 'opacity-50' : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-primary">
 {query.isFetching ? 'Đang tải' : 'Làm mới'}
 </Text>
 </Pressable>
 </View>

 <ScrollView
 className="flex-1"
 showsVerticalScrollIndicator={false}
 contentContainerStyle={{
 gap: 24,
 padding: 20,
 paddingBottom: 40,
 }}
 >
 <View className="gap-3">
 <Badge variant={variantTrangThai(order.trangThai)}>
 {nhanTrangThaiDonHangMobile(order.trangThai)}
 </Badge>
 <Text className="text-3xl font-bold text-foreground">{order.maDonHang}</Text>
 <Text className="text-sm text-muted-foreground">
 Tạo lúc {dinhDangNgay(order.createdAt)}
 </Text>
 </View>

 <View className="gap-4 rounded-2xl border border-border bg-card p-4">
 <Text className="text-2xl font-bold text-foreground">Tóm tắt</Text>

 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-muted-foreground">Trạng thái</Text>
 <Text className="font-bold text-foreground">
 {nhanTrangThaiDonHangMobile(order.trangThai)}
 </Text>
 </View>

 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-muted-foreground">Tổng tiền</Text>
 <Text className="text-xl font-bold text-primary">{dinhDangGia(order.tongTien)}</Text>
 </View>

 <View className="flex-row items-start justify-between gap-3">
 <Text className="text-muted-foreground">Cập nhật</Text>
 <Text className="text-right text-foreground">{dinhDangNgay(order.updatedAt)}</Text>
 </View>

 <View className="h-px bg-border" />

 <Text
 className={order.coTheHuy ? 'text-sm text-success' : 'text-sm text-muted-foreground'}
 >
 {order.coTheHuy
 ? 'hệ thống cho biết đơn đang ở trạng thái có thể hủy.'
 : (order.lyDoKhongTheHuy ?? 'Đơn không thể hủy ở trạng thái hiện tại.')}
 </Text>

 <Text className="text-xs leading-5 text-muted-foreground">
 chỉ triển khai list/detail/timeline. Không thêm cancel mutation ngoài exact
 master.
 </Text>
 </View>

{paymentQuery.isPending ? (
 <View className="gap-3">
 <Text className="text-2xl font-bold text-foreground">
 Thanh toán
 </Text>
 <Skeleton height={190} borderRadius={18} />
 </View>
 ) : paymentQuery.isError &&
 layTrangThaiHttp(paymentQuery.error) === 404 ? (
 <View className="gap-2 rounded-2xl border border-warning bg-card p-4">
 <Badge variant="warning">Chưa có thanh toán</Badge>
 <Text className="text-sm leading-5 text-muted-foreground">
 hệ thống chưa có Payment cho đơn này.
 </Text>
 </View>
 ) : paymentQuery.isError || !paymentQuery.data ? (
 <View className="gap-3 rounded-2xl border border-danger bg-card p-4">
 <Text className="font-bold text-danger">
 Không tải được thanh toán
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 Chi tiết đơn vẫn hiển thị, nhưng Payment Status tạm thời chưa đọc được.
 </Text>
 <Pressable
 accessibilityRole="button"
 onPress={() => {
 void paymentQuery.refetch();
 }}
 className="self-start rounded-xl border border-border px-3 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-primary">Thử lại</Text>
 </Pressable>
 </View>
 ) : (
 <View className="gap-4 rounded-2xl border border-border bg-card p-4">
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="text-2xl font-bold text-foreground">
 Thanh toán
 </Text>
 <Text className="text-sm text-muted-foreground">
 {paymentQuery.data.phuongThuc}
 </Text>
 </View>
 <Badge variant={variantThanhToan(paymentQuery.data.trangThai)}>
 {nhanThanhToan(paymentQuery.data.trangThai)}
 </Badge>
 </View>

 <View className="h-px bg-border" />

 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-muted-foreground">Số tiền</Text>
 <Text className="text-lg font-bold text-primary">
 {dinhDangGia(paymentQuery.data.soTien)}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">
 Mã giao dịch
 </Text>
 <Text selectable className="font-semibold text-foreground">
 {paymentQuery.data.giaoDich.maGiaoDich}
 </Text>
 </View>

 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-muted-foreground">Giao dịch</Text>
 <Badge
 variant={variantThanhToan(
 paymentQuery.data.giaoDich.trangThai,
 )}
 >
 {nhanThanhToan(paymentQuery.data.giaoDich.trangThai)}
 </Badge>
 </View>

 <View className="h-px bg-border" />

 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="font-bold text-foreground">
 Tồn kho của đơn
 </Text>
 <Text className="text-xs text-muted-foreground">
 Reservation do hệ thống quản lý theo Payment.
 </Text>
 </View>
 <Badge
 variant={variantDatCho(
 paymentQuery.data.datCho.trangThai,
 )}
 >
 {nhanDatCho(paymentQuery.data.datCho.trangThai)}
 </Badge>
 </View>

 <Text className="text-xs text-muted-foreground">
 Reservation hết hạn:{' '}
 {dinhDangNgay(paymentQuery.data.datCho.hetHanLuc)}
 </Text>
 </View>
 )}

 <View className="gap-4">
 <View className="gap-1">
 <Text className="text-2xl font-bold text-foreground">
 Vận chuyển
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 Mỗi nhà cung cấp có thể có vận đơn riêng. Timeline bên dưới
 là sự kiện tracking thật từ hệ thống.
 </Text>
 </View>

 {shipmentQuery.isPending ? (
 <Skeleton height={210} borderRadius={18} />
 ) : shipmentQuery.isError || !shipmentQuery.data ? (
 <View className="gap-3 rounded-2xl border border-danger bg-card p-4">
 <Text className="font-bold text-danger">
 Không tải được vận chuyển
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 Order và Payment vẫn sử dụng được; tracking có thể thử lại riêng.
 </Text>
 <Pressable
 accessibilityRole="button"
 onPress={() => {
 void shipmentQuery.refetch();
 }}
 className="self-start rounded-xl border border-border px-3 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-primary">Thử lại</Text>
 </Pressable>
 </View>
 ) : shipmentQuery.data.vanChuyen.length === 0 ? (
 <View className="gap-2 rounded-2xl border border-border bg-card p-4">
 <Badge variant="neutral">Chưa có vận đơn</Badge>
 <Text className="text-sm leading-5 text-muted-foreground">
 Khi nhà cung cấp bàn giao cho đơn vị giao hàng, vận đơn và
 sự kiện tracking sẽ xuất hiện tại đây.
 </Text>
 </View>
 ) : (
 shipmentQuery.data.vanChuyen.map((shipment) => (
 <View
 key={shipment.id}
 className="gap-4 rounded-2xl border border-border bg-card p-4"
 >
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="text-lg font-bold text-foreground">
 {shipment.tenNhaCungCap}
 </Text>
 <Text className="text-xs text-muted-foreground">
 {shipment.maDonNhaCungCap}
 </Text>
 </View>
 <Badge variant={variantGiaoHang(shipment.trangThai)}>
 {nhanGiaoHang(shipment.trangThai)}
 </Badge>
 </View>

 <View className="gap-1 rounded-xl bg-background p-3">
 <Text className="text-xs text-muted-foreground">
 Mã vận đơn
 </Text>
 <Text
 selectable
 className="text-base font-bold text-foreground"
 >
 {shipment.maVanDon}
 </Text>
 <Text className="text-xs text-muted-foreground">
 Cập nhật {dinhDangNgay(shipment.updatedAt)}
 </Text>
 </View>

 <View className="gap-3">
 <Text className="font-bold text-foreground">
 Hành trình giao hàng
 </Text>

 {shipment.suKien.length === 0 ? (
 <Text className="text-sm leading-5 text-muted-foreground">
 Chưa có sự kiện tracking từ đơn vị giao hàng.
 </Text>
 ) : (
 shipment.suKien.map((event, index) => (
 <View key={event.id} className="flex-row gap-3">
 <View className="items-center">
 <View
 className={[
 'h-4 w-4 rounded-full border-2',
 index === shipment.suKien.length - 1
 ? 'border-primary bg-primary'
 : 'border-success bg-success',
 ].join(' ')}
 />
 {index < shipment.suKien.length - 1 ? (
 <View
 className="w-0.5 flex-1 bg-border"
 style={{ minHeight: 58 }}
 />
 ) : null}
 </View>

 <View className="min-w-0 flex-1 gap-1 pb-4">
 <Text className="font-semibold text-foreground">
 {nhanGiaoHang(event.trangThai)}
 </Text>
 <Text className="text-xs text-muted-foreground">
 {dinhDangNgay(event.thoiGian)}
 </Text>
 {event.viTri ? (
 <Text className="text-sm text-foreground">
 {event.viTri}
 </Text>
 ) : null}
 {event.moTa ? (
 <Text className="text-sm leading-5 text-muted-foreground">
 {event.moTa}
 </Text>
 ) : null}
 </View>
 </View>
 ))
 )}
 </View>
 </View>
 ))
 )}
 </View>

 <View className="gap-4 rounded-2xl border border-border bg-card p-4">
 <View className="gap-1">
 <Text className="text-2xl font-bold text-foreground">Timeline đơn hàng</Text>
 <Text className="text-xs leading-5 text-muted-foreground">
 Tiến trình được suy ra từ trạng thái hiện tại. hệ thống chưa lưu timestamp cho từng mốc
 nên Mobile không hiển thị thời gian giả.
 </Text>
 </View>

 <View>
 {order.tienTrinh.map((moc, index) => (
 <View key={`${moc.trangThai}-${index}`} className="flex-row gap-3">
 <View className="items-center">
 <View
 className={[
 'h-5 w-5 items-center justify-center rounded-full border-2',
 moc.hienTai
 ? 'border-primary bg-primary'
 : moc.daDat
 ? 'border-success bg-success'
 : 'border-border bg-background',
 ].join(' ')}
 >
 <Text
 className={[
 'text-[9px] font-bold',
 moc.hienTai || moc.daDat
 ? 'text-primary-foreground'
 : 'text-muted-foreground',
 ].join(' ')}
 >
 {index + 1}
 </Text>
 </View>

 {index < order.tienTrinh.length - 1 ? (
 <View
 className={['w-0.5 flex-1', moc.daDat ? 'bg-success' : 'bg-border'].join(' ')}
 style={{ minHeight: 54 }}
 />
 ) : null}
 </View>

 <View className="min-w-0 flex-1 gap-1 pb-5">
 <Text
 className={
 moc.hienTai ? 'font-bold text-primary' : 'font-semibold text-foreground'
 }
 >
 {nhanTrangThaiDonHangMobile(moc.trangThai)}
 </Text>
 <Text
 className={
 moc.hienTai
 ? 'text-xs text-primary'
 : moc.daDat
 ? 'text-xs text-success'
 : 'text-xs text-muted-foreground'
 }
 >
 {moc.hienTai ? 'Hiện tại' : moc.daDat ? 'Đã đạt' : 'Chưa tới'}
 </Text>
 </View>
 </View>
 ))}
 </View>
 </View>

 <View className="gap-4">
 <Text className="text-2xl font-bold text-foreground">Sản phẩm theo nhà cung cấp</Text>

 {order.donNhaCungCap.map((suborder) => (
 <View key={suborder.id} className="gap-4 rounded-2xl border border-border bg-card p-4">
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="text-lg font-bold text-foreground">
 {suborder.tenNhaCungCap}
 </Text>
 <Text className="text-xs text-muted-foreground">{suborder.maDon}</Text>
 </View>

 <View className="items-end gap-2">
 <Badge variant={variantTrangThai(suborder.trangThai)}>
 {nhanTrangThaiDonHangMobile(suborder.trangThai)}
 </Badge>
 <Text className="font-bold text-primary">{dinhDangGia(suborder.tamTinh)}</Text>
 </View>
 </View>

 <View className="h-px bg-border" />

 <View className="gap-4">
 {suborder.muc.map((item) => (
 <View key={item.id} className="gap-4 rounded-xl bg-background p-3">
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="font-bold text-foreground">{item.tenSanPham}</Text>
 <Text className="text-xs text-muted-foreground">
 SKU {item.sku} · {item.khoiLuong} {item.donVi} · SL {item.soLuong}
 </Text>
 <Text className="text-xs text-muted-foreground">
 {item.tenTrangTrai} ({item.maTrangTrai})
 </Text>
 </View>
 <Text className="font-bold text-foreground">
 {dinhDangGia(item.thanhTien)}
 </Text>
 </View>

 <Text className="text-xs text-muted-foreground">
 {dinhDangGia(item.donGia)} × {item.soLuong}
 </Text>

 <View className="flex-row flex-wrap gap-2">
 <Pressable
 accessibilityRole="button"
 onPress={() =>
 router.push({
 pathname: '/san-pham/[id]',
 params: { id: item.sanPhamId },
 })
 }
 className="rounded-xl border border-border bg-card px-3 py-2.5 active:opacity-80"
 >
 <Text className="text-xs font-semibold text-primary">Xem sản phẩm</Text>
 </Pressable>

 <Pressable
 accessibilityRole="button"
 onPress={() =>
 router.push({
 pathname: '/khieu-nai/tao',
 params: { mucDonHangId: item.id },
 })
 }
 className="rounded-xl border border-warning bg-card px-3 py-2.5 active:opacity-80"
 >
 <Text className="text-xs font-semibold text-warning">Khiếu nại</Text>
 </Pressable>
 </View>

 <DanhGiaMucDonHangMobile mucDonHangId={item.id} />
 </View>
 ))}
 </View>
 </View>
 ))}
 </View>

 <View className="gap-2 rounded-2xl border border-info bg-card p-4">
 <Badge variant="info">Mobile Complaint/Review</Badge>
 <Text className="text-sm leading-5 text-muted-foreground">
 Bạn có thể đánh giá sản phẩm và gửi khiếu nại kèm ảnh chụp hoặc ảnh từ thư viện.
 </Text>
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}
