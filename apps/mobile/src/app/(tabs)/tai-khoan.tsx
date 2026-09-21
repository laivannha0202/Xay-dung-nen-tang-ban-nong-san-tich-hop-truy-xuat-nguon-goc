import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { HO_SO_TAI_KHOAN_QUERY_KEY, layHoSoTaiKhoanMobile } from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { dangXuatMobile } from '@/lib/phien-xac-thuc';
import { huyDangKyThongBaoPushMobile } from '@/lib/thong-bao-push';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type Menu = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  href: Href;
};

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'A';
}

function MenuItem({ item, onPress }: { item: Menu; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 border-b border-[#EEF2EF] px-4 py-4 active:bg-[#F8FBF9]">
      <View className="h-11 w-11 items-center justify-center rounded-[15px] bg-[#EAF7EF]">
        <Ionicons name={item.icon} size={22} color={PRIMARY} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-extrabold text-[#202A24]">{item.title}</Text>
        <Text className="mt-0.5 text-[11px] leading-4 text-[#849088]">{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color="#89958E" />
    </Pressable>
  );
}

export default function TrangTaiKhoan() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dangDangXuat, setDangDangXuat] = useState(false);
  const trangThai = useXacThucStore((state) => state.trangThai);
  const nguoiDung = useXacThucStore((state) => state.nguoiDung);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const profileQuery = useQuery({
    queryKey: HO_SO_TAI_KHOAN_QUERY_KEY,
    queryFn: layHoSoTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  const menuTaiKhoan: Menu[] = [
    { icon: 'person-outline', title: 'Hồ sơ cá nhân', description: 'Họ tên, số điện thoại, ngày sinh', href: '/tai-khoan/ho-so' as Href },
    { icon: 'receipt-outline', title: 'Đơn hàng của tôi', description: 'Theo dõi trạng thái và lịch sử mua', href: '/don-hang' as Href },
    { icon: 'location-outline', title: 'Địa chỉ giao hàng', description: 'Quản lý địa chỉ nhận nông sản', href: '/tai-khoan/dia-chi' as Href },
    { icon: 'lock-closed-outline', title: 'Đổi mật khẩu', description: 'Cập nhật mật khẩu tài khoản', href: '/tai-khoan/doi-mat-khau' as Href },
    { icon: 'heart-outline', title: 'Sản phẩm yêu thích', description: 'Danh sách nông sản đã lưu', href: '/tai-khoan/wishlist' as Href },
    { icon: 'storefront-outline', title: 'Trang trại theo dõi', description: 'Trang trại bạn đang quan tâm', href: '/tai-khoan/trang-trai-theo-doi' as Href },
    { icon: 'ticket-outline', title: 'Khuyến mãi', description: 'Voucher và Flash Sale', href: '/khuyen-mai' as Href },
    { icon: 'notifications-outline', title: 'Thông báo', description: 'Đơn hàng, thu hoạch và hệ thống', href: '/tai-khoan/thong-bao' as Href },
    { icon: 'chatbox-ellipses-outline', title: 'Khiếu nại & hỗ trợ', description: 'Theo dõi yêu cầu sau bán', href: '/tai-khoan/khieu-nai' as Href },
    { icon: 'sparkles-outline', title: 'Gợi ý cho bạn', description: 'Nông sản phù hợp từ dữ liệu mua sắm của tài khoản', href: '/goi-y' as Href },
            { icon: 'gift-outline', title: 'Điểm thưởng', description: 'Thông tin chương trình khách hàng', href: '/tai-khoan/diem-thuong' as Href },
  ];

  const menuThongTin: Menu[] = [
    { icon: 'document-text-outline', title: 'Điều khoản sử dụng', description: 'Quy định kênh khách hàng', href: '/dieu-khoan' as Href },
    { icon: 'shield-checkmark-outline', title: 'Chính sách bảo mật', description: 'Cách dữ liệu được sử dụng và bảo vệ', href: '/chinh-sach-bao-mat' as Href },
  ];

  async function logout() {
    if (dangDangXuat) return;
    setDangDangXuat(true);
    try {
      await huyDangKyThongBaoPushMobile();
      await dangXuatMobile();
    } catch {
      // Đăng xuất local vẫn phải hoàn tất khi backend tạm thời không truy cập được.
    } finally {
      queryClient.clear();
      router.replace('/');
      setDangDangXuat(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để xem dữ liệu tài khoản.', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void logout() },
    ]);
  }

  if (trangThai === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
        <View className="gap-4 px-5 py-5"><Skeleton height={50} borderRadius={14} /><Skeleton height={180} borderRadius={20} /><Skeleton height={300} borderRadius={20} /></View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="px-4 pt-2"><MobileBrandBar /></View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            bare
            icon="person-outline"
            title="Bạn chưa đăng nhập"
            description="Đăng nhập để quản lý đơn hàng, địa chỉ, yêu thích, khuyến mãi và thông báo."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan')}
            secondaryActionLabel="Xem nông sản"
            onSecondaryAction={() => router.navigate('/kham-pha')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const profile = profileQuery.data;
  const displayName = profile?.hoTen || nguoiDung?.hoTen || 'Khách hàng AgriMarket';
  const email = profile?.email || nguoiDung?.email || '';

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View className="bg-white px-4 pb-4 pt-2"><MobileBrandBar /></View>
        <View className="px-4 pt-4">
          {profileQuery.isError ? (
            <ErrorState
              title="Không tải được hồ sơ"
              description="Bạn vẫn có thể dùng các chức năng tài khoản bên dưới."
              actionLabel="Thử lại"
              onAction={() => void profileQuery.refetch()}
            />
          ) : (
            <View className="rounded-[22px] bg-[#087A4B] p-5">
              <View className="flex-row items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white/95">
                  <Text className="text-[20px] font-black text-[#087A4B]">{initials(displayName)}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-[20px] font-black text-white">{displayName}</Text>
                  <Text numberOfLines={1} className="mt-1 text-[12px] text-white/80">{email}</Text>
                  {profile?.soDienThoai ? <Text className="mt-0.5 text-[11px] text-white/75">{profile.soDienThoai}</Text> : null}
                </View>
                <Pressable onPress={() => router.push('/tai-khoan/ho-so')} className="h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Ionicons name="create-outline" size={20} color="#FFFFFF" /></Pressable>
              </View>
            </View>
          )}

          <Text className="mb-2 mt-6 text-[13px] font-black uppercase tracking-[0.6px] text-[#5D6C63]">Tài khoản & mua hàng</Text>
          <View className="overflow-hidden rounded-[18px] border border-[#DCE7DF] bg-white">
            {/* AGRIMARKET-MOBILE-CONTRACT-FIX-ACCOUNT-V1 */}
                    {menuTaiKhoan.map((item) => (
                      <MenuItem
                        key={item.title}
                        item={item}
                        onPress={() => {
                          if (item.href === '/goi-y') {
                            router.push('/goi-y');
                            return;
                          }
                          if (item.href === '/tai-khoan/diem-thuong') {
                            router.push('/tai-khoan/diem-thuong');
                            return;
                          }
                          router.push(item.href);
                        }}
                      />
                    ))}
          </View>

          <Text className="mb-2 mt-6 text-[13px] font-black uppercase tracking-[0.6px] text-[#5D6C63]">Thông tin AgriMarket</Text>
          <View className="overflow-hidden rounded-[18px] border border-[#DCE7DF] bg-white">
            {menuThongTin.map((item) => <MenuItem key={item.title} item={item} onPress={() => router.push(item.href)} />)}
          </View>

          <Pressable
            disabled={dangDangXuat}
            onPress={confirmLogout}
            className={`mt-5 min-h-[50px] flex-row items-center justify-center gap-2 rounded-[15px] border border-[#F0C9C5] bg-[#FFF5F4] ${dangDangXuat ? 'opacity-45' : ''}`}
          >
            <Ionicons name="log-out-outline" size={20} color="#B23A2E" />
            <Text className="text-[13px] font-extrabold text-[#B23A2E]">{dangDangXuat ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
