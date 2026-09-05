import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { HO_SO_TAI_KHOAN_QUERY_KEY, layHoSoTaiKhoanMobile } from '@/lib/api-tai-khoan';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function MucTaiKhoan({
  title,
  description,
  action,
  badge,
  disabled = false,
}: {
  title: string;
  description: string;
  action?: () => void;
  badge?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={disabled ? undefined : 'button'}
      disabled={disabled}
      onPress={action}
      className={[
        'gap-2 rounded-2xl border border-border bg-card p-4',
        disabled ? 'opacity-70' : 'active:opacity-80',
      ].join(' ')}
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text className="min-w-0 flex-1 text-lg font-bold text-foreground">{title}</Text>
        {badge ? <Badge variant="info">{badge}</Badge> : null}
      </View>
      <Text className="text-sm leading-5 text-muted-foreground">{description}</Text>
      {!disabled ? <Text className="text-sm font-semibold text-primary">Mở →</Text> : null}
    </Pressable>
  );
}

export default function TrangTaiKhoan() {
  const router = useRouter();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const profileQuery = useQuery({
    queryKey: HO_SO_TAI_KHOAN_QUERY_KEY,
    queryFn: layHoSoTaiKhoanMobile,
    enabled: daDangNhap,
    staleTime: 30_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={120} borderRadius={18} />
          <Skeleton height={150} borderRadius={18} />
          <Skeleton height={150} borderRadius={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để quản lý tài khoản"
            description="Hồ sơ, địa chỉ, yêu thích, trang trại theo dõi và khiếu nại đều gắn với tài khoản khách hàng."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 20,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-2">
          <Text className="text-3xl font-bold text-foreground">Tài khoản</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Một nơi cho hồ sơ, địa chỉ và các dữ liệu cá nhân đã đồng bộ Backend.
          </Text>
        </View>

        {profileQuery.isPending ? <Skeleton height={124} borderRadius={18} /> : null}

        {profileQuery.isError ? (
          <ErrorState
            title="Không tải được hồ sơ"
            description="Không thể đọc thông tin tài khoản hiện tại."
            actionLabel="Thử lại"
            onAction={() => {
              void profileQuery.refetch();
            }}
          />
        ) : null}

        {profileQuery.data ? (
          <View className="gap-2 rounded-2xl border border-primary bg-card p-4">
            <Badge variant="success">Đã đồng bộ Backend</Badge>
            <Text className="text-2xl font-bold text-foreground">{profileQuery.data.hoTen}</Text>
            <Text className="text-sm text-muted-foreground">{profileQuery.data.email}</Text>
            <Text className="text-sm text-muted-foreground">
              {profileQuery.data.soDienThoai ?? 'Chưa có số điện thoại'}
            </Text>
          </View>
        ) : null}

        <View className="gap-3">
          <MucTaiKhoan
            title="Hồ sơ"
            description="Xem và cập nhật họ tên, số điện thoại, ngày sinh."
            action={() => router.push('/tai-khoan/ho-so')}
          />
          <MucTaiKhoan
            title="Sổ địa chỉ"
            description="Thêm, sửa, đặt mặc định và xóa địa chỉ giao hàng."
            action={() => router.push('/tai-khoan/dia-chi')}
          />
          <MucTaiKhoan
            title="Sản phẩm yêu thích"
            description="Xem wishlist Backend và bỏ sản phẩm khỏi danh sách."
            action={() => router.push('/tai-khoan/wishlist')}
          />
          <MucTaiKhoan
            title="Trang trại theo dõi"
            description="Xem các trang trại đang theo dõi và bỏ theo dõi."
            action={() => router.push('/tai-khoan/trang-trai-theo-doi')}
          />
          <MucTaiKhoan
            title="Khiếu nại của tôi"
            description="Xem lịch sử và chi tiết complaint đã gửi."
            action={() => router.push('/tai-khoan/khieu-nai')}
          />
        </View>

        <View className="gap-3">
          <Text className="text-xl font-bold text-foreground">Chưa có customer API</Text>
          <MucTaiKhoan
            title="Loyalty"
            description="Master có mục loyalty nhưng repository hiện chưa có public/customer API để đọc số dư điểm. Mobile không hiển thị số điểm giả."
            badge="Backend boundary"
            disabled
          />
          <MucTaiKhoan
            title="Voucher"
            description="Khuyến mãi hiện có service nội bộ nhưng chưa có public controller/OpenAPI customer contract. Mobile không tạo mã voucher giả."
            badge="Backend boundary"
            disabled
          />
        </View>

        <View className="gap-2 rounded-2xl border border-info bg-card p-4">
          <Badge variant="info">PHIEN-106 – Push Notification</Badge>
          <Text className="text-sm leading-5 text-muted-foreground">
            Expo Notifications và event order/shipment/refund/new harvest/recall thuộc phiên tiếp
            theo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
