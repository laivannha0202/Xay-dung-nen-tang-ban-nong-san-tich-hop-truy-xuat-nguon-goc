import {
  metaThanhPhanCheckout,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  thuocPhamViGiaoHangHungYen,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';
type PhuongThucCheckout = 'COD' | 'VNPAY_SANDBOX';
type UuDaiCheckout = { maKhuyenMai?: string; diemSuDung?: number };

type LanDatHang = {
  maYeuCauDonHang: string;
  maYeuCauThanhToan: string;
  diaChiGiaoHangId: string;
  gioHangId: string;
  phuongThuc: PhuongThucCheckout;
  maKhuyenMai?: string;
  diemSuDung?: number;
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
  const meta = metaThanhPhanCheckout(thanhPhan);
  if (!meta.hienThiGiaTri) return meta.label;
  return dinhDangGia(thanhPhan.giaTri ?? 0);
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
      <Skeleton height={160} borderRadius={18} />
      <Skeleton height={190} borderRadius={18} />
    </View>
  );
}

function SectionTitle({ icon, title }: { icon: ComponentProps<typeof Ionicons>['name']; title: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8F7ED]">
        <Ionicons name={icon} size={22} color={PRIMARY} />
      </View>
      <Text className="text-[19px] font-extrabold text-[#202A24]">{title}</Text>
    </View>
  );
}

function ThanhPhanRow({
  nhan,
  thanhPhan,
  laKhoanGiam = false,
}: {
  nhan: string;
  thanhPhan: ThanhPhanCheckoutMobile;
  laKhoanGiam?: boolean;
}) {
  const meta = metaThanhPhanCheckout(thanhPhan);
  const coGiaTri = meta.hienThiGiaTri && (thanhPhan.giaTri ?? 0) > 0;
  return (
    <View className="gap-1 py-1">
      <View className="flex-row items-start justify-between gap-4">
        <Text className="text-[14px] text-[#56645B]">{nhan}</Text>
        <Text className={coGiaTri && laKhoanGiam ? 'text-[14px] font-extrabold text-[#087A4B]' : 'text-[14px] font-bold text-[#263129]'}>
          {coGiaTri && laKhoanGiam ? '-' : ''}{giaTriThanhPhan(thanhPhan)}
        </Text>
      </View>
      {thanhPhan.lyDo ? (
        <Text className={thanhPhan.trangThai === 'KHONG_HOP_LE' ? 'text-[11px] leading-4 text-[#C93445]' : 'text-[11px] leading-4 text-[#8A948E]'}>
          {thanhPhan.lyDo}
        </Text>
      ) : null}
    </View>
  );
}

function AnhSanPhamCheckout({ url, ten }: { url: string | null; ten: string }) {
  const uri = useMemo(() => chuanHoaUrlAnhMobile(url), [url]);
  const [loiAnh, setLoiAnh] = useState(false);
  useEffect(() => setLoiAnh(false), [uri]);

  return (
    <View className="h-[68px] w-[68px] overflow-hidden rounded-2xl bg-[#EAF5EE]">
      {uri && !loiAnh ? (
        <Image
          source={{ uri }}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          contentFit="cover"
          transition={120}
          accessibilityLabel={`Ảnh ${ten}`}
          onError={() => setLoiAnh(true)}
          style={{ width: 68, height: 68 }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="leaf-outline" size={31} color={PRIMARY} />
        </View>
      )}
    </View>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewMobile }) {
  const router = useRouter();
  return (
    <View className="overflow-hidden rounded-[20px] border border-[#E1E8E3] bg-white">
      {preview.items.map((item, index) => (
        <View key={item.mucGioHangId} className={['flex-row items-center gap-3 p-4', index > 0 ? 'border-t border-[#EEF2EF]' : ''].join(' ')}>
          <Pressable onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}>
            <AnhSanPhamCheckout url={item.anhBiaUrl} ten={item.tenSanPham} />
          </Pressable>
          <View className="min-w-0 flex-1 gap-1">
            <Text numberOfLines={2} className="text-[15px] font-extrabold text-[#202A24]">{item.tenSanPham}</Text>
            <Text numberOfLines={1} className="text-[12px] text-[#7C8880]">{item.nhaCungCap.ten}</Text>
            <Text className="text-[12px] font-semibold text-[#087A4B]">{dinhDangGia(item.donGia)} × {item.soLuong}</Text>
            {!item.coTheDatHang ? <Text className="text-[11px] text-[#D6454F]">Không đủ tồn kho</Text> : null}
          </View>
          <Text className="text-[15px] font-extrabold text-[#075E3B]">{dinhDangGia(item.thanhTien)}</Text>
        </View>
      ))}
    </View>
  );
}

