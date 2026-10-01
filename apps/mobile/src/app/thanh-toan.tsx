import {
  metaThanhPhanCheckout,
  PHAM_VI_GIAO_HANG_AGRIMARKET,
  thuocPhamViGiaoHangHungYen,
  THUONG_HIEU_AGRIMARKET, dinhDangGiaVND } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import {
  type ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
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
  KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY,
  type KhuyenMaiKhachHang,
  layKhuyenMaiDaLuuMobile,
} from '@/lib/api-khuyen-mai-mobile';
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
import { chuanHoaTenDiaBanMobile } from '@/lib/dia-ban-chuan-hoa';
import { moTabChinh, quayLaiHoacVe } from '@/lib/navigation-mobile';
import { taoPaymentReturnUrl } from '@/lib/payment-return';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

// Lấy từ brand token dùng chung (packages/api-client/domain-ui) để đổi màu
// thương hiệu chỉ sửa một chỗ. Trước đây 19 file hard-code '#087A4B'.
const PRIMARY = THUONG_HIEU_AGRIMARKET.primary;
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

// Dùng helper dùng chung của @agrimarket/api-client để quy tắc làm tròn
// và định dạng vi-VN chỉ có một nơi định nghĩa.
const dinhDangGia = (value: number): string => `${dinhDangGiaVND(value)}đ`;

/**
 * Formatter SỐ LƯỢNG/ĐIỂM — KHÔNG gắn "đ".
 *
 * `dinhDangGia` chỉ dùng cho TIỀN. Dùng nhầm cho điểm sẽ sinh ra UI sai kiểu
 * "100đ điểm". Đơn vị ("điểm") nằm sẵn trong câu, nên formatter chỉ trả về số.
 * Khớp với Customer Web: `dinhDangGia` ở Web cũng không tự thêm ký hiệu tiền.
 */
function dinhDangSo(value: number): string {
  return Math.round(value).toLocaleString('vi-VN');
}

function giaTriThanhPhan(thanhPhan: ThanhPhanCheckoutMobile): string {
  const meta = metaThanhPhanCheckout(thanhPhan);
  if (!meta.hienThiGiaTri) return meta.label;
  return dinhDangGia(thanhPhan.giaTri ?? 0);
}

function dinhDangDiaChi(item: DiaChiTaiKhoanMobile): string {
  // Phải khớp `tai-khoan/dia-chi.tsx` và Customer Web `checkout-content.tsx`:
  // form địa chỉ ghi `tenXaPhuong` + `tenThonToDanPho`, đọc `phuongXa`/
  // `quanHuyen`/`maBuuChinh` (field legacy) làm mất thôn/TDP người dùng vừa chọn.
  return [item.dongDiaChi, item.tenThonToDanPho, item.tenXaPhuong ?? item.phuongXa, item.tinhThanh]
    .filter(Boolean)
    .join(', ');
}

function CheckoutSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton height={110} borderRadius={14} />
      <Skeleton height={210} borderRadius={14} />
      <Skeleton height={150} borderRadius={14} />
      <Skeleton height={170} borderRadius={14} />
    </View>
  );
}

/**
 * Tiêu đề section — icon nhỏ cạnh chữ, không dùng ô vuông 40x40 cho từng block
 * (Customer Web cũng chỉ dùng icon 18px cạnh title).
 */
