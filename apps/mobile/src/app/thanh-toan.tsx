import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
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
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { taoPaymentReturnUrl } from '@/lib/payment-return';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';
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
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function giaTriThanhPhan(thanhPhan: ThanhPhanCheckoutMobile): string {
  if (thanhPhan.giaTri === null) return 'Chưa xác định';
  return dinhDangGia(thanhPhan.giaTri);
}

function dinhDangDiaChi(item: DiaChiTaiKhoanMobile): string {
  return [item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh, item.maBuuChinh]
    .filter(Boolean)
    .join(', ');
}

function CheckoutSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={120} borderRadius={18} />
      <Skeleton height={230} borderRadius={18} />
      <Skeleton height={140} borderRadius={18} />
      <Skeleton height={190} borderRadius={18} />
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  action,
  onAction,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  action?: string;
  onAction?: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7ED]">
          <Ionicons name={icon} size={22} color={PRIMARY} />
        </View>
        <Text className="text-[19px] font-extrabold text-[#202A24]">{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onAction}
          className={disabled ? 'opacity-40' : 'active:opacity-70'}
        >
          <Text className="font-bold text-[#087A4B]">{action} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ThanhPhanRow({ nhan, thanhPhan }: { nhan: string; thanhPhan: ThanhPhanCheckoutMobile }) {
  return (
    <View className="gap-1 py-1">
      <View className="flex-row items-start justify-between gap-4">
        <Text className="text-[14px] text-[#56645B]">{nhan}</Text>
        <Text className="text-[14px] font-bold text-[#263129]">{giaTriThanhPhan(thanhPhan)}</Text>
      </View>
      {thanhPhan.lyDo ? (
        <Text className="text-[11px] leading-4 text-[#8A948E]">{thanhPhan.lyDo}</Text>
      ) : null}
    </View>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewMobile }) {
  return (
    <View className="overflow-hidden rounded-[20px] border border-[#E1E8E3] bg-white">
      {preview.items.map((item, index) => (
        <View
          key={item.mucGioHangId}
          className={[
            'flex-row items-center gap-3 p-4',
            index > 0 ? 'border-t border-[#EEF2EF]' : '',
          ].join(' ')}
        >
          <View className="h-[68px] w-[68px] items-center justify-center rounded-2xl bg-[#EAF5EE]">
            <Ionicons name="leaf-outline" size={31} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={2} className="text-[15px] font-extrabold text-[#202A24]">
              {item.tenSanPham}
            </Text>
            <Text numberOfLines={1} className="text-[12px] text-[#7C8880]">{item.nhaCungCap.ten}</Text>
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-[12px] font-bold text-[#087A4B]">{dinhDangGia(item.donGia)}</Text>
              <Text className="text-[11px] text-[#8A948E]">× {item.soLuong}</Text>
              <Text className={item.coTheDatHang ? 'text-[11px] text-[#168556]' : 'text-[11px] text-[#D6454F]'}>
                {item.coTheDatHang ? 'Đủ tồn kho' : 'Không đủ tồn'}
              </Text>
            </View>
          </View>
          <View className="items-end gap-1">
            <Text className="text-[15px] font-extrabold text-[#075E3B]">{dinhDangGia(item.thanhTien)}</Text>
            <Text className="text-[10px] text-[#9AA39E]">SKU {item.sku}</Text>
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
        'rounded-[20px] border p-4',
        selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white',
        disabled ? 'opacity-60' : 'active:opacity-80',
      ].join(' ')}
    >
      <View className="flex-row items-start gap-3">
        <View className={selected ? 'mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary' : 'mt-0.5 h-6 w-6 rounded-full border-2 border-[#B8C2BC]'}>
          {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[16px] font-extrabold text-[#202A24]">{item.tenNguoiNhan}</Text>
            {item.macDinh ? <Badge variant="success">Mặc định</Badge> : null}
          </View>
          <Text className="mt-1 text-[13px] font-semibold text-[#56645B]">{item.soDienThoai}</Text>
          <Text className="mt-1 text-[13px] leading-5 text-[#69766E]">{dinhDangDiaChi(item)}</Text>
        </View>
      </View>
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
        'min-h-[104px] flex-1 rounded-[18px] border p-4',
        selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white',
        disabled ? 'opacity-60' : 'active:opacity-80',
      ].join(' ')}
    >
      <View className="flex-row items-start gap-3">
        <View className={selected ? 'mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary' : 'mt-0.5 h-6 w-6 rounded-full border-2 border-[#B8C2BC]'}>
          {selected ? <View className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
        </View>
        <Ionicons name={online ? 'card-outline' : 'cash-outline'} size={26} color={selected ? PRIMARY : '#536158'} />
      </View>
      <Text className="mt-3 text-[14px] font-extrabold text-[#263129]">
        {online ? 'VNPay Sandbox' : 'Thanh toán khi nhận hàng'}
      </Text>
      <Text className="mt-1 text-[11px] leading-4 text-[#7C8880]">
        {online ? 'Cổng thanh toán thử nghiệm có xác minh kết quả.' : 'Thanh toán COD khi nhận hàng.'}
      </Text>
    </Pressable>
  );
}

export default function TrangThanhToan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const [diaChiDaChonId, setDiaChiDaChonId] = useState<string | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucCheckout>('COD');
  const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<TaoDonHangMobileKetQua | null>(null);
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
    if (!addressQuery.data || addressQuery.data.length === 0) return;

    const selectedStillExists = addressQuery.data.some((item) => item.id === diaChiDaChonId);
    if (selectedStillExists) return;

    const macDinh = addressQuery.data.find((item) => item.macDinh) ?? addressQuery.data[0];
    if (macDinh) setDiaChiDaChonId(macDinh.id);
  }, [addressQuery.data, diaChiDaChonId]);

  const diaChiDaChon = useMemo(
    () => addressQuery.data?.find((item) => item.id === diaChiDaChonId) ?? null,
    [addressQuery.data, diaChiDaChonId],
  );

  async function invalidateSauDatHang() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: GIO_HANG_MOBILE_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: DON_HANG_MOBILE_LIST_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: CHECKOUT_PREVIEW_MOBILE_QUERY_KEY }),
    ]);
  }

  const datHangMutation = useMutation({
    mutationFn: async (): Promise<KetQuaDatHang> => {
      const preview = previewQuery.data;
      if (!preview || !diaChiDaChon) {
        throw new Error('Checkout hoặc địa chỉ giao hàng chưa sẵn sàng.');
      }
      if (!preview.total.coTheXacNhan) {
        throw new Error('Checkout hiện không đủ điều kiện xác nhận.');
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
        throw new Error('Checkout đã thay đổi sau khi bắt đầu đặt hàng. Vui lòng mở lại Checkout.');
      }

      let donHang = lanDatHang.donHang;
      if (!donHang) {
        donHang = await taoDonHangMobile(
          taoDuLieuDonHangTuPreview(preview, lanDatHang.diaChiGiaoHangId, lanDatHang.maYeuCauDonHang),
        );
        lanDatHang.donHang = donHang;
        lanDatHangRef.current = lanDatHang;
        setDonHangDaTao(donHang);
      }

      const thanhToan =
        phuongThuc === 'COD'
          ? await taoThanhToanCodMobile(donHang.id, lanDatHang.maYeuCauThanhToan)
          : await taoThanhToanVnPaySandboxMobile(donHang.id, lanDatHang.maYeuCauThanhToan);

      return { donHang, thanhToan, phuongThuc };
    },
    onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
      setLoiDatHang(null);

      if (method === 'COD') {
        if (
          thanhToan.donHangId !== donHang.id ||
          thanhToan.phuongThuc !== 'COD' ||
          thanhToan.trangThai !== 'PENDING'
        ) {
          setLoiDatHang('Hệ thống đã tạo payment nhưng trạng thái COD không đúng kỳ vọng.');
          return;
        }

        lanDatHangRef.current = null;
        setDonHangDaTao(null);
        await invalidateSauDatHang();
        router.replace({ pathname: '/don-hang/[id]', params: { id: donHang.id } });
        return;
      }

      if (thanhToan.donHangId !== donHang.id) {
        setLoiDatHang('Payment VNPay không thuộc đơn hàng vừa tạo.');
        return;
      }

      if (thanhToan.trangThai === 'PAID') {
        lanDatHangRef.current = null;
        setDonHangDaTao(null);
        await invalidateSauDatHang();
        router.replace({
          pathname: '/thanh-toan/ket-qua',
          params: { donHangId: donHang.id, maDonHang: donHang.maDonHang, trangThai: 'success' },
        });
        return;
      }

      if (
        thanhToan.phuongThuc !== 'VNPAY_SANDBOX' ||
        (thanhToan.trangThai !== 'PENDING' && thanhToan.trangThai !== 'CREATED') ||
        !thanhToan.paymentUrl
      ) {
        setLoiDatHang('Hệ thống chưa trả payment URL VNPay hợp lệ.');
        return;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(
        thanhToan.paymentUrl,
        taoPaymentReturnUrl(),
      );

      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        setLoiDatHang('Bạn đã đóng VNPay trước khi ứng dụng nhận được kết quả. Có thể mở lại Payment hoặc kiểm tra đơn hàng.');
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
    if (datHangMutation.isPending) return;
    setLoiDatHang(null);
    datHangMutation.mutate();
  }

  const Header = () => (
    <View className="flex-row items-center gap-3 border-b border-[#E7ECE9] bg-white px-5 py-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại giỏ hàng"
        disabled={datHangMutation.isPending}
        onPress={() => quayLaiHoacVe(router, '/gio-hang')}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F3F7F5]"
      >
        <Ionicons name="chevron-back" size={29} color={PRIMARY} />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="text-[25px] font-extrabold text-[#075E3B]">Thanh toán</Text>
        <Text className="text-[12px] text-[#7C8880]">Kiểm tra thông tin và hoàn tất đơn hàng</Text>
      </View>
      <View className="flex-row items-center gap-1.5 rounded-xl bg-[#EAF7EF] px-3 py-2">
        <Ionicons name="lock-closed" size={16} color={PRIMARY} />
        <View>
          <Text className="text-[11px] font-extrabold text-[#075E3B]">Thanh toán an toàn</Text>
          <Text className="text-[9px] text-[#718078]">Dữ liệu từ hệ thống</Text>
        </View>
      </View>
    </View>
  );

  if (trangThai === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Header />
        <View className="flex-1 px-5 py-4"><CheckoutSkeleton /></View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Header />
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

  const dangTai = previewQuery.isPending || addressQuery.isPending;
  if (dangTai) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Header />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}><CheckoutSkeleton /></ScrollView>
      </SafeAreaView>
    );
  }

  if (previewQuery.isError || !previewQuery.data || addressQuery.isError || !addressQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Header />
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được thông tin thanh toán"
            description="Không thể đọc checkout hoặc sổ địa chỉ hiện tại."
            actionLabel="Thử lại"
            onAction={() => void Promise.all([previewQuery.refetch(), addressQuery.refetch()])}
          />
        </View>
      </SafeAreaView>
    );
  }

  const preview = previewQuery.data;
  const addresses = addressQuery.data;

  if (preview.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <Header />
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
  const coTheDatHang = coDiaChi && preview.total.coTheXacNhan && !datHangMutation.isPending;
  const daBatDauDatHang = lanDatHangRef.current !== null;
  const khoaLuaChon = datHangMutation.isPending || donHangDaTao !== null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Header />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View className="gap-6">
          <View className="gap-3">
            <SectionTitle
              icon="location"
              title="Địa chỉ nhận hàng"
              action="Thay đổi"
              disabled={khoaLuaChon}
              onAction={() => router.push('/tai-khoan/dia-chi')}
            />
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
            <SectionTitle icon="cart" title={`Sản phẩm (${preview.items.length})`} />
            <DanhSachSanPham preview={preview} />
          </View>

          <View className="gap-3">
            <SectionTitle icon="car-outline" title="Phương thức giao hàng" />
            <View className="flex-row items-center gap-3 rounded-[20px] border border-[#DCE7DF] bg-[#F7FAF8] p-4">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#E7F5EC]">
                <Ionicons name="car-outline" size={25} color={PRIMARY} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-extrabold text-[#263129]">Phí giao hàng từ hệ thống</Text>
                <Text className="mt-1 text-[12px] leading-4 text-[#7C8880]">{preview.shipping.lyDo}</Text>
              </View>
              <Text className="font-extrabold text-[#075E3B]">{giaTriThanhPhan(preview.shipping)}</Text>
            </View>
          </View>

          <View className="gap-3">
            <SectionTitle icon="card-outline" title="Phương thức thanh toán" />
            <View accessibilityRole="radiogroup" className="flex-row gap-3">
              <PhuongThucCard value="COD" selected={phuongThuc === 'COD'} disabled={khoaLuaChon} onPress={() => setPhuongThuc('COD')} />
              <PhuongThucCard value="VNPAY_SANDBOX" selected={phuongThuc === 'VNPAY_SANDBOX'} disabled={khoaLuaChon} onPress={() => setPhuongThuc('VNPAY_SANDBOX')} />
            </View>
          </View>

          <View className="gap-3">
            <SectionTitle icon="ticket-outline" title="Ưu đãi và điểm" />
            <View className="gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
              <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} />
              <View className="h-px bg-[#EEF2EF]" />
              <ThanhPhanRow nhan="Điểm" thanhPhan={preview.points} />
            </View>
          </View>

          <View className="gap-4 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
            <SectionTitle icon="document-text-outline" title="Tóm tắt đơn hàng" />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[14px] text-[#56645B]">Tạm tính ({preview.items.length} mặt hàng)</Text>
              <Text className="font-bold text-[#263129]">{dinhDangGia(preview.price.tamTinhHangHoa)}</Text>
            </View>
            <ThanhPhanRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
            <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} />
            <ThanhPhanRow nhan="Điểm" thanhPhan={preview.points} />
            <View className="h-px bg-[#E3E9E5]" />
            <View className="flex-row items-end justify-between gap-3">
              <Text className="text-[20px] font-extrabold text-[#17251C]">Tổng cộng</Text>
              <Text className="text-[27px] font-extrabold text-[#087A4B]">
                {preview.total.tongThanhToan === null ? 'Chưa xác định' : dinhDangGia(preview.total.tongThanhToan)}
              </Text>
            </View>
          </View>

          {!preview.total.coTheXacNhan ? (
            <View className="gap-2 rounded-[18px] border border-[#F0D4A6] bg-[#FFF9EE] p-4">
              <Badge variant="warning">Chưa thể xác nhận</Badge>
              {preview.total.lyDoKhongTheXacNhan.map((reason) => (
                <Text key={reason} className="text-sm leading-5 text-[#6B604A]">• {reason}</Text>
              ))}
            </View>
          ) : null}

          {preview.total.coTheXacNhan && !coDiaChi ? (
            <View className="rounded-[18px] border border-[#F0D4A6] bg-[#FFF9EE] p-4">
              <Text className="text-sm leading-5 text-[#6B604A]">Chọn hoặc thêm địa chỉ giao hàng để tiếp tục.</Text>
            </View>
          ) : null}

          {donHangDaTao ? (
            <View className="gap-2 rounded-[18px] border border-[#F0D4A6] bg-[#FFF9EE] p-4">
              <Badge variant="warning">Đơn đã được tạo</Badge>
              <Text className="font-extrabold text-[#263129]">{donHangDaTao.maDonHang}</Text>
              <Text className="text-sm leading-5 text-[#6B604A]">Nếu bước Payment lỗi, lần thử lại giữ nguyên Order và idempotency key.</Text>
            </View>
          ) : null}

          {phuongThuc === 'VNPAY_SANDBOX' ? (
            <View className="flex-row items-start gap-3 rounded-[18px] border border-[#BFDCEB] bg-[#F3FAFD] p-4">
              <Ionicons name="information-circle-outline" size={23} color="#247DA8" />
              <View className="min-w-0 flex-1">
                <Text className="font-extrabold text-[#226C90]">VNPay Sandbox</Text>
                <Text className="mt-1 text-[12px] leading-5 text-[#5A7480]">Ứng dụng sẽ mở cổng thử nghiệm và xác minh lại trạng thái giao dịch từ backend.</Text>
              </View>
            </View>
          ) : null}

          {loiDatHang ? (
            <View className="rounded-[18px] border border-[#F0C8C8] bg-[#FFF8F8] p-4">
              <Text className="text-sm leading-5 text-[#C93445]">{loiDatHang}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !coTheDatHang, busy: datHangMutation.isPending }}
            disabled={!coTheDatHang}
            onPress={submit}
            className={[
              'min-h-[58px] items-center justify-center rounded-[20px] px-4',
              coTheDatHang ? 'bg-primary active:opacity-80' : 'bg-[#D6DED9]',
            ].join(' ')}
          >
            <Text className={coTheDatHang ? 'text-[18px] font-extrabold text-white' : 'text-[18px] font-extrabold text-[#8C9690]'}>
              {datHangMutation.isPending
                ? phuongThuc === 'COD'
                  ? 'Đang tạo đơn COD…'
                  : 'Đang mở VNPay…'
                : donHangDaTao
                  ? phuongThuc === 'COD'
                    ? 'Thử lại thanh toán COD'
                    : 'Mở lại VNPay Sandbox'
                  : phuongThuc === 'COD'
                    ? 'Đặt hàng'
                    : 'Thanh toán qua VNPay'}
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="leaf-outline" size={17} color={PRIMARY} />
            <Text className="text-center text-[11px] text-[#7C8880]">Cùng AgriMarket lan tỏa nông sản sạch, cuộc sống xanh</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={previewQuery.isFetching || addressQuery.isFetching || daBatDauDatHang}
            onPress={() => void Promise.all([previewQuery.refetch(), addressQuery.refetch()])}
            className={previewQuery.isFetching || addressQuery.isFetching || daBatDauDatHang ? 'items-center opacity-40' : 'items-center active:opacity-70'}
          >
            <Text className="text-[12px] font-semibold text-[#708078]">
              {previewQuery.isFetching || addressQuery.isFetching ? 'Đang làm mới checkout…' : 'Làm mới giá và tồn kho'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
