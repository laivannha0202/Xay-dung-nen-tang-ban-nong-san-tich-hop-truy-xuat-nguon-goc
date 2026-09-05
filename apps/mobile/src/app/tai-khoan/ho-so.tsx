import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  capNhatHoSoTaiKhoanMobile,
  HO_SO_TAI_KHOAN_QUERY_KEY,
  layHoSoTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

export default function TrangHoSoTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');
  const [loiForm, setLoiForm] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState<string | null>(null);

  const query = useQuery({
    queryKey: HO_SO_TAI_KHOAN_QUERY_KEY,
    queryFn: layHoSoTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    setHoTen(query.data.hoTen);
    setSoDienThoai(query.data.soDienThoai ?? '');
    setNgaySinh(query.data.ngaySinh ?? '');
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: capNhatHoSoTaiKhoanMobile,
    onSuccess: (profile) => {
      queryClient.setQueryData(HO_SO_TAI_KHOAN_QUERY_KEY, profile);
      setHoTen(profile.hoTen);
      setSoDienThoai(profile.soDienThoai ?? '');
      setNgaySinh(profile.ngaySinh ?? '');
      setLoiForm(null);
      setThanhCong('Đã cập nhật hồ sơ.');
    },
  });

  function luuHoSo() {
    const ten = hoTen.trim();
    const phone = soDienThoai.trim();
    const birthday = ngaySinh.trim();

    if (ten.length < 2 || ten.length > 150) {
      setLoiForm('Họ tên phải từ 2 đến 150 ký tự.');
      return;
    }

    if (phone && !/^[0-9+]{9,20}$/.test(phone)) {
      setLoiForm('Số điện thoại phải gồm 9–20 ký tự số hoặc dấu +.');
      return;
    }

    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      setLoiForm('Ngày sinh dùng định dạng YYYY-MM-DD.');
      return;
    }

    setLoiForm(null);
    setThanhCong(null);
    mutation.mutate({
      hoTen: ten,
      soDienThoai: phone || null,
      ngaySinh: birthday || null,
    });
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={100} borderRadius={18} />
          <Skeleton height={280} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem hồ sơ"
            description="Hồ sơ khách hàng chỉ dành cho tài khoản đã xác thực."
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
            title="Không tải được hồ sơ"
            description="Backend chưa trả được Customer Profile."
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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Hồ sơ của tôi</Text>
          <Text className="text-sm text-muted-foreground">
            Email là định danh đăng nhập và không chỉnh sửa tại Customer Profile.
          </Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Email</Text>
            <View className="rounded-xl border border-border bg-background px-4 py-3 opacity-70">
              <Text selectable className="text-foreground">
                {query.data.email}
              </Text>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Họ và tên</Text>
            <TextInput
              value={hoTen}
              onChangeText={setHoTen}
              maxLength={150}
              className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Số điện thoại</Text>
            <TextInput
              value={soDienThoai}
              onChangeText={setSoDienThoai}
              keyboardType="phone-pad"
              placeholder="0912345678"
              placeholderTextColor="#737373"
              className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Ngày sinh</Text>
            <TextInput
              value={ngaySinh}
              onChangeText={setNgaySinh}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#737373"
              className="rounded-xl border border-border bg-background px-4 py-3 text-foreground"
            />
          </View>

          {loiForm ? <Text className="text-sm text-danger">{loiForm}</Text> : null}
          {mutation.isError ? (
            <Text className="text-sm text-danger">
              Không cập nhật được hồ sơ. Số điện thoại có thể đã được sử dụng.
            </Text>
          ) : null}
          {thanhCong ? (
            <View className="self-start">
              <Badge variant="success">{thanhCong}</Badge>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={mutation.isPending}
            onPress={luuHoSo}
            className={[
              'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
              mutation.isPending ? 'opacity-50' : 'active:opacity-80',
            ].join(' ')}
          >
            <Text className="font-semibold text-primary-foreground">
              {mutation.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
