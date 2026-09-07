import {
 useLocalSearchParams,
 useRouter,
} from 'expo-router';
import { useState } from 'react';
import {
 Pressable,
 Text,
} from 'react-native';

import {
 AuthButton,
 AuthShell,
} from '@/components/auth/auth-shell';
import { AuthField } from '@/components/auth/auth-field';
import {
 apiDangKy,
 thongBaoLoiXacThuc,
} from '@/lib/api-xac-thuc';
import { chuanHoaReturnTo } from '@/lib/auth-navigation';

const EMAIL_TOI_DA = 191;
const MAT_KHAU_TOI_THIEU = 10;
const MAT_KHAU_TOI_DA = 128;
const HO_TEN_TOI_THIEU = 2;
const HO_TEN_TOI_DA = 150;
const SO_DIEN_THOAI_PATTERN =
 /^[0-9+]{9,20}$/;

function emailHopLe(
 value: string,
): boolean {
 // Client pre-check để UX nhanh; hệ thống @IsEmail vẫn là
 // validation source-of-truth cuối cùng.
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
 value,
 );
}

function layMotParam(
 value:
 | string
 | string[]
 | undefined,
): string | null {
 if (
 typeof value === 'string'
 ) {
 return value;
 }

 if (
 Array.isArray(value)
 && typeof value[0] ===
 'string'
 ) {
 return value[0];
 }

 return null;
}

export default function TrangDangKy() {
 const router = useRouter();

 const params =
 useLocalSearchParams<{
 returnTo?:
 | string
 | string[];
 }>();

 const returnTo =
 chuanHoaReturnTo(
 layMotParam(
 params.returnTo,
 ) ?? undefined,
 );

 const [
 hoTen,
 setHoTen,
 ] = useState('');

 const [
 email,
 setEmail,
 ] = useState('');

 const [
 soDienThoai,
 setSoDienThoai,
 ] = useState('');

 const [
 matKhau,
 setMatKhau,
 ] = useState('');

 const [
 xacNhan,
 setXacNhan,
 ] = useState('');

 const [
 loi,
 setLoi,
 ] = useState('');

 const [
 dangXuLy,
 setDangXuLy,
 ] = useState(false);

 function moDangNhap() {
 const returnToParam =
 typeof returnTo === 'string'
 ? returnTo
 : null;

 if (returnToParam) {
 router.replace({
 pathname:
 '/dang-nhap',
 params: {
 returnTo:
 returnToParam,
 },
 });

 return;
 }

 router.replace(
 '/dang-nhap',
 );
 }

 async function submit() {
 const hoTenChuan =
 hoTen.trim();

 const emailChuan =
 email
 .trim()
 .toLowerCase();

 const soDienThoaiChuan =
 soDienThoai.trim();

 if (
 hoTenChuan.length <
 HO_TEN_TOI_THIEU
 ) {
 setLoi(
 `Họ tên cần ít nhất ${HO_TEN_TOI_THIEU} ký tự.`,
 );
 return;
 }

 if (
 hoTenChuan.length >
 HO_TEN_TOI_DA
 ) {
 setLoi(
 `Họ tên không được vượt quá ${HO_TEN_TOI_DA} ký tự.`,
 );
 return;
 }

 if (!emailChuan) {
 setLoi(
 'Vui lòng nhập email.',
 );
 return;
 }

 if (
 emailChuan.length >
 EMAIL_TOI_DA
 ) {
 setLoi(
 `Email không được vượt quá ${EMAIL_TOI_DA} ký tự.`,
 );
 return;
 }

 if (
 !emailHopLe(
 emailChuan,
 )
 ) {
 setLoi(
 'Email không đúng định dạng.',
 );
 return;
 }

 if (
 matKhau.length <
 MAT_KHAU_TOI_THIEU
 ) {
 setLoi(
 `Mật khẩu cần ít nhất ${MAT_KHAU_TOI_THIEU} ký tự.`,
 );
 return;
 }

 if (
 matKhau.length >
 MAT_KHAU_TOI_DA
 ) {
 setLoi(
 `Mật khẩu không được vượt quá ${MAT_KHAU_TOI_DA} ký tự.`,
 );
 return;
 }

 if (
 matKhau !==
 xacNhan
 ) {
 setLoi(
 'Mật khẩu xác nhận không khớp.',
 );
 return;
 }

 if (
 soDienThoaiChuan
 && !SO_DIEN_THOAI_PATTERN.test(
 soDienThoaiChuan,
 )
 ) {
 setLoi(
 'Số điện thoại chỉ gồm chữ số/dấu + và dài 9–20 ký tự.',
 );
 return;
 }

 setDangXuLy(true);
 setLoi('');

 try {
 await apiDangKy({
 hoTen:
 hoTenChuan,
 email:
 emailChuan,
 matKhau,
 soDienThoai:
 soDienThoaiChuan
 || undefined,
 });

 moDangNhap();
 } catch (error) {
 setLoi(
 thongBaoLoiXacThuc(
 error,
 ),
 );
 } finally {
 setDangXuLy(false);
 }
 }

 return (
 <AuthShell
 title="Tạo tài khoản"
 description="Đăng ký tài khoản khách hàng AgriMarket. Sau khi đăng ký thành công, bạn đăng nhập để tiếp tục."
 >
 <AuthField
 label="Họ tên"
 value={hoTen}
 onChangeText={
 setHoTen
 }
 textContentType="name"
 placeholder="Nguyễn Văn A"
 maxLength={
 HO_TEN_TOI_DA
 }
 />

 <AuthField
 label="Email"
 value={email}
 onChangeText={
 setEmail
 }
 autoCapitalize="none"
 autoCorrect={false}
 keyboardType="email-address"
 textContentType="emailAddress"
 placeholder="ban@example.com"
 maxLength={
 EMAIL_TOI_DA
 }
 />

 <AuthField
 label="Số điện thoại (không bắt buộc)"
 value={
 soDienThoai
 }
 onChangeText={
 setSoDienThoai
 }
 keyboardType="phone-pad"
 textContentType="telephoneNumber"
 placeholder="0912345678"
 maxLength={20}
 />

 <AuthField
 label="Mật khẩu"
 value={matKhau}
 onChangeText={
 setMatKhau
 }
 secureTextEntry
 textContentType="newPassword"
 placeholder="10–128 ký tự"
 maxLength={
 MAT_KHAU_TOI_DA
 }
 />

 <AuthField
 label="Xác nhận mật khẩu"
 value={xacNhan}
 onChangeText={
 setXacNhan
 }
 secureTextEntry
 textContentType="newPassword"
 placeholder="Nhập lại mật khẩu"
 maxLength={
 MAT_KHAU_TOI_DA
 }
 />

 {loi ? (
 <Text className="text-sm leading-5 text-danger">
 {loi}
 </Text>
 ) : null}

 <AuthButton
 label="Đăng ký"
 busy={dangXuLy}
 onPress={() =>
 void submit()
 }
 />

 <Pressable
 accessibilityRole="button"
 onPress={
 moDangNhap
 }
 >
 <Text className="text-center font-semibold text-primary">
 Đã có tài khoản?
 {' '}
 Đăng nhập
 </Text>
 </Pressable>
 </AuthShell>
 );
}
