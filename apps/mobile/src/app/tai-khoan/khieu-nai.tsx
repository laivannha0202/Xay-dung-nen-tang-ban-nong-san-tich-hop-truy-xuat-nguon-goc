import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY,
  layKhieuNaiTaiKhoanMobile,
  nhanLyDoKhieuNaiTaiKhoan,
} from '@/lib/api-tai-khoan';
import { moDangNhap } from '@/lib/auth-navigation';
import { moTabChinh, quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const GIOI_HAN = 20;
const PRIMARY = '#087A4B';

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function TrangKhieuNaiTaiKhoan() {
  const router = useRouter();
  const [trang, setTrang] = useState(1);
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const query = useQuery({
    queryKey: [...KHIEU_NAI_TAI_KHOAN_LIST_QUERY_KEY, trang],
    queryFn: () => layKhieuNaiTaiKhoanMobile({ trang, gioiHan: GIOI_HAN }),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc' || query.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="gap-4 px-5 py-5">
          <Skeleton height={96} borderRadius={20} />
          <Skeleton height={150} borderRadius={20} />
          <Skeleton height={150} borderRadius={20} />
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
            description="Các yêu cầu hỗ trợ liên quan đơn hàng chỉ hiển thị cho đúng chủ tài khoản."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/khieu-nai')}
          />
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
            description="AgriMarket chưa thể tải lịch sử yêu cầu của tài khoản này."
            actionLabel="Thử lại"
            onAction={() => void query.refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tongTrang = Math.max(1, Math.ceil(query.data.tong / query.data.gioiHan));

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
          onPress={() => quayLaiHoacVe(router, '/tai-khoan')}
          className="self-start flex-row items-center gap-1 rounded-full bg-white px-3 py-2 active:opacity-75"
        >
          <Ionicons name="chevron-back" size={18} color={PRIMARY} />
          <Text className="text-[13px] font-bold text-[#087A4B]">Tài khoản</Text>
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1DC]">
            <Ionicons name="chatbox-ellipses-outline" size={25} color="#B76A00" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[29px] font-extrabold tracking-[-0.5px] text-[#17251C]">
              Yêu cầu hỗ trợ
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#748078]">
              {query.data.tong} yêu cầu đã được AgriMarket ghi nhận.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF7EF]">
            <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
          </View>
          <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#617168]">
            Bạn có thể gửi yêu cầu từ chi tiết đơn hàng khi sản phẩm có vấn đề và đính kèm bằng chứng phù hợp.
          </Text>
        </View>

        {query.data.items.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu hỗ trợ"
            description="Nếu cần hỗ trợ về sản phẩm đã mua, hãy mở chi tiết đơn hàng để gửi yêu cầu."
            actionLabel="Xem đơn hàng"
            onAction={() => moTabChinh(router, '/don-hang')}
          />
        ) : (
          <View className="gap-3">
            {query.data.items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Xem yêu cầu cho ${item.tenSanPham}`}
                onPress={() =>
                  router.push({
                    pathname: '/tai-khoan/khieu-nai/[id]',
                    params: { id: item.id },
                  })
                }
                className="rounded-[20px] border border-[#DCE7DF] bg-white p-4 active:opacity-80"
              >
                <View className="flex-row items-start gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF5E8]">
                    <Ionicons name="alert-circle-outline" size={23} color="#B76A00" />
                  </View>
                  <View className="min-w-0 flex-1 gap-2">
                    <View className="flex-row items-start justify-between gap-2">
                      <View className="min-w-0 flex-1 gap-1">
                        <Text numberOfLines={2} className="text-[16px] font-extrabold text-[#263129]">
                          {item.tenSanPham}
                        </Text>
                        <Text className="text-[11px] text-[#8A948E]">Đơn {item.maDonHang}</Text>
                      </View>
                      <Badge variant="warning">{nhanLyDoKhieuNaiTaiKhoan(item.lyDo)}</Badge>
                    </View>

                    <View className="flex-row flex-wrap items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="images-outline" size={15} color="#748078" />
                        <Text className="text-[12px] text-[#748078]">
                          {item.soBangChung} bằng chứng
                        </Text>
                      </View>
                      <Text className="text-[12px] text-[#A0A8A3]">•</Text>
                      <Text className="text-[12px] text-[#748078]">{dinhDangNgay(item.createdAt)}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={19} color="#99A29D" />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {query.data.tong > query.data.gioiHan ? (
          <View className="flex-row items-center justify-between gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-3">
            <Pressable
              accessibilityRole="button"
              disabled={trang <= 1}
              onPress={() => setTrang((value) => Math.max(1, value - 1))}
              className={[
                'min-h-11 flex-1 items-center justify-center rounded-xl border border-[#DCE7DF] px-3',
                trang <= 1 ? 'opacity-40' : 'active:opacity-80',
              ].join(' ')}
            >
              <Text className="font-bold text-[#405047]">Trang trước</Text>
            </Pressable>
            <Text className="text-[13px] font-extrabold text-[#526158]">
              {query.data.trang}/{tongTrang}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={trang >= tongTrang}
              onPress={() => setTrang((value) => value + 1)}
              className={[
                'min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-3',
                trang >= tongTrang ? 'opacity-40' : 'active:opacity-80',
              ].join(' ')}
            >
              <Text className="font-bold text-white">Trang sau</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
