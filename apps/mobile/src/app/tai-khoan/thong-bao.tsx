import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/design-system';
import {
  dangKyThongBaoPushMobile,
  guiThongBaoThuNghiemNoiBo,
  layEasProjectId,
  LOAI_THONG_BAO_PUSH_MOBILE,
  type KetQuaDangKyPushMobile,
} from '@/lib/thong-bao-push';

const NHAN_EVENT: Record<
  (typeof LOAI_THONG_BAO_PUSH_MOBILE)[number],
  {
    title: string;
    description: string;
    target: string;
  }
> = {
  ORDER_STATUS: {
    title: 'Order status',
    description: 'Thay đổi trạng thái đơn hàng.',
    target: '/don-hang/{orderId}',
  },
  SHIPMENT_STATUS: {
    title: 'Shipment status',
    description: 'Cập nhật vận chuyển/giao hàng.',
    target: 'deepLink do server cung cấp, thường về đơn hàng',
  },
  REFUND_STATUS: {
    title: 'Refund',
    description: 'Kết quả/tiến trình hoàn tiền.',
    target: 'deepLink do server cung cấp',
  },
  NEW_HARVEST: {
    title: 'New harvest',
    description: 'Thu hoạch mới từ trang trại đang theo dõi.',
    target: '/trang-trai/{trangTraiId}',
  },
  RECALL: {
    title: 'Recall',
    description: 'Cảnh báo thu hồi/truy xuất cần chú ý.',
    target: '/truy-xuat/{ma} hoặc deepLink nội bộ phù hợp',
  },
};

function trangThaiLabel(result: KetQuaDangKyPushMobile | null): string {
  if (!result) return 'Chưa kiểm tra';

  switch (result.trangThai) {
    case 'khong-ho-tro-web':
      return 'Web không đăng ký native push';
    case 'tu-choi-quyen':
      return 'Chưa cấp quyền';
    case 'thieu-project-id':
      return 'Thiếu EAS projectId';
    case 'client-san-sang-chua-co-backend':
      return 'Client đã có token · Backend chưa đăng ký';
    case 'loi-lay-token':
      return 'Lỗi lấy ExpoPushToken';
  }
}

export default function TrangThongBaoPushTaiKhoan() {
  const router = useRouter();
  const [result, setResult] = useState<KetQuaDangKyPushMobile | null>(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loiThuNghiem, setLoiThuNghiem] = useState<string | null>(null);
  const [daGuiThu, setDaGuiThu] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    setProjectId(layEasProjectId());
  }, []);

  async function kiemTraVaDangKy() {
    setDangXuLy(true);
    setLoiThuNghiem(null);

    try {
      setResult(await dangKyThongBaoPushMobile());
    } finally {
      setDangXuLy(false);
    }
  }

  async function guiThuNoiBo() {
    setDangXuLy(true);
    setLoiThuNghiem(null);
    setDaGuiThu(false);

    try {
      await guiThongBaoThuNghiemNoiBo();
      setDaGuiThu(true);
    } catch (error) {
      setLoiThuNghiem(
        error instanceof Error ? error.message : 'Không gửi được local notification diagnostic.',
      );
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Thông báo đẩy</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Expo Notifications client foundation cho order, shipment, refund, new harvest và recall.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Trạng thái client</Text>

          <View className="self-start">
            <Badge
              variant={result?.trangThai === 'client-san-sang-chua-co-backend' ? 'success' : 'info'}
            >
              {trangThaiLabel(result)}
            </Badge>
          </View>

          <Text className="text-sm text-muted-foreground">Platform: {Platform.OS}</Text>
          <Text selectable className="text-sm text-muted-foreground">
            EAS projectId: {projectId ?? 'chưa cấu hình'}
          </Text>

          {result ? (
            <Text className="text-sm leading-5 text-muted-foreground">{result.thongBao}</Text>
          ) : null}

          {result?.expoPushToken ? (
            <Text selectable className="text-xs leading-5 text-muted-foreground">
              ExpoPushToken: {result.expoPushToken}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={dangXuLy}
            onPress={() => {
              void kiemTraVaDangKy();
            }}
            className={[
              'min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3',
              dangXuLy ? 'opacity-50' : 'active:opacity-80',
            ].join(' ')}
          >
            <Text className="font-semibold text-primary-foreground">
              {dangXuLy ? 'Đang kiểm tra…' : 'Kiểm tra quyền và ExpoPushToken'}
            </Text>
          </Pressable>
        </View>

        <View className="gap-3 rounded-2xl border border-warning bg-card p-4">
          <Badge variant="warning">Server-push boundary</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            Repository hiện chưa có Backend endpoint đăng ký device token, token refresh handler
            hoặc push sender cho 5 event. Mobile không tự coi local diagnostic là production push.
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            `layThongBaoThuHoachMoi` là API pull/list cho thu hoạch mới; nó không được dùng để giả
            làm Expo Push.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">5 event trong master</Text>

          {LOAI_THONG_BAO_PUSH_MOBILE.map((type) => {
            const event = NHAN_EVENT[type];

            return (
              <View key={type} className="gap-2 rounded-2xl border border-border bg-card p-4">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Badge variant="info">{type}</Badge>
                  <Text className="text-lg font-bold text-foreground">{event.title}</Text>
                </View>
                <Text className="text-sm text-muted-foreground">{event.description}</Text>
                <Text selectable className="text-xs leading-5 text-muted-foreground">
                  Target: {event.target}
                </Text>
              </View>
            );
          })}
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Local notification diagnostic</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Chỉ kiểm tra notification rendering + tap vào internal deepLink. Đây không phải server
            push.
          </Text>

          {daGuiThu ? <Badge variant="success">Đã tạo local notification</Badge> : null}

          {loiThuNghiem ? <Text className="text-sm text-danger">{loiThuNghiem}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={dangXuLy}
            onPress={() => {
              void guiThuNoiBo();
            }}
            className={[
              'min-h-12 items-center justify-center rounded-xl border border-primary px-4 py-3',
              dangXuLy ? 'opacity-50' : 'active:opacity-80',
            ].join(' ')}
          >
            <Text className="font-semibold text-primary">Gửi local diagnostic</Text>
          </Pressable>
        </View>

        <View className="gap-2 rounded-2xl border border-info bg-card p-4">
          <Badge variant="info">PHIEN-107 – Cart Sync Test</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            Cart Sync Test thuộc phiên tiếp theo; PHIEN-106 không thay đổi cart/order business
            logic.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
