import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { router, useRouter, type Href } from 'expo-router';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { layThongBaoInAppMobile, THONG_BAO_IN_APP_QUERY_KEY } from '@/lib/api-thong-bao';
import {
  dangKyThongBaoPushMobile,
  guiThongBaoThuNghiemNoiBo,
  layEasProjectId,
  LOAI_THONG_BAO_PUSH_MOBILE,
  taoDuLieuPushThuHoachMoi,
  type KetQuaDangKyPushMobile,
} from '@/lib/thong-bao-push';
import { useXacThucStore } from '@/stores/xac-thuc.store';

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
  const nav = useRouter();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const inAppQuery = useQuery({
    queryKey: THONG_BAO_IN_APP_QUERY_KEY,
    queryFn: layThongBaoInAppMobile,
    enabled: daDangNhap,
    staleTime: 15_000,
  });

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
          onPress={() => nav.back()}
          className="self-start rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Thông báo</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Đồng bộ in-app notification hiện có với NEW_HARVEST push contract.
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-foreground">In-app · Thu hoạch mới</Text>
            {inAppQuery.data ? (
              <Badge variant="info">{inAppQuery.data.tong} thông báo</Badge>
            ) : null}
          </View>

          {!daDangNhap ? (
            <EmptyState
              title="Đăng nhập để xem thông báo"
              description="Thông báo được lưu theo tài khoản khách hàng."
              actionLabel="Đăng nhập"
              onAction={() => nav.push('/dang-nhap')}
            />
          ) : inAppQuery.isPending ? (
            <View className="gap-3">
              <Skeleton height={120} borderRadius={18} />
              <Skeleton height={120} borderRadius={18} />
            </View>
          ) : inAppQuery.isError || !inAppQuery.data ? (
            <ErrorState
              title="Không tải được thông báo"
              description="Backend chưa trả được danh sách thông báo in-app."
              actionLabel="Thử lại"
              onAction={() => {
                void inAppQuery.refetch();
              }}
            />
          ) : inAppQuery.data.duLieu.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo"
              description="Khi trang trại bạn theo dõi có thu hoạch mới, thông báo sẽ xuất hiện ở đây."
            />
          ) : (
            <View className="gap-3">
              {inAppQuery.data.duLieu.map((item) => {
                const pushData = taoDuLieuPushThuHoachMoi(item);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push(pushData.deepLink as Href)}
                    className="gap-2 rounded-2xl border border-border bg-card p-4 active:opacity-80"
                  >
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Badge variant="success">NEW_HARVEST</Badge>
                      <Text className="font-bold text-foreground">{item.tenTrangTrai}</Text>
                    </View>

                    <Text className="text-sm text-foreground">
                      {item.cayTrong}
                      {item.giong ? ` · ${item.giong}` : ''}
                      {' · '}
                      {item.soLuong} {item.donVi}
                    </Text>

                    <Text className="text-xs text-muted-foreground">
                      Thu hoạch {item.ngayThuHoach}
                      {' · '}
                      Phân loại {item.phanLoai}
                    </Text>

                    <Text selectable className="text-xs text-muted-foreground">
                      Push sync: entityId=
                      {pushData.entityId}
                      {' · '}
                      {pushData.deepLink}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-xl font-bold text-foreground">Expo Push client</Text>

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
          <Badge variant="warning">Production push boundary</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            PHIEN-110 đồng bộ in-app NEW_HARVEST với push payload/deep-link. Repository vẫn chưa có
            Backend device-token registration hoặc push sender, nên không giả production delivery.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">Push event contract</Text>
          <View className="flex-row flex-wrap gap-2">
            {LOAI_THONG_BAO_PUSH_MOBILE.map((type) => (
              <Badge key={type} variant={type === 'NEW_HARVEST' ? 'success' : 'info'}>
                {type}
              </Badge>
            ))}
          </View>
          <Text className="text-sm leading-5 text-muted-foreground">
            NEW_HARVEST hiện có in-app source thật. Các event order/shipment/refund/recall vẫn giữ
            client contract từ PHIEN-106 nhưng chưa có server producer.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="text-lg font-bold text-foreground">Local diagnostic</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Chỉ kiểm tra rendering + notification tap; không phải server push.
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
          <Badge variant="info">PHIEN-111 – MySQL Search Optimization</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            Notification Sync dừng ở contract thật đang có; search optimization thuộc phiên tiếp
            theo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
