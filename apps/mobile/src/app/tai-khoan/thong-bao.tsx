import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { thongBaoLoiApi } from '@/lib/api-error';
import {
  layThongBaoInAppMobile,
  THONG_BAO_IN_APP_QUERY_KEY,
} from '@/lib/api-thong-bao';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import {
  dangKyThongBaoPushMobile,
  taoDuLieuPushThuHoachMoi,
  type KetQuaDangKyPushMobile,
} from '@/lib/thong-bao-push';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type ThongTinDangKy = {
  nhan: string;
  moTa: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
};

function thongTinDangKy(result: KetQuaDangKyPushMobile | null): ThongTinDangKy {
  if (!result) {
    return {
      nhan: 'Chưa bật trên thiết bị này',
      moTa: 'Bật thông báo để không bỏ lỡ cập nhật thu hoạch từ các trang trại bạn theo dõi.',
      variant: 'info',
    };
  }

  switch (result.trangThai) {
    case 'da-dang-ky-backend':
      return {
        nhan: 'Đã bật thông báo',
        moTa: 'Thiết bị này đã sẵn sàng nhận thông báo quan trọng từ AgriMarket.',
        variant: 'success',
      };
    case 'tu-choi-quyen':
      return {
        nhan: 'Chưa cấp quyền thông báo',
        moTa: 'Bạn có thể bật quyền Thông báo trong phần cài đặt ứng dụng của điện thoại.',
        variant: 'warning',
      };
    case 'can-development-build':
      return {
        nhan: 'Chưa hỗ trợ trên bản đang dùng',
        moTa: 'Tính năng thông báo trên thiết bị khả dụng trên bản ứng dụng đã cài đặt đầy đủ.',
        variant: 'warning',
      };
    case 'khong-ho-tro-web':
      return {
        nhan: 'Không hỗ trợ trên nền tảng này',
        moTa: 'Bạn vẫn có thể xem đầy đủ thông báo bên trong AgriMarket.',
        variant: 'info',
      };
    case 'thieu-project-id':
      return {
        nhan: 'Thông báo chưa sẵn sàng',
        moTa: 'Phiên bản ứng dụng hiện tại chưa thể đăng ký nhận thông báo trên thiết bị.',
        variant: 'warning',
      };
    case 'loi-dang-ky-backend':
    case 'loi-lay-token':
      return {
        nhan: 'Chưa thể bật thông báo',
        moTa: 'Hãy kiểm tra kết nối và thử lại sau.',
        variant: 'danger',
      };
  }
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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
  const [loiDangKy, setLoiDangKy] = useState<string | null>(null);

  async function batThongBao() {
    if (dangXuLy || !daDangNhap) return;
    setDangXuLy(true);
    setLoiDangKy(null);

    try {
      setResult(await dangKyThongBaoPushMobile());
    } catch (error) {
      setLoiDangKy(
        thongBaoLoiApi(error, 'Không thể bật thông báo lúc này. Vui lòng thử lại sau.'),
      );
    } finally {
      setDangXuLy(false);
    }
  }

  const pushStatus = thongTinDangKy(result);

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={100} borderRadius={20} />
          <Skeleton height={150} borderRadius={20} />
          <Skeleton height={120} borderRadius={20} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để xem thông báo"
            description="Cập nhật thu hoạch và thông báo tài khoản được đồng bộ theo tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(nav, '/tai-khoan/thong-bao')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View className="pt-2">
          <MobileBrandBar />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại tài khoản"
          onPress={() => quayLaiHoacVe(nav, '/tai-khoan')}
          className="self-start flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
        >
          <Ionicons name="chevron-back" size={18} color={PRIMARY} />
          <Text className="text-[13px] font-bold text-[#087A4B]">Tài khoản</Text>
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F5EA]">
            <Ionicons name="notifications-outline" size={26} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[29px] font-extrabold tracking-[-0.5px] text-[#17251C]">
              Thông báo
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#748078]">
              Theo dõi thu hoạch mới và các cập nhật quan trọng dành cho bạn.
            </Text>
          </View>
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7EF]">
              <Ionicons name="phone-portrait-outline" size={23} color={PRIMARY} />
            </View>
            <View className="min-w-0 flex-1 gap-2">
              <Text className="text-[17px] font-extrabold text-[#263129]">
                Thông báo trên thiết bị
              </Text>
              <View className="self-start">
                <Badge variant={pushStatus.variant}>{pushStatus.nhan}</Badge>
              </View>
              <Text className="text-[12px] leading-5 text-[#748078]">{pushStatus.moTa}</Text>
            </View>
          </View>

          {loiDangKy ? (
            <View className="rounded-2xl border border-[#F0C8C8] bg-[#FFF8F8] p-3">
              <Text className="text-[12px] leading-5 text-[#C93445]">{loiDangKy}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: dangXuLy }}
            disabled={dangXuLy || result?.trangThai === 'da-dang-ky-backend'}
            onPress={() => void batThongBao()}
            className={[
              'min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4',
              dangXuLy || result?.trangThai === 'da-dang-ky-backend'
                ? 'opacity-45'
                : 'active:opacity-80',
            ].join(' ')}
          >
            <Ionicons name="notifications" size={19} color="#FFFFFF" />
            <Text className="font-extrabold text-white">
              {dangXuLy
                ? 'Đang bật thông báo…'
                : result?.trangThai === 'da-dang-ky-backend'
                  ? 'Đã bật thông báo'
                  : 'Bật thông báo'}
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[20px] font-extrabold text-[#17251C]">Thu hoạch mới</Text>
              <Text className="mt-1 text-[12px] text-[#7A857E]">
                Cập nhật từ các trang trại bạn đang theo dõi
              </Text>
            </View>
            {inAppQuery.data ? (
              <Badge variant="info">{inAppQuery.data.tong} thông báo</Badge>
            ) : null}
          </View>

          {inAppQuery.isPending ? (
            <View className="gap-3">
              <Skeleton height={126} borderRadius={20} />
              <Skeleton height={126} borderRadius={20} />
            </View>
          ) : inAppQuery.isError || !inAppQuery.data ? (
            <ErrorState
              title="Không tải được thông báo"
              description={thongBaoLoiApi(
                inAppQuery.error,
                'Không tải được danh sách thông báo lúc này.',
              )}
              actionLabel="Thử lại"
              onAction={() => void inAppQuery.refetch()}
            />
          ) : inAppQuery.data.duLieu.length === 0 ? (
            <EmptyState
              title="Chưa có thông báo mới"
              description="Khi trang trại bạn theo dõi có thu hoạch mới, thông tin sẽ xuất hiện tại đây."
            />
          ) : (
            <View className="gap-3">
              {inAppQuery.data.duLieu.map((item) => {
                const pushData = taoDuLieuPushThuHoachMoi(item);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Xem cập nhật từ ${item.tenTrangTrai}`}
                    onPress={() => nav.push(pushData.deepLink as Href)}
                    className="rounded-[20px] border border-[#DCE7DF] bg-white p-4 active:opacity-80"
                  >
                    <View className="flex-row items-start gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7EF]">
                        <Ionicons name="leaf-outline" size={24} color={PRIMARY} />
                      </View>
                      <View className="min-w-0 flex-1 gap-1.5">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Badge variant="success">Thu hoạch mới</Badge>
                          <Text numberOfLines={1} className="min-w-0 flex-1 font-extrabold text-[#263129]">
                            {item.tenTrangTrai}
                          </Text>
                        </View>
                        <Text className="text-[14px] font-bold text-[#263129]">
                          {item.cayTrong}{item.giong ? ` · ${item.giong}` : ''}
                        </Text>
                        <Text className="text-[12px] leading-5 text-[#748078]">
                          {item.soLuong} {item.donVi} · {item.phanLoai} · thu hoạch {item.ngayThuHoach}
                        </Text>
                        <Text className="text-[11px] text-[#99A29D]">
                          {dinhDangNgay(item.createdAt)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={19} color="#99A29D" />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
