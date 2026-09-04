import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { AuthButton, AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { apiQuenMatKhau, thongBaoLoiXacThuc } from '@/lib/api-xac-thuc';

export default function TrangQuenMatKhau() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loi, setLoi] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  async function submit() {
    if (!email.trim()) return setLoi('Vui lòng nhập email.');
    setDangXuLy(true);
    setLoi('');
    setThongBao('');
    try {
      const response = await apiQuenMatKhau(email);
      setThongBao(response.thongBao);
    } catch (error) {
      setLoi(thongBaoLoiXacThuc(error));
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nếu tài khoản tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu qua email."
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
      {loi ? <Text className="text-sm text-danger">{loi}</Text> : null}
      {thongBao ? <Text className="text-sm text-success">{thongBao}</Text> : null}
      <AuthButton label="Gửi hướng dẫn" busy={dangXuLy} onPress={() => void submit()} />
      <Pressable onPress={() => router.replace('/dang-nhap')}>
        <Text className="text-center font-semibold text-primary">Quay lại đăng nhập</Text>
      </Pressable>
    </AuthShell>
  );
}
