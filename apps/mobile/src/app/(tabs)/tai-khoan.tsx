import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { thongBaoLoiApi } from '@/lib/api-error';
import { moDangNhap } from '@/lib/auth-navigation';
import {
  HO_SO_TAI_KHOAN_QUERY_KEY,
  layHoSoTaiKhoanMobile,
} from '@/lib/api-tai-khoan';
import { dangXuatMobile } from '@/lib/phien-xac-thuc';
import { huyDangKyThongBaoPushMobile } from '@/lib/thong-bao-push';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
};

function MenuItem({ icon, title, description, onPress }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="flex-row items-center gap-4 border-b border-[#EEF2EF] px-4 py-4 active:bg-[#F8FBF9]"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7EF]">
        <Ionicons name={icon} size={24} color={PRIMARY} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-[16px] font-extrabold text-[#202A24]">{title}</Text>
        <Text className="text-[12px] leading-4 text-[#8A948E]">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={21} color="#6D7971" />
    </Pressable>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
}

export default function TrangTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dangDangXuat, setDangDangXuat] = useState(false);
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const profileQuery = useQuery({
    queryKey: HO_SO_TAI_KHOAN_QUERY_KEY,
    queryFn: layHoSoTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  async function thucHienDangXuat() {
    if (dangDangXuat) return;
    setDangDangXuat(true);

    try {
      await huyDangKyThongBaoPushMobile();
      await dangXuatMobile();
    } catch {
      // Logout local vẫn phải hoàn tất nếu hệ thống tạm thời không truy cập được.
    } finally {
      queryClient.clear();
      router.replace('/');
      setDangDangXuat(false);
    }
  }

  function xacNhanDangXuat() {
    Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để xem dữ liệu tài khoản.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => void thucHienDangXuat(),
      },
    ]);
  }

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={54} borderRadius={12} />
          <Skeleton height={190} borderRadius={22} />
          <Skeleton height={280} borderRadius={22} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để quản lý tài khoản"
            description="Hồ sơ, địa chỉ, yêu thích, trang trại theo dõi và khiếu nại đều được đồng bộ với tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>

        <View className="px-5 pt-4">
          {profileQuery.isPending ? <Skeleton height={190} borderRadius={22} /> : null}

          {profileQuery.isError ? (
            <ErrorState
              title="Không tải được hồ sơ"
              description={thongBaoLoiApi(
                profileQuery.error,
                'Không thể đọc thông tin tài khoản hiện tại.',
              )}
              actionLabel="Thử lại"
              onAction={() => void profileQuery.refetch()}
            />
          ) : null}

          {profile ? (
            <View className="overflow-hidden rounded-[22px] border border-[#DCE9E1] bg-[#F1FAF5] p-5">
              <View className="flex-row items-center gap-4">
                <View className="h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-white bg-[#DDF2E5]">
                  <Text className="text-[24px] font-extrabold text-[#075E3B]">{initials(profile.hoTen)}</Text>
                </View>
                <View className="min-w-0 flex-1 gap-1">
                  <Text numberOfLines={2} className="text-[23px] font-extrabold text-[#17251C]">
                    {profile.hoTen}
                  </Text>
                  <Text numberOfLines={1} className="text-[14px] text-[#78847C]">{profile.email}</Text>
                  {profile.soDienThoai ? (
                    <Text className="text-[13px] text-[#78847C]">{profile.soDienThoai}</Text>
                  ) : null}
                  <View className="mt-1 self-start flex-row items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
                    <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
                    <Text className="text-[12px] font-bold text-[#087A4B]">Tài khoản đã xác thực</Text>
                  </View>
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/tai-khoan/ho-so')}
                className="mt-4 flex-row items-center gap-3 rounded-2xl bg-[#DFF3E7] px-4 py-3 active:opacity-80"
              >
                <Ionicons name="leaf-outline" size={23} color={PRIMARY} />
                <View className="min-w-0 flex-1">
                  <Text className="font-extrabold text-[#1F4B35]">Cùng AgriMarket lan tỏa nông sản sạch</Text>
                  <Text className="mt-0.5 text-[12px] text-[#617168]">Cập nhật hồ sơ để trải nghiệm mua sắm thuận tiện hơn</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PRIMARY} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <View className="mt-5 px-5">
          <View className="overflow-hidden rounded-[20px] border border-[#E2E9E5] bg-white">
            <MenuItem
              icon="clipboard-outline"
              title="Đơn hàng của tôi"
              description="Theo dõi đơn hàng và tiến trình giao nhận"
              onPress={() => router.push('/don-hang')}
            />
            <MenuItem
              icon="location-outline"
              title="Sổ địa chỉ"
              description="Quản lý địa chỉ nhận hàng"
              onPress={() => router.push('/tai-khoan/dia-chi')}
            />
            <MenuItem
              icon="heart-outline"
              title="Yêu thích"
              description="Sản phẩm bạn đã lưu"
              onPress={() => router.push('/tai-khoan/wishlist')}
            />
            <MenuItem
              icon="business-outline"
              title="Trang trại theo dõi"
              description="Các trang trại bạn đang quan tâm"
              onPress={() => router.push('/tai-khoan/trang-trai-theo-doi')}
            />
          </View>
        </View>

        <View className="mt-4 px-5">
          <View className="overflow-hidden rounded-[20px] border border-[#E2E9E5] bg-white">
            <MenuItem
              icon="notifications-outline"
              title="Thông báo"
              description="Thu hoạch mới và cập nhật liên quan"
              onPress={() => router.push('/tai-khoan/thong-bao')}
            />
            <MenuItem
              icon="warning-outline"
              title="Khiếu nại của tôi"
              description="Theo dõi các yêu cầu hỗ trợ đã gửi"
              onPress={() => router.push('/tai-khoan/khieu-nai')}
            />
            <MenuItem
              icon="person-outline"
              title="Hồ sơ cá nhân"
              description="Họ tên, số điện thoại và ngày sinh"
              onPress={() => router.push('/tai-khoan/ho-so')}
            />
          </View>
        </View>

        <View className="mx-5 mt-5 flex-row items-center gap-4 rounded-[20px] bg-[#EFF8F2] p-5">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
            <Ionicons name="earth-outline" size={29} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[17px] font-extrabold text-[#17452F]">Vì một nền nông nghiệp bền vững</Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#6B786F]">Nông sản sạch, cuộc sống xanh</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi AgriMarket"
          disabled={dangDangXuat}
          onPress={xacNhanDangXuat}
          className={[
            'mx-5 mt-5 min-h-14 flex-row items-center justify-center gap-2 rounded-[18px] border border-[#F0C8C8] bg-[#FFF8F8] px-4',
            dangDangXuat ? 'opacity-50' : 'active:opacity-80',
          ].join(' ')}
        >
          <Ionicons name="log-out-outline" size={24} color="#DC3E3E" />
          <Text className="text-[16px] font-extrabold text-[#DC3E3E]">
            {dangDangXuat ? 'Đang đăng xuất…' : 'Đăng xuất'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
