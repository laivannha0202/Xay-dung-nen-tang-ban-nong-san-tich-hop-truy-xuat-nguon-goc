import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton, AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { thongBaoLoiXacThuc } from '@/lib/api-xac-thuc';
import { dangNhapMobile } from '@/lib/phien-xac-thuc';
import { useXacThucStore } from '@/stores/xac-thuc.store';

export default function TrangDangNhap() {
  const router = useRouter();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  useEffect(() => {
    if (trangThai === 'da-dang-nhap') router.replace('/');
  }, [router, trangThai]);

  async function submit() {
    if (!email.trim() || !matKhau) {
      setLoi('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setDangXuLy(true);
    setLoi('');
    try {
      await dangNhapMobile(email, matKhau);
      router.replace('/');
    } catch (error) {
      setLoi(thongBaoLoiXacThuc(error));
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <AuthShell
      title="Đăng nhập AgriMarket"
      description="Đăng nhập để đồng bộ đơn hàng, hồ sơ và các tính năng cá nhân trên thiết bị."
    >
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="ban@example.com"
      />
      <AuthField
        label="Mật khẩu"
        value={matKhau}
        onChangeText={setMatKhau}
        secureTextEntry
        textContentType="password"
        placeholder="Nhập mật khẩu"
      />
      {loi ? <Text className="text-sm text-danger">{loi}</Text> : null}
      <AuthButton label="Đăng nhập" busy={dangXuLy} onPress={() => void submit()} />
      <View className="flex-row flex-wrap justify-between gap-3">
        <Pressable onPress={() => router.push('/quen-mat-khau')}>
          <Text className="font-semibold text-primary">Quên mật khẩu?</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/dang-ky')}>
          <Text className="font-semibold text-primary">Tạo tài khoản</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
