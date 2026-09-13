import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthButton, AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { thongBaoLoiXacThuc } from '@/lib/api-xac-thuc';
import { dangNhapMobile } from '@/lib/phien-xac-thuc';
import { useXacThucStore } from '@/stores/xac-thuc.store';
import { hrefSauDangNhap } from '@/lib/auth-navigation';

function SocialButton({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[44px] flex-row items-center justify-center gap-2.5 rounded-[8px] border border-[#E2E8F0] bg-white px-4 active:opacity-75"
    >
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text className="text-[14px] font-semibold text-[#1E293B]">{label}</Text>
    </Pressable>
  );
}

export default function TrangDangNhap() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = hrefSauDangNhap(params.returnTo);
  const trangThai = useXacThucStore((state) => state.trangThai);
  const [taiKhoan, setTaiKhoan] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [ghiNho, setGhiNho] = useState(true);
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  useEffect(() => {
    if (trangThai === 'da-dang-nhap') router.replace(returnTo);
  }, [returnTo, router, trangThai]);

  function moDangKy() {
    const returnToParam = typeof returnTo === 'string' ? returnTo : null;
    if (returnToParam) {
      router.push({ pathname: '/dang-ky', params: { returnTo: returnToParam } });
      return;
    }
    router.push('/dang-ky');
  }

  function chucNangDangPhatTrien(ten: string) {
    Alert.alert('Đang phát triển', `Đăng nhập bằng ${ten} sẽ được bổ sung trong bản cập nhật tới.`);
  }

  async function submit() {
    if (!taiKhoan.trim() || !matKhau) {
      setLoi('Vui lòng nhập email hoặc số điện thoại và mật khẩu.');
      return;
    }
    setDangXuLy(true);
    setLoi('');
    try {
      await dangNhapMobile(taiKhoan.trim().toLowerCase(), matKhau);
      router.replace(returnTo);
    } catch (error) {
      setLoi(thongBaoLoiXacThuc(error));
    } finally {
      setDangXuLy(false);
    }
  }

  const voHieuHoa = !taiKhoan.trim() || !matKhau || dangXuLy;

  return (
    <AuthShell title="Đăng nhập">
      {loi ? (
        <View className="gap-1 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] p-3.5">
          <Text className="text-[13.5px] font-bold text-[#B91C1C]">Không thể đăng nhập</Text>
          <Text className="text-[13px] leading-5 text-[#B91C1C]">{loi}</Text>
        </View>
      ) : null}

      <AuthField
        required
        label="Email hoặc số điện thoại"
        value={taiKhoan}
        onChangeText={setTaiKhoan}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="Nhập email hoặc số điện thoại"
        left={<Ionicons name="mail-outline" size={18} color="#94A3B8" />}
      />

      <AuthField
        required
        label="Mật khẩu"
        value={matKhau}
        onChangeText={setMatKhau}
        secureTextEntry={!hienMatKhau}
        textContentType="password"
        placeholder="Nhập mật khẩu"
        left={<Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            hitSlop={8}
            onPress={() => setHienMatKhau((value) => !value)}
          >
            <Ionicons name={hienMatKhau ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
          </Pressable>
        }
      />

      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ghiNho }}
          accessibilityLabel="Ghi nhớ đăng nhập"
          onPress={() => setGhiNho((value) => !value)}
          className="flex-row items-center gap-2 py-1"
        >
          <View
            className={[
              'h-5 w-5 items-center justify-center rounded-[5px] border',
              ghiNho ? 'border-[#1B7A42] bg-[#1B7A42]' : 'border-[#CBD5E1] bg-white',
            ].join(' ')}
          >
            {ghiNho ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
          </View>
          <Text className="text-[13px] font-medium text-[#334155]">Ghi nhớ đăng nhập</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quên mật khẩu"
          onPress={() => router.push('/quen-mat-khau')}
        >
          <Text className="text-[13px] font-bold text-[#15803D]">Quên mật khẩu?</Text>
        </Pressable>
      </View>

      <AuthButton label="Đăng nhập" busy={dangXuLy} disabled={voHieuHoa} onPress={() => void submit()} />

      <View className="flex-row items-center gap-3 py-0.5">
        <View className="h-px flex-1 bg-[#E2E8F0]" />
        <Text className="text-[12.5px] font-medium text-[#94A3B8]">Hoặc</Text>
        <View className="h-px flex-1 bg-[#E2E8F0]" />
      </View>

      <View className="gap-2.5">
        <SocialButton
          icon="logo-google"
          iconColor="#EA4335"
          label="Tiếp tục với Google"
          onPress={() => chucNangDangPhatTrien('Google')}
        />
        <SocialButton
          icon="logo-facebook"
          iconColor="#1877F2"
          label="Tiếp tục với Facebook"
          onPress={() => chucNangDangPhatTrien('Facebook')}
        />
      </View>

      <Text className="text-center text-[13.5px] text-[#64748B]">
        Chưa có tài khoản?{' '}
        <Text className="font-bold text-[#15803D]" onPress={moDangKy}>
          Đăng ký
        </Text>
      </Text>
    </AuthShell>
  );
}
