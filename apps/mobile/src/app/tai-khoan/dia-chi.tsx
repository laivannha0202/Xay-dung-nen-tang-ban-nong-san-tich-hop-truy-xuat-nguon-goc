import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  SelectablePickerMobile,
  SelectablePickerScreen,
  Skeleton,
  type PickerOptionMobile,
} from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  layDanhSachThonToDanPhoMobile,
  layDanhSachXaPhuongHungYenMobile,
  nhanLoaiXaPhuongMobile,
  TINH_HUNG_YEN,
  type ThonToDanPhoMobile,
  type XaPhuongHungYenMobile,
} from '@/lib/api-dia-ban';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  capNhatDiaChiTaiKhoanMobile,
  datDiaChiMacDinhTaiKhoanMobile,
  DIA_CHI_TAI_KHOAN_QUERY_KEY,
  layDiaChiTaiKhoanMobile,
  taoDiaChiTaiKhoanMobile,
  type DiaChiTaiKhoanMobile,
  xoaDiaChiTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

// Lấy từ brand token dùng chung (packages/api-client/domain-ui) để đổi màu
// thương hiệu chỉ sửa một chỗ. Trước đây 19 file hard-code '#087A4B'.
const PRIMARY = THUONG_HIEU_AGRIMARKET.primary;

type FormState = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  xaPhuongMa: string;
  thonToDanPhoMa: string;
  macDinh: boolean;
};

const EMPTY_FORM: FormState = {
  tenNguoiNhan: '',
  soDienThoai: '',
  dongDiaChi: '',
  xaPhuongMa: '',
  thonToDanPhoMa: '',
  macDinh: false,
};

/**
 * Màn hình nào đang hiện trong Modal full-screen duy nhất của trang.
 *
 * Chỉ có MỘT `Modal` native. Selector xã/phường và thôn/TDP nằm trong cùng
 * Modal này (đổi nội dung bằng state) thay vì mở Modal thứ hai lồng bên
 * trong — tránh nested modal làm sheet trượt, nền lọt form phía sau và nút
 * Back trên Android bắt nhầm tầng.
 */
type ManHinhTrongModal = 'form' | 'xa-phuong' | 'thon-to-dan-pho';

const TIEU_DE_MAN_HINH: Record<Exclude<ManHinhTrongModal, 'form'>, string> = {
  'xa-phuong': 'Chọn xã/phường',
  'thon-to-dan-pho': 'Chọn thôn/tổ dân phố',
};

/**
 * Field văn bản của form — cùng chiều cao / bo góc / viền với
 * `SelectablePickerMobile` để form đồng nhất.
 */
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-[#374151]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        className="min-h-[48px] rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[15px] text-[#111827]"
      />
    </View>
  );
}

function dinhDangDiaChi(item: DiaChiTaiKhoanMobile): string {
  return [item.dongDiaChi, item.tenThonToDanPho, item.tenXaPhuong ?? item.phuongXa, item.tinhThanh]
    .filter(Boolean)
    .join(', ');
}

