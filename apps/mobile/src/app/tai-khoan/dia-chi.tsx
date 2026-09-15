import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  chuanHoaTenDiaBanMobile,
  layDanhSachThonToDanPhoMobile,
  layDanhSachXaPhuongHungYenMobile,
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

const PRIMARY = '#087A4B';

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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: 'default' | 'phone-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={16} color="#607067" />
        <Text className="text-[13px] font-extrabold text-[#405047]">{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#99A29D"
        keyboardType={keyboardType}
        className="min-h-[52px] rounded-2xl border border-[#DCE7DF] bg-[#F9FBFA] px-4 text-[15px] text-[#202A24]"
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

  const [formMo, setFormMo] = useState(false);
  const [suaId, setSuaId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loiForm, setLoiForm] = useState<string | null>(null);
  const [danhSachXaPhuong, setDanhSachXaPhuong] = useState<XaPhuongHungYenMobile[]>([]);
  const [timXaPhuong, setTimXaPhuong] = useState('');
  const [danhSachThon, setDanhSachThon] = useState<ThonToDanPhoMobile[]>([]);
  const [dangTaiThon, setDangTaiThon] = useState(false);

  useEffect(() => {
    if (!formMo) return;
    layDanhSachXaPhuongHungYenMobile()
      .then(setDanhSachXaPhuong)
      .catch(() => setDanhSachXaPhuong([]));
  }, [formMo]);

  useEffect(() => {
    if (!formMo || !form.xaPhuongMa) {
      setDanhSachThon([]);
      return;
    }
    setDangTaiThon(true);
    layDanhSachThonToDanPhoMobile(form.xaPhuongMa)
      .then(setDanhSachThon)
      .catch(() => setDanhSachThon([]))
      .finally(() => setDangTaiThon(false));
  }, [formMo, form.xaPhuongMa]);

  const xaPhuongLoc = useMemo(() => {
    const tuKhoa = chuanHoaTenDiaBanMobile(timXaPhuong);
    if (!tuKhoa) return danhSachXaPhuong.slice(0, 20);
    return danhSachXaPhuong
      .filter(
        (item) =>
          chuanHoaTenDiaBanMobile(item.ten).includes(tuKhoa) ||
          chuanHoaTenDiaBanMobile(item.tenDayDu).includes(tuKhoa),
      )
      .slice(0, 20);
  }, [danhSachXaPhuong, timXaPhuong]);

  const tenXaPhuongDaChon = danhSachXaPhuong.find((item) => item.ma === form.xaPhuongMa)?.tenDayDu;
  const tenThonDaChon = danhSachThon.find((item) => item.ma === form.thonToDanPhoMa)?.tenDayDu;
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
      setFormMo(false);
      setSuaId(null);
      setForm(EMPTY_FORM);
      setTimXaPhuong('');
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
    setTimXaPhuong('');
    setLoiForm(null);
    setFormMo(true);
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
    setTimXaPhuong('');
    setLoiForm(null);
    setFormMo(true);
  }

  function dongForm() {
    if (saveMutation.isPending) return;
    setFormMo(false);
    setSuaId(null);
    setForm(EMPTY_FORM);
    setTimXaPhuong('');
    setLoiForm(null);
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
            disabled={formMo}
            onPress={moThem}
            className={[
              'flex-row items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5',
              formMo ? 'opacity-45' : 'active:opacity-80',
            ].join(' ')}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="text-[13px] font-extrabold text-white">Thêm địa chỉ</Text>
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

        {formMo ? (
          <View className="gap-4 rounded-[22px] border border-[#B9DCC7] bg-white p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="text-[20px] font-extrabold text-[#17251C]">
                  {suaId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ nhận hàng'}
                </Text>
                <Text className="mt-1 text-[12px] leading-5 text-[#7A857E]">
                  Điền chính xác thông tin người nhận để đơn hàng được giao thuận tiện.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng biểu mẫu"
                onPress={dongForm}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F7F5] active:opacity-75"
              >
                <Ionicons name="close" size={20} color="#66736B" />
              </Pressable>
            </View>

            <Field
              icon="person-outline"
              label="Tên người nhận"
              value={form.tenNguoiNhan}
              onChangeText={(value) => setField('tenNguoiNhan', value)}
              placeholder="Nguyễn Văn A"
            />
            <Field
              icon="call-outline"
              label="Số điện thoại"
              value={form.soDienThoai}
              onChangeText={(value) => setField('soDienThoai', value)}
              placeholder="0912345678"
              keyboardType="phone-pad"
            />
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="business-outline" size={16} color="#607067" />
                <Text className="text-[13px] font-extrabold text-[#405047]">Tỉnh</Text>
              </View>
              <View className="min-h-[52px] justify-center rounded-2xl border border-[#DCE7DF] bg-[#F1F5F2] px-4">
                <Text className="text-[15px] font-bold text-[#405047]">{TINH_HUNG_YEN} (cố định)</Text>
              </View>
            </View>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="navigate-outline" size={16} color="#607067" />
                <Text className="text-[13px] font-extrabold text-[#405047]">Xã/Phường *</Text>
              </View>
              {tenXaPhuongDaChon ? (
                <View className="flex-row items-center justify-between gap-2 rounded-2xl border border-[#B9DCC7] bg-[#EAF7EF] px-4 py-3">
                  <Text className="min-w-0 flex-1 text-[14px] font-bold text-[#087A4B]">
                    {tenXaPhuongDaChon}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Chọn lại xã phường"
                    onPress={() => setField('xaPhuongMa', '')}
                    hitSlop={8}
                  >
                    <Text className="text-[12px] font-bold text-[#087A4B]">Đổi</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-2">
                  <TextInput
                    value={timXaPhuong}
                    onChangeText={setTimXaPhuong}
                    placeholder="Gõ không dấu để tìm, ví dụ: kien xuong"
                    placeholderTextColor="#99A29D"
                    className="min-h-[52px] rounded-2xl border border-[#DCE7DF] bg-[#F9FBFA] px-4 text-[15px] text-[#202A24]"
                  />
                  {xaPhuongLoc.map((item) => (
                    <Pressable
                      key={item.ma}
                      accessibilityRole="button"
                      onPress={() => setField('xaPhuongMa', item.ma)}
                      className="rounded-xl border border-[#DCE7DF] bg-[#F9FBFA] px-4 py-3 active:opacity-75"
                    >
                      <Text className="text-[14px] text-[#202A24]">{item.tenDayDu}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="location-outline" size={16} color="#607067" />
                <Text className="text-[13px] font-extrabold text-[#405047]">
                  Thôn/Tổ dân phố{danhSachThon.length > 0 ? ' *' : ''}
                </Text>
              </View>
              {!form.xaPhuongMa ? (
                <Text className="text-[12px] text-[#89948D]">Chọn xã/phường trước.</Text>
              ) : dangTaiThon ? (
                <Text className="text-[12px] text-[#89948D]">Đang tải...</Text>
              ) : thonChuaCongBo ? (
                <Text className="text-[12px] leading-5 text-[#89948D]">
                  Danh sách thôn/tổ dân phố của khu vực này đang được cập nhật.
                  Bạn vẫn có thể lưu địa chỉ.
                </Text>
              ) : (
                <View className="gap-2">
                  {danhSachThon.map((item) => (
                    <Pressable
                      key={item.ma}
                      accessibilityRole="button"
                      onPress={() => setField('thonToDanPhoMa', item.ma)}
                      className={[
                        'rounded-xl border px-4 py-3 active:opacity-75',
                        form.thonToDanPhoMa === item.ma
                          ? 'border-[#087A4B] bg-[#EAF7EF]'
                          : 'border-[#DCE7DF] bg-[#F9FBFA]',
                      ].join(' ')}
                    >
                      <Text className="text-[14px] text-[#202A24]">
                        {form.thonToDanPhoMa === item.ma ? `✓ ${item.tenDayDu}` : item.tenDayDu}
                      </Text>
                    </Pressable>
                  ))}
                  {tenThonDaChon ? null : (
                    <Text className="text-[12px] text-[#89948D]">Chạm để chọn một mục.</Text>
                  )}
                </View>
              )}
            </View>
            <Field
              icon="home-outline"
              label="Địa chỉ chi tiết *"
              value={form.dongDiaChi}
              onChangeText={(value) => setField('dongDiaChi', value)}
              placeholder="Số nhà, ngõ/xóm..."
            />

            {!suaId ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.macDinh }}
                onPress={() => setField('macDinh', !form.macDinh)}
                className="flex-row items-center gap-3 rounded-2xl bg-[#F7FAF8] p-3 active:opacity-80"
              >
                <View
                  className={[
                    'h-6 w-6 items-center justify-center rounded-lg border',
                    form.macDinh ? 'border-primary bg-primary' : 'border-[#BCC8C1] bg-white',
                  ].join(' ')}
                >
                  {form.macDinh ? <Ionicons name="checkmark" size={17} color="#FFFFFF" /> : null}
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-extrabold text-[#405047]">Đặt làm mặc định</Text>
                  <Text className="mt-0.5 text-[11px] text-[#89948D]">
                    Tự động chọn địa chỉ này khi thanh toán.
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {loiForm ? (
              <View className="flex-row items-start gap-2 rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
                <Ionicons name="alert-circle-outline" size={19} color="#C93445" />
                <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">{loiForm}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={saveMutation.isPending}
                onPress={dongForm}
                className="min-h-[50px] flex-1 items-center justify-center rounded-2xl border border-[#DCE7DF] bg-white active:opacity-80"
              >
                <Text className="font-extrabold text-[#405047]">Hủy</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={saveMutation.isPending}
                onPress={luu}
                className={[
                  'min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4',
                  saveMutation.isPending ? 'opacity-50' : 'active:opacity-80',
                ].join(' ')}
              >
                <Ionicons name="save-outline" size={19} color="#FFFFFF" />
                <Text className="font-extrabold text-white">
                  {saveMutation.isPending ? 'Đang lưu…' : 'Lưu địa chỉ'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

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
    </SafeAreaView>
  );
}
