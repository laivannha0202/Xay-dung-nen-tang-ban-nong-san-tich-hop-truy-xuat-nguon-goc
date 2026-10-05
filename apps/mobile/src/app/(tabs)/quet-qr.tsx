import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';
import {
  CameraView,
  type BarcodeScanningResult,
  type CameraMountError,
  scanFromURLAsync,
  useCameraPermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge } from '@/components/design-system';
import { SafeAreaScreen } from '@/components/layout/safe-area-screen';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';

const MA_TRUY_XUAT_PATTERN = /AGM-[A-F0-9]{32}/i;
// Lấy từ brand token dùng chung (packages/api-client/domain-ui) để đổi màu
// thương hiệu chỉ sửa một chỗ. Trước đây 19 file hard-code '#087A4B'.
const PRIMARY = THUONG_HIEU_AGRIMARKET.primary;

// Khung camera nằm NGOÀI ScrollView và dùng style cố định (không phụ thuộc
// className). Lý do: CameraView là native view có preview layer riêng; khi nằm
// trong ScrollView với `flex: 1` trên Android/Fabric, preview có thể tràn khung
// hoặc co về 0px làm cả màn hình trắng. Style tường minh + absoluteFill là
// cách ổn định nhất cho native preview.
const KHUNG_CAMERA_CHIEU_RONG = 380;
const KHUNG_CAMERA_CHIEU_CAO = 340;

type KetQuaQuet = {
  raw: string;
  maTruyXuat: string | null;
};

