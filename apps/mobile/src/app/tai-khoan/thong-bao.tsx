import { useQuery } from '@tanstack/react-query';
import {
 router,
 useRouter,
 type Href,
} from 'expo-router';
import {
 useEffect,
 useState,
} from 'react';
import {
 Platform,
 Pressable,
 ScrollView,
 Text,
 View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
 Badge,
 EmptyState,
 ErrorState,
 Skeleton,
} from '@/components/design-system';
import {
 layThongBaoInAppMobile,
 THONG_BAO_IN_APP_QUERY_KEY,
} from '@/lib/api-thong-bao';
import {
 dangKyThongBaoPushMobile,
 guiPushThuBackendMobile,
 guiThongBaoThuNghiemNoiBo,
 layEasProjectId,
 LOAI_THONG_BAO_PUSH_MOBILE,
 taoDuLieuPushThuHoachMoi,
 type KetQuaDangKyPushMobile,
} from '@/lib/thong-bao-push';
import { thongBaoLoiApi } from '@/lib/api-error';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function trangThaiLabel(
 result: KetQuaDangKyPushMobile | null,
): string {
 if (!result) {
 return 'Chưa kiểm tra';
 }

 switch (result.trangThai) {
 case 'khong-ho-tro-web':
 return 'Thông báo trên thiết bị không hỗ trợ ở bản web';
 case 'can-development-build':
 return 'Chỉ hỗ trợ trong ứng dụng đã cài đặt';
 case 'tu-choi-quyen':
 return 'Chưa cấp quyền';
 case 'thieu-project-id':
 return 'Ứng dụng chưa sẵn sàng nhận thông báo';
 case 'da-dang-ky-backend':
 return 'Đã bật thông báo';
 case 'loi-dang-ky-backend':
 return 'Không thể bật thông báo';
 case 'loi-lay-token':
 return 'Không thể đăng ký thiết bị';
 }
}

