import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Notice, PageHeader, PrimaryButton } from '@/components/v2/page-kit';
import { doiMatKhauMobile } from '@/lib/api-xac-thuc-mo-rong';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function PasswordField({
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
    <View>
      <Text className="mb-1.5 text-[12px] font-extrabold text-[#34443B]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor="#98A19C"
        className="min-h-[50px] rounded-[14px] border border-[#DCE7DF] bg-white px-4 text-[14px] text-[#17251C]"
      />
    </View>
  );
}

export default function DoiMatKhauMobileScreen() {
  const router = useRouter();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const [matKhauHienTai, setMatKhauHienTai] = useState('');
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [thanhCong, setThanhCong] = useState<string | null>(null);

  useEffect(() => {
    if (trangThai === 'chua-dang-nhap') {
      moDangNhap(router, '/tai-khoan/doi-mat-khau');
    }
  }, [router, trangThai]);

  const hopLe = useMemo(
    () => matKhauHienTai.length > 0 && matKhauMoi.length >= 10 && matKhauMoi.length <= 128 && matKhauMoi === xacNhan,
    [matKhauHienTai, matKhauMoi, xacNhan],
  );

  async function submit() {
    if (!hopLe || dangGui) return;
    setDangGui(true);
    setLoi(null);
    setThanhCong(null);
    try {
      const result = await doiMatKhauMobile({ matKhauHienTai, matKhauMoi });
      setThanhCong(result.thongBao || 'Đã đổi mật khẩu.');
      setMatKhauHienTai('');
      setMatKhauMoi('');
      setXacNhan('');
    } catch {
      setLoi('Không đổi được mật khẩu. Hãy kiểm tra mật khẩu hiện tại và thử lại.');
    } finally {
      setDangGui(false);
    }
  }

  if (trangThai !== 'da-dang-nhap') return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title="Đổi mật khẩu" subtitle="Mật khẩu mới từ 10 đến 128 ký tự" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <View className="gap-4 rounded-[18px] border border-[#DCE7DF] bg-white p-4">
          {loi ? <Notice tone="danger" title="Không thể đổi mật khẩu" description={loi} /> : null}
          {thanhCong ? <Notice tone="success" title="Thành công" description={thanhCong} /> : null}
          <PasswordField label="Mật khẩu hiện tại" value={matKhauHienTai} onChangeText={setMatKhauHienTai} />
          <PasswordField label="Mật khẩu mới" value={matKhauMoi} onChangeText={setMatKhauMoi} placeholder="10 - 128 ký tự" />
          <PasswordField label="Xác nhận mật khẩu mới" value={xacNhan} onChangeText={setXacNhan} />
          {xacNhan.length > 0 && xacNhan !== matKhauMoi ? (
            <Text className="text-[11px] font-semibold text-[#B23A2E]">Mật khẩu xác nhận chưa khớp.</Text>
          ) : null}
          <Text className="text-[11px] leading-4 text-[#748078]">Không dùng lại mật khẩu quá dễ đoán hoặc mật khẩu bạn đang dùng ở dịch vụ khác.</Text>
          <PrimaryButton label={dangGui ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'} disabled={!hopLe || dangGui} onPress={() => void submit()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
