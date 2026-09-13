import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';

const MA_TRUY_XUAT_PATTERN = /AGM-[A-F0-9]{32}/i;
const PRIMARY = '#087A4B';

type KetQuaQuet = {
  raw: string;
  maTruyXuat: string | null;
};

function tachMaTruyXuat(raw: string): string | null {
  const match = raw.trim().match(MA_TRUY_XUAT_PATTERN);
  return match?.[0]?.toUpperCase() ?? null;
}

function Nut({
  label,
  secondary = false,
  disabled = false,
  onPress,
}: {
  label: string;
  secondary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={[
        'min-h-12 items-center justify-center rounded-xl px-4 py-3',
        secondary ? 'border border-[#DCE7DF] bg-white' : 'bg-primary',
        disabled ? 'opacity-40' : 'active:opacity-80',
      ].join(' ')}
    >
      <Text className={secondary ? 'font-semibold text-[#263129]' : 'font-semibold text-white'}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TrangQuetQr() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [ketQua, setKetQua] = useState<KetQuaQuet | null>(null);
  const [batDen, setBatDen] = useState(false);
  const [nhapThuCong, setNhapThuCong] = useState(false);
  const [maThuCong, setMaThuCong] = useState('');

  const daDungQuet = ketQua !== null;

  function xuLyQr(result: BarcodeScanningResult) {
    if (daDungQuet) return;
    setKetQua({ raw: result.data, maTruyXuat: tachMaTruyXuat(result.data) });
  }

  function quetLai() {
    setKetQua(null);
    setMaThuCong('');
  }

  function xemChiTietTruyXuat() {
    if (!ketQua?.maTruyXuat) return;
    router.push({ pathname: '/truy-xuat/[ma]', params: { ma: ketQua.maTruyXuat } });
  }

  function kiemTraMaThuCong() {
    const maTruyXuat = tachMaTruyXuat(maThuCong);
    setKetQua({ raw: maThuCong.trim(), maTruyXuat });
    setNhapThuCong(false);
  }

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-5">
        <View className="w-full max-w-xl gap-3 rounded-2xl border border-[#DCE7DF] bg-white p-5">
          <Text className="text-2xl font-bold text-[#17251C]">Đang kiểm tra quyền camera</Text>
          <Text className="leading-6 text-[#718078]">AgriMarket cần camera để đọc mã QR truy xuất nguồn gốc.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2"><MobileBrandBar /></View>
        <View className="flex-1 justify-center px-5">
          <View className="gap-5 rounded-[22px] border border-[#DCE7DF] bg-[#F8FBF9] p-5">
            <View className="self-start"><Badge variant="warning">Cần quyền camera</Badge></View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E7F5EC]">
              <Ionicons name="camera-outline" size={31} color={PRIMARY} />
            </View>
            <View className="gap-2">
              <Text className="text-3xl font-extrabold text-[#17251C]">Cho phép camera để quét QR</Text>
              <Text className="leading-6 text-[#718078]">Camera chỉ được dùng để nhận diện mã QR. Ứng dụng không tự chụp hoặc lưu ảnh/video.</Text>
            </View>
            <Nut
              label={permission.canAskAgain ? 'Cho phép sử dụng camera' : 'Không thể yêu cầu lại quyền'}
              disabled={!permission.canAskAgain}
              onPress={() => void requestPermission()}
            />
            {!permission.canAskAgain ? (
              <Text className="text-sm leading-5 text-[#718078]">Hãy mở cài đặt ứng dụng trên thiết bị và bật quyền Camera.</Text>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <View className="px-5 pt-2"><MobileBrandBar /></View>

        <View className="mt-2 bg-[#0D261A] px-5 pb-6 pt-5">
          <View className="items-center gap-2 pb-4">
            <Text className="text-[32px] font-extrabold text-white">Quét QR</Text>
            <Text className="max-w-[330px] text-center text-[14px] leading-5 text-white/80">
              Quét mã trên bao bì sản phẩm để kiểm tra nguồn gốc và hành trình lô hàng.
            </Text>
          </View>

          <View className="h-[430px] overflow-hidden rounded-[28px] border border-white/20 bg-black">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              enableTorch={batDen}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={daDungQuet ? undefined : xuLyQr}
            />

            <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
              <View className="h-[265px] w-[265px] rounded-[30px] border-[3px] border-[#CFF9DC]" />
              {!daDungQuet ? (
                <Text className="mt-5 rounded-full bg-black/70 px-5 py-2.5 text-[13px] font-semibold text-white">
                  Đưa mã QR vào khung để quét tự động
                </Text>
              ) : null}
            </View>
          </View>

          <View className="mt-5 flex-row justify-center gap-8">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: batDen }}
              onPress={() => setBatDen((value) => !value)}
              className="items-center gap-2 active:opacity-75"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                <Ionicons name={batDen ? 'flash' : 'flash-outline'} size={27} color="#173A29" />
              </View>
              <Text className="text-[12px] font-semibold text-white">{batDen ? 'Tắt đèn' : 'Bật đèn'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setNhapThuCong((value) => !value)}
              className="items-center gap-2 active:opacity-75"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E7F5EC]">
                <Ionicons name="keypad-outline" size={27} color={PRIMARY} />
              </View>
              <Text className="text-[12px] font-semibold text-white">Nhập mã</Text>
            </Pressable>
          </View>
        </View>

        {nhapThuCong ? (
          <View className="mx-5 mt-5 gap-3 rounded-[20px] border border-[#DCE7DF] bg-[#F7FAF8] p-4">
            <Text className="text-[17px] font-extrabold text-[#17251C]">Nhập mã truy xuất</Text>
            <Text className="text-[12px] leading-5 text-[#718078]">Nhập mã AGM- gồm 32 ký tự hex được in trên tem truy xuất.</Text>
            <TextInput
              value={maThuCong}
              onChangeText={setMaThuCong}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="AGM-..."
              placeholderTextColor="#98A29C"
              className="min-h-12 rounded-xl border border-[#DCE7DF] bg-white px-4 text-[14px] text-[#17251C]"
            />
            <Nut label="Kiểm tra mã" disabled={!maThuCong.trim()} onPress={kiemTraMaThuCong} />
          </View>
        ) : null}

        <View className="mx-5 mt-5">
          {ketQua ? (
            ketQua.maTruyXuat ? (
              <View className="gap-3 rounded-[20px] border border-[#B7E2C6] bg-[#F1FAF5] p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Badge variant="success">Mã AgriMarket hợp lệ</Badge>
                  <Ionicons name="shield-checkmark" size={24} color={PRIMARY} />
                </View>
                <Text className="text-[12px] text-[#718078]">Mã truy xuất</Text>
                <Text selectable className="text-[15px] font-extrabold leading-6 text-[#17251C]">{ketQua.maTruyXuat}</Text>
                <Text className="text-[13px] leading-5 text-[#617168]">Mở chi tiết để tải timeline, thông tin lô và cảnh báo được công khai từ hệ thống.</Text>
                <View className="gap-2">
                  <Nut label="Xem chi tiết truy xuất" onPress={xemChiTietTruyXuat} />
                  <Nut label="Quét mã khác" secondary onPress={quetLai} />
                </View>
              </View>
            ) : (
              <View className="gap-3 rounded-[20px] border border-[#F0C8C8] bg-[#FFF8F8] p-4">
                <Badge variant="danger">Mã không hợp lệ</Badge>
                <Text className="text-[13px] leading-5 text-[#6E7772]">Nội dung đã đọc không chứa mã AgriMarket theo định dạng AGM- + 32 ký tự hex.</Text>
                <Text selectable numberOfLines={2} className="text-xs text-[#8A948E]">{ketQua.raw}</Text>
                <Nut label="Quét lại" onPress={quetLai} />
              </View>
            )
          ) : (
            <View className="flex-row items-start gap-3 rounded-[20px] bg-[#F1FAF5] p-4">
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-white">
                <Ionicons name="bulb-outline" size={24} color={PRIMARY} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-extrabold text-[#17452F]">Mẹo quét QR</Text>
                <Text className="mt-1 text-[13px] leading-5 text-[#6D7971]">Giữ tem nằm trọn trong khung, đủ ánh sáng và tránh rung để quét nhanh hơn.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