export default function TrangThongBaoPushTaiKhoan() {
 const nav = useRouter();

 const trangThaiXacThuc =
 useXacThucStore(
 (state) => state.trangThai,
 );

 const daDangNhap =
 trangThaiXacThuc ===
 'da-dang-nhap';

 const inAppQuery = useQuery({
 queryKey:
 THONG_BAO_IN_APP_QUERY_KEY,
 queryFn:
 layThongBaoInAppMobile,
 enabled: daDangNhap,
 staleTime: 15_000,
 });

 const [
 result,
 setResult,
 ] =
 useState<KetQuaDangKyPushMobile | null>(
 null,
 );

 const [
 dangXuLy,
 setDangXuLy,
 ] = useState(false);

 const [
 loiThuNghiem,
 setLoiThuNghiem,
 ] =
 useState<string | null>(
 null,
 );

 const [
 thongBaoThu,
 setThongBaoThu,
 ] =
 useState<string | null>(
 null,
 );

 const [
 projectId,
 setProjectId,
 ] =
 useState<string | null>(
 null,
 );

 useEffect(() => {
 setProjectId(
 layEasProjectId(),
 );
 }, []);

 async function kiemTraVaDangKy() {
 setDangXuLy(true);
 setLoiThuNghiem(null);
 setThongBaoThu(null);

 try {
 setResult(
 await dangKyThongBaoPushMobile(),
 );
 } finally {
 setDangXuLy(false);
 }
 }

 async function guiThuBackend() {
 setDangXuLy(true);
 setLoiThuNghiem(null);
 setThongBaoThu(null);

 try {
 const data =
 await guiPushThuBackendMobile();

 setThongBaoThu(
 `Đã gửi ${data.daGui}/${data.soThietBi} thiết bị; chưa gửi được ${data.soLoi}.`,
 );
 } catch (error) {
 setLoiThuNghiem(
 thongBaoLoiApi(
 error,
 'Không gửi được thông báo thử.',
 ),
 );
 } finally {
 setDangXuLy(false);
 }
 }

 async function guiThuNoiBo() {
 setDangXuLy(true);
 setLoiThuNghiem(null);
 setThongBaoThu(null);

 try {
 await guiThongBaoThuNghiemNoiBo();

 setThongBaoThu(
 'Đã tạo thông báo thử trên thiết bị.',
 );
 } catch (error) {
 setLoiThuNghiem(
 error instanceof Error
 ? error.message
 : 'Không gửi được thông báo thử trên thiết bị.',
 );
 } finally {
 setDangXuLy(false);
 }
 }

 return (
 <SafeAreaView
 className="flex-1 bg-background"
 edges={['top', 'bottom']}
 >
 <ScrollView
 className="flex-1"
 contentContainerStyle={{
 gap: 20,
 padding: 20,
 paddingBottom: 40,
 }}
 >
 <Pressable
 accessibilityRole="button"
 onPress={() => nav.back()}
 className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
 >
 <Text className="font-semibold text-foreground">
 Quay lại
 </Text>
 </Pressable>

 <View className="gap-2">
 <Text className="text-3xl font-bold text-foreground">
 Thông báo
 </Text>
 <Text className="text-sm leading-5 text-muted-foreground">
 In-app notification và remote push dùng cùng deep-link contract.
 </Text>
 </View>

 <View className="gap-3">
 <View className="flex-row items-center justify-between">
 <Text className="text-xl font-bold text-foreground">
 Thu hoạch mới
 </Text>

 {inAppQuery.data ? (
 <Badge variant="info">
 {inAppQuery.data.tong} thông báo
 </Badge>
 ) : null}
 </View>

 {!daDangNhap ? (
 <EmptyState
 title="Đăng nhập để xem thông báo"
 description="Thông báo được lưu theo tài khoản khách hàng."
 actionLabel="Đăng nhập"
 onAction={() =>
 moDangNhap(
 nav,
 '/tai-khoan/thong-bao',
 )
 }
 />
 ) : inAppQuery.isPending ? (
 <View className="gap-3">
 <Skeleton
 height={120}
 borderRadius={18}
 />
 <Skeleton
 height={120}
 borderRadius={18}
 />
 </View>
 ) : inAppQuery.isError ||
 !inAppQuery.data ? (
 <ErrorState
 title="Không tải được thông báo"
 description={thongBaoLoiApi(
 inAppQuery.error,
 'Không tải được thông báo in-app.',
 )}
 actionLabel="Thử lại"
 onAction={() => {
 void inAppQuery.refetch();
 }}
 />
 ) : inAppQuery.data.duLieu.length ===
 0 ? (
 <EmptyState
 title="Chưa có thông báo"
 description="Khi trang trại bạn theo dõi có thu hoạch mới, thông báo sẽ xuất hiện ở đây."
 />
 ) : (
 <View className="gap-3">
 {inAppQuery.data.duLieu.map(
 (item) => {
 const pushData =
 taoDuLieuPushThuHoachMoi(
 item,
 );

 return (
 <Pressable
 key={item.id}
 accessibilityRole="button"
 onPress={() =>
 router.push(
 pushData.deepLink as Href,
 )
 }
 className="gap-2 rounded-2xl border border-border bg-card p-4 active:opacity-80"
 >
 <View className="flex-row flex-wrap items-center gap-2">
 <Badge variant="success">
 NEW_HARVEST
 </Badge>

 <Text className="font-bold text-foreground">
 {item.tenTrangTrai}
 </Text>
 </View>

 <Text className="text-sm text-foreground">
 {item.cayTrong}
 {item.giong
 ? ` · ${item.giong}`
 : ''}
 {' · '}
 {item.soLuong}{' '}
 {item.donVi}
 </Text>

 <Text className="text-xs text-muted-foreground">
 Thu hoạch{' '}
 {item.ngayThuHoach}
 {' · '}
 Phân loại{' '}
 {item.phanLoai}
 </Text>
 </Pressable>
 );
 },
 )}
 </View>
 )}
 </View>

 <View className="gap-3 rounded-2xl border border-border bg-card p-4">
 <Text className="text-xl font-bold text-foreground">
 Thông báo trên thiết bị
 </Text>

 <View className="self-start">
 <Badge
 variant={
 result?.trangThai ===
 'da-dang-ky-backend'
 ? 'success'
 : result?.trangThai ===
 'loi-dang-ky-backend'
 ? 'danger'
 : 'info'
 }
 >
 {trangThaiLabel(
 result,
 )}
 </Badge>
 </View>

 <Text className="text-sm text-muted-foreground">
 Platform: {Platform.OS}
 </Text>

 <Text
 selectable
 className="text-sm text-muted-foreground"
 >
 Trạng thái ứng dụng:{' '}
 {projectId ??
 'chưa có trong build'}
 </Text>

 <Pressable
 accessibilityRole="button"
 disabled={
 dangXuLy ||
 !daDangNhap
 }
 onPress={() => {
 void kiemTraVaDangKy();
 }}
 className={[
 'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
 dangXuLy ||
 !daDangNhap
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-primary-foreground">
 {dangXuLy
 ? 'Đang xử lý…'
 : 'Bật thông báo'}
 </Text>
 </Pressable>

 <Pressable
 accessibilityRole="button"
 disabled={
 dangXuLy ||
 !daDangNhap ||
 result?.trangThai !==
 'da-dang-ky-backend'
 }
 onPress={() => {
 void guiThuBackend();
 }}
 className={[
 'min-h-12 items-center justify-center rounded-xl border border-primary px-4 py-3',
 dangXuLy ||
 !daDangNhap ||
 result?.trangThai !==
 'da-dang-ky-backend'
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-primary">
 Gửi thông báo thử
 </Text>
 </Pressable>

 {thongBaoThu ? (
 <Badge variant="success">
 {thongBaoThu}
 </Badge>
 ) : null}

 {loiThuNghiem ? (
 <Text className="text-sm leading-5 text-danger">
 {loiThuNghiem}
 </Text>
 ) : null}
 </View>

 <View className="gap-3 rounded-2xl border border-border bg-card p-4">
 <Text className="text-lg font-bold text-foreground">
 Loại thông báo
 </Text>

 <View className="flex-row flex-wrap gap-2">
 {LOAI_THONG_BAO_PUSH_MOBILE.map(
 (type) => (
 <Badge
 key={type}
 variant={
 type ===
 'NEW_HARVEST'
 ? 'success'
 : 'info'
 }
 >
 {type}
 </Badge>
 ),
 )}
 </View>

 <Text className="text-sm leading-5 text-muted-foreground">
 Bạn có thể nhận thông báo về thu hoạch mới và các cập nhật quan trọng của tài khoản.
 </Text>
 </View>

 <View className="gap-3 rounded-2xl border border-border bg-card p-4">
 <Text className="text-lg font-bold text-foreground">
 Kiểm tra thông báo trên thiết bị
 </Text>

 <Text className="text-sm leading-5 text-muted-foreground">
 Dùng để kiểm tra cách thông báo hiển thị và mở màn hình liên quan.
 </Text>

 <Pressable
 accessibilityRole="button"
 disabled={dangXuLy}
 onPress={() => {
 void guiThuNoiBo();
 }}
 className={[
 'min-h-12 items-center justify-center rounded-xl border border-border px-4 py-3',
 dangXuLy
 ? 'opacity-50'
 : 'active:opacity-80',
 ].join(' ')}
 >
 <Text className="font-semibold text-foreground">
 Gửi thông báo thử trên thiết bị
 </Text>
 </Pressable>
 </View>

 <View className="gap-2 rounded-2xl border border-warning bg-card p-4">
 <Badge variant="warning">
 Lưu ý
 </Badge>

 <Text className="text-sm leading-5 text-muted-foreground">
 Thông báo trên thiết bị cần được bật trong cài đặt của ứng dụng và hệ điều hành.
 </Text>
 </View>
 </ScrollView>
 </SafeAreaView>
 );
}
