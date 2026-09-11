import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { DanhGiaMucDonHangMobile } from '@/components/orders/danh-gia-muc-don-hang';
import { layTrangThaiHttp, thongBaoLoiApi } from '@/lib/api-error';
import {
  DON_HANG_MOBILE_LIST_QUERY_KEY,
  donHangMobileDetailQueryKey,
  huyDonHangMobile,
  layChiTietDonHangMobile,
  nhanTrangThaiDonHangMobile,
} from '@/lib/api-don-hang';
import {
  giaoHangDonHangMobileQueryKey,
  layGiaoHangDonHangMobile,
} from '@/lib/api-giao-hang';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import {
  layThanhToanDonHangMobile,
  thanhToanDonHangMobileQueryKey,
} from '@/lib/api-thanh-toan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';
type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
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
  if (trangThai === 'HOAN_THANH' || trangThai === 'DA_GIAO') return 'success';
  if (trangThai === 'DANG_GIAO') return 'info';
  if (trangThai === 'CHO_THANH_TOAN') return 'warning';
  return 'neutral';
}

function variantThanhToan(trangThai: string): BadgeVariant {
  if (trangThai === 'PAID') return 'success';
  if (trangThai === 'FAILED' || trangThai === 'CANCELLED') return 'danger';
  if (trangThai === 'REFUNDED' || trangThai === 'PARTIALLY_REFUNDED') return 'info';
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
  if (trangThai === 'DA_GIAI_PHONG' || trangThai === 'HET_HAN') return 'danger';
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
  if (['GIAO_THAT_BAI', 'DA_HUY', 'HOAN_HANG'].includes(trangThai)) return 'danger';
  if (trangThai === 'DANG_GIAO' || trangThai === 'DA_LAY_HANG') return 'info';
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
      <Skeleton height={140} borderRadius={20} />
      <Skeleton height={190} borderRadius={20} />
      <Skeleton height={240} borderRadius={20} />
    </View>
  );
}

