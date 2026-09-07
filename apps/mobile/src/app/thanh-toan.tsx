import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
 Badge,
 EmptyState,
 ErrorState,
 Skeleton,
} from '@/components/design-system';
import {
 CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
 type CheckoutPreviewMobile,
 layCheckoutPreviewMobile,
 taoDonHangMobile,
 type TaoDonHangMobileKetQua,
 taoDuLieuDonHangTuPreview,
 type ThanhPhanCheckoutMobile,
} from '@/lib/api-checkout';
import { thongBaoLoiApi } from '@/lib/api-error';
import { DON_HANG_MOBILE_LIST_QUERY_KEY } from '@/lib/api-don-hang';
import { GIO_HANG_MOBILE_QUERY_KEY } from '@/lib/api-gio-hang';
import {
 DIA_CHI_TAI_KHOAN_QUERY_KEY,
 type DiaChiTaiKhoanMobile,
 layDiaChiTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import {
 taoThanhToanCodMobile,
 taoThanhToanVnPaySandboxMobile,
 type ThanhToanMobile,
} from '@/lib/api-thanh-toan';
import { moDangNhap } from '@/lib/auth-navigation';
import { taoPaymentReturnUrl } from '@/lib/payment-return';
import { useXacThucStore } from '@/stores/xac-thuc.store';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';

type PhuongThucCheckout = 'COD' | 'VNPAY_SANDBOX';

type LanDatHang = {
 maYeuCauDonHang: string;
 maYeuCauThanhToan: string;
 diaChiGiaoHangId: string;
 gioHangId: string;
 phuongThuc: PhuongThucCheckout;
 donHang?: TaoDonHangMobileKetQua;
};

type KetQuaDatHang = {
 donHang: TaoDonHangMobileKetQua;
 thanhToan: ThanhToanMobile;
 phuongThuc: PhuongThucCheckout;
};

function dinhDangGia(value: number): string {
 return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function giaTriThanhPhan(
 thanhPhan: ThanhPhanCheckoutMobile,
): string {
 if (thanhPhan.giaTri === null) {
 return 'Chưa xác định';
 }

 return dinhDangGia(thanhPhan.giaTri);
}

function dinhDangDiaChi(item: DiaChiTaiKhoanMobile): string {
 return [
 item.dongDiaChi,
 item.phuongXa,
 item.quanHuyen,
 item.tinhThanh,
 item.maBuuChinh,
 ]
 .filter(Boolean)
 .join(', ');
}

function CheckoutSkeleton() {
 return (
 <View className="gap-4">
 <Skeleton height={150} borderRadius={18} />
 <Skeleton height={220} borderRadius={18} />
 <Skeleton height={180} borderRadius={18} />
 <Skeleton height={200} borderRadius={18} />
 </View>
 );
}

function ThanhPhanRow({
 nhan,
 thanhPhan,
}: {
 nhan: string;
 thanhPhan: ThanhPhanCheckoutMobile;
}) {
 return (
 <View className="gap-1">
 <View className="flex-row items-start justify-between gap-4">
 <Text className="font-semibold text-foreground">{nhan}</Text>
 <Text className="font-bold text-foreground">
 {giaTriThanhPhan(thanhPhan)}
 </Text>
 </View>
 <Text className="text-xs leading-5 text-muted-foreground">
 {thanhPhan.lyDo}
 </Text>
 </View>
 );
}

function DanhSachSanPham({
 preview,
}: {
 preview: CheckoutPreviewMobile;
}) {
 return (
 <View className="gap-3">
 {preview.items.map((item) => (
 <View
 key={item.mucGioHangId}
 className="gap-3 rounded-2xl border border-border bg-card p-4"
 >
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="text-base font-bold text-foreground">
 {item.tenSanPham}
 </Text>
 <Text className="text-sm text-muted-foreground">
 {item.nhaCungCap.ten}
 </Text>
 <Text className="text-sm text-foreground">
 SKU {item.sku} · Số lượng {item.soLuong}
 </Text>
 </View>
 <Text className="font-bold text-primary">
 {dinhDangGia(item.thanhTien)}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-sm text-muted-foreground">
 {dinhDangGia(item.donGia)} × {item.soLuong}
 </Text>
 <Text
 className={
 item.coTheDatHang
 ? 'text-sm text-success'
 : 'text-sm text-danger'
 }
 >
 Tồn khả dụng: {item.soLuongKhaDung} ·{' '}
 {item.coTheDatHang
 ? 'Có thể đặt hàng'
 : 'Không đủ tồn hiện tại'}
 </Text>
 </View>
 </View>
 ))}
 </View>
 );
}

function DiaChiCard({
 item,
 selected,
 disabled,
 onPress,
}: {
 item: DiaChiTaiKhoanMobile;
 selected: boolean;
 disabled: boolean;
 onPress: () => void;
}) {
 return (
 <Pressable
 accessibilityRole="radio"
 accessibilityState={{ selected, disabled }}
 disabled={disabled}
 onPress={onPress}
 className={[
 'gap-2 rounded-2xl border p-4',
 selected
 ? 'border-primary bg-card'
 : 'border-border bg-background',
 disabled ? 'opacity-60' : 'active:opacity-80',
 ].join(' ')}
 >
 <View className="flex-row items-start justify-between gap-3">
 <View className="min-w-0 flex-1 gap-1">
 <Text className="text-base font-bold text-foreground">
 {item.tenNguoiNhan}
 </Text>
 <Text className="text-sm text-muted-foreground">
 {item.soDienThoai}
 </Text>
 </View>
 <View className="flex-row flex-wrap gap-2">
 {item.macDinh ? (
 <Badge variant="success">Mặc định</Badge>
 ) : null}
 {selected ? (
 <Badge variant="info">Đang chọn</Badge>
 ) : null}
 </View>
 </View>

 <Text className="text-sm leading-5 text-foreground">
 {dinhDangDiaChi(item)}
 </Text>
 </Pressable>
 );
}

function PhuongThucCard({
 value,
 selected,
 disabled,
 onPress,
}: {
 value: PhuongThucCheckout;
 selected: boolean;
 disabled: boolean;
 onPress: () => void;
}) {
 const online = value === 'VNPAY_SANDBOX';

 return (
 <Pressable
 accessibilityRole="radio"
 accessibilityState={{ selected, disabled }}
 disabled={disabled}
 onPress={onPress}
 className={[
 'gap-2 rounded-2xl border p-4',
 selected
 ? 'border-primary bg-card'
 : 'border-border bg-background',
 disabled ? 'opacity-60' : 'active:opacity-80',
 ].join(' ')}
 >
 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-base font-bold text-foreground">
 {online ? 'VNPay Sandbox' : 'Thanh toán khi nhận hàng'}
 </Text>
 {selected ? <Badge variant="info">Đang chọn</Badge> : null}
 </View>
 <Text className="text-sm leading-5 text-muted-foreground">
 {online
 ? 'Mở cổng VNPay Sandbox. Kết quả được hệ thống xác minh bằng chữ ký trước khi Mobile hiển thị.'
 : 'Tạo Payment COD ở trạng thái chờ thanh toán và hoàn tất khi nhận hàng.'}
 </Text>
 </Pressable>
 );
}

export default function TrangThanhToan() {
 const router = useRouter();
 const queryClient = useQueryClient();

 const trangThai = useXacThucStore((state) => state.trangThai);
 const daDangNhap = trangThai === 'da-dang-nhap';

 const [diaChiDaChonId, setDiaChiDaChonId] = useState<string | null>(
 null,
 );
 const [phuongThuc, setPhuongThuc] =
 useState<PhuongThucCheckout>('COD');
 const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
 const [donHangDaTao, setDonHangDaTao] =
 useState<TaoDonHangMobileKetQua | null>(null);

 const lanDatHangRef = useRef<LanDatHang | null>(null);

 const previewQuery = useQuery({
 queryKey: CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
 queryFn: layCheckoutPreviewMobile,
 enabled: daDangNhap,
 staleTime: 0,
 });

 const addressQuery = useQuery({
 queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
 queryFn: layDiaChiTaiKhoanMobile,
 enabled: daDangNhap,
 staleTime: 20_000,
 });

 useEffect(() => {
 if (!addressQuery.data || addressQuery.data.length === 0) {
 return;
 }

 const selectedStillExists = addressQuery.data.some(
 (item) => item.id === diaChiDaChonId,
 );

 if (selectedStillExists) {
 return;
 }

 const macDinh =
 addressQuery.data.find((item) => item.macDinh) ??
 addressQuery.data[0];

 if (!macDinh) {
 return;
 }

 setDiaChiDaChonId(macDinh.id);
 }, [addressQuery.data, diaChiDaChonId]);

 const diaChiDaChon = useMemo(
 () =>
 addressQuery.data?.find(
 (item) => item.id === diaChiDaChonId,
 ) ?? null,
 [addressQuery.data, diaChiDaChonId],
 );

 async function invalidateSauDatHang() {
 await Promise.all([
 queryClient.invalidateQueries({
 queryKey: GIO_HANG_MOBILE_QUERY_KEY,
 }),
 queryClient.invalidateQueries({
 queryKey: DON_HANG_MOBILE_LIST_QUERY_KEY,
 }),
 queryClient.invalidateQueries({
 queryKey: CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
 }),
 ]);
 }

 const datHangMutation = useMutation({
 mutationFn: async (): Promise<KetQuaDatHang> => {
 const preview = previewQuery.data;

 if (!preview || !diaChiDaChon) {
 throw new Error(
 'Checkout hoặc địa chỉ giao hàng chưa sẵn sàng.',
 );
 }

 if (!preview.total.coTheXacNhan) {
 throw new Error(
 'Checkout hiện không đủ điều kiện xác nhận.',
 );
 }

 let lanDatHang = lanDatHangRef.current;

 if (!lanDatHang) {
 lanDatHang = {
 maYeuCauDonHang: Crypto.randomUUID(),
 maYeuCauThanhToan: Crypto.randomUUID(),
 diaChiGiaoHangId: diaChiDaChon.id,
 gioHangId: preview.gioHangId,
 phuongThuc,
 };
 lanDatHangRef.current = lanDatHang;
 }

 if (
 lanDatHang.gioHangId !== preview.gioHangId ||
 lanDatHang.diaChiGiaoHangId !== diaChiDaChon.id ||
 lanDatHang.phuongThuc !== phuongThuc
 ) {
 throw new Error(
 'Checkout đã thay đổi sau khi bắt đầu đặt hàng. Vui lòng mở lại Checkout.',
 );
 }

 let donHang = lanDatHang.donHang;

 if (!donHang) {
 donHang = await taoDonHangMobile(
 taoDuLieuDonHangTuPreview(
 preview,
 lanDatHang.diaChiGiaoHangId,
 lanDatHang.maYeuCauDonHang,
 ),
 );

 lanDatHang.donHang = donHang;
 lanDatHangRef.current = lanDatHang;
 setDonHangDaTao(donHang);
 }

 const thanhToan =
 phuongThuc === 'COD'
 ? await taoThanhToanCodMobile(
 donHang.id,
 lanDatHang.maYeuCauThanhToan,
 )
 : await taoThanhToanVnPaySandboxMobile(
 donHang.id,
 lanDatHang.maYeuCauThanhToan,
 );

 return {
 donHang,
 thanhToan,
 phuongThuc,
 };
 },

 onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
 setLoiDatHang(null);

 if (method === 'COD') {
 if (
 thanhToan.donHangId !== donHang.id ||
 thanhToan.phuongThuc !== 'COD' ||
 thanhToan.trangThai !== 'PENDING'
 ) {
 setLoiDatHang(
 'hệ thống đã tạo payment nhưng trạng thái COD không đúng kỳ vọng.',
 );
 return;
 }

 lanDatHangRef.current = null;
 setDonHangDaTao(null);

 await invalidateSauDatHang();

 router.replace({
 pathname: '/don-hang/[id]',
 params: { id: donHang.id },
 });
 return;
 }

 if (thanhToan.donHangId !== donHang.id) {
 setLoiDatHang(
 'Payment VNPay không thuộc đơn hàng vừa tạo.',
 );
 return;
 }

 if (thanhToan.trangThai === 'PAID') {
 lanDatHangRef.current = null;
 setDonHangDaTao(null);
 await invalidateSauDatHang();

 router.replace({
 pathname: '/thanh-toan/ket-qua',
 params: {
 donHangId: donHang.id,
 maDonHang: donHang.maDonHang,
 trangThai: 'success',
 },
 });
 return;
 }

 if (
 thanhToan.phuongThuc !== 'VNPAY_SANDBOX' ||
 (thanhToan.trangThai !== 'PENDING' &&
 thanhToan.trangThai !== 'CREATED') ||
 !thanhToan.paymentUrl
 ) {
 setLoiDatHang(
 'hệ thống chưa trả payment URL VNPay hợp lệ.',
 );
 return;
 }

 const browserResult = await WebBrowser.openAuthSessionAsync(
 thanhToan.paymentUrl,
 taoPaymentReturnUrl(),
 );

 if (
 browserResult.type === 'cancel' ||
 browserResult.type === 'dismiss'
 ) {
 setLoiDatHang(
 'Bạn đã đóng VNPay trước khi ứng dụng nhận được kết quả. Có thể mở lại cùng Payment hoặc kiểm tra đơn hàng.',
 );
 }
 },

 onError: (error) => {
 setLoiDatHang(
 thongBaoLoiApi(
 error,
 donHangDaTao
 ? 'Đơn đã được tạo nhưng bước thanh toán chưa hoàn tất. Hãy thử lại với cùng Payment.'
 : 'Không thể tạo đơn hoặc Payment. Vui lòng thử lại.',
 ),
 );
 },
 });

 function submit() {
 if (datHangMutation.isPending) {
 return;
 }

 setLoiDatHang(null);
 datHangMutation.mutate();
 }

 if (trangThai === 'dang-khoi-phuc') {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/gio-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>
 </View>
 <View className="flex-1 px-5 py-4">
 <CheckoutSkeleton />
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
 onPress={() => quayLaiHoacVe(router, '/gio-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>
 </View>

 <View className="flex-1 justify-center px-5">
 <EmptyState
 title="Đăng nhập để tiếp tục thanh toán"
 description="Giỏ hàng, địa chỉ giao hàng và checkout được đồng bộ theo tài khoản."
 actionLabel="Đăng nhập"
 onAction={() => moDangNhap(router, '/thanh-toan')}
 />
 </View>
 </SafeAreaView>
 );
 }

 const dangTai =
 previewQuery.isPending || addressQuery.isPending;

 if (dangTai) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/gio-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>
 </View>
 <ScrollView
 className="flex-1"
 contentContainerStyle={{ padding: 20 }}
 >
 <CheckoutSkeleton />
 </ScrollView>
 </SafeAreaView>
 );
 }

 if (
 previewQuery.isError ||
 !previewQuery.data ||
 addressQuery.isError ||
 !addressQuery.data
 ) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center px-5 py-3">
 <Pressable
 accessibilityRole="button"
 onPress={() => quayLaiHoacVe(router, '/gio-hang')}
 className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>
 </View>

 <View className="flex-1 justify-center px-5">
 <ErrorState
 title="Không tải được thông tin thanh toán"
 description="Không thể đọc checkout hoặc sổ địa chỉ hiện tại."
 actionLabel="Thử lại"
 onAction={() => {
 void Promise.all([
 previewQuery.refetch(),
 addressQuery.refetch(),
 ]);
 }}
 />
 </View>
 </SafeAreaView>
 );
 }

 const preview = previewQuery.data;
 const addresses = addressQuery.data;

 if (preview.items.length === 0) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center px-5">
 <EmptyState
 title="Giỏ hàng đang trống"
 description="Hãy thêm nông sản vào giỏ trước khi thanh toán."
 actionLabel="Về giỏ hàng"
 onAction={() => router.replace('/gio-hang')}
 />
 </View>
 </SafeAreaView>
 );
 }

 const coDiaChi = addresses.length > 0 && diaChiDaChon !== null;
 const coTheDatHang =
 coDiaChi &&
 preview.total.coTheXacNhan &&
 !datHangMutation.isPending;

 const daBatDauDatHang = lanDatHangRef.current !== null;
 const khoaLuaChon =
 datHangMutation.isPending || donHangDaTao !== null;

 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
 <Pressable
 accessibilityRole="button"
 disabled={datHangMutation.isPending}
 onPress={() => quayLaiHoacVe(router, '/gio-hang')}
 className={[
 'rounded-full border border-border bg-card px-4 py-2',
 datHangMutation.isPending
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>

 <Pressable
 accessibilityRole="button"
 disabled={
 previewQuery.isFetching ||
 addressQuery.isFetching ||
 daBatDauDatHang
 }
 onPress={() => {
 void Promise.all([
 previewQuery.refetch(),
 addressQuery.refetch(),
 ]);
 }}
 className={[
 'rounded-full border border-border bg-card px-4 py-2',
 previewQuery.isFetching ||
 addressQuery.isFetching ||
 daBatDauDatHang
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-primary">
 {previewQuery.isFetching || addressQuery.isFetching
 ? 'Đang tải'
 : 'Làm mới'}
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
 <View className="gap-2">
 <Text className="text-3xl font-bold text-foreground">
 Thanh toán
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 Giá, tồn kho, phí vận chuyển và tổng thanh toán được xác nhận
 từ hệ thống tại thời điểm checkout.
 </Text>
 </View>

 <View className="gap-4">
 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-xl font-bold text-foreground">
 Địa chỉ giao hàng
 </Text>
 <Pressable
 accessibilityRole="button"
 disabled={khoaLuaChon}
 onPress={() => router.push('/tai-khoan/dia-chi')}
 className={[
 'rounded-xl border border-border px-3 py-2',
 khoaLuaChon
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="text-sm font-semibold text-primary">
 Quản lý
 </Text>
 </Pressable>
 </View>

 {addresses.length === 0 ? (
 <EmptyState
 title="Chưa có địa chỉ giao hàng"
 description="Thêm địa chỉ thật vào sổ địa chỉ trước khi xác nhận đơn."
 actionLabel="Thêm địa chỉ"
 onAction={() => router.push('/tai-khoan/dia-chi')}
 />
 ) : (
 <View accessibilityRole="radiogroup" className="gap-3">
 {addresses.map((item) => (
 <DiaChiCard
 key={item.id}
 item={item}
 selected={item.id === diaChiDaChonId}
 disabled={khoaLuaChon}
 onPress={() => setDiaChiDaChonId(item.id)}
 />
 ))}
 </View>
 )}
 </View>

 <View className="gap-3">
 <Text className="text-xl font-bold text-foreground">
 Sản phẩm
 </Text>
 <DanhSachSanPham preview={preview} />
 </View>

 <View className="gap-4 rounded-2xl border border-border bg-card p-4">
 <Text className="text-xl font-bold text-foreground">
 Tóm tắt thanh toán
 </Text>

 <View className="flex-row items-center justify-between gap-3">
 <Text className="font-semibold text-foreground">
 Tạm tính hàng hóa
 </Text>
 <Text className="font-bold text-foreground">
 {dinhDangGia(preview.price.tamTinhHangHoa)}
 </Text>
 </View>

 <ThanhPhanRow
 nhan="Khuyến mãi"
 thanhPhan={preview.promotion}
 />
 <ThanhPhanRow
 nhan="Phí vận chuyển"
 thanhPhan={preview.shipping}
 />
 <ThanhPhanRow
 nhan="Điểm"
 thanhPhan={preview.points}
 />

 <View className="h-px bg-border" />

 <View className="flex-row items-center justify-between gap-3">
 <Text className="text-lg font-bold text-foreground">
 Tổng thanh toán
 </Text>
 <Text className="text-2xl font-bold text-primary">
 {preview.total.tongThanhToan === null
 ? 'Chưa xác định'
 : dinhDangGia(preview.total.tongThanhToan)}
 </Text>
 </View>
 </View>

 <View className="gap-3">
 <Text className="text-xl font-bold text-foreground">
 Phương thức thanh toán
 </Text>
 <View accessibilityRole="radiogroup" className="gap-3">
 <PhuongThucCard
 value="COD"
 selected={phuongThuc === 'COD'}
 disabled={khoaLuaChon}
 onPress={() => setPhuongThuc('COD')}
 />
 <PhuongThucCard
 value="VNPAY_SANDBOX"
 selected={phuongThuc === 'VNPAY_SANDBOX'}
 disabled={khoaLuaChon}
 onPress={() => setPhuongThuc('VNPAY_SANDBOX')}
 />
 </View>
 </View>

 {!preview.total.coTheXacNhan ? (
 <View className="gap-2 rounded-2xl border border-warning bg-card p-4">
 <Badge variant="warning">Chưa thể xác nhận</Badge>
 {preview.total.lyDoKhongTheXacNhan.map((reason) => (
 <Text
 key={reason}
 className="text-sm leading-5 text-muted-foreground"
 >
 • {reason}
 </Text>
 ))}
 </View>
 ) : null}

 {preview.total.coTheXacNhan && !coDiaChi ? (
 <View className="rounded-2xl border border-warning bg-card p-4">
 <Text className="text-sm leading-5 text-muted-foreground">
 Chọn hoặc thêm địa chỉ giao hàng để tiếp tục.
 </Text>
 </View>
 ) : null}

 {donHangDaTao ? (
 <View className="gap-2 rounded-2xl border border-warning bg-card p-4">
 <Badge variant="warning">Đơn đã được tạo</Badge>
 <Text className="font-bold text-foreground">
 {donHangDaTao.maDonHang}
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 Nếu bước Payment lỗi, lần thử lại giữ nguyên Order và
 idempotency key của Payment.
 </Text>
 </View>
 ) : null}

 {phuongThuc === 'VNPAY_SANDBOX' ? (
 <View className="rounded-2xl border border-info bg-card p-4">
 <Text className="font-bold text-info">
 VNPay Sandbox
 </Text>
 <Text className="mt-1 text-sm leading-5 text-muted-foreground">
 Sau khi thanh toán trực tuyến, ứng dụng sẽ tự quay lại màn hình kết quả để cập nhật trạng thái giao dịch.
 </Text>
 </View>
 ) : null}

 {loiDatHang ? (
 <View className="rounded-2xl border border-danger bg-card p-4">
 <Text className="text-sm leading-5 text-danger">
 {loiDatHang}
 </Text>
 </View>
 ) : null}

 <View className="gap-2">
 <Pressable
 accessibilityRole="button"
 accessibilityState={{
 disabled: !coTheDatHang,
 busy: datHangMutation.isPending,
 }}
 disabled={!coTheDatHang}
 onPress={submit}
 className={[
 'min-h-12 items-center justify-center rounded-xl px-4 py-3',
 coTheDatHang
 ? 'bg-primary active:opacity-80'
 : 'bg-muted opacity-60',
 ].join(' ')}
 >
 <Text
 className={
 coTheDatHang
 ? 'font-bold text-primary-foreground'
 : 'font-bold text-muted-foreground'
 }
 >
 {datHangMutation.isPending
 ? phuongThuc === 'COD'
 ? 'Đang tạo đơn COD…'
 : 'Đang mở VNPay…'
 : donHangDaTao
 ? phuongThuc === 'COD'
 ? 'Thử lại thanh toán COD'
 : 'Mở lại VNPay Sandbox'
 : phuongThuc === 'COD'
 ? 'Đặt hàng COD'
 : 'Thanh toán qua VNPay Sandbox'}
 </Text>
 </Pressable>

 <Text className="text-center text-xs leading-5 text-muted-foreground">
 Order và Payment dùng hai idempotency key riêng để giảm nguy cơ
 tạo trùng khi mạng chập chờn.
 </Text>
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}