function SectionTitle({ icon, title, action }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; action?: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Ionicons name={icon} size={18} color={PRIMARY} />
        <Text numberOfLines={1} className="text-[17px] font-extrabold text-[#202A24]">{title}</Text>
      </View>
      {action}
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
    <View className="h-[64px] w-[64px] overflow-hidden rounded-xl bg-[#EAF5EE]">
      {uri && !loiAnh ? (
        <Image
          source={{ uri }}
          cachePolicy="memory-disk"
          recyclingKey={uri}
          contentFit="cover"
          transition={120}
          accessibilityLabel={`Ảnh ${ten}`}
          onError={() => setLoiAnh(true)}
          style={{ width: 64, height: 64 }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Ionicons name="leaf-outline" size={28} color={PRIMARY} />
        </View>
      )}
    </View>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewMobile }) {
  const router = useRouter();
  return (
    <View className="overflow-hidden rounded-[12px] border border-[#E1E8E3] bg-white">
      {preview.items.map((item, index) => (
        <View key={item.mucGioHangId} className={['flex-row items-center gap-3 p-3.5', index > 0 ? 'border-t border-[#EEF2EF]' : ''].join(' ')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Xem ${item.tenSanPham}`}
            onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: item.sanPhamId } })}
          >
            <AnhSanPhamCheckout url={item.anhBiaUrl} ten={item.tenSanPham} />
          </Pressable>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text numberOfLines={2} className="text-[15px] font-bold text-[#202A24]">{item.tenSanPham}</Text>
            <Text numberOfLines={1} className="text-[12px] text-[#7C8880]">{item.nhaCungCap.ten}</Text>
            <Text className="text-[13px] font-semibold text-[#5F6D64]">{dinhDangGia(item.donGia)} × {item.soLuong}</Text>
            {!item.coTheDatHang ? <Text className="text-[11px] font-semibold text-[#D6454F]">Không đủ tồn kho</Text> : null}
          </View>
          <Text className="text-[15px] font-extrabold text-[#075E3B]">{dinhDangGia(item.thanhTien)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Mô tả điều kiện tối thiểu của voucher, hiển thị ngắn gọn. */
function dieuKienVoucher(voucher: KhuyenMaiKhachHang): string {
  const parts: string[] = [];
  if (voucher.donHangToiThieu > 0) {
    parts.push(`Đơn tối thiểu ${dinhDangGia(voucher.donHangToiThieu)}`);
  }
  if (voucher.ketThucLuc) {
    parts.push(`Hết hạn ${voucher.ketThucLuc.slice(0, 10)}`);
  }
  return parts.join(' · ');
}

/**
 * Selector voucher full-screen, đặt trong MỘT `Modal` của màn hình chủ.
 * Bám đúng bài học trong `selectable-picker.tsx`: không bottom sheet, không
 * nested Modal (nested Modal làm nền tối lọt ra và nút Back bắt nhầm tầng).
 * Danh sách dùng `FlatList` để không map toàn bộ.
 *
 * Phân biệt 3 trạng thái (như Customer Web):
 *   đang tải → skeleton · lỗi API → "Không tải được ví voucher" + Thử lại ·
 *   tải OK nhưng rỗng → "Ví voucher đang trống".
 * Lỗi mạng KHÔNG BAO GIỜ được hiển thị như ví rỗng.
 */
function BoChonVoucher({
  danhSach,
  dangChon,
  dangTai,
  loi,
  onThuLai,
  onChon,
  onXemKhuyenMai,
  onDong,
}: {
  danhSach: KhuyenMaiKhachHang[];
  dangChon?: string;
  dangTai: boolean;
  loi: boolean;
  onThuLai: () => void;
  onChon: (ma: string) => void;
  onXemKhuyenMai: () => void;
  onDong: () => void;
}) {
  const [tuKhoa, setTuKhoa] = useState('');

  const ketQuaLoc = useMemo(() => {
    const chuanHoa = chuanHoaTenDiaBanMobile(tuKhoa);
    if (!chuanHoa) return danhSach;
    return danhSach.filter((voucher) => {
      const ten = chuanHoaTenDiaBanMobile(voucher.ten);
      const ma = chuanHoaTenDiaBanMobile(voucher.ma);
      return ten.includes(chuanHoa) || ma.includes(chuanHoa);
    });
  }, [danhSach, tuKhoa]);

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">
      {/*
        Header chuẩn commerce: nút Back TÁCH RIÊNG (chỉ icon, 44x44), title là
        văn bản tĩnh KHÔNG clickable. Không bọc "← Chọn voucher" trong cùng một
        Pressable — nếu không, Expo Web sinh focus ring/outline đen bao quanh
        cả cụm và sai hierarchy.
      */}
      <View className="min-h-[56px] flex-row items-center gap-3 border-b border-[#E7ECE9] bg-white px-3 py-1.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={onDong}
          hitSlop={8}
          style={{ minWidth: 44, minHeight: 44 }}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-[#F3F7F5] active:opacity-70"
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </Pressable>
        <Text numberOfLines={1} className="min-w-0 flex-1 text-[18px] font-extrabold text-[#111827]">
          Chọn voucher
        </Text>
      </View>

      {danhSach.length > 1 && !loi ? (
        <View className="border-b border-[#F3F4F6] px-4 pb-3 pt-2">
          <View className="min-h-[44px] flex-row items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3">
            <Ionicons name="search-outline" size={17} color="#9CA3AF" />
            <TextInput
              value={tuKhoa}
              onChangeText={setTuKhoa}
              placeholder="Tìm theo tên hoặc mã voucher"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Tìm theo tên hoặc mã voucher"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              className="min-h-[44px] flex-1 text-[15px] text-[#111827]"
            />
          </View>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {dangTai ? (
          <View className="gap-2 p-4">
            <Skeleton height={72} borderRadius={12} />
            <Skeleton height={72} borderRadius={12} />
          </View>
        ) : loi ? (
          // Lỗi API ≠ ví rỗng. Không được hiển thị "Ví voucher đang trống".
          <View className="px-4 py-6">
            <ErrorState
              title="Không tải được ví voucher"
              description="Hãy kiểm tra kết nối và thử lại."
              actionLabel="Thử lại"
              onAction={onThuLai}
            />
          </View>
        ) : danhSach.length === 0 ? (
          // Tải OK nhưng ví rỗng: căn giữa theo trục dọc, có padding đáy
          // để optical center đẹp (Android status/nav bar).
          <View className="flex-1 items-center justify-center px-6 pb-20">
            <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-[#E6F4EC]">
              <Ionicons name="ticket-outline" size={40} color={PRIMARY} />
            </View>
            <Text className="mt-4 text-center text-[17px] font-extrabold text-[#16211A]">
              Ví voucher đang trống
            </Text>
            <Text className="mt-2 max-w-[320px] text-center text-[13.5px] leading-5 text-[#6F7B74]">
              Bạn chưa lưu voucher nào. Hãy chọn voucher tại trang Khuyến mãi để sử dụng khi thanh toán.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xem khuyến mãi"
              onPress={onXemKhuyenMai}
              className="mt-5 min-h-[48px] min-w-[176px] items-center justify-center rounded-[10px] bg-[#087A4B] px-6 active:opacity-85"
            >
              <Text className="text-[15px] font-bold text-white">Xem khuyến mãi</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={ketQuaLoc}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            ListHeaderComponent={
              <Text className="pb-2 text-[12px] font-semibold text-[#7C8880]">Voucher đã lưu</Text>
            }
            ListEmptyComponent={
              // Chỉ tới được khi danh sách CÓ voucher nhưng tìm không khớp.
              <Text className="px-4 py-10 text-center text-[13px] text-[#6B7A71]">
                Không tìm thấy voucher phù hợp với từ khoá.
              </Text>
            }
            renderItem={({ item }) => {
              const daChon = item.ma === dangChon;
              const dieuKien = dieuKienVoucher(item);
              return (
                <View
                  className={[
                    'mb-2 gap-2 rounded-[12px] border p-3.5',
                    daChon ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white',
                  ].join(' ')}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-[15px] font-extrabold text-[#202A24]">
                        {item.ten}
                      </Text>
                      <View className="mt-1 flex-row flex-wrap items-center gap-2">
                        <Badge variant="success">{item.ma}</Badge>
                        <Text className="text-[13px] font-bold text-[#087A4B]">
                          Giảm {dinhDangGia(item.giaTriGiam)}
                        </Text>
                      </View>
                      {dieuKien ? (
                        <Text className="mt-1 text-[11px] leading-4 text-[#7C8880]">{dieuKien}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn voucher ${item.ma}`}
                      accessibilityState={{ selected: daChon }}
                      onPress={() => onChon(item.ma)}
                      className="min-h-[44px] min-w-[72px] items-center justify-center rounded-xl border border-primary bg-white px-3 active:opacity-80"
                    >
                      <Text className="text-[14px] font-extrabold text-[#087A4B]">Chọn</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Bật/tắt dùng điểm tối đa — không cho nhập tay số điểm. */
function CongDungDiem({
  diemDangDung,
  diemToiDaCoTheSuDung,
  dangDung,
  khoa,
  onDoi,
}: {
  diemDangDung: number;
  diemToiDaCoTheSuDung: number;
  dangDung: boolean;
  khoa: boolean;
  onDoi: (dung: boolean) => void;
}) {
  const khongDungDuoc = khoa || diemToiDaCoTheSuDung <= 0;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: dangDung, disabled: khongDungDuoc }}
      accessibilityLabel={
        dangDung ? `Đang dùng ${dinhDangSo(diemDangDung)} điểm` : 'Dùng điểm tối đa'
      }
      disabled={khongDungDuoc}
      onPress={() => onDoi(!dangDung)}
      className={['min-h-[44px] flex-row items-center justify-center rounded-xl px-3', khongDungDuoc ? 'bg-[#EEF2EF]' : 'active:opacity-80'].join(' ')}
      style={khongDungDuoc ? undefined : { backgroundColor: '#EAF5EE' }}
    >
      <View
        className={['h-6 w-10 justify-center rounded-full px-0.5', dangDung ? 'bg-primary' : 'bg-[#C6CFC9]'].join(' ')}
      >
        <View
          className={['h-5 w-5 rounded-full bg-white', dangDung ? 'self-end' : 'self-start'].join(' ')}
        />
      </View>
      <Text
        className={[
          'ml-2 text-[14px] font-extrabold',
          khongDungDuoc ? 'text-[#98A29C]' : 'text-[#075E3B]',
        ].join(' ')}
      >
        {dangDung ? `Đang dùng ${dinhDangSo(diemDangDung)} điểm` : 'Dùng điểm tối đa'}
      </Text>
    </Pressable>
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
      className={['rounded-[12px] border p-3.5', selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white', biKhoa ? 'opacity-60' : 'active:opacity-80'].join(' ')}
    >
      <View className="flex-row items-start gap-3">
        <View className={selected ? 'mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-primary' : 'mt-0.5 h-6 w-6 rounded-full border-2 border-[#B8C2BC]'}>
          {selected ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[15px] font-extrabold text-[#202A24]">{item.tenNguoiNhan}</Text>
            {item.macDinh ? <Badge variant="success">Mặc định</Badge> : null}
            {trongPhamVi ? <Badge variant="success">Có thể giao</Badge> : <Badge variant="warning">Ngoài khu vực</Badge>}
          </View>
          <Text className="mt-1 text-[13px] text-[#56645B]">{item.soDienThoai}</Text>
          <Text className="mt-0.5 text-[13px] leading-5 text-[#69766E]">{dinhDangDiaChi(item)}</Text>
          {!trongPhamVi ? <Text className="mt-2 text-[12px] font-semibold text-[#C93445]">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

function PhuongThucCard({ value, selected, disabled, onPress }: { value: PhuongThucCheckout; selected: boolean; disabled: boolean; onPress: () => void }) {
  const online = value === 'VNPAY_SANDBOX';
  // Wording giống hệt Customer Web (Web là source of truth nghiệp vụ).
  const tieuDe = online ? 'VNPay Sandbox' : 'Thanh toán khi nhận hàng';
  const moTa = online
    ? 'Chuyển sang cổng thanh toán thử nghiệm để hoàn tất giao dịch.'
    : 'Thanh toán cho đơn hàng khi bạn nhận hàng.';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={`${tieuDe}. ${moTa}`}
      disabled={disabled}
      onPress={onPress}
      className={[
        'min-h-[92px] flex-1 gap-1.5 rounded-[12px] border p-3.5',
        selected ? 'border-primary bg-[#F1FAF5]' : 'border-[#E1E8E3] bg-white',
        disabled ? 'opacity-60' : 'active:opacity-80',
      ].join(' ')}
    >
      <View className="flex-row items-center gap-2">
        <View
          className={[
            'h-5 w-5 items-center justify-center rounded-full border-2',
            selected ? 'border-primary bg-primary' : 'border-[#B8C2BC]',
          ].join(' ')}
        >
          {selected ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
        </View>
        <Ionicons name={online ? 'card-outline' : 'cash-outline'} size={18} color={selected ? PRIMARY : '#536158'} />
      </View>
      <Text numberOfLines={2} className="text-[14px] font-extrabold text-[#263129]">{tieuDe}</Text>
      <Text className="text-[12px] leading-4 text-[#7C8880]">{moTa}</Text>
      {online ? <Text className="text-[11px] font-extrabold text-[#B26A00]">MÔI TRƯỜNG THỬ NGHIỆM</Text> : null}
    </Pressable>
  );
}

export default function TrangThanhToan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThai === 'da-dang-nhap';
  const { width } = useWindowDimensions();

  const [diaChiDaChonId, setDiaChiDaChonId] = useState<string | null>(null);
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucCheckout>('COD');
  const [uuDaiApDung, setUuDaiApDung] = useState<UuDaiCheckout>({});
  const [moBoChonVoucher, setMoBoChonVoucher] = useState(false);
  const [loiDatHang, setLoiDatHang] = useState<string | null>(null);
  const [donHangDaTao, setDonHangDaTao] = useState<TaoDonHangMobileKetQua | null>(null);
  const lanDatHangRef = useRef<LanDatHang | null>(null);

  const addressQuery = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  // Voucher lấy từ ví đã lưu — KHÔNG cho nhập mã tay, giống Customer Web.
  const voucherDaLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuMobile,
    enabled: daDangNhap,
    staleTime: 15_000,
    retry: 1,
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

  // Đổi voucher thì bỏ điểm tạm thời để hệ thống tính lại mức điểm tối đa
  // theo đúng tổng tiền sau khuyến mãi (cùng luật với Customer Web).
  function chonVoucher(maKhuyenMai: string) {
    if (khoaLuaChon || previewQuery.isFetching) return;
    setUuDaiApDung({ maKhuyenMai, diemSuDung: undefined });
    setMoBoChonVoucher(false);
  }

  // Không nhập tay số điểm: chỉ bật/tắt dùng mức tối đa do hệ thống trả về.
  function doiDungDiem(dung: boolean) {
    if (khoaLuaChon || previewQuery.isFetching) return;
    const diemToiDaCoTheSuDung = previewQuery.data?.loyalty.diemToiDaCoTheSuDung ?? 0;
    setUuDaiApDung((current) => ({
      ...current,
      diemSuDung: dung && diemToiDaCoTheSuDung > 0 ? diemToiDaCoTheSuDung : undefined,
    }));
  }

  function boUuDai() {
    if (khoaLuaChon || previewQuery.isFetching) return;
    setUuDaiApDung({});
    setMoBoChonVoucher(false);
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
          setLoiDatHang('Thanh toán khi nhận hàng chưa hoàn tất. Vui lòng thử lại hoặc kiểm tra đơn hàng.');
          return;
        }
        lanDatHangRef.current = null;
        setDonHangDaTao(null);
        await invalidateSauDatHang();
        router.replace({ pathname: '/don-hang/[id]', params: { id: donHang.id } });
        return;
      }

      if (thanhToan.donHangId !== donHang.id) {
        setLoiDatHang('Giao dịch thanh toán không khớp với đơn hàng vừa tạo.');
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
        setLoiDatHang('Chưa nhận được liên kết thanh toán hợp lệ. Vui lòng thử lại.');
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
          <Text className="text-[23px] font-extrabold text-[#075E3B]">Thanh toán</Text>
          {/* Không dùng từ kỹ thuật (Backend/API) trong copy khách thấy. */}
          <Text className="text-[12px] text-[#7C8880]">Kiểm tra thông tin trước khi đặt hàng</Text>
        </View>
      </View>
    );
  }

  if (trangThai === 'dang-khoi-phuc') {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 px-5 py-4"><CheckoutSkeleton /></View></SafeAreaView>;
  }
  if (!daDangNhap) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><EmptyState icon="wallet-outline" title="Bạn chưa đăng nhập" description="Đăng nhập để tiếp tục thanh toán an toàn trên mọi thiết bị." actionLabel="Đăng nhập" onAction={() => moDangNhap(router, '/thanh-toan')} secondaryActionLabel="Xem nông sản trước" onSecondaryAction={() => moTabChinh(router, '/kham-pha')} /></View></SafeAreaView>;
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
    return <SafeAreaView className="flex-1 bg-white"><Header /><ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 16 }}><View className="rounded-[14px] border border-[#F0D4A6] bg-[#FFF9EE] p-4"><Badge variant="warning">Chưa có địa chỉ phù hợp</Badge><Text className="mt-2 text-sm leading-5 text-[#6B604A]">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa} Hãy thêm hoặc sửa một địa chỉ giao hàng phù hợp.</Text></View>{addresses.map((item) => <DiaChiCard key={item.id} item={item} selected={false} disabled onPress={() => undefined} />)}<Pressable accessibilityRole="button" accessibilityLabel="Quản lý địa chỉ" onPress={() => router.push('/tai-khoan/dia-chi')} className="min-h-12 items-center justify-center rounded-xl bg-primary"><Text className="font-extrabold text-white">Quản lý địa chỉ</Text></Pressable></ScrollView></SafeAreaView>;
  }

  const preview = previewQuery.data;
  if (preview.items.length === 0) {
    return <SafeAreaView className="flex-1 bg-white"><Header /><View className="flex-1 justify-center px-5"><EmptyState title="Giỏ hàng đang trống" description="Hãy thêm nông sản vào giỏ trước khi thanh toán." actionLabel="Về giỏ hàng" onAction={() => router.replace('/gio-hang')} /></View></SafeAreaView>;
  }

  const coDiaChi = diaChiDaChon !== null && thuocPhamViGiaoHangHungYen(diaChiDaChon.tinhThanh);
  const khoaSauKhiTaoDon = datHangMutation.isPending || donHangDaTao !== null;
  const coTheDatHang = coDiaChi && preview.total.coTheXacNhan && !datHangMutation.isPending;

  const soDuDiem = preview.loyalty.soDuDiem;
  const diemToiDaCoTheSuDung = preview.loyalty.diemToiDaCoTheSuDung;
  const dangDungDiem = (uuDaiApDung.diemSuDung ?? 0) > 0;

  const danhSachVoucher = voucherDaLuuQuery.data ?? [];
  const voucherDangChon = uuDaiApDung.maKhuyenMai
    ? danhSachVoucher.find((voucher) => voucher.ma === uuDaiApDung.maKhuyenMai)
    : undefined;
  const dangCoUuDai = Boolean(uuDaiApDung.maKhuyenMai) || dangDungDiem;

  // 2 cột khi đủ rộng, 1 cột trên máy hẹp để chữ không bị bóp.
  const haiCotThanhToan = width >= 400;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <Header />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="gap-5">
          <View className="gap-3">
            <SectionTitle
              icon="location"
              title="Địa chỉ nhận hàng"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quản lý địa chỉ"
                  disabled={khoaSauKhiTaoDon}
                  onPress={() => router.push('/tai-khoan/dia-chi')}
                  hitSlop={8}
                  className="min-h-[44px] justify-center"
                >
                  <Text className="text-[13px] font-extrabold text-[#087A4B]">Quản lý</Text>
                </Pressable>
              }
            />
            <View accessibilityRole="radiogroup" className="gap-2.5">
              {addresses.map((item) => <DiaChiCard key={item.id} item={item} selected={item.id === diaChiDaChonId} disabled={khoaSauKhiTaoDon} onPress={() => setDiaChiDaChonId(item.id)} />)}
            </View>
            <View className="flex-row items-start gap-2 rounded-[12px] bg-[#F1FAF5] px-3.5 py-2.5">
              <Ionicons name="car-outline" size={15} color={PRIMARY} />
              <Text className="flex-1 text-[12px] leading-5 text-[#47705B]">{PHAM_VI_GIAO_HANG_AGRIMARKET.moTa}</Text>
            </View>
          </View>

          <View className="gap-3">
            <SectionTitle icon="cart" title={`Sản phẩm (${preview.items.length})`} />
            <DanhSachSanPham preview={preview} />
          </View>

          {/* Voucher lấy từ ví đã lưu + điểm thưởng bật/tắt mức tối đa. */}
          <View className="gap-3">
            <SectionTitle icon="ticket-outline" title="Voucher và điểm thưởng" />

            <View className="gap-2.5 rounded-[12px] border border-[#E1E8E3] bg-white p-3.5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-[14px] font-extrabold text-[#202A24]">Voucher AgriMarket</Text>
                  <Text className="mt-0.5 text-[12px] leading-4 text-[#7C8880]">
                    Chỉ sử dụng voucher đã lưu trong tài khoản.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Chọn voucher"
                  accessibilityState={{ disabled: khoaSauKhiTaoDon || previewQuery.isFetching }}
                  disabled={khoaSauKhiTaoDon || previewQuery.isFetching}
                  onPress={() => setMoBoChonVoucher(true)}
                  className="min-h-[44px] min-w-[104px] items-center justify-center rounded-xl border border-[#CDE4D5] bg-[#F1FAF5] px-3 active:opacity-80 disabled:opacity-40"
                >
                  <Text className="text-[14px] font-extrabold text-[#087A4B]">Chọn voucher</Text>
                </Pressable>
              </View>

              {voucherDaLuuQuery.isError ? (
                <Text className="text-[12px] text-[#C93445]">Không tải được ví voucher. Bạn vẫn có thể thanh toán không voucher.</Text>
              ) : null}

              {voucherDangChon ? (
                <View className="gap-2 rounded-[12px] border border-[#CDE4D5] bg-[#F7FAF8] p-3">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <Text numberOfLines={1} className="text-[14px] font-extrabold text-[#202A24]">{voucherDangChon.ten}</Text>
                      <View className="mt-1 flex-row flex-wrap items-center gap-2">
                        <Badge variant="success">{voucherDangChon.ma}</Badge>
                        <Text className="text-[12px] font-bold text-[#087A4B]">Giảm {dinhDangGia(voucherDangChon.giaTriGiam)}</Text>
                      </View>
                    </View>
                  </View>
                  {dieuKienVoucher(voucherDangChon) ? (
                    <Text className="text-[11px] leading-4 text-[#7C8880]">{dieuKienVoucher(voucherDangChon)}</Text>
                  ) : null}
                  <View className="flex-row gap-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Đổi voucher"
                      disabled={khoaSauKhiTaoDon || previewQuery.isFetching}
                      onPress={() => setMoBoChonVoucher(true)}
                      className="min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#CBD7CF] active:opacity-80 disabled:opacity-40"
                    >
                      <Text className="text-[14px] font-bold text-[#56645B]">Đổi</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Bỏ voucher"
                      disabled={khoaSauKhiTaoDon || previewQuery.isFetching}
                      onPress={boUuDai}
                      className="min-h-[44px] flex-1 items-center justify-center rounded-xl border border-[#CBD7CF] active:opacity-80 disabled:opacity-40"
                    >
                      <Text className="text-[14px] font-bold text-[#C93445]">Bỏ</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            <View className="gap-2.5 rounded-[12px] border border-[#E1E8E3] bg-white p-3.5">
              <View className="flex-row items-start gap-2">
                <Ionicons name="wallet-outline" size={17} color="#B26A00" />
                <View className="min-w-0 flex-1">
                  <Text className="text-[14px] font-extrabold text-[#202A24]">Điểm thưởng</Text>
                  <Text className="mt-0.5 text-[12px] leading-4 text-[#7C8880]">
                    {soDuDiem > 0
                      ? `Bạn có ${dinhDangSo(soDuDiem)} điểm. Có thể dùng tối đa ${dinhDangSo(diemToiDaCoTheSuDung)} điểm cho đơn này.`
                      : 'Bạn chưa có điểm thưởng để dùng cho đơn này.'}
                  </Text>
                </View>
              </View>
              <CongDungDiem
                diemDangDung={uuDaiApDung.diemSuDung ?? 0}
                diemToiDaCoTheSuDung={diemToiDaCoTheSuDung}
                dangDung={dangDungDiem}
                khoa={khoaSauKhiTaoDon || previewQuery.isFetching}
                onDoi={doiDungDiem}
              />
            </View>

            {dangCoUuDai ? (
              <View className="gap-1.5 rounded-[12px] border border-[#E1E8E3] bg-white p-3.5">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
                    <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Bỏ ưu đãi"
                    disabled={khoaSauKhiTaoDon || previewQuery.isFetching}
                    onPress={boUuDai}
                    hitSlop={8}
                    className="min-h-[44px] justify-center disabled:opacity-40"
                  >
                    <Text className="text-[13px] font-bold text-[#56645B]">Bỏ ưu đãi</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <View className="gap-3">
            <SectionTitle icon="card-outline" title="Phương thức thanh toán" />
            <View
              accessibilityRole="radiogroup"
              className={haiCotThanhToan ? 'flex-row gap-3' : 'gap-2.5'}
            >
              <PhuongThucCard value="COD" selected={phuongThuc === 'COD'} disabled={khoaSauKhiTaoDon} onPress={() => setPhuongThuc('COD')} />
              <PhuongThucCard value="VNPAY_SANDBOX" selected={phuongThuc === 'VNPAY_SANDBOX'} disabled={khoaSauKhiTaoDon} onPress={() => setPhuongThuc('VNPAY_SANDBOX')} />
            </View>
          </View>

          <View className="gap-3 rounded-[14px] border border-[#E1E8E3] bg-white p-4">
            <SectionTitle icon="document-text-outline" title="Tóm tắt đơn hàng" />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-[13px] text-[#6B7A71]">Tạm tính</Text>
              <Text className="text-[14px] font-extrabold text-[#263129]">{dinhDangGia(preview.price.tamTinhHangHoa)}</Text>
            </View>
            <ThanhPhanRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
            <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} laKhoanGiam />
            <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} laKhoanGiam />
            <View className="h-px bg-[#E3E9E5]" />
            <View className="flex-row items-end justify-between gap-3">
              <Text className="text-[15px] font-extrabold text-[#17251C]">Tổng thanh toán</Text>
              <Text className="text-[20px] font-extrabold text-[#075E3B]">
                {preview.total.tongThanhToan === null ? 'Chưa xác định' : dinhDangGia(preview.total.tongThanhToan)}
              </Text>
            </View>
          </View>

          {!preview.total.coTheXacNhan ? <View className="gap-2 rounded-[14px] border border-[#F0D4A6] bg-[#FFF9EE] p-4"><Badge variant="warning">Chưa thể xác nhận</Badge>{preview.total.lyDoKhongTheXacNhan.map((reason) => <Text key={reason} className="text-sm leading-5 text-[#6B604A]">• {reason}</Text>)}</View> : null}
          {donHangDaTao ? (
            <View className="gap-1.5 rounded-[14px] border border-[#F0D4A6] bg-[#FFF9EE] p-4">
              <Badge variant="warning">Đơn hàng đã được tạo</Badge>
              <Text className="font-extrabold text-[#263129]">{donHangDaTao.maDonHang}</Text>
              <Text className="text-[13px] leading-5 text-[#6B604A]">Bước thanh toán chưa hoàn tất. Bạn có thể thử lại thanh toán mà không tạo đơn mới.</Text>
            </View>
          ) : null}
          {loiDatHang ? <View className="rounded-[14px] border border-[#F0C8C8] bg-[#FFF8F8] p-4"><Text className="text-sm leading-5 text-[#C93445]">{loiDatHang}</Text></View> : null}

          <Pressable accessibilityRole="button" accessibilityState={{ disabled: !coTheDatHang, busy: datHangMutation.isPending }} disabled={!coTheDatHang} onPress={() => { setLoiDatHang(null); datHangMutation.mutate(); }} className={['min-h-[54px] items-center justify-center rounded-xl px-4', coTheDatHang ? 'bg-primary active:opacity-80' : 'bg-[#D6DED9]'].join(' ')}>
            <Text className={coTheDatHang ? 'text-[17px] font-extrabold text-white' : 'text-[17px] font-extrabold text-[#8C9690]'}>{datHangMutation.isPending ? 'Đang xử lý…' : donHangDaTao ? 'Thử lại thanh toán' : phuongThuc === 'COD' ? 'Đặt hàng' : 'Thanh toán qua VNPay'}</Text>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Làm mới giá và tồn kho" disabled={previewQuery.isFetching || addressQuery.isFetching || Boolean(lanDatHangRef.current)} onPress={() => void Promise.all([previewQuery.refetch(), addressQuery.refetch()])} className="min-h-[44px] items-center justify-center disabled:opacity-40">
            <Text className="text-[12px] font-semibold text-[#708078]">Làm mới giá và tồn kho</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/*
        MỘT Modal duy nhất cho selector voucher (full-screen, không bottom sheet).
        Nội dung đổi bằng state nên không có nested Modal nào — tránh nền tối
        lọt ra và nút Back bắt nhầm tầng trên Android.
      */}
      <Modal
        visible={moBoChonVoucher}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setMoBoChonVoucher(false)}
      >
        <BoChonVoucher
          danhSach={danhSachVoucher}
          dangChon={uuDaiApDung.maKhuyenMai}
          dangTai={voucherDaLuuQuery.isPending}
          loi={voucherDaLuuQuery.isError}
          onThuLai={() => void voucherDaLuuQuery.refetch()}
          onChon={chonVoucher}
          onXemKhuyenMai={() => {
            setMoBoChonVoucher(false);
            router.push('/khuyen-mai');
          }}
          onDong={() => setMoBoChonVoucher(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}
