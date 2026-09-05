import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  capNhatDiaChiTaiKhoanMobile,
  datDiaChiMacDinhTaiKhoanMobile,
  DIA_CHI_TAI_KHOAN_QUERY_KEY,
  layDiaChiTaiKhoanMobile,
  taoDiaChiTaiKhoanMobile,
  type DiaChiTaiKhoanMobile,
  xoaDiaChiTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

type FormState = {
  tenNguoiNhan: string;
  soDienThoai: string;
  dongDiaChi: string;
  phuongXa: string;
  quanHuyen: string;
  tinhThanh: string;
  maBuuChinh: string;
  macDinh: boolean;
};

const EMPTY_FORM: FormState = {
  tenNguoiNhan: '',
  soDienThoai: '',
  dongDiaChi: '',
  phuongXa: '',
  quanHuyen: '',
  tinhThanh: '',
  maBuuChinh: '',
  macDinh: false,
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#737373"
        className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
      />
    </View>
  );
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

  const query = useQuery({
    queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    queryFn: layDiaChiTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 20_000,
  });

  const reload = async () => {
    await queryClient.invalidateQueries({
      queryKey: DIA_CHI_TAI_KHOAN_QUERY_KEY,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const ten = form.tenNguoiNhan.trim();
      const phone = form.soDienThoai.trim();
      const dong = form.dongDiaChi.trim();
      const tinh = form.tinhThanh.trim();

      if (ten.length < 2 || dong.length < 3 || tinh.length < 2) {
        throw new Error('Tên người nhận, địa chỉ và tỉnh/thành chưa hợp lệ.');
      }

      if (!/^[0-9+]{9,20}$/.test(phone)) {
        throw new Error('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      }

      const data = {
        tenNguoiNhan: ten,
        soDienThoai: phone,
        dongDiaChi: dong,
        phuongXa: form.phuongXa.trim() || null,
        quanHuyen: form.quanHuyen.trim() || null,
        tinhThanh: tinh,
        maBuuChinh: form.maBuuChinh.trim() || null,
      };

      if (suaId) {
        return capNhatDiaChiTaiKhoanMobile(suaId, data);
      }

      return taoDiaChiTaiKhoanMobile({
        ...data,
        macDinh: form.macDinh,
      });
    },
    onSuccess: async () => {
      setFormMo(false);
      setSuaId(null);
      setForm(EMPTY_FORM);
      setLoiForm(null);
      await reload();
    },
  });

  const defaultMutation = useMutation({
    mutationFn: datDiaChiMacDinhTaiKhoanMobile,
    onSuccess: reload,
  });

  const deleteMutation = useMutation({
    mutationFn: xoaDiaChiTaiKhoanMobile,
    onSuccess: reload,
  });

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function moThem() {
    setSuaId(null);
    setForm(EMPTY_FORM);
    setLoiForm(null);
    setFormMo(true);
  }

  function moSua(item: DiaChiTaiKhoanMobile) {
    setSuaId(item.id);
    setForm({
      tenNguoiNhan: item.tenNguoiNhan,
      soDienThoai: item.soDienThoai,
      dongDiaChi: item.dongDiaChi,
      phuongXa: item.phuongXa ?? '',
      quanHuyen: item.quanHuyen ?? '',
      tinhThanh: item.tinhThanh,
      maBuuChinh: item.maBuuChinh ?? '',
      macDinh: false,
    });
    setLoiForm(null);
    setFormMo(true);
  }

  function luu() {
    setLoiForm(null);
    saveMutation.mutateAsync().catch((error: unknown) => {
      setLoiForm(error instanceof Error ? error.message : 'Không lưu được địa chỉ.');
    });
  }

  function xacNhanXoa(id: string) {
    Alert.alert('Xóa địa chỉ?', 'Địa chỉ sẽ được gỡ khỏi sổ địa chỉ của bạn.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={120} borderRadius={18} />
          <Skeleton height={220} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem địa chỉ"
            description="Sổ địa chỉ được đồng bộ theo tài khoản khách hàng."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được sổ địa chỉ"
            description="Backend chưa trả được danh sách địa chỉ."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={moThem}
            className="rounded-xl bg-primary px-4 py-2.5 active:opacity-80"
          >
            <Text className="font-semibold text-primary-foreground">Thêm địa chỉ</Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Sổ địa chỉ</Text>
          <Text className="text-sm text-muted-foreground">
            {query.data.length} địa chỉ đang lưu trên Backend.
          </Text>
        </View>

        {formMo ? (
          <View className="gap-4 rounded-2xl border border-primary bg-card p-4">
            <Text className="text-xl font-bold text-foreground">
              {suaId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
            </Text>
            <Field
              label="Tên người nhận"
              value={form.tenNguoiNhan}
              onChangeText={(value) => setField('tenNguoiNhan', value)}
            />
            <Field
              label="Số điện thoại"
              value={form.soDienThoai}
              onChangeText={(value) => setField('soDienThoai', value)}
              placeholder="0912345678"
            />
            <Field
              label="Địa chỉ"
              value={form.dongDiaChi}
              onChangeText={(value) => setField('dongDiaChi', value)}
            />
            <Field
              label="Phường/Xã"
              value={form.phuongXa}
              onChangeText={(value) => setField('phuongXa', value)}
            />
            <Field
              label="Quận/Huyện"
              value={form.quanHuyen}
              onChangeText={(value) => setField('quanHuyen', value)}
            />
            <Field
              label="Tỉnh/Thành"
              value={form.tinhThanh}
              onChangeText={(value) => setField('tinhThanh', value)}
            />
            <Field
              label="Mã bưu chính"
              value={form.maBuuChinh}
              onChangeText={(value) => setField('maBuuChinh', value)}
            />

            {!suaId ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.macDinh }}
                onPress={() => setField('macDinh', !form.macDinh)}
                className="flex-row items-center gap-3 py-1"
              >
                <View
                  className={[
                    'h-5 w-5 rounded border',
                    form.macDinh ? 'border-primary bg-primary' : 'border-border bg-background',
                  ].join(' ')}
                />
                <Text className="text-sm text-foreground">Đặt làm địa chỉ mặc định</Text>
              </Pressable>
            ) : null}

            {loiForm ? <Text className="text-sm text-danger">{loiForm}</Text> : null}

            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={saveMutation.isPending}
                onPress={() => {
                  setFormMo(false);
                  setLoiForm(null);
                }}
                className="min-h-11 flex-1 items-center justify-center rounded-xl border border-border px-4 py-2.5 active:opacity-80"
              >
                <Text className="font-semibold text-foreground">Hủy</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={saveMutation.isPending}
                onPress={luu}
                className={[
                  'min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2.5',
                  saveMutation.isPending ? 'opacity-50' : 'active:opacity-80',
                ].join(' ')}
              >
                <Text className="font-semibold text-primary-foreground">
                  {saveMutation.isPending ? 'Đang lưu…' : 'Lưu'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {query.data.length === 0 ? (
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <Text className="font-bold text-foreground">Chưa có địa chỉ</Text>
            <Text className="text-sm text-muted-foreground">
              Thêm địa chỉ giao hàng đầu tiên của bạn.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {query.data.map((item) => (
              <View key={item.id} className="gap-3 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-lg font-bold text-foreground">{item.tenNguoiNhan}</Text>
                      {item.macDinh ? <Badge variant="success">Mặc định</Badge> : null}
                    </View>
                    <Text className="text-sm text-muted-foreground">{item.soDienThoai}</Text>
                  </View>
                </View>

                <Text className="text-sm leading-5 text-foreground">
                  {[item.dongDiaChi, item.phuongXa, item.quanHuyen, item.tinhThanh, item.maBuuChinh]
                    .filter(Boolean)
                    .join(', ')}
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {!item.macDinh ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={defaultMutation.isPending}
                      onPress={() => defaultMutation.mutate(item.id)}
                      className="rounded-xl border border-primary px-3 py-2 active:opacity-80"
                    >
                      <Text className="text-xs font-semibold text-primary">Đặt mặc định</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => moSua(item)}
                    className="rounded-xl border border-border px-3 py-2 active:opacity-80"
                  >
                    <Text className="text-xs font-semibold text-foreground">Sửa</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={deleteMutation.isPending}
                    onPress={() => xacNhanXoa(item.id)}
                    className="rounded-xl border border-danger px-3 py-2 active:opacity-80"
                  >
                    <Text className="text-xs font-semibold text-danger">Xóa</Text>
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
