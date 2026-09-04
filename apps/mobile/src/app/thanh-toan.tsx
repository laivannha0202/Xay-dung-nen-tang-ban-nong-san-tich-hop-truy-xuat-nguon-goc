import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import {
  CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
  type CheckoutPreviewMobile,
  layCheckoutPreviewMobile,
  type ThanhPhanCheckoutMobile,
} from '@/lib/api-checkout';
import { taoPaymentReturnUrl } from '@/lib/payment-return';
import { useXacThucStore } from '@/stores/xac-thuc.store';

type PhuongThucHienThi = 'COD' | 'VNPAY_SANDBOX';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function giaTriThanhPhan(thanhPhan: ThanhPhanCheckoutMobile): string {
  if (thanhPhan.giaTri === null) {
    return 'Chưa xác định';
  }

  return dinhDangGia(thanhPhan.giaTri);
}

function CheckoutSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={140} borderRadius={18} />
      <Skeleton height={220} borderRadius={18} />
      <Skeleton height={160} borderRadius={18} />
      <Skeleton height={220} borderRadius={18} />
    </View>
  );
}

function InputField({
  label,
  value,
  placeholder,
  multiline = false,
  keyboardType,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad';
  onChangeText: (value: string) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#737373"
        multiline={multiline}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={[
          'rounded-xl border border-border bg-background px-4 text-foreground',
          multiline ? 'min-h-24 py-3' : 'min-h-12 py-2',
        ].join(' ')}
      />
    </View>
  );
}

function ThanhPhanRow({ nhan, thanhPhan }: { nhan: string; thanhPhan: ThanhPhanCheckoutMobile }) {
  return (
    <View className="gap-1">
      <View className="flex-row items-start justify-between gap-4">
        <Text className="font-semibold text-foreground">{nhan}</Text>
        <Text className="font-bold text-foreground">{giaTriThanhPhan(thanhPhan)}</Text>
      </View>
      <Text className="text-xs leading-5 text-muted-foreground">{thanhPhan.lyDo}</Text>
    </View>
  );
}