function tachMaTruyXuat(raw: string): string | null {
  // QR trên tem là payload bất kỳ có chứa mã AGM (thường là URL
  // `/truy-xuat?ma=AGM-...`). Ta CHỈ rút mã ra rồi điều hướng tới màn
  // `/truy-xuat/[ma]` — không bao giờ `Linking.openURL` payload đọc được, nên
  // không có đường mở URL lạ từ QR ngoài hệ thống. Màn đích gọi API công khai
  // và tự báo "không hợp lệ / không tồn tại" khi mã sai.
  return raw.trim().match(MA_TRUY_XUAT_PATTERN)?.[0]?.toUpperCase() ?? null;
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
        secondary ? 'border border-[#DCE7DF] bg-white' : 'bg-[#087A4B]',
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
  // Camera native mount lỗi (đang bị ứng dụng khác chiếm camera, thiết bị/emulator
  // không có camera, preview không dựng được...). Không có state này thì lỗi
  // native chỉ biểu hiện thành khung đen/trắng trống và người dùng không hiểu vì sao.
  const [loiCamera, setLoiCamera] = useState<string | null>(null);
  const [loiAnhThuVien, setLoiAnhThuVien] = useState<string | null>(null);
  const [dangDocAnh, setDangDocAnh] = useState(false);

  const daDungQuet = ketQua !== null;
  const daCapQuyen = permission?.granted === true;
  const cameraHoatDong = daCapQuyen && loiCamera === null;
  // Flash chỉ hiện khi camera thật sự đang chạy. `expo-camera` 57 không có
  // API báo "thiết bị có đèn flash", nên tín hiệu đáng tin duy nhất là
  // preview đã mount thành công; hiện nút khi chưa chắc sẽ bấm không được.
  const coTheDungDen = cameraHoatDong;

  function xuLyQr(result: BarcodeScanningResult) {
    if (daDungQuet) return;
    setKetQua({ raw: result.data, maTruyXuat: tachMaTruyXuat(result.data) });
  }

  function xuLyLoiCamera(event: CameraMountError) {
    setLoiCamera(event?.message ?? 'Không mở được camera trên thiết bị này.');
  }

  function quetLai() {
    setKetQua(null);
    setMaThuCong('');
  }

  function moNhapMa() {
    setNhapThuCong(true);
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

  /**
   * Chọn ảnh QR từ thư viện rồi đọc bằng `scanFromURLAsync` của chính
   * `expo-camera` (không thêm thư viện QR thứ hai, không OCR, không tự parse
   * ảnh). Lỗi quyền thư viện/đọc ảnh đều đi qua thông báo ngắn gọn.
   *
   * Lịch sử quét: Backend KHÔNG có API lịch sử quét QR cho khách, nên màn này
   * cố tình không hiển thị lịch sử giả. Xem `docs`/báo cáo handoff.
   */
  async function quetTuThuVien() {
    if (dangDocAnh) return;
    setLoiAnhThuVien(null);

    const quyen = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!quyen.granted) {
      setLoiAnhThuVien(
        quyen.canAskAgain
          ? 'Cần quyền truy cập thư viện ảnh để chọn ảnh QR.'
          : 'Chưa được cấp quyền thư viện ảnh. Hãy bật quyền trong cài đặt ứng dụng.',
      );
      return;
    }

    const ketQuaChon = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (ketQuaChon.canceled || !ketQuaChon.assets[0]?.uri) return;

    setDangDocAnh(true);
    try {
      const ketQua = await scanFromURLAsync(ketQuaChon.assets[0].uri, ['qr']);
      const first = ketQua[0];
      if (!first) {
        setLoiAnhThuVien('Không tìm thấy mã QR trong ảnh này. Hãy chọn ảnh chụp rõ tem.');
        return;
      }
      xuLyQr(first);
    } catch {
      setLoiAnhThuVien('Không đọc được ảnh vừa chọn. Hãy thử lại với ảnh khác hoặc nhập mã trực tiếp.');
    } finally {
      setDangDocAnh(false);
    }
  }

  function moCaiDatHeThong() {
    void Linking.openSettings();
  }

  // 1. Đang hỏi quyền camera.
  if (!permission) {
    return (
      <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2"><MobileBrandBar /></View>
        <View className="flex-1 justify-center px-5">
          <View className="w-full gap-3 rounded-2xl border border-[#DCE7DF] bg-[#F8FBF9] p-5">
            <ActivityIndicator color={PRIMARY} />
            <Text className="text-2xl font-bold text-[#17251C]">Đang kiểm tra quyền camera</Text>
            <Text className="leading-6 text-[#718078]">AgriMarket cần camera để đọc mã QR truy xuất nguồn gốc.</Text>
          </View>
        </View>
      </SafeAreaScreen>
    );
  }

  // 2. Chưa được cấp quyền camera.
  if (!permission.granted) {
    return (
      <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2"><MobileBrandBar /></View>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View className="mt-2 gap-5 rounded-[22px] border border-[#DCE7DF] bg-[#F8FBF9] p-5">
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
              <>
                <Text className="text-sm leading-5 text-[#718078]">Bạn đã từ chối quyền camera. Hãy mở cài đặt ứng dụng trên thiết bị và bật quyền Camera.</Text>
                <Nut label="Mở cài đặt ứng dụng" secondary onPress={moCaiDatHeThong} />
              </>
            ) : null}
          </View>

          <View className="mt-5 gap-3 rounded-[20px] border border-[#DCE7DF] bg-[#F7FAF8] p-4">
            <Text className="text-[17px] font-extrabold text-[#17251C]">Nhập mã truy xuất</Text>
            <Text className="text-[12px] leading-5 text-[#718078]">Không có camera? Nhập mã AGM- gồm 32 ký tự hex được in trên tem truy xuất.</Text>
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
        </ScrollView>
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen className="flex-1 bg-white" edges={['top']}>
      <View className="px-5 pt-2"><MobileBrandBar /></View>

      {/* Khối cố định (không scroll): brand bar + tiêu đề + khung camera. */}
      <View className="mt-2 bg-[#0D261A] px-5 pb-6 pt-5">
        <View className="items-center gap-2 pb-4">
          <Text className="text-[32px] font-extrabold text-white">Quét QR</Text>
          <Text className="max-w-[330px] text-center text-[14px] leading-5 text-white/80">
            Quét mã trên bao bì sản phẩm để kiểm tra nguồn gốc và hành trình lô hàng.
          </Text>
        </View>

        <View
          style={[styles.khungCamera, { width: KHUNG_CAMERA_CHIEU_RONG, height: KHUNG_CAMERA_CHIEU_CAO }]}
          className="overflow-hidden rounded-[28px] border border-white/20 bg-black"
        >
          {cameraHoatDong ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={batDen}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={daDungQuet ? undefined : xuLyQr}
              onMountError={xuLyLoiCamera}
            />
          ) : null}

          {cameraHoatDong ? (
            <View pointerEvents="none" style={StyleSheet.absoluteFill} className="items-center justify-center">
              <View style={styles.khungNhin} className="rounded-[30px] border-[3px] border-[#CFF9DC]" />
              {!daDungQuet ? (
                <Text className="mt-5 rounded-full bg-black/70 px-5 py-2.5 text-[13px] font-semibold text-white">
                  Đưa mã QR vào khung để quét tự động
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-3 px-6">
              <Ionicons name="videocam-off-outline" size={34} color="#FFFFFF" />
              <Text className="text-center text-[15px] font-extrabold text-white">
                {loiCamera ? 'Không mở được camera' : 'Đang bật camera...'}
              </Text>
              <Text className="text-center text-[12px] leading-5 text-white/75">
                {loiCamera
                  ? loiCamera
                  : 'Nếu bạn không thấy hình camera, hãy dùng nhập mã thủ công bên dưới.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={moNhapMa}
                className="min-h-11 items-center justify-center rounded-xl bg-white px-5 active:opacity-80"
              >
                <Text className="text-[14px] font-bold text-[#173A29]">Nhập mã thủ công</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="mt-5 flex-row justify-center gap-8">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={batDen ? 'Tắt đèn flash' : 'Bật đèn flash'}
            accessibilityState={{ selected: batDen, disabled: !coTheDungDen }}
            disabled={!coTheDungDen}
            onPress={() => setBatDen((value) => !value)}
            className={`items-center gap-2 ${coTheDungDen ? 'active:opacity-75' : 'opacity-40'}`}
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
              <Ionicons name={batDen ? 'flash' : 'flash-outline'} size={27} color="#173A29" />
            </View>
            <Text className="text-[12px] font-semibold text-white">{batDen ? 'Tắt đèn' : 'Bật đèn'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nhập mã truy xuất"
            onPress={() => setNhapThuCong((value) => !value)}
            className="items-center gap-2 active:opacity-75"
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E7F5EC]">
              <Ionicons name="keypad-outline" size={27} color={PRIMARY} />
            </View>
            <Text className="text-[12px] font-semibold text-white">Nhập mã</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chọn ảnh QR trong thư viện"
            accessibilityState={{ busy: dangDocAnh }}
            disabled={dangDocAnh || daDungQuet}
            onPress={() => void quetTuThuVien()}
            className={`items-center gap-2 ${dangDocAnh || daDungQuet ? 'opacity-40' : 'active:opacity-75'}`}
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-[#E7F5EC]">
              <Ionicons name={dangDocAnh ? 'hourglass-outline' : 'images-outline'} size={27} color={PRIMARY} />
            </View>
            <Text className="text-[12px] font-semibold text-white">
              {dangDocAnh ? 'Đang đọc…' : 'Ảnh QR'}
            </Text>
          </Pressable>
        </View>
        {loiAnhThuVien ? (
          <Text className="mt-3 text-center text-[12px] leading-5 text-[#FFD9D9]">{loiAnhThuVien}</Text>
        ) : null}
      </View>

      {/* Chỉ phần kết quả cuộn, để camera không nằm trong vùng scroll. */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 28 }}
      >
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
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  khungCamera: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  khungNhin: {
    height: 220,
    width: 220,
  },
});