import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
 Badge,
 EmptyState,
 ErrorState,
 Skeleton,
} from '@/components/design-system';
import { DON_HANG_MOBILE_LIST_QUERY_KEY } from '@/lib/api-don-hang';
import { GIO_HANG_MOBILE_QUERY_KEY } from '@/lib/api-gio-hang';
import {
 layThanhToanDonHangMobile,
 thanhToanDonHangMobileQueryKey,
} from '@/lib/api-thanh-toan';
import { moDangNhap } from '@/lib/auth-navigation';
import { layGiaTriThamSo } from '@/lib/payment-return';
import { useXacThucStore } from '@/stores/xac-thuc.store';

type TrangThaiKetQua = 'success' | 'failure' | 'pending';

function trangThaiKetQua(value: string): TrangThaiKetQua {
 if (value === 'PAID') {
 return 'success';
 }

 if (
 value === 'FAILED' ||
 value === 'CANCELLED' ||
 value === 'REFUNDED'
 ) {
 return 'failure';
 }

 return 'pending';
}

export default function TrangKetQuaThanhToan() {
 const router = useRouter();
 const queryClient = useQueryClient();

 const params = useLocalSearchParams<{
 donHangId?: string | string[];
 paymentId?: string | string[];
 maDonHang?: string | string[];
 trangThai?: string | string[];
 }>();

 const donHangId = layGiaTriThamSo(params.donHangId) ?? '';
 const maDonHangReturn = layGiaTriThamSo(params.maDonHang);
 const trangThaiReturn = layGiaTriThamSo(params.trangThai);

 const authState = useXacThucStore((state) => state.trangThai);
 const daDangNhap = authState === 'da-dang-nhap';

 const paymentQuery = useQuery({
 queryKey: thanhToanDonHangMobileQueryKey(donHangId),
 queryFn: () => layThanhToanDonHangMobile(donHangId),
 enabled: daDangNhap && donHangId.length > 0,
 staleTime: 0,
 refetchOnMount: 'always',
 });

 useEffect(() => {
 const payment = paymentQuery.data;

 if (
 !payment ||
 (payment.trangThai !== 'PAID' &&
 payment.trangThai !== 'FAILED' &&
 payment.trangThai !== 'CANCELLED')
 ) {
 return;
 }

 void Promise.all([
 queryClient.invalidateQueries({
 queryKey: DON_HANG_MOBILE_LIST_QUERY_KEY,
 }),
 queryClient.invalidateQueries({
 queryKey: GIO_HANG_MOBILE_QUERY_KEY,
 }),
 ]);
 }, [paymentQuery.data, queryClient]);

 if (authState === 'dang-khoi-phuc') {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center gap-4 px-5">
 <Skeleton height={180} borderRadius={24} />
 <Skeleton height={140} borderRadius={24} />
 </View>
 </SafeAreaView>
 );
 }

 if (!daDangNhap) {
 const returnTo = donHangId
 ? `/thanh-toan/ket-qua?donHangId=${encodeURIComponent(donHangId)}`
 : '/thanh-toan/ket-qua';

 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center px-5">
 <EmptyState
 title="Đăng nhập để kiểm tra thanh toán"
 description="Trạng thái cuối cùng phải được đọc lại từ hệ thống của tài khoản đã tạo đơn."
 actionLabel="Đăng nhập"
 onAction={() => moDangNhap(router, returnTo)}
 />
 </View>
 </SafeAreaView>
 );
 }

 if (!donHangId) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center px-5">
 <ErrorState
 title="Thiếu mã đơn hàng"
 description="Return URL không chứa donHangId nên không thể xác minh Payment với hệ thống."
 actionLabel="Xem đơn hàng"
 onAction={() => router.replace('/don-hang')}
 />
 </View>
 </SafeAreaView>
 );
 }

 if (paymentQuery.isPending) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center gap-4 px-5">
 <Skeleton height={180} borderRadius={24} />
 <Skeleton height={140} borderRadius={24} />
 </View>
 </SafeAreaView>
 );
 }

 if (paymentQuery.isError || !paymentQuery.data) {
 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <View className="flex-1 justify-center px-5">
 <ErrorState
 title="Chưa xác minh được thanh toán"
 description="Không đọc được Payment Status từ hệ thống. Không sử dụng trạng thái return URL làm kết quả cuối cùng."
 actionLabel="Thử lại"
 onAction={() => {
 void paymentQuery.refetch();
 }}
 />
 </View>
 </SafeAreaView>
 );
 }

 const payment = paymentQuery.data;
 const status = trangThaiKetQua(payment.trangThai);

 const config =
 status === 'success'
 ? {
 badge: 'success' as const,
 nhan: 'Đã thanh toán',
 tieuDe: 'Thanh toán thành công',
 moTa:
 'hệ thống đã xác minh giao dịch và ghi nhận Payment ở trạng thái PAID.',
 }
 : status === 'failure'
 ? {
 badge: 'danger' as const,
 nhan: 'Không thành công',
 tieuDe: 'Thanh toán chưa thành công',
 moTa:
 'hệ thống đã xác minh giao dịch nhưng Payment không ở trạng thái thành công.',
 }
 : {
 badge: 'info' as const,
 nhan: 'Đang xử lý',
 tieuDe: 'Đang chờ xác nhận thanh toán',
 moTa:
 'Payment chưa ở trạng thái cuối cùng. Có thể callback đang được xử lý.',
 };

 return (
 <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
 <ScrollView
 className="flex-1"
 showsVerticalScrollIndicator={false}
 contentContainerStyle={{
 flexGrow: 1,
 justifyContent: 'center',
 padding: 20,
 paddingBottom: 40,
 }}
 >
 <View className="gap-6 rounded-3xl border border-border bg-card p-5">
 <View className="items-center gap-3">
 <Badge variant={config.badge}>{config.nhan}</Badge>
 <Text className="text-center text-3xl font-bold text-foreground">
 {config.tieuDe}
 </Text>
 <Text className="text-center text-sm leading-6 text-muted-foreground">
 {config.moTa}
 </Text>
 </View>

 <View className="gap-3 rounded-2xl border border-border bg-background p-4">
 <Text className="text-lg font-bold text-foreground">
 Xác minh từ hệ thống
 </Text>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">Mã đơn hàng</Text>
 <Text selectable className="font-semibold text-foreground">
 {payment.maDonHang || maDonHangReturn || donHangId}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">
 Phương thức
 </Text>
 <Text className="font-semibold text-foreground">
 {payment.phuongThuc}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">
 Trạng thái Payment
 </Text>
 <Text className="font-semibold text-foreground">
 {payment.trangThai}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">
 Trạng thái giao dịch
 </Text>
 <Text className="font-semibold text-foreground">
 {payment.giaoDich.trangThai}
 </Text>
 </View>

 <View className="gap-1">
 <Text className="text-xs text-muted-foreground">
 Reservation
 </Text>
 <Text className="font-semibold text-foreground">
 {payment.datCho.trangThai}
 </Text>
 </View>
 </View>

 {trangThaiReturn ? (
 <Text className="text-center text-xs leading-5 text-muted-foreground">
 Return URL báo “{trangThaiReturn}”, nhưng giao diện trên sử dụng
 trạng thái đọc lại từ hệ thống.
 </Text>
 ) : null}

 <View className="gap-3">
 {status === 'pending' ? (
 <Pressable
 accessibilityRole="button"
 disabled={paymentQuery.isFetching}
 onPress={() => {
 void paymentQuery.refetch();
 }}
 className={[
 'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
 paymentQuery.isFetching
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-primary-foreground">
 {paymentQuery.isFetching
 ? 'Đang kiểm tra…'
 : 'Kiểm tra lại'}
 </Text>
 </Pressable>
 ) : null}

 <Pressable
 accessibilityRole="button"
 onPress={() =>
 router.replace({
 pathname: '/don-hang/[id]',
 params: { id: donHangId },
 })
 }
 className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
 >
 <Text className="font-semibold text-primary-foreground">
 Xem đơn hàng
 </Text>
 </Pressable>

 <Pressable
 accessibilityRole="button"
 onPress={() => router.replace('/')}
 className="min-h-12 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Về trang chủ
 </Text>
 </Pressable>
 </View>
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}