function Header({
  title,
  refreshing,
  onBack,
  onRefresh,
}: {
  title: string;
  refreshing: boolean;
  onBack: () => void;
  onRefresh?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 border-b border-[#E3EBE6] bg-white px-4 py-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại danh sách đơn hàng"
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F1F6F3]"
      >
        <Ionicons name="chevron-back" size={27} color={PRIMARY} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="text-[20px] font-extrabold text-[#17251C]" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-[11px] text-[#7A8780]">Chi tiết đơn hàng AgriMarket</Text>
      </View>
      {onRefresh ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Làm mới đơn hàng"
          disabled={refreshing}
          onPress={onRefresh}
          className={refreshing ? 'h-10 w-10 items-center justify-center opacity-40' : 'h-10 w-10 items-center justify-center rounded-full active:bg-[#F1F6F3]'}
        >
          <Ionicons name="refresh" size={21} color={PRIMARY} />
        </Pressable>
      ) : null}
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietDonHang() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const huyMutation = useMutation({
    mutationFn: () => huyDonHangMobile(id),
    onSuccess: async (order) => {
      queryClient.setQueryData(donHangMobileDetailQueryKey(id), order);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DON_HANG_MOBILE_LIST_QUERY_KEY }),
        paymentQuery.refetch(),
        shipmentQuery.refetch(),
      ]);
    },
  });

  function lamMoi() {
    void Promise.all([query.refetch(), paymentQuery.refetch(), shipmentQuery.refetch()]);
  }

  function xacNhanHuy() {
    if (!query.data?.coTheHuy || huyMutation.isPending) return;
    Alert.alert(
      'Hủy đơn hàng?',
      `Bạn có chắc muốn hủy đơn ${query.data.maDonHang}? Hệ thống sẽ cập nhật lại tồn kho theo chính sách hiện hành.`,
      [
        { text: 'Không', style: 'cancel' },
        { text: 'Hủy đơn', style: 'destructive', onPress: () => huyMutation.mutate() },
      ],
    );
  }

  const back = () => quayLaiHoacVe(router, '/don-hang');

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <Header title="Đơn hàng" refreshing={false} onBack={back} />
        <View className="flex-1 px-4 py-4"><DetailSkeleton /></View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <Header title="Đơn hàng" refreshing={false} onBack={back} />
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
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <Header title="Đơn hàng" refreshing={false} onBack={back} />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          <DetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <Header title="Đơn hàng" refreshing={false} onBack={back} />
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được chi tiết đơn hàng"
            description="Đơn hàng không tồn tại, không thuộc tài khoản này hoặc dịch vụ đang tạm gián đoạn."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const order = query.data;
  const refreshing = query.isFetching || paymentQuery.isFetching || shipmentQuery.isFetching;

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <Header title={`#${order.maDonHang}`} refreshing={refreshing} onBack={back} onRefresh={lamMoi} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 40 }}
      >
        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[12px] font-bold uppercase tracking-[0.8px] text-[#7A8780]">Đơn hàng</Text>
              <Text className="mt-1 text-[24px] font-extrabold text-[#17251C]">{order.maDonHang}</Text>
              <Text className="mt-1 text-[12px] text-[#7A8780]">Đặt lúc {dinhDangNgay(order.createdAt)}</Text>
            </View>
            <Badge variant={variantTrangThai(order.trangThai)}>
              {nhanTrangThaiDonHangMobile(order.trangThai)}
            </Badge>
          </View>

          <View className="flex-row items-end justify-between rounded-[18px] bg-[#F1FAF5] p-4">
            <View>
              <Text className="text-[11px] text-[#718078]">Tổng thanh toán</Text>
              <Text className="mt-1 text-[27px] font-extrabold text-[#087A4B]">{dinhDangGia(order.tongTien)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-[#718078]">Cập nhật gần nhất</Text>
              <Text className="mt-1 text-[12px] font-semibold text-[#334139]">{dinhDangNgay(order.updatedAt)}</Text>
            </View>
          </View>

          <View className="gap-2 rounded-[18px] border border-[#E3E9E5] bg-[#FCFDFC] p-4">
            <Text className="mb-1 text-[13px] font-extrabold text-[#334139]">Chi tiết thanh toán</Text>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[12px] text-[#718078]">Tạm tính hàng hóa</Text>
              <Text className="text-[12px] font-bold text-[#334139]">{dinhDangGia(order.tamTinhHangHoa)}</Text>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[12px] text-[#718078]">Phí vận chuyển</Text>
              <Text className="text-[12px] font-bold text-[#334139]">{dinhDangGia(order.phiVanChuyen)}</Text>
            </View>
            {order.maKhuyenMai || order.giamKhuyenMai > 0 ? (
              <View className="flex-row items-center justify-between gap-3">
                <Text className="min-w-0 flex-1 text-[12px] text-[#718078]" numberOfLines={1}>
                  Voucher{order.maKhuyenMai ? ` · ${order.maKhuyenMai}` : ''}
                </Text>
                <Text className="text-[12px] font-bold text-[#087A4B]">-{dinhDangGia(order.giamKhuyenMai)}</Text>
              </View>
            ) : null}
            {order.diemDaDung > 0 || order.giaTriDiemDaDung > 0 ? (
              <View className="flex-row items-center justify-between gap-3">
                <Text className="min-w-0 flex-1 text-[12px] text-[#718078]" numberOfLines={1}>
                  Điểm thưởng · {order.diemDaDung.toLocaleString('vi-VN')} điểm
                </Text>
                <Text className="text-[12px] font-bold text-[#087A4B]">-{dinhDangGia(order.giaTriDiemDaDung)}</Text>
              </View>
            ) : null}
            <View className="my-1 h-px bg-[#E3E9E5]" />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-extrabold text-[#263129]">Tổng thanh toán</Text>
              <Text className="text-[17px] font-extrabold text-[#087A4B]">{dinhDangGia(order.tongTien)}</Text>
            </View>
          </View>

          {order.coTheHuy ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: huyMutation.isPending }}
              disabled={huyMutation.isPending}
              onPress={xacNhanHuy}
              className={[
                'min-h-12 items-center justify-center rounded-[16px] border border-[#F1C6C9] bg-[#FFF7F7] px-4',
                huyMutation.isPending ? 'opacity-50' : 'active:opacity-75',
              ].join(' ')}
            >
              <Text className="font-extrabold text-[#C93445]">
                {huyMutation.isPending ? 'Đang hủy đơn…' : 'Hủy đơn hàng'}
              </Text>
            </Pressable>
          ) : order.lyDoKhongTheHuy ? (
            <Text className="text-[12px] leading-5 text-[#718078]">{order.lyDoKhongTheHuy}</Text>
          ) : null}

          {huyMutation.isError ? (
            <View className="rounded-[14px] bg-[#FFF4F4] p-3">
              <Text className="text-[12px] leading-5 text-[#C93445]">
                {thongBaoLoiApi(huyMutation.error, 'Chưa thể hủy đơn hàng. Vui lòng làm mới và thử lại.')}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F5EC]">
              <Ionicons name="card-outline" size={22} color={PRIMARY} />
            </View>
            <Text className="text-[19px] font-extrabold text-[#17251C]">Thanh toán</Text>
          </View>

          {paymentQuery.isPending ? (
            <Skeleton height={150} borderRadius={16} />
          ) : paymentQuery.isError && layTrangThaiHttp(paymentQuery.error) === 404 ? (
            <View className="gap-2 rounded-[16px] bg-[#FFF9EE] p-4">
              <Badge variant="warning">Chưa có thanh toán</Badge>
              <Text className="text-[12px] leading-5 text-[#6B604A]">Đơn hàng này chưa có giao dịch thanh toán.</Text>
            </View>
          ) : paymentQuery.isError || !paymentQuery.data ? (
            <View className="gap-3 rounded-[16px] bg-[#FFF7F7] p-4">
              <Text className="font-bold text-[#C93445]">Không tải được trạng thái thanh toán</Text>
              <Pressable onPress={() => void paymentQuery.refetch()} className="self-start rounded-xl bg-white px-3 py-2 active:opacity-75">
                <Text className="font-bold text-[#087A4B]">Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              <View className="flex-row items-start justify-between gap-3">
                <View>
                  <Text className="text-[12px] text-[#718078]">Phương thức</Text>
                  <Text className="mt-1 font-extrabold text-[#263129]">{paymentQuery.data.phuongThuc}</Text>
                </View>
                <Badge variant={variantThanhToan(paymentQuery.data.trangThai)}>
                  {nhanThanhToan(paymentQuery.data.trangThai)}
                </Badge>
              </View>
              <View className="h-px bg-[#EEF2EF]" />
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-[#637168]">Số tiền</Text>
                <Text className="text-[18px] font-extrabold text-[#087A4B]">{dinhDangGia(paymentQuery.data.soTien)}</Text>
              </View>
              <View className="gap-1">
                <Text className="text-[11px] text-[#7A8780]">Mã giao dịch</Text>
                <Text selectable className="font-semibold text-[#263129]">{paymentQuery.data.giaoDich.maGiaoDich}</Text>
              </View>
              <View className="flex-row items-center justify-between gap-3 rounded-[14px] bg-[#F7FAF8] p-3">
                <View>
                  <Text className="text-[11px] text-[#7A8780]">Giữ tồn kho</Text>
                  <Text className="mt-1 text-[11px] text-[#7A8780]">Đến {dinhDangNgay(paymentQuery.data.datCho.hetHanLuc)}</Text>
                </View>
                <Badge variant={variantDatCho(paymentQuery.data.datCho.trangThai)}>
                  {nhanDatCho(paymentQuery.data.datCho.trangThai)}
                </Badge>
              </View>
            </View>
          )}
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F5EC]">
              <Ionicons name="trail-sign-outline" size={22} color={PRIMARY} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[19px] font-extrabold text-[#17251C]">Tiến trình đơn hàng</Text>
              <Text className="text-[11px] text-[#7A8780]">Theo trạng thái cập nhật từ hệ thống</Text>
            </View>
          </View>

          {order.tienTrinh.map((moc, index) => (
            <View key={`${moc.trangThai}-${index}`} className="flex-row gap-3">
              <View className="items-center">
                <View
                  className={[
                    'h-6 w-6 items-center justify-center rounded-full border-2',
                    moc.hienTai
                      ? 'border-[#087A4B] bg-[#087A4B]'
                      : moc.daDat
                        ? 'border-[#55A979] bg-[#E7F5EC]'
                        : 'border-[#D7E0DA] bg-white',
                  ].join(' ')}
                >
                  {moc.daDat || moc.hienTai ? (
                    <Ionicons name={moc.hienTai ? 'location' : 'checkmark'} size={13} color={moc.hienTai ? '#FFFFFF' : PRIMARY} />
                  ) : null}
                </View>
                {index < order.tienTrinh.length - 1 ? (
                  <View className={moc.daDat ? 'w-0.5 flex-1 bg-[#B7DEC6]' : 'w-0.5 flex-1 bg-[#E3E9E5]'} style={{ minHeight: 46 }} />
                ) : null}
              </View>
              <View className="min-w-0 flex-1 pb-4">
                <Text className={moc.hienTai ? 'font-extrabold text-[#087A4B]' : 'font-bold text-[#334139]'}>
                  {nhanTrangThaiDonHangMobile(moc.trangThai)}
                </Text>
                <Text className="mt-1 text-[11px] text-[#7A8780]">
                  {moc.hienTai ? 'Trạng thái hiện tại' : moc.daDat ? 'Đã hoàn thành mốc này' : 'Chưa tới mốc này'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-4">
          <View className="flex-row items-center gap-3 px-1">
            <Ionicons name="cube-outline" size={22} color={PRIMARY} />
            <Text className="text-[20px] font-extrabold text-[#17251C]">Sản phẩm trong đơn</Text>
          </View>

          {order.donNhaCungCap.map((suborder) => (
            <View key={suborder.id} className="overflow-hidden rounded-[22px] border border-[#DCE7DF] bg-white">
              <View className="flex-row items-start justify-between gap-3 bg-[#F1FAF5] p-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-[16px] font-extrabold text-[#17251C]">{suborder.tenNhaCungCap}</Text>
                  <Text className="mt-1 text-[11px] text-[#718078]">{suborder.maDon}</Text>
                </View>
                <View className="items-end gap-2">
                  <Badge variant={variantTrangThai(suborder.trangThai)}>{nhanTrangThaiDonHangMobile(suborder.trangThai)}</Badge>
                  <Text className="font-extrabold text-[#087A4B]">{dinhDangGia(suborder.tamTinh)}</Text>
                </View>
              </View>

              {suborder.muc.map((item, index) => (
                <View key={item.id} className={index > 0 ? 'gap-3 border-t border-[#EEF2EF] p-4' : 'gap-3 p-4'}>
                  <View className="flex-row items-start gap-3">
                    <View className="h-14 w-14 items-center justify-center rounded-[14px] bg-[#EAF5EE]">
                      <Ionicons name="leaf-outline" size={26} color={PRIMARY} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-[15px] font-extrabold text-[#202A24]" numberOfLines={2}>{item.tenSanPham}</Text>
                      <Text className="mt-1 text-[11px] text-[#7A8780]" numberOfLines={1}>{item.tenTrangTrai}</Text>
                      <Text className="mt-1 text-[11px] text-[#7A8780]">{item.khoiLuong} {item.donVi} · SL {item.soLuong} · SKU {item.sku}</Text>
                    </View>
                    <Text className="font-extrabold text-[#263129]">{dinhDangGia(item.thanhTien)}</Text>
                  </View>

                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}
                      className="rounded-xl bg-[#EAF7EF] px-3 py-2.5 active:opacity-75"
                    >
                      <Text className="text-[12px] font-extrabold text-[#087A4B]">Xem sản phẩm</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/khieu-nai/tao', params: { mucDonHangId: item.id } })}
                      className="rounded-xl border border-[#E8D19C] bg-[#FFF9EE] px-3 py-2.5 active:opacity-75"
                    >
                      <Text className="text-[12px] font-extrabold text-[#9A6900]">Yêu cầu hỗ trợ</Text>
                    </Pressable>
                  </View>

                  <DanhGiaMucDonHangMobile mucDonHangId={item.id} />
                </View>
              ))}
            </View>
          ))}
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E7F5EC]">
              <Ionicons name="car-outline" size={22} color={PRIMARY} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[19px] font-extrabold text-[#17251C]">Giao hàng</Text>
              <Text className="text-[11px] text-[#7A8780]">Mỗi nhà cung cấp có thể có vận đơn riêng</Text>
            </View>
          </View>

          {shipmentQuery.isPending ? (
            <Skeleton height={180} borderRadius={16} />
          ) : shipmentQuery.isError || !shipmentQuery.data ? (
            <View className="gap-3 rounded-[16px] bg-[#FFF7F7] p-4">
              <Text className="font-bold text-[#C93445]">Không tải được thông tin giao hàng</Text>
              <Pressable onPress={() => void shipmentQuery.refetch()} className="self-start rounded-xl bg-white px-3 py-2 active:opacity-75">
                <Text className="font-bold text-[#087A4B]">Thử lại</Text>
              </Pressable>
            </View>
          ) : shipmentQuery.data.vanChuyen.length === 0 ? (
            <View className="gap-2 rounded-[16px] bg-[#F7FAF8] p-4">
              <Badge variant="neutral">Chưa có vận đơn</Badge>
              <Text className="text-[12px] leading-5 text-[#718078]">Thông tin vận chuyển sẽ xuất hiện khi đơn được bàn giao cho đơn vị giao hàng.</Text>
            </View>
          ) : (
            <View className="gap-4">
              {shipmentQuery.data.vanChuyen.map((shipment) => (
                <View key={shipment.id} className="gap-4 rounded-[18px] border border-[#E3E9E5] p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text className="font-extrabold text-[#263129]">{shipment.tenNhaCungCap}</Text>
                      <Text selectable className="mt-1 text-[12px] text-[#718078]">{shipment.maVanDon}</Text>
                    </View>
                    <Badge variant={variantGiaoHang(shipment.trangThai)}>{nhanGiaoHang(shipment.trangThai)}</Badge>
                  </View>

                  {shipment.suKien.length === 0 ? (
                    <Text className="text-[12px] text-[#718078]">Chưa có sự kiện theo dõi giao hàng.</Text>
                  ) : (
                    shipment.suKien.map((event, index) => (
                      <View key={event.id} className="flex-row gap-3">
                        <View className="items-center">
                          <View className={index === shipment.suKien.length - 1 ? 'h-4 w-4 rounded-full bg-[#087A4B]' : 'h-4 w-4 rounded-full bg-[#79B994]'} />
                          {index < shipment.suKien.length - 1 ? <View className="w-0.5 flex-1 bg-[#DCE7DF]" style={{ minHeight: 50 }} /> : null}
                        </View>
                        <View className="min-w-0 flex-1 pb-4">
                          <Text className="font-bold text-[#334139]">{nhanGiaoHang(event.trangThai)}</Text>
                          <Text className="mt-1 text-[11px] text-[#7A8780]">{dinhDangNgay(event.thoiGian)}</Text>
                          {event.viTri ? <Text className="mt-1 text-[12px] text-[#46554D]">{event.viTri}</Text> : null}
                          {event.moTa ? <Text className="mt-1 text-[12px] leading-5 text-[#718078]">{event.moTa}</Text> : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row items-start gap-3 rounded-[18px] bg-[#F1FAF5] p-4">
          <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
          <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#617168]">
            Bạn có thể mở từng sản phẩm để xem chi tiết, đánh giá sau khi đủ điều kiện hoặc gửi yêu cầu hỗ trợ cho mặt hàng trong đơn.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}