export default function TrangDiaChiTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [manHinhMo, setManHinhMo] = useState<ManHinhTrongModal | null>(null);
  const [suaId, setSuaId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loiForm, setLoiForm] = useState<string | null>(null);
  const [danhSachXaPhuong, setDanhSachXaPhuong] = useState<XaPhuongHungYenMobile[]>([]);
  const [danhSachThon, setDanhSachThon] = useState<ThonToDanPhoMobile[]>([]);
  const [dangTaiXaPhuong, setDangTaiXaPhuong] = useState(false);
  const [dangTaiThon, setDangTaiThon] = useState(false);

  const modalMo = manHinhMo !== null;
  const dangMoForm = manHinhMo === 'form';

  // Danh sách xã chỉ tải khi mở form; giữ nguyên trong lúc selector đang mở
  // để quay lại form không phải chờ tải lại.
  useEffect(() => {
    if (manHinhMo === null) return;
    setDangTaiXaPhuong(true);
    layDanhSachXaPhuongHungYenMobile()
      .then(setDanhSachXaPhuong)
      .catch(() => setDanhSachXaPhuong([]))
      .finally(() => setDangTaiXaPhuong(false));
  }, [manHinhMo]);

  useEffect(() => {
    if (!modalMo || !form.xaPhuongMa) {
      setDanhSachThon([]);
      return;
    }
    // Đang hiển thị selector thôn thì giữ nguyên danh sách, không tải lại.
    if (manHinhMo === 'thon-to-dan-pho') return;
    setDangTaiThon(true);
    layDanhSachThonToDanPhoMobile(form.xaPhuongMa)
      .then(setDanhSachThon)
      .catch(() => setDanhSachThon([]))
      .finally(() => setDangTaiThon(false));
  }, [manHinhMo, modalMo, form.xaPhuongMa]);

  // Option cho picker. Nhãn xã/phường dùng cùng cách ghép với Web
  // (`${nhanLoaiXaPhuong} ${ten}`) để mobile/web hiển thị giống nhau.
  const luaChonXaPhuong = useMemo<PickerOptionMobile[]>(
    () =>
      danhSachXaPhuong.map((item) => ({
        value: item.ma,
        label: `${nhanLoaiXaPhuongMobile(item.loai)} ${item.ten}`,
        timThem: item.tenDayDu,
      })),
    [danhSachXaPhuong],
  );

  const luaChonThon = useMemo<PickerOptionMobile[]>(
    () => danhSachThon.map((item) => ({ value: item.ma, label: item.tenDayDu })),
    [danhSachThon],
  );

  const thonChuaCongBo = Boolean(form.xaPhuongMa) && !dangTaiThon && danhSachThon.length === 0;

  const query = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const reload = async () => {
    await queryClient.invalidateQueries({ queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ten = form.tenNguoiNhan.trim();
      const phone = form.soDienThoai.trim();
      const dong = form.dongDiaChi.trim();

      if (ten.length < 2 || dong.length < 3) {
        throw new Error('Tên người nhận và địa chỉ chi tiết chưa hợp lệ.');
      }

      if (!/^[0-9+]{9,20}$/.test(phone)) {
        throw new Error('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      }

      if (!form.xaPhuongMa) {
        throw new Error('Vui lòng chọn xã/phường thuộc tỉnh Hưng Yên.');
      }

      if (danhSachThon.length > 0 && !form.thonToDanPhoMa) {
        throw new Error('Vui lòng chọn thôn/tổ dân phố.');
      }

      const data = {
        tenNguoiNhan: ten,
        soDienThoai: phone,
        dongDiaChi: dong,
        tinhThanh: TINH_HUNG_YEN,
        xaPhuongMa: form.xaPhuongMa,
        thonToDanPhoMa: form.thonToDanPhoMa || null,
      };

      if (suaId) return capNhatDiaChiTaiKhoanMobile(suaId, data);

      return taoDiaChiTaiKhoanMobile({ ...data, macDinh: form.macDinh });
    },
    onSuccess: async () => {
      setManHinhMo(null);
      setSuaId(null);
      setForm(EMPTY_FORM);
      setLoiForm(null);
      await reload();
    },
  });

  const defaultMutation = useMutation({
    mutationFn: datDiaChiMacDinhTaiKhoanMobile,
    onSuccess: reload,
    onError: (error) => {
      Alert.alert(
        'Không đặt được địa chỉ mặc định',
        thongBaoLoiApi(error, 'Vui lòng thử lại.'),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: xoaDiaChiTaiKhoanMobile,
    onSuccess: reload,
    onError: (error) => {
      Alert.alert('Không xóa được địa chỉ', thongBaoLoiApi(error, 'Vui lòng thử lại.'));
    },
  });

  // --- Nội dung form. Thứ tự field khớp Customer Web (Web 2 cột ở desktop,
  // Mobile thuần 1 cột): Tên người nhận · Số điện thoại · Tỉnh · Xã/Phường ·
  // Thôn/Tổ dân phố · Địa chỉ chi tiết · Đặt làm mặc định · Hủy · Lưu địa chỉ.
  const noiDungForm = (
    <View className="gap-4">
      <Field
        label="Tên người nhận *"
        value={form.tenNguoiNhan}
        onChangeText={(value) => setField('tenNguoiNhan', value)}
        placeholder="Nguyễn Văn A"
      />
      <Field
        label="Số điện thoại *"
        value={form.soDienThoai}
        onChangeText={(value) => setField('soDienThoai', value)}
        placeholder="0912345678"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <View className="gap-1.5">
        <Text className="text-[13px] font-semibold text-[#374151]">Tỉnh</Text>
        <View
          className="min-h-[48px] justify-center rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-3.5"
          style={{ minHeight: 48 }}
        >
          <Text className="text-[15px] text-[#374151]">{TINH_HUNG_YEN}</Text>
        </View>
        <Text className="text-[12px] leading-[18px] text-[#9CA3AF]">
          AgriMarket hiện chỉ giao hàng trong tỉnh Hưng Yên.
        </Text>
      </View>

      <SelectablePickerMobile
        label="Xã/Phường"
        required
        value={form.xaPhuongMa}
        options={luaChonXaPhuong}
        placeholder="Chọn xã/phường"
        loading={dangTaiXaPhuong}
        accessibilityLabel="Chọn xã hoặc phường"
        onOpen={() => setManHinhMo('xa-phuong')}
      />

      <SelectablePickerMobile
        label="Thôn/Tổ dân phố"
        required={luaChonThon.length > 0}
        value={form.thonToDanPhoMa}
        options={luaChonThon}
        placeholder="Chọn thôn/tổ dân phố"
        placeholderChuaChon={form.xaPhuongMa ? undefined : 'Chọn xã/phường trước'}
        disabled={!form.xaPhuongMa || dangTaiThon}
        loading={dangTaiThon}
        accessibilityLabel="Chọn thôn hoặc tổ dân phố"
        helperText={
          thonChuaCongBo
            ? 'Danh sách thôn/tổ dân phố của khu vực này đang được cập nhật. Bạn vẫn có thể nhập địa chỉ chi tiết.'
            : undefined
        }
        onOpen={() => setManHinhMo('thon-to-dan-pho')}
      />

      <Field
        label="Địa chỉ chi tiết *"
        value={form.dongDiaChi}
        onChangeText={(value) => setField('dongDiaChi', value)}
        placeholder="Số nhà, ngõ/xóm..."
      />

      {!suaId ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Đặt làm địa chỉ mặc định"
          accessibilityState={{ checked: form.macDinh }}
          onPress={() => setField('macDinh', !form.macDinh)}
          className="min-h-[48px] flex-row items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3.5 active:opacity-80"
        >
          <View
            className={[
              'h-5 w-5 items-center justify-center rounded-md border',
              form.macDinh ? 'border-primary bg-primary' : 'border-[#C7CDD9] bg-white',
            ].join(' ')}
          >
            {form.macDinh ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
          </View>
          <Text className="flex-1 text-[14px] text-[#111827]">Đặt làm địa chỉ mặc định</Text>
        </Pressable>
      ) : null}

      {loiForm ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
          <Ionicons name="alert-circle-outline" size={18} color="#C93445" />
          <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">{loiForm}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={saveMutation.isPending}
          onPress={dongForm}
          className="min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white active:opacity-80"
        >
          <Text className="text-[15px] font-semibold text-[#374151]">Hủy</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lưu địa chỉ"
          disabled={saveMutation.isPending}
          onPress={luu}
          className={[
            'min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary px-4',
            saveMutation.isPending ? 'opacity-50' : 'active:opacity-80',
          ].join(' ')}
        >
          <Text className="text-[15px] font-semibold text-white">
            {saveMutation.isPending ? 'Đang lưu…' : 'Lưu địa chỉ'}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      // Khi đổi xã => clear thôn ngay.
      if (key === 'xaPhuongMa' && value !== current.xaPhuongMa) {
        return { ...current, xaPhuongMa: value as string, thonToDanPhoMa: '' };
      }
      return { ...current, [key]: value };
    });
  }

  function moThem() {
    setSuaId(null);
    setForm(EMPTY_FORM);
    setLoiForm(null);
    setManHinhMo('form');
  }

  function moSua(item: DiaChiTaiKhoanMobile) {
    setSuaId(item.id);
    setForm({
      tenNguoiNhan: item.tenNguoiNhan,
      soDienThoai: item.soDienThoai,
      dongDiaChi: item.dongDiaChi,
      xaPhuongMa: item.xaPhuongMa ?? '',
      thonToDanPhoMa: item.thonToDanPhoMa ?? '',
      macDinh: item.macDinh,
    });
    setLoiForm(null);
    setManHinhMo('form');
  }

  function dongForm() {
    if (saveMutation.isPending) return;
    setManHinhMo(null);
    setSuaId(null);
    setForm(EMPTY_FORM);
    setLoiForm(null);
  }

  /** Đóng selector, quay lại form — giữ nguyên toàn bộ dữ liệu đã nhập. */
  function quayLaiForm() {
    setManHinhMo('form');
  }

  /** Chọn xong trong selector: cập nhật giá trị rồi quay lại form. */
  function chonXaPhuong(value: string) {
    setField('xaPhuongMa', value);
    quayLaiForm();
  }

  function chonThon(value: string) {
    setField('thonToDanPhoMa', value);
    quayLaiForm();
  }

  function luu() {
    setLoiForm(null);
    void saveMutation.mutateAsync().catch((error: unknown) => {
      setLoiForm(thongBaoLoiApi(error, 'Không lưu được địa chỉ.'));
    });
  }

  function xacNhanXoa(item: DiaChiTaiKhoanMobile) {
    Alert.alert(
      'Xóa địa chỉ?',
      `Địa chỉ của ${item.tenNguoiNhan} sẽ được gỡ khỏi sổ địa chỉ.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(item.id),
        },
      ],
    );
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={105} borderRadius={22} />
          <Skeleton height={180} borderRadius={22} />
          <Skeleton height={180} borderRadius={22} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem sổ địa chỉ"
            description="Địa chỉ nhận hàng được đồng bộ theo tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/dia-chi')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={105} borderRadius={22} />
          <Skeleton height={180} borderRadius={22} />
          <Skeleton height={180} borderRadius={22} />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được sổ địa chỉ"
            description={thongBaoLoiApi(query.error, 'Không tải được danh sách địa chỉ lúc này.')}
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="pt-2">
          <MobileBrandBar />
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại tài khoản"
            onPress={() => quayLaiHoacVe(router, '/tai-khoan')}
            className="flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
          >
            <Ionicons name="chevron-back" size={18} color={PRIMARY} />
            <Text className="text-[13px] font-bold text-[#087A4B]">Tài khoản</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thêm địa chỉ mới"
            onPress={moThem}
            className="min-h-[44px] flex-row items-center gap-1.5 rounded-xl bg-primary px-4 active:opacity-80"
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text className="text-[13px] font-semibold text-white">Thêm địa chỉ</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F5EA]">
            <Ionicons name="location-outline" size={26} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[29px] font-extrabold tracking-[-0.5px] text-[#17251C]">
              Sổ địa chỉ
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#748078]">
              {query.data.length} địa chỉ nhận hàng đang được lưu.
            </Text>
          </View>
        </View>

        {query.data.length === 0 ? (
          <EmptyState
            title="Chưa có địa chỉ nhận hàng"
            description="Thêm địa chỉ đầu tiên để quá trình thanh toán nhanh hơn."
            actionLabel="Thêm địa chỉ"
            onAction={moThem}
          />
        ) : (
          <View className="gap-3">
            {query.data.map((item) => (
              <View
                key={item.id}
                className={[
                  'gap-4 rounded-[22px] border bg-white p-4',
                  item.macDinh ? 'border-[#A9D7BA]' : 'border-[#DCE7DF]',
                ].join(' ')}
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className={[
                      'h-11 w-11 items-center justify-center rounded-2xl',
                      item.macDinh ? 'bg-[#E4F5EA]' : 'bg-[#F1F5F2]',
                    ].join(' ')}
                  >
                    <Ionicons name="location" size={22} color={item.macDinh ? PRIMARY : '#718078'} />
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-[17px] font-extrabold text-[#202A24]">{item.tenNguoiNhan}</Text>
                      {item.macDinh ? <Badge variant="success">Mặc định</Badge> : null}
                    </View>
                    <Text className="text-[13px] font-semibold text-[#56645B]">{item.soDienThoai}</Text>
                    <Text className="mt-1 text-[13px] leading-5 text-[#748078]">{dinhDangDiaChi(item)}</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 border-t border-[#EEF2EF] pt-3">
                  {!item.macDinh ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={defaultMutation.isPending}
                      onPress={() => defaultMutation.mutate(item.id)}
                      className={[
                        'flex-row items-center gap-1.5 rounded-xl bg-[#EAF7EF] px-3 py-2',
                        defaultMutation.isPending ? 'opacity-45' : 'active:opacity-75',
                      ].join(' ')}
                    >
                      <Ionicons name="star-outline" size={16} color={PRIMARY} />
                      <Text className="text-[12px] font-bold text-[#087A4B]">Đặt mặc định</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => moSua(item)}
                    className="flex-row items-center gap-1.5 rounded-xl border border-[#DCE7DF] bg-white px-3 py-2 active:opacity-75"
                  >
                    <Ionicons name="create-outline" size={16} color="#405047" />
                    <Text className="text-[12px] font-bold text-[#405047]">Chỉnh sửa</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={deleteMutation.isPending}
                    onPress={() => xacNhanXoa(item)}
                    className={[
                      'flex-row items-center gap-1.5 rounded-xl border border-[#F0C8C8] bg-[#FFF8F8] px-3 py-2',
                      deleteMutation.isPending ? 'opacity-45' : 'active:opacity-75',
                    ].join(' ')}
                  >
                    <Ionicons name="trash-outline" size={16} color="#C93445" />
                    <Text className="text-[12px] font-bold text-[#C93445]">Xóa</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* MỘT Modal native duy nhất phục vụ cả form lẫn selector.
          - `fullScreen` để selector phủ kín màn hình, không có nền tối lọt form.
          - `animationType="fade"`: chuyển form ↔ selector không trượt cả màn
            hình nữa (trước đây `slide` kéo theo cả vùng nhìn).
          - Nút Back của Android: đang ở selector thì về form, đang ở form thì
            đóng — không bắt nhầm tầng như khi lồng hai Modal. */}
      <Modal
        visible={modalMo}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={dangMoForm ? dongForm : quayLaiForm}
      >
        {dangMoForm ? (
          <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
              <Text className="flex-1 text-[17px] font-bold text-[#111827]">
                {suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng biểu mẫu địa chỉ"
                onPress={dongForm}
                hitSlop={10}
                className="h-11 w-11 items-center justify-center rounded-full active:opacity-70"
              >
                <Ionicons name="close" size={22} color="#374151" />
              </Pressable>
            </View>

            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              >
                {noiDungForm}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        ) : manHinhMo === 'xa-phuong' ? (
          <SelectablePickerScreen
            title={TIEU_DE_MAN_HINH['xa-phuong']}
            searchPlaceholder="Tìm xã/phường..."
            value={form.xaPhuongMa}
            options={luaChonXaPhuong}
            onSelect={chonXaPhuong}
            onClose={quayLaiForm}
          />
        ) : manHinhMo === 'thon-to-dan-pho' ? (
          <SelectablePickerScreen
            title={TIEU_DE_MAN_HINH['thon-to-dan-pho']}
            searchPlaceholder="Tìm thôn/tổ dân phố..."
            value={form.thonToDanPhoMa}
            options={luaChonThon}
            onSelect={chonThon}
            onClose={quayLaiForm}
          />
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}
