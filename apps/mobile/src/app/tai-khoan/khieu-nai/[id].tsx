import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  khieuNaiTaiKhoanDetailQueryKey,
  layChiTietKhieuNaiTaiKhoanMobile,
  nhanLyDoKhieuNaiTaiKhoan,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';

type BadgeVariant = 'neutral' | 'info' | 'success' | 'danger' | 'warning';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function nhanTrangThaiVanChuyen(value: string): string {
  const labels: Record<string, string> = {
    CREATED: 'Đã tạo vận đơn',
    PICKED_UP: 'Đã lấy hàng',
    IN_TRANSIT: 'Đang vận chuyển',
    OUT_FOR_DELIVERY: 'Đang giao hàng',
    DELIVERED: 'Đã giao',
    FAILED: 'Giao chưa thành công',
    RETURNED: 'Đã hoàn về',
  };
  return labels[value] ?? value;
}

function variantVanChuyen(value: string): BadgeVariant {
  if (value === 'DELIVERED') return 'success';
  if (value === 'IN_TRANSIT' || value === 'OUT_FOR_DELIVERY' || value === 'PICKED_UP') return 'info';
  if (value === 'FAILED' || value === 'RETURNED') return 'danger';
  return 'warning';
}

function DetailSkeleton() {
  return (
    <View className="gap-4">
      <Skeleton height={110} borderRadius={22} />
      <Skeleton height={180} borderRadius={22} />
      <Skeleton height={230} borderRadius={22} />
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietKhieuNaiTaiKhoan() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: khieuNaiTaiKhoanDetailQueryKey(id),
    queryFn: () => layChiTietKhieuNaiTaiKhoanMobile(id),
    enabled: daDangNhap && id.length > 0,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="px-5 py-5">
          <DetailSkeleton />
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
            title="Đăng nhập để xem yêu cầu hỗ trợ"
            description="Chi tiết yêu cầu chỉ hiển thị cho đúng chủ tài khoản."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, `/tai-khoan/khieu-nai/${encodeURIComponent(id)}`)}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="px-5 py-5">
          <DetailSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (query.isError || !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được yêu cầu hỗ trợ"
            description="Yêu cầu không tồn tại, không thuộc tài khoản hoặc hệ thống đang tạm thời không phản hồi."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const complaint = query.data;

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
          accessibilityLabel="Quay lại danh sách yêu cầu hỗ trợ"
          onPress={() => quayLaiHoacVe(router, '/tai-khoan/khieu-nai')}
          className="self-start flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
        >
          <Ionicons name="chevron-back" size={18} color={PRIMARY} />
          <Text className="text-[13px] font-bold text-[#087A4B]">Yêu cầu hỗ trợ</Text>
        </Pressable>

        <View className="gap-3 rounded-[24px] border border-[#F0D9B8] bg-[#FFF9F0] p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 gap-2">
              <Badge variant="warning">{nhanLyDoKhieuNaiTaiKhoan(complaint.lyDo)}</Badge>
              <Text className="text-[24px] font-extrabold leading-8 text-[#17251C]">
                {complaint.mucDonHang.tenSanPham}
              </Text>
              <Text className="text-[12px] text-[#7D817B]">
                Gửi lúc {dinhDangNgay(complaint.createdAt)}
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white">
              <Ionicons name="chatbox-ellipses-outline" size={25} color="#B76A00" />
            </View>
          </View>
        </View>

        <View className="gap-3 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="document-text-outline" size={21} color={PRIMARY} />
            <Text className="text-[18px] font-extrabold text-[#17251C]">Nội dung yêu cầu</Text>
          </View>
          <Text className="text-[14px] leading-6 text-[#4E5C54]">{complaint.moTa}</Text>
        </View>

        <View className="gap-4 rounded-[22px] border border-[#DCE7DF] bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="bag-check-outline" size={21} color={PRIMARY} />
            <Text className="text-[18px] font-extrabold text-[#17251C]">Đơn hàng liên quan</Text>
          </View>

          <View className="gap-3 rounded-2xl bg-[#F7FAF8] p-4">
            <View className="flex-row justify-between gap-3">
              <Text className="text-[12px] text-[#7A857E]">Mã đơn</Text>
              <Text className="text-right text-[13px] font-extrabold text-[#263129]">
                {complaint.donHang.maDonHang}
              </Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="text-[12px] text-[#7A857E]">Nhà cung cấp</Text>
              <Text numberOfLines={2} className="max-w-[65%] text-right text-[13px] font-bold text-[#263129]">
                {complaint.donNhaCungCap.tenNhaCungCap}
              </Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="text-[12px] text-[#7A857E]">Sản phẩm</Text>
              <Text numberOfLines={2} className="max-w-[65%] text-right text-[13px] font-bold text-[#263129]">
                {complaint.mucDonHang.tenSanPham}
              </Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="text-[12px] text-[#7A857E]">Số lượng</Text>
              <Text className="text-[13px] font-bold text-[#263129]">{complaint.mucDonHang.soLuong}</Text>
            </View>
            <View className="flex-row justify-between gap-3">
              <Text className="text-[12px] text-[#7A857E]">Thành tiền</Text>
              <Text className="text-[15px] font-extrabold text-[#087A4B]">
                {dinhDangGia(complaint.mucDonHang.thanhTien)}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/don-hang/[id]',
                params: { id: complaint.donHang.id },
              })
            }
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-4 active:opacity-80"
          >
            <Ionicons name="receipt-outline" size={19} color="#FFFFFF" />
            <Text className="font-extrabold text-white">Xem chi tiết đơn hàng</Text>
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="images-outline" size={21} color={PRIMARY} />
              <Text className="text-[18px] font-extrabold text-[#17251C]">Bằng chứng đã gửi</Text>
            </View>
            <Badge variant="info">{complaint.bangChung.length} tệp</Badge>
          </View>

          {complaint.bangChung.length === 0 ? (
            <View className="rounded-[20px] border border-[#DCE7DF] bg-white p-4">
              <Text className="text-[13px] text-[#748078]">Yêu cầu này không có bằng chứng đính kèm.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {complaint.bangChung.map((evidence) => {
                const laAnh = evidence.mimeType.startsWith('image/');
                const laVideo = evidence.mimeType.startsWith('video/');

                return (
                  <View key={evidence.id} className="overflow-hidden rounded-[20px] border border-[#DCE7DF] bg-white">
                    {laAnh && evidence.urlXem ? (
                      <Image
                        source={{ uri: evidence.urlXem }}
                        contentFit="cover"
                        transition={120}
                        style={{ width: '100%', height: 210 }}
                      />
                    ) : (
                      <View className="h-32 items-center justify-center bg-[#F1F5F2]">
                        <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                          <Ionicons
                            name={laVideo ? 'videocam-outline' : 'document-outline'}
                            size={28}
                            color={PRIMARY}
                          />
                        </View>
                      </View>
                    )}

                    <View className="gap-2 p-4">
                      <Text numberOfLines={2} className="font-extrabold text-[#263129]">{evidence.tenGoc}</Text>
                      <Text className="text-[11px] text-[#89948D]">
                        {laAnh ? 'Ảnh' : laVideo ? 'Video' : 'Tệp đính kèm'} · {dinhDangNgay(evidence.createdAt)}
                      </Text>
                      {evidence.urlXem ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void Linking.openURL(evidence.urlXem!)}
                          className="self-start flex-row items-center gap-1.5 rounded-xl bg-[#EAF7EF] px-3 py-2 active:opacity-75"
                        >
                          <Ionicons name="open-outline" size={16} color={PRIMARY} />
                          <Text className="text-[12px] font-bold text-[#087A4B]">Mở tệp</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {complaint.phanBo.length > 0 ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="git-branch-outline" size={21} color={PRIMARY} />
              <Text className="text-[18px] font-extrabold text-[#17251C]">Lô hàng liên quan</Text>
            </View>
            {complaint.phanBo.map((allocation) => (
              <View key={allocation.tonKhoLoId} className="gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="font-extrabold text-[#263129]">Lô {allocation.maLo}</Text>
                    <Text className="mt-1 text-[12px] text-[#7A857E]">
                      Kho {allocation.maKho} · SL {allocation.soLuong}
                    </Text>
                  </View>
                  {allocation.maTruyXuat ? <Badge variant="success">Có truy xuất</Badge> : null}
                </View>
                {allocation.maTruyXuat ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/truy-xuat/[ma]',
                        params: { ma: allocation.maTruyXuat! },
                      })
                    }
                    className="flex-row items-center justify-center gap-2 rounded-xl bg-[#EAF7EF] px-3 py-2.5 active:opacity-75"
                  >
                    <Ionicons name="qr-code-outline" size={17} color={PRIMARY} />
                    <Text className="text-[12px] font-extrabold text-[#087A4B]">Xem nguồn gốc lô hàng</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="car-outline" size={21} color={PRIMARY} />
            <Text className="text-[18px] font-extrabold text-[#17251C]">Giao hàng liên quan</Text>
          </View>

          {complaint.vanChuyen.length === 0 ? (
            <View className="rounded-[20px] border border-[#DCE7DF] bg-white p-4">
              <Text className="text-[13px] text-[#748078]">Chưa có thông tin vận chuyển liên quan.</Text>
            </View>
          ) : (
            complaint.vanChuyen.map((shipment) => (
              <View key={shipment.id} className="flex-row items-center gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF7EF]">
                  <Ionicons name="car-outline" size={22} color={PRIMARY} />
                </View>
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="font-extrabold text-[#263129]">{shipment.maVanDon}</Text>
                  <Text className="text-[11px] text-[#89948D]">
                    Cập nhật {dinhDangNgay(shipment.updatedAt)}
                  </Text>
                </View>
                <Badge variant={variantVanChuyen(shipment.trangThai)}>
                  {nhanTrangThaiVanChuyen(shipment.trangThai)}
                </Badge>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