function DiaChiCard({ item, selected, disabled, onPress }: { item: DiaChiTaiKhoanMobile; selected: boolean; disabled: boolean; onPress: () => void }) {
  const trongPhamVi = thuocPhamViGiaoHangHungYen(item.tinhThanh);
  const biKhoa = disabled || !trongPhamVi;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: biKhoa }}
      disabled={biKhoa}
      onPress={onPress}
      className={['rounded-[20px] border p-4', selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white', biKhoa ? 'opacity-60' : 'active:opacity-80'].join(' ')}
    >
      <View className="flex-row items-start gap-3">
        <View className={selected ? 'mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary' : 'mt-0.5 h-6 w-6 rounded-full border-2 border-[#B8C2BC]'}>
          {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[16px] font-extrabold text-[#202A24]">{item.tenNguoiNhan}</Text>
            {item.macDinh ? <Badge variant="success">Mặc định</Badge> : null}
            {trongPhamVi ? <Badge variant="success">Có thể giao</Badge> : <Badge variant="warning">Ngoài khu vực</Badge>}
          </View>
          <Text className="mt-1 text-[13px] font-semibold text-[#56645B]">{item.soDienThoai}</Text>
          <Text className="mt-1 text-[13px] leading-5 text-[#69766E]">{dinhDangDiaChi(item)}</Text>
          {!trongPhamVi ? <Text className="mt-2 text-[12px] font-semibold text-[#C93445]">AgriMarket hiện chỉ giao trong tỉnh Hưng Yên.</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function PhuongThucCard({ value, selected, disabled, onPress }: { value: PhuongThucCheckout; selected: boolean; disabled: boolean; onPress: () => void }) {
  const online = value === 'VNPAY_SANDBOX';
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={['min-h-[108px] flex-1 rounded-[18px] border p-4', selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white', disabled ? 'opacity-60' : 'active:opacity-80'].join(' ')}
    >
      <Ionicons name={online ? 'card-outline' : 'cash-outline'} size={27} color={selected ? PRIMARY : '#536158'} />
      <Text className="mt-3 text-[14px] font-extrabold text-[#263129]">{online ? 'VNPay Sandbox' : 'COD'}</Text>
      <Text className="mt-1 text-[11px] leading-4 text-[#7C8880]">{online ? 'Thanh toán thử nghiệm qua VNPay.' : 'Thanh toán khi nhận hàng.'}</Text>
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
  const [maKhuyenMaiNhap, setMaKhuyenMaiNhap] = useState('');
  const [diemNhap, setDiemNhap] = useState('');
  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
  const [loiUuDai, setLoiUuDai] = useState<string | null>(null);
  const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<TaoDonHangMobileKetQua | null>(null);
  const lanDatHangRef = useRef<LanDatHang | null>(null);

  const addressQuery = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!addressQuery.data?.length) return;
    if (addressQuery.data.some((item) => item.id === diaChiDaChonId && thuocPhamViGiaoHangHungYen(item.tinhThanh))) return;
    const macDinhTrongPhamVi = addressQuery.data.find(
      (item) => item.macDinh && thuocPhamViGiaoHangHungYen(item.tinhThanh),
    );
    const dauTienTrongPhamVi = addressQuery.data.find((item) => thuocPhamViGiaoHangHungYen(item.tinhThanh));
    const fallback = macDinhTrongPhamVi ?? dauTienTrongPhamVi ?? null;
    setDiaChiDaChonId(fallback?.id ?? null);
  }, [addressQuery.data, diaChiDaChonId]);

  const diaChiDaChon = useMemo(
    () => addressQuery.data?.find((item) => item.id === diaChiDaChonId) ?? null,
    [addressQuery.data, diaChiDaChonId],
  );

  const previewQuery = useQuery({
    queryKey: [
      ...CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
      diaChiDaChonId ?? '',
      uuDaiApDung.maKhuyenMai ?? '',
      uuDaiApDung.diemSuDung ?? 0,
    ],
    queryFn: () => layCheckoutPreviewMobile({
      diaChiGiaoHangId: diaChiDaChonId ?? undefined,
      ...uuDaiApDung,
    }),
    enabled: daDangNhap && Boolean(diaChiDaChonId),
    staleTime: 0,
  });

  const khoaLuaChon = Boolean(donHangDaTao) || Boolean(lanDatHangRef.current) || false;

  function apDungUuDai() {
    if (khoaLuaChon || previewQuery.isFetching) return;
    const maKhuyenMai = maKhuyenMaiNhap.trim();
    const rawDiem = diemNhap.trim();
    const diem = rawDiem ? Number(rawDiem) : 0;
    if (!Number.isFinite(diem) || diem < 0 || !Number.isInteger(diem)) {
      setLoiUuDai('Điểm sử dụng phải là số nguyên không âm.');
      return;
    }
    setLoiUuDai(null);
    setUuDaiApDung({
      maKhuyenMai: maKhuyenMai || undefined,
      diemSuDung: diem > 0 ? diem : undefined,
    });
  }

  function boUuDai() {
    if (khoaLuaChon || previewQuery.isFetching) return;
    setMaKhuyenMaiNhap('');
    setDiemNhap('');
    setLoiUuDai(null);
    setUuDaiApDung({});
  }

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
      if (!preview || !diaChiDaChon) throw new Error('Checkout hoặc địa chỉ giao hàng chưa sẵn sàng.');
      if (!thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh)) {
        throw new Error(PHAM_VI_GIAO_HANG_AGRIMARKET.moTa);
      }
      if (!preview.total.coTheXacNhan) throw new Error(preview.total.lyDoKhongTheXacNhan[0] ?? 'Checkout hiện không đủ điều kiện xác nhận.');

      let lanDatHang = lanDatHangRef.current;
      if (!lanDatHang) {
        lanDatHang = {
          maYeuCauDonHang: Crypto.randomUUID(),
          maYeuCauThanhToan: Crypto.randomUUID(),
          diaChiGiaoHangId: diaChiDaChon.id,
          gioHangId: preview.gioHangId,
          phuongThuc,
          maKhuyenMai: uuDaiApDung.maKhuyenMai,
          diemSuDung: uuDaiApDung.diemSuDung,
        };
        lanDatHangRef.current = lanDatHang;
      }

      if (
        lanDatHang.gioHangId !== preview.gioHangId ||
        lanDatHang.diaChiGiaoHangId !== diaChiDaChon.id ||
        lanDatHang.phuongThuc !== phuongThuc ||
        (lanDatHang.maKhuyenMai ?? '') !== (uuDaiApDung.maKhuyenMai ?? '') ||
        (lanDatHang.diemSuDung ?? 0) !== (uuDaiApDung.diemSuDung ?? 0)
      ) {
        throw new Error('Checkout đã thay đổi sau khi bắt đầu đặt hàng. Vui lòng mở lại Checkout.');
      }

      let donHang = lanDatHang.donHang;
      if (!donHang) {
        donHang = await taoDonHangMobile(
          taoDuLieuDonHangTuPreview(
            preview,
            lanDatHang.diaChiGiaoHangId,
            lanDatHang.maYeuCauDonHang,
            { maKhuyenMai: lanDatHang.maKhuyenMai, diemSuDung: lanDatHang.diemSuDung },
          ),
        );
        lanDatHang.donHang = donHang;
        lanDatHangRef.current = lanDatHang;
        setDonHangDaTao(donHang);
      }

      const thanhToan = phuongThuc === 'COD'
        ? await taoThanhToanCodMobile(donHang.id, lanDatHang.maYeuCauThanhToan)
        : await taoThanhToanVnPaySandboxMobile(donHang.id, lanDatHang.maYeuCauThanhToan);

      return { donHang, thanhToan, phuongThuc };
    },
    onSuccess: async ({ donHang, thanhToan, phuongThuc: method }) => {
      setLoiDatHang(null);
      if (method === 'COD') {
        if (thanhToan.donHangId !== donHang.id || thanhToan.phuongThuc !== 'COD' || thanhToan.trangThai !== 'PENDING') {
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
        router.replace({ pathname: '/thanh-toan/ket-qua', params: { donHangId: donHang.id, maDonHang: donHang.maDonHang, trangThai: 'success' } });
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
      const browserResult = await WebBrowser.openAuthSessionAsync(thanhToan.paymentUrl, taoPaymentReturnUrl());
      if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
        setLoiDatHang('Bạn đã đóng VNPay trước khi ứng dụng nhận được kết quả. Có thể mở lại Payment hoặc kiểm tra đơn hàng.');
      }
    },
    onError: (error) => {
      setLoiDatHang(thongBaoLoiApi(error, donHangDaTao ? 'Đơn đã được tạo nhưng bước thanh toán chưa hoàn tất. Hãy thử lại với cùng Payment.' : 'Không thể tạo đơn hoặc Payment. Vui lòng thử lại.'));
    },
  });

  function Header() {
    return (
      <View className="flex-row items-center gap-3 border-b border-[#E7ECE9] bg-white px-5 py-3">
        <Pressable accessibilityRole="button" accessibilityLabel="Quay lại giỏ hàng" disabled={datHangMutation.isPending} onPress={() => quayLaiHoacVe(router, '/gio-hang')} className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F3F7F5]">
          <Ionicons name="chevron-back" size={29} color={PRIMARY} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-[25px] font-extrabold text-[#075E3B]">Thanh toán</Text>
          <Text className="text-[12px] text-[#7C8880]">Giá, ưu đãi và phạm vi giao hàng được Backend xác nhận</Text>
        </View>
      </View>
    );
  }

  if (trangThai === 'dang-khoi-phuc') {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 px-5 py-4"><CheckoutSkeleton /></View></SafeAreaView>;
  }
  if (!daDangNhap) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><EmptyState title="Đăng nhập để tiếp tục thanh toán" description="Checkout được đồng bộ theo tài khoản của bạn." actionLabel="Đăng nhập" onAction={() => moDangNhap(router, '/thanh-toan')} /></View></SafeAreaView>;
  }

  if (addressQuery.isPending || (diaChiDaChonId && previewQuery.isPending)) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}><CheckoutSkeleton /></ScrollView></SafeAreaView>;
  }
  if (addressQuery.isError || !addressQuery.data || (diaChiDaChonId && (previewQuery.isError || !previewQuery.data))) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><ErrorState title="Không tải được thông tin thanh toán" description="Không thể đọc checkout hoặc sổ địa chỉ hiện tại." actionLabel="Thử lại" onAction={() => void Promise.all([previewQuery.refetch(), addressQuery.refetch()])} /></View></SafeAreaView>;
  }

  const addresses = addressQuery.data;
  if (addresses.length === 0) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><EmptyState title="Chưa có địa chỉ giao hàng" description="Thêm địa chỉ trong tỉnh Hưng Yên trước khi xác nhận đơn." actionLabel="Thêm địa chỉ" onAction={() => router.push('/tai-khoan/dia-chi')} /></View></SafeAreaView>;
  }

  if (!diaChiDaChonId || !previewQuery.data) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 16 }}><View className="rounded-[20px] border border-[#F0D4A6] bg-[#FFF9EE] p-4"><Badge variant="warning">Chưa có địa chỉ phù hợp</Badge><Text className="mt-2 text-sm leading-5 text-[#6B604A]">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa} Hãy thêm hoặc sửa một địa chỉ giao hàng phù hợp.</Text></View>{addresses.map((item) => <DiaChiCard key={item.id} item={item} selected={false} disabled onPress={() => undefined} />)}<Pressable onPress={() => router.push('/tai-khoan/dia-chi')} className="min-h-12 items-center justify-center rounded-xl bg-primary"><Text className="font-extrabold text-white">Quản lý địa chỉ</Text></Pressable></ScrollView></SafeAreaView>;
  }

  const preview = previewQuery.data;
  if (preview.items.length === 0) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><EmptyState title="Giỏ hàng đang trống" description="Hãy thêm nông sản vào giỏ trước khi thanh toán." actionLabel="Về giỏ hàng" onAction={() => router.replace('/gio-hang')} /></View></SafeAreaView>;
  }

  const coDiaChi = diaChiDaChon !== null && thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh);
  const khoaSauKhiTaoDon = datHangMutation.isPending || donHangDaTao !== null;
  const coTheDatHang = coDiaChi && preview.total.coTheXacNhan && !datHangMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Header />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="gap-6">
          <View className="gap-3">
            <SectionTitle icon="location" title="Địa chỉ nhận hàng" />
            <View className="rounded-[16px] bg-[#F1FAF5] px-4 py-3"><Text className="text-[12px] leading-5 text-[#47705B]">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}</Text></View>
            <View accessibilityRole="radiogroup" className="gap-3">
              {addresses.map((item) => <DiaChiCard key={item.id} item={item} selected={item.id === diaChiDaChonId} disabled={khoaSauKhiTaoDon} onPress={() => setDiaChiDaChonId(item.id)} />)}
            </View>
          </View>

          <View className="gap-3"><SectionTitle icon="cart" title={`Sản phẩm (${preview.items.length})`} /><DanhSachSanPham preview={preview} /></View>

          <View className="gap-3">
            <SectionTitle icon="ticket-outline" title="Voucher và điểm thưởng" />
            <View className="gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
              <TextInput
                value={maKhuyenMaiNhap}
                onChangeText={setMaKhuyenMaiNhap}
                editable={!khoaSauKhiTaoDon}
                autoCapitalize="characters"
                placeholder="Nhập mã khuyến mãi"
                className="min-h-12 rounded-xl border border-[#DCE7DF] px-4 text-[15px] text-[#263129]"
              />
              <TextInput
                value={diemNhap}
                onChangeText={setDiemNhap}
                editable={!khoaSauKhiTaoDon}
                keyboardType="number-pad"
                placeholder="Số điểm muốn dùng"
                className="min-h-12 rounded-xl border border-[#DCE7DF] px-4 text-[15px] text-[#263129]"
              />
              {loiUuDai ? <Text className="text-[12px] text-[#C93445]">{loiUuDai}</Text> : null}
              <View className="flex-row gap-3">
                <Pressable disabled={khoaSauKhiTaoDon || previewQuery.isFetching} onPress={apDungUuDai} className="min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-3 disabled:opacity-50">
                  <Text className="font-extrabold text-white">{previewQuery.isFetching ? 'Đang tính…' : 'Áp dụng'}</Text>
                </Pressable>
                <Pressable disabled={khoaSauKhiTaoDon || previewQuery.isFetching} onPress={boUuDai} className="min-h-11 items-center justify-center rounded-xl border border-[#CBD7CF] px-4 disabled:opacity-50">
                  <Text className="font-bold text-[#56645B]">Bỏ ưu đãi</Text>
                </Pressable>
              </View>
              <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
              <View className="h-px bg-[#EEF2EF]" />
              <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
            </View>
          </View>

          <View className="gap-3"><SectionTitle icon="card-outline" title="Phương thức thanh toán" /><View accessibilityRole="radiogroup" className="flex-row gap-3"><PhuongThucCard value="COD" selected={phuongThuc === 'COD'} disabled={khoaSauKhiTaoDon} onPress={() => setPhuongThuc('COD')} /><PhuongThucCard value="VNPAY_SANDBOX" selected={phuongThuc === 'VNPAY_SANDBOX'} disabled={khoaSauKhiTaoDon} onPress={() => setPhuongThuc('VNPAY_SANDBOX')} /></View></View>

          <View className="gap-4 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
            <SectionTitle icon="document-text-outline" title="Tóm tắt đơn hàng" />
            <View className="flex-row justify-between"><Text className="text-[14px] text-[#56645B]">Tạm tính</Text><Text className="font-bold text-[#263129]">{dinhDangGia(preview.price.tamTinhHangHoa)}</Text></View>
            <ThanhPhanRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
            <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
            <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
            <View className="h-px bg-[#E3E9E5]" />
            <View className="flex-row items-end justify-between gap-3"><Text className="text-[20px] font-extrabold text-[#17251C]">Tổng cộng</Text><Text className="text-[27px] font-extrabold text-[#087A4B]">{preview.total.tongThanhToan === null ? 'Chưa xác định' : dinhDangGia(preview.total.tongThanhToan)}</Text></View>
          </View>

          {!preview.total.coTheXacNhan ? <View className="gap-2 rounded-[18px] border border-[#F0D4A6] bg-[#FFF9EE] p-4"><Badge variant="warning">Chưa thể xác nhận</Badge>{preview.total.lyDoKhongTheXacNhan.map((reason) => <Text key={reason} className="text-sm leading-5 text-[#6B604A]">• {reason}</Text>)}</View> : null}
          {donHangDaTao ? <View className="gap-2 rounded-[18px] border border-[#F0D4A6] bg-[#FFF9EE] p-4"><Badge variant="warning">Đơn đã được tạo</Badge><Text className="font-extrabold text-[#263129]">{donHangDaTao.maDonHang}</Text><Text className="text-sm text-[#6B604A]">Nếu Payment lỗi, lần thử lại giữ nguyên Order và idempotency key.</Text></View> : null}
          {loiDatHang ? <View className="rounded-[18px] border border-[#F0C8C8] bg-[#FFF8F8] p-4"><Text className="text-sm leading-5 text-[#C93445]">{loiDatHang}</Text></View> : null}

          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !coTheDatHang, busy: datHangMutation.isPending }} disabled={!coTheDatHang} onPress={() => { setLoiDatHang(null); datHangMutation.mutate(); }} className={['min-h-[58px] items-center justify-center rounded-[20px] px-4', coTheDatHang ? 'bg-primary active:opacity-80' : 'bg-[#D6DED9]'].join(' ')}>
            <Text className={coTheDatHang ? 'text-[18px] font-extrabold text-white' : 'text-[18px] font-extrabold text-[#8C9690]'}>{datHangMutation.isPending ? 'Đang xử lý…' : donHangDaTao ? 'Thử lại Payment' : phuongThuc === 'COD' ? 'Đặt hàng' : 'Thanh toán qua VNPay'}</Text>
          </Pressable>

          <Pressable disabled={previewQuery.isFetching || addressQuery.isFetching || Boolean(lanDatHangRef.current)} onPress={() => void Promise.all([previewQuery.refetch(), addressQuery.refetch()])} className="items-center disabled:opacity-40"><Text className="text-[12px] font-semibold text-[#708078]">Làm mới giá, tồn kho và phạm vi giao hàng</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
