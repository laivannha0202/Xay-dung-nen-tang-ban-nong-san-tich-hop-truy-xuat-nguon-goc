import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { AuthButton, AuthShell } from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import { apiDangKy, thongBaoLoiXacThuc } from '@/lib/api-xac-thuc';

export default function TrangDangKy() {
  const router = useRouter();
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [loi, setLoi] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  async function submit() {
    if (hoTen.trim().length < 2) return setLoi('Họ tên cần ít nhất 2 ký tự.');
    if (!email.trim()) return setLoi('Vui lòng nhập email.');
    if (matKhau.length < 10) return setLoi('Mật khẩu cần ít nhất 10 ký tự.');
    if (matKhau !== xacNhan) return setLoi('Mật khẩu xác nhận không khớp.');
    if (soDienThoai.trim() && !/^[0-9+]{9,20}$/.test(soDienThoai.trim())) {
      return setLoi('Số điện thoại không hợp lệ.');
    }
    setDangXuLy(true);
    setLoi('');
    try {
      await apiDangKy({ hoTen, email, matKhau, soDienThoai: soDienThoai || undefined });
      router.replace('/dang-nhap');
    } catch (error) {
      setLoi(thongBaoLoiXacThuc(error));
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <AuthShell title="Tạo tài khoản" description="Đăng ký tài khoản khách hàng AgriMarket.">
      <AuthField
        label="Họ tên"
        value={hoTen}
        onChangeText={setHoTen}
        textContentType="name"
        placeholder="Nguyễn Văn A"
      />
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
        label="Số điện thoại (không bắt buộc)"
        value={soDienThoai}
        onChangeText={setSoDienThoai}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        placeholder="0912345678"
      />
      <AuthField
        label="Mật khẩu"
        value={matKhau}
        onChangeText={setMatKhau}
        secureTextEntry
        textContentType="newPassword"
        placeholder="Ít nhất 10 ký tự"
      />
      <AuthField
        label="Xác nhận mật khẩu"
        value={xacNhan}
        onChangeText={setXacNhan}
        secureTextEntry
        textContentType="newPassword"
        placeholder="Nhập lại mật khẩu"
      />
      {loi ? <Text className="text-sm text-danger">{loi}</Text> : null}
      <AuthButton label="Đăng ký" busy={dangXuLy} onPress={() => void submit()} />
      <Pressable onPress={() => router.replace('/dang-nhap')}>
        <Text className="text-center font-semibold text-primary">Đã có tài khoản? Đăng nhập</Text>
      </Pressable>
    </AuthShell>
  );
}
