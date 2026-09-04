import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/design-system';

const MA_TRUY_XUAT_PATTERN = /AGM-[A-F0-9]{32}/i;

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
        secondary ? 'border border-border bg-card' : 'bg-primary',
        disabled ? 'opacity-40' : 'active:opacity-80',
      ].join(' ')}
    >
      <Text
        className={
          secondary ? 'font-semibold text-foreground' : 'font-semibold text-primary-foreground'
        }
      >
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

  const daDungQuet = ketQua !== null;

  function xuLyQr(result: BarcodeScanningResult) {
    if (daDungQuet) return;

    setKetQua({
      raw: result.data,
      maTruyXuat: tachMaTruyXuat(result.data),
    });
  }

  function quetLai() {
    setKetQua(null);
  }

  function xemChiTietTruyXuat() {
    if (!ketQua?.maTruyXuat) return;

    router.push({
      pathname: '/truy-xuat/[ma]',
      params: { ma: ketQua.maTruyXuat },
    });
  }

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-5">
        <View className="w-full max-w-xl gap-3 rounded-2xl border border-border bg-card p-5">
          <Text className="text-2xl font-bold text-foreground">Đang kiểm tra quyền camera</Text>
          <Text className="leading-6 text-muted-foreground">
            AgriMarket cần camera để đọc mã QR truy xuất nguồn gốc.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 justify-center bg-background px-5">
        <View className="gap-5 rounded-2xl border border-border bg-card p-5">
          <View className="self-start">
            <Badge variant="warning">Cần quyền camera</Badge>
          </View>
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">Cho phép camera để quét QR</Text>
            <Text className="leading-6 text-muted-foreground">
              Camera chỉ được dùng để nhận diện mã QR. PHIEN-098 không chụp hoặc lưu ảnh/video.
            </Text>
          </View>
          <Nut
            label={
              permission.canAskAgain ? 'Cho phép sử dụng camera' : 'Không thể yêu cầu lại quyền'
            }
            disabled={!permission.canAskAgain}
            onPress={() => {
              void requestPermission();
            }}
          />
          {!permission.canAskAgain ? (
            <Text className="text-sm leading-5 text-muted-foreground">
              Quyền camera đã bị từ chối cố định. Hãy mở cài đặt ứng dụng trên thiết bị và bật quyền
              Camera.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="gap-2 px-5 pb-4 pt-4">
        <View className="self-start">
          <Badge variant="success">Expo Camera</Badge>
        </View>
        <Text className="text-3xl font-bold text-foreground">Quét QR truy xuất</Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          Đưa mã QR của lô AgriMarket vào khung. QR chuẩn hiện chứa payload `AGM-` + 32 ký tự hex.
        </Text>
      </View>

      <View className="mx-5 flex-1 overflow-hidden rounded-3xl border border-border bg-black">
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          enableTorch={batDen}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={daDungQuet ? undefined : xuLyQr}
        />

        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="h-64 w-64 rounded-3xl border-4 border-white/90" />
          {!daDungQuet ? (
            <Text className="mt-5 rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
              Giữ QR nằm trong khung
            </Text>
          ) : null}
        </View>

        <View className="absolute bottom-4 left-4 right-4">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: batDen }}
            onPress={() => setBatDen((value) => !value)}
            className="self-end rounded-full bg-black/70 px-4 py-3 active:opacity-80"
          >
            <Text className="font-semibold text-white">{batDen ? 'Tắt đèn' : 'Bật đèn'}</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3 px-5 pb-5 pt-4">
        {ketQua ? (
          ketQua.maTruyXuat ? (
            <View className="gap-3 rounded-2xl border border-success bg-card p-4">
              <View className="self-start">
                <Badge variant="success">Đã nhận mã AgriMarket</Badge>
              </View>
              <Text className="text-sm text-muted-foreground">Mã truy xuất</Text>
              <Text selectable className="text-base font-bold leading-6 text-foreground">
                {ketQua.maTruyXuat}
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                Mã hợp lệ đã sẵn sàng để tải Timeline và cảnh báo thu hồi từ Backend.
              </Text>
              <View className="gap-2">
                <Nut label="Xem chi tiết truy xuất" onPress={xemChiTietTruyXuat} />
                <Nut label="Quét mã khác" secondary onPress={quetLai} />
              </View>
            </View>
          ) : (
            <View className="gap-3 rounded-2xl border border-danger bg-card p-4">
              <View className="self-start">
                <Badge variant="danger">QR không hợp lệ</Badge>
              </View>
              <Text className="text-sm leading-5 text-muted-foreground">
                QR đã đọc được nhưng không chứa mã truy xuất AgriMarket theo định dạng `AGM-` + 32
                ký tự hex.
              </Text>
              <Text selectable numberOfLines={2} className="text-xs text-muted-foreground">
                {ketQua.raw}
              </Text>
              <Nut label="Quét lại" onPress={quetLai} />
            </View>
          )
        ) : (
          <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-semibold text-foreground">Scanner đang hoạt động</Text>
              <Text className="text-sm text-muted-foreground">Chỉ nhận barcode loại QR.</Text>
            </View>
            <Badge variant="info">Đang quét</Badge>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
