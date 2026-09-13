import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  capNhatHoSoTaiKhoanMobile,
  HO_SO_TAI_KHOAN_QUERY_KEY,
  layHoSoTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type TruongHoSoProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'numbers-and-punctuation';
  maxLength?: number;
  hint?: string;
};

function TruongHoSo({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  hint,
}: TruongHoSoProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={17} color="#607067" />
        <Text className="text-[13px] font-extrabold text-[#405047]">{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#99A29D"
        className="min-h-[52px] rounded-2xl border border-[#DCE7DF] bg-[#F9FBFA] px-4 text-[15px] text-[#202A24]"
      />
      {hint ? <Text className="px-1 text-[11px] leading-4 text-[#89948D]">{hint}</Text> : null}
    </View>
  );
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'A'
  );
}

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

  const coThayDoi = useMemo(() => {
    if (!query.data) return false;
    return (
      hoTen.trim() !== query.data.hoTen ||
      soDienThoai.trim() !== (query.data.soDienThoai ?? '') ||
      ngaySinh.trim() !== (query.data.ngaySinh ?? '')
    );
  }, [hoTen, ngaySinh, query.data, soDienThoai]);

  const mutation = useMutation({
    mutationFn: capNhatHoSoTaiKhoanMobile,
    onSuccess: (profile) => {
      queryClient.setQueryData(HO_SO_TAI_KHOAN_QUERY_KEY, profile);
      setHoTen(profile.hoTen);
      setSoDienThoai(profile.soDienThoai ?? '');
      setNgaySinh(profile.ngaySinh ?? '');
      setLoiForm(null);
      setThanhCong('Thông tin cá nhân đã được cập nhật.');
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
      setLoiForm('Ngày sinh cần theo định dạng YYYY-MM-DD, ví dụ 2000-12-31.');
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

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={120} borderRadius={22} />
          <Skeleton height={330} borderRadius={22} />
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
            title="Đăng nhập để xem hồ sơ"
            description="Thông tin cá nhân được đồng bộ an toàn theo tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/ho-so')}
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
          <Skeleton height={120} borderRadius={22} />
          <Skeleton height={330} borderRadius={22} />
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
            title="Không tải được hồ sơ"
            description={thongBaoLoiApi(query.error, 'Không thể tải thông tin cá nhân lúc này.')}
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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại tài khoản"
          onPress={() => quayLaiHoacVe(router, '/tai-khoan')}
          className="self-start flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
        >
          <Ionicons name="chevron-back" size={18} color={PRIMARY} />
          <Text className="text-[13px] font-bold text-[#087A4B]">Tài khoản</Text>
        </Pressable>

        <View className="rounded-[24px] border border-[#DCE9E1] bg-[#F1FAF5] p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-[#DDF2E5]">
              <Text className="text-[22px] font-extrabold text-[#075E3B]">
                {initials(query.data.hoTen)}
              </Text>
            </View>
            <View className="min-w-0 flex-1">
              <Text numberOfLines={2} className="text-[22px] font-extrabold text-[#17251C]">
                {query.data.hoTen}
              </Text>
              <Text numberOfLines={1} className="mt-1 text-[13px] text-[#748078]">
                {query.data.email}
              </Text>
              <View className="mt-2 self-start">
                <Badge variant="success">Tài khoản đã xác thực</Badge>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="gap-1">
            <Text className="text-[20px] font-extrabold text-[#17251C]">Thông tin cá nhân</Text>
            <Text className="text-[12px] leading-5 text-[#7A857E]">
              Cập nhật thông tin để nhận hàng và liên hệ thuận tiện hơn.
            </Text>
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="mail-outline" size={17} color="#607067" />
              <Text className="text-[13px] font-extrabold text-[#405047]">Email đăng nhập</Text>
            </View>
            <View className="min-h-[52px] justify-center rounded-2xl border border-[#E1E8E3] bg-[#F4F7F5] px-4">
              <Text selectable className="text-[14px] text-[#69766E]">
                {query.data.email}
              </Text>
            </View>
            <Text className="px-1 text-[11px] leading-4 text-[#89948D]">
              Email dùng để đăng nhập nên không thay đổi tại màn hình này.
            </Text>
          </View>

          <TruongHoSo
            icon="person-outline"
            label="Họ và tên"
            value={hoTen}
            onChangeText={setHoTen}
            maxLength={150}
            placeholder="Nhập họ và tên"
          />

          <TruongHoSo
            icon="call-outline"
            label="Số điện thoại"
            value={soDienThoai}
            onChangeText={setSoDienThoai}
            keyboardType="phone-pad"
            placeholder="0912345678"
            hint="Dùng để liên hệ khi giao nhận đơn hàng."
          />

          <TruongHoSo
            icon="calendar-outline"
            label="Ngày sinh"
            value={ngaySinh}
            onChangeText={setNgaySinh}
            keyboardType="numbers-and-punctuation"
            placeholder="YYYY-MM-DD"
            hint="Ví dụ: 2000-12-31. Có thể để trống nếu bạn chưa muốn cung cấp."
          />

          {loiForm ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
              <Ionicons name="alert-circle-outline" size={19} color="#C93445" />
              <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">{loiForm}</Text>
            </View>
          ) : null}

          {mutation.isError ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
              <Ionicons name="alert-circle-outline" size={19} color="#C93445" />
              <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#C93445]">
                {thongBaoLoiApi(mutation.error, 'Không cập nhật được thông tin cá nhân.')}
              </Text>
            </View>
          ) : null}

          {thanhCong ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-[#EAF7EF] p-3">
              <Ionicons name="checkmark-circle" size={20} color={PRIMARY} />
              <Text className="min-w-0 flex-1 text-[12px] font-bold text-[#075E3B]">{thanhCong}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: mutation.isPending || !coThayDoi }}
            disabled={mutation.isPending || !coThayDoi}
            onPress={luuHoSo}
            className={[
              'min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4',
              mutation.isPending || !coThayDoi ? 'opacity-45' : 'active:opacity-80',
            ].join(' ')}
          >
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text className="text-[15px] font-extrabold text-white">
              {mutation.isPending ? 'Đang lưu…' : coThayDoi ? 'Lưu thay đổi' : 'Thông tin đã cập nhật'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
