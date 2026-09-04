import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/design-system';
import {
  chuanHoaTrangThaiThanhToan,
  layGiaTriThamSo,
  taoPaymentReturnUrl,
  type TrangThaiKetQuaThanhToanMobile,
} from '@/lib/payment-return';

type CauHinhKetQua = {
  badge: 'success' | 'danger' | 'info';
  nhan: string;
  tieuDe: string;
  moTa: string;
  actionLabel: string;
  actionRoute: '/' | '/thanh-toan';
};

const CAU_HINH: Record<TrangThaiKetQuaThanhToanMobile, CauHinhKetQua> = {
  success: {
    badge: 'success',
    nhan: 'success',
    tieuDe: 'Thanh toán thành công',
    moTa: 'Return flow đã chuyển về Mobile với trạng thái success.',
    actionLabel: 'Tiếp tục mua sắm',
    actionRoute: '/',
  },
  failure: {
    badge: 'danger',
    nhan: 'failure',
    tieuDe: 'Thanh toán chưa thành công',
    moTa: 'Return flow báo failure. Hãy quay lại Checkout để kiểm tra.',
    actionLabel: 'Quay lại Checkout',
    actionRoute: '/thanh-toan',
  },
  pending: {
    badge: 'info',
    nhan: 'pending',
    tieuDe: 'Đang chờ xác nhận thanh toán',
    moTa: 'Kết quả cuối cùng chưa có hoặc tham số trạng thái không hợp lệ.',
    actionLabel: 'Quay lại Checkout',
    actionRoute: '/thanh-toan',
  },
};

export default function TrangKetQuaThanhToan() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    trangThai?: string | string[];
    maDonHang?: string | string[];
    maGiaoDich?: string | string[];
  }>();

  const trangThai = chuanHoaTrangThaiThanhToan(params.trangThai);
  const maDonHang = layGiaTriThamSo(params.maDonHang);
  const maGiaoDich = layGiaTriThamSo(params.maGiaoDich);
  const config = CAU_HINH[trangThai];
  const paymentReturnUrl = taoPaymentReturnUrl();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-6 rounded-3xl border border-border bg-card p-5">
          <View className="items-center gap-3">
            <Badge variant={config.badge}>{config.nhan}</Badge>
            <Text className="text-center text-3xl font-bold text-foreground">{config.tieuDe}</Text>
            <Text className="text-center text-sm leading-6 text-muted-foreground">
              {config.moTa}
            </Text>
          </View>

          <View className="gap-3 rounded-2xl border border-warning bg-background p-4">
            <Text className="font-bold text-warning">
              Return status chưa phải Backend verification
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Repository hiện chưa có GET Payment Status cho khách hàng. Màn hình này chỉ normalize
              trạng thái do gateway/return flow chuyển về. Mobile không tự sửa Payment, Order hoặc
              Inventory.
            </Text>
          </View>

          {maDonHang || maGiaoDich ? (
            <View className="gap-3 rounded-2xl border border-border bg-background p-4">
              <Text className="text-lg font-bold text-foreground">Thông tin tham chiếu</Text>
              {maDonHang ? (
                <View className="gap-1">
                  <Text className="text-xs text-muted-foreground">Mã đơn hàng</Text>
                  <Text selectable className="font-semibold text-foreground">
                    {maDonHang}
                  </Text>
                </View>
              ) : null}
              {maGiaoDich ? (
                <View className="gap-1">
                  <Text className="text-xs text-muted-foreground">Mã giao dịch</Text>
                  <Text selectable className="font-semibold text-foreground">
                    {maGiaoDich}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="gap-2 rounded-2xl border border-info bg-background p-4">
            <Text className="font-bold text-info">Mobile deep-link return</Text>
            <Text selectable className="text-xs leading-5 text-muted-foreground">
              {paymentReturnUrl}
            </Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              Expo Router + scheme `agrimarket` sẽ đưa return URL về route `/thanh-toan/ket-qua`.
            </Text>
          </View>

          <View className="gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace(config.actionRoute)}
              className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-primary-foreground">{config.actionLabel}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              className="min-h-12 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 active:opacity-80"
            >
              <Text className="font-semibold text-foreground">Về trang chủ</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