function DanhSachSanPham({ preview }: { preview: CheckoutPreviewMobile }) {
  return (
    <View className="gap-3">
      {preview.items.map((item) => (
        <View
          key={item.mucGioHangId}
          className="gap-3 rounded-2xl border border-border bg-background p-4"
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-base font-bold text-foreground">{item.tenSanPham}</Text>
              <Text className="text-sm text-muted-foreground">{item.nhaCungCap.ten}</Text>
              <Text className="text-sm text-foreground">
                SKU {item.sku} · Số lượng {item.soLuong}
              </Text>
            </View>
            <Text className="font-bold text-primary">{dinhDangGia(item.thanhTien)}</Text>
          </View>

          <View className="gap-1">
            <Text className="text-sm text-muted-foreground">
              {dinhDangGia(item.donGia)} × {item.soLuong}
            </Text>
            <Text className={item.coTheDatHang ? 'text-sm text-success' : 'text-sm text-danger'}>
              Tồn khả dụng: {item.soLuongKhaDung} ·{' '}
              {item.coTheDatHang ? 'Có thể đặt hàng' : 'Không đủ tồn hiện tại'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function TrangThanhToan() {
  const router = useRouter();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const nguoiDung = useXacThucStore((state) => state.nguoiDung);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const [hoTen, setHoTen] = useState(nguoiDung?.hoTen ?? '');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChiChiTiet, setDiaChiChiTiet] = useState('');
  const [phuongXa, setPhuongXa] = useState('');
  const [tinhThanh, setTinhThanh] = useState('');
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucHienThi>('COD');
  const paymentReturnUrl = taoPaymentReturnUrl();

  const query = useQuery({
    queryKey: CHECKOUT_PREVIEW_MOBILE_QUERY_KEY,
    queryFn: layCheckoutPreviewMobile,
    enabled: daDangNhap,
    staleTime: 0,
  });

  const diaChiTomTat = useMemo(
    () =>
      [diaChiChiTiet, phuongXa, tinhThanh]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(', '),
    [diaChiChiTiet, phuongXa, tinhThanh],
  );

  const diaChiDayDu =
    hoTen.trim().length > 0 &&
    soDienThoai.trim().length > 0 &&
    diaChiChiTiet.trim().length > 0 &&
    phuongXa.trim().length > 0 &&
    tinhThanh.trim().length > 0;

  if (trangThai === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <View className="flex-1 px-5 py-4">
          <CheckoutSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (!daDangNhap) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Đăng nhập để tiếp tục thanh toán"
            description="Checkout Preview gắn với giỏ hàng và tài khoản khách hàng."
            actionLabel="Đăng nhập"
            onAction={() => router.push('/dang-nhap')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          <CheckoutSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Quay lại</Text>
          </Pressable>
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không lấy được Checkout Preview"
            description="Backend có thể tạm thời không khả dụng hoặc phiên đăng nhập đã hết hạn."
            actionLabel="Thử lại"
            onAction={() => {
              void query.refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const preview = query.data;

  if (preview.items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/gio-hang')}
            className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
          >
            <Text className="font-semibold text-foreground">Giỏ hàng</Text>
          </Pressable>
        </View>
        <View className="flex-1 justify-center px-5">
          <EmptyState
            title="Không có sản phẩm để thanh toán"
            description="Thêm sản phẩm vào giỏ hàng trước khi mở Checkout."
            actionLabel="Khám phá nông sản"
            onAction={() => router.push('/kham-pha')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const coItemKhongHopLe = preview.items.some((item) => !item.coTheDatHang);

  const lyDoKhongTheXacNhan = [
    ...preview.total.lyDoKhongTheXacNhan,
    ...(!diaChiDayDu ? ['Chưa nhập đầy đủ địa chỉ nhận hàng trên Mobile.'] : []),
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between gap-3 border-b border-border bg-background px-5 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/gio-hang')}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Giỏ hàng</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={query.isFetching}
          onPress={() => {
            void query.refetch();
          }}
          className={[
            'rounded-full border border-border bg-card px-4 py-2',
            query.isFetching ? 'opacity-50' : 'active:opacity-80',
          ].join(' ')}
        >
          <Text className="font-semibold text-primary">
            {query.isFetching ? 'Đang đồng bộ' : 'Đồng bộ Preview'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          gap: 24,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <View className="gap-3">
          <View className="self-start">
            <Badge variant="success">Checkout Preview</Badge>
          </View>
          <Text className="text-3xl font-bold text-foreground">Xác nhận thông tin thanh toán</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Preview được tính lại từ Backend
            {nguoiDung?.email ? ` · ${nguoiDung.email}` : ''}. Mobile không tự suy diễn phí vận
            chuyển hay tổng cuối cùng.
          </Text>
        </View>

        {coItemKhongHopLe ? (
          <View className="gap-2 rounded-2xl border border-danger bg-card p-4">
            <Badge variant="danger">Có sản phẩm không còn đủ tồn</Badge>
            <Text className="text-sm leading-5 text-muted-foreground">
              Hãy quay lại giỏ hàng để chỉnh số lượng trước khi tiếp tục.
            </Text>
          </View>
        ) : null}

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">1. Địa chỉ nhận hàng</Text>
            <Badge variant="info">address</Badge>
          </View>

          <View className="gap-2 rounded-xl border border-info bg-background p-3">
            <Text className="text-sm font-semibold text-info">Draft tại Mobile</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              Backend hiện chưa có schema/API địa chỉ cho Checkout. Dữ liệu nhập ở đây chỉ phục vụ
              UI PHIEN-101 và không được ghi xuống Backend.
            </Text>
          </View>

          <InputField
            label="Họ và tên"
            value={hoTen}
            placeholder="Nguyễn Văn A"
            onChangeText={setHoTen}
          />
          <InputField
            label="Số điện thoại"
            value={soDienThoai}
            placeholder="09xxxxxxxx"
            keyboardType="phone-pad"
            onChangeText={setSoDienThoai}
          />
          <InputField
            label="Địa chỉ chi tiết"
            value={diaChiChiTiet}
            placeholder="Số nhà, đường..."
            multiline
            onChangeText={setDiaChiChiTiet}
          />
          <InputField
            label="Phường / Xã"
            value={phuongXa}
            placeholder="Phường / Xã"
            onChangeText={setPhuongXa}
          />
          <InputField
            label="Tỉnh / Thành phố"
            value={tinhThanh}
            placeholder="Tỉnh / Thành phố"
            onChangeText={setTinhThanh}
          />

          <Text className="text-xs leading-5 text-muted-foreground">
            Địa chỉ tóm tắt: {diaChiTomTat || 'Chưa nhập đủ thông tin'}
          </Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">2. Sản phẩm</Text>
            <Badge variant="neutral">items</Badge>
          </View>
          <DanhSachSanPham preview={preview} />
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">3. Phương thức giao hàng</Text>
            <Badge variant="warning">shipping</Badge>
          </View>

          <View className="gap-2 rounded-xl border border-border bg-background p-4 opacity-70">
            <Text className="font-semibold text-foreground">Giao hàng tiêu chuẩn</Text>
            <Text className="text-sm text-muted-foreground">Chưa có biểu phí từ Backend.</Text>
          </View>

          <Text className="text-sm leading-5 text-muted-foreground">{preview.shipping.lyDo}</Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">4. Voucher / Điểm</Text>
            <Badge variant="warning">voucher</Badge>
          </View>

          <View className="gap-2 opacity-60">
            <Text className="text-sm font-semibold text-foreground">Mã ưu đãi</Text>
            <TextInput
              editable={false}
              value=""
              placeholder="Chưa hỗ trợ ở Backend"
              placeholderTextColor="#737373"
              className="min-h-12 rounded-xl border border-border bg-background px-4 py-2 text-foreground"
            />
          </View>

          <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} />
          <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} />
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">5. Phương thức thanh toán</Text>
            <Badge variant="info">payment</Badge>
          </View>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{
              checked: phuongThuc === 'COD',
            }}
            onPress={() => setPhuongThuc('COD')}
            className={[
              'gap-1 rounded-xl border p-4 active:opacity-80',
              phuongThuc === 'COD' ? 'border-primary bg-secondary' : 'border-border bg-background',
            ].join(' ')}
          >
            <Text className="font-bold text-foreground">COD — Thanh toán khi nhận hàng</Text>
            <Text className="text-sm text-muted-foreground">
              Payment lifecycle hiện tại hỗ trợ COD.
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="radio"
            accessibilityState={{
              checked: phuongThuc === 'VNPAY_SANDBOX',
              disabled: true,
            }}
            disabled
            className="gap-1 rounded-xl border border-border bg-background p-4 opacity-50"
          >
            <Text className="font-bold text-foreground">VNPay Sandbox</Text>
            <Text className="text-sm text-muted-foreground">
              Gateway adapter đã có nhưng Backend `taoThanhToan` hiện chưa nhận VNPay. Mobile đã
              chuẩn bị deep-link return flow nhưng không mở gateway URL giả.
            </Text>
            <Text selectable className="text-xs leading-5 text-muted-foreground">
              Return URL: {paymentReturnUrl}
            </Text>
          </Pressable>

          <Text className="text-xs leading-5 text-muted-foreground">
            Backend còn MOCK cho regression/test; Mobile không expose MOCK như phương thức thanh
            toán khách hàng.
          </Text>
        </View>

        <View className="gap-4 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-2xl font-bold text-foreground">6. Tóm tắt đơn hàng</Text>
            <Badge variant="success">summary</Badge>
          </View>

          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-foreground">Tạm tính hàng hóa</Text>
            <Text className="font-bold text-foreground">
              {dinhDangGia(preview.price.tamTinhHangHoa)}
            </Text>
          </View>

          <ThanhPhanRow nhan="Phí vận chuyển" thanhPhan={preview.shipping} />
          <ThanhPhanRow nhan="Khuyến mãi" thanhPhan={preview.promotion} />
          <ThanhPhanRow nhan="Điểm thưởng" thanhPhan={preview.points} />

          <View className="h-px bg-border" />

          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-bold text-foreground">Tổng thanh toán</Text>
              <Text className="text-xs text-muted-foreground">Backend là nguồn sự thật.</Text>
            </View>
            <Text className="text-xl font-bold text-primary">
              {preview.total.tongThanhToan === null
                ? 'Chưa thể chốt'
                : dinhDangGia(preview.total.tongThanhToan)}
            </Text>
          </View>

          {lyDoKhongTheXacNhan.length > 0 ? (
            <View className="gap-2 rounded-xl border border-warning bg-background p-3">
              <Text className="font-semibold text-warning">
                Checkout chưa thể xác nhận giao dịch
              </Text>
              {lyDoKhongTheXacNhan.map((lyDo) => (
                <Text key={lyDo} className="text-sm leading-5 text-muted-foreground">
                  • {lyDo}
                </Text>
              ))}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled
            className="min-h-12 items-center justify-center rounded-xl bg-primary px-4 py-3 opacity-40"
          >
            <Text className="font-semibold text-primary-foreground">Xác nhận đặt hàng</Text>
          </Pressable>

          <Text className="text-xs leading-5 text-muted-foreground">
            PHIEN-101 không tạo giao dịch giả. Chỉ khi Backend có đầy đủ
            address/shipping/voucher/payment/order contract thì CTA xác nhận mới được nối mutation
            thật.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
