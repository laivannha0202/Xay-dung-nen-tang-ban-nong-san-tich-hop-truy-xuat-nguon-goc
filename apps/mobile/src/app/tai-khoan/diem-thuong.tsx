import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, Skeleton } from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import {
  DIEM_THUONG_TONG_QUAN_QUERY_KEY,
  diemThuongGiaoDichQueryKey,
  layGiaoDichDiemThuongMobile,
  layTongQuanDiemThuongMobile,
} from '@/lib/api-diem-thuong';
import { moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { useXacThucStore } from '@/stores/xac-thuc.store';

const PRIMARY = '#087A4B';
const GIOI_HAN = 20;

function dinhDangNgay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function dinhDangDiem(value: number): string {
  const dau = value > 0 ? '+' : '';
  return `${dau}${value.toLocaleString('vi-VN')} điểm`;
}

function DiemThuongSkeleton() {
  return (
    <View className="gap-4 px-5 py-5">
      <Skeleton height={170} borderRadius={24} />
      <Skeleton height={112} borderRadius={20} />
      <Skeleton height={112} borderRadius={20} />
    </View>
  );
}

export default function TrangDiemThuongTaiKhoan() {
  const router = useRouter();
  const [trang, setTrang] = useState(1);
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const tongQuanQuery = useQuery({
    queryKey: DIEM_THUONG_TONG_QUAN_QUERY_KEY,
    queryFn: layTongQuanDiemThuongMobile,
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  const giaoDichQuery = useQuery({
    queryKey: diemThuongGiaoDichQueryKey(trang, GIOI_HAN),
    queryFn: () => layGiaoDichDiemThuongMobile(trang, GIOI_HAN),
    enabled: daDangNhap,
    staleTime: 15_000,
  });

  if (trangThaiXacThuc === 'dang-khoi-phuc') {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <DiemThuongSkeleton />
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
            title="Đăng nhập để xem điểm thưởng"
            description="Số dư và lịch sử điểm chỉ hiển thị cho đúng tài khoản AgriMarket."
            actionLabel="Đăng nhập"
            onAction={() => moDangNhap(router, '/tai-khoan/diem-thuong')}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (tongQuanQuery.isPending || giaoDichQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <DiemThuongSkeleton />
      </SafeAreaView>
    );
  }

  if (
    tongQuanQuery.isError ||
    giaoDichQuery.isError ||
    !tongQuanQuery.data ||
    !giaoDichQuery.data
  ) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="px-5 pt-2">
          <MobileBrandBar />
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được điểm thưởng"
            description="AgriMarket chưa thể tải số dư và lịch sử điểm của tài khoản này."
            actionLabel="Thử lại"
            onAction={() => {
              void Promise.all([tongQuanQuery.refetch(), giaoDichQuery.refetch()]);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tongQuan = tongQuanQuery.data;
  const giaoDich = giaoDichQuery.data;
  const tongTrang = Math.max(1, Math.ceil(giaoDich.tong / giaoDich.gioiHan));

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
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F5EA]">
            <Ionicons name="gift-outline" size={25} color={PRIMARY} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-[29px] font-extrabold tracking-[-0.5px] text-[#17251C]">
              Điểm thưởng
            </Text>
            <Text className="mt-1 text-[13px] leading-5 text-[#748078]">
              Theo dõi số dư và các lần thay đổi điểm trong tài khoản.
            </Text>
          </View>
        </View>

        <View className="overflow-hidden rounded-[26px] bg-[#075E3B] p-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-[12px] font-bold uppercase tracking-[1px] text-[#CDEBDC]">
                Số dư hiện tại
              </Text>
              <Text className="mt-2 text-[38px] font-extrabold tracking-[-1px] text-white">
                {tongQuan.diem.toLocaleString('vi-VN')}
              </Text>
              <Text className="mt-1 text-[14px] font-bold text-[#DDF3E7]">điểm</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/15">
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
            </View>
          </View>

          <View className="mt-5 border-t border-white/15 pt-4">
            <Text className="text-[12px] leading-5 text-[#D6EADF]">
              {tongQuan.tongGiaoDich.toLocaleString('vi-VN')} giao dịch điểm đã được ghi nhận
              {tongQuan.capNhatLuc ? ` · cập nhật ${dinhDangNgay(tongQuan.capNhatLuc)}` : ''}.
            </Text>
          </View>
        </View>

        <View className="flex-row items-start gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF7EF]">
            <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
          </View>
          <Text className="min-w-0 flex-1 text-[12px] leading-5 text-[#617168]">
            Số điểm hiển thị được lấy trực tiếp từ sổ điểm của tài khoản. Việc sử dụng điểm khi thanh toán chỉ xuất hiện khi chương trình áp dụng hỗ trợ tính năng đó.
          </Text>
        </View>

        <View className="gap-3">
          <View className="flex-row items-end justify-between gap-3">
            <View>
              <Text className="text-[20px] font-extrabold text-[#17251C]">Lịch sử điểm</Text>
              <Text className="mt-1 text-[12px] text-[#7A857E]">
                {giaoDich.tong.toLocaleString('vi-VN')} giao dịch
              </Text>
            </View>
          </View>

          {giaoDich.items.length === 0 ? (
            <View className="rounded-[22px] border border-[#DCE7DF] bg-white p-5">
              <View className="items-center gap-3 py-4">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-[#EEF7F1]">
                  <Ionicons name="receipt-outline" size={27} color={PRIMARY} />
                </View>
                <Text className="text-[16px] font-extrabold text-[#263129]">
                  Chưa có giao dịch điểm
                </Text>
                <Text className="text-center text-[12px] leading-5 text-[#7A857E]">
                  Khi tài khoản phát sinh điểm, lịch sử thay đổi sẽ được hiển thị tại đây.
                </Text>
              </View>
            </View>
          ) : (
            giaoDich.items.map((item) => {
              const tangDiem = item.bienDongDiem >= 0;
              return (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 rounded-[20px] border border-[#DCE7DF] bg-white p-4"
                >
                  <View
                    className={[
                      'h-11 w-11 items-center justify-center rounded-2xl',
                      tangDiem ? 'bg-[#EAF7EF]' : 'bg-[#FFF1F1]',
                    ].join(' ')}
                  >
                    <Ionicons
                      name={tangDiem ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={22}
                      color={tangDiem ? PRIMARY : '#C83D3D'}
                    />
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <Text numberOfLines={2} className="text-[14px] font-extrabold text-[#263129]">
                      {item.lyDo?.trim() || 'Điều chỉnh điểm thưởng'}
                    </Text>
                    <Text className="text-[11px] text-[#89948D]">{dinhDangNgay(item.createdAt)}</Text>
                    <Text className="text-[11px] text-[#748078]">
                      Số dư sau giao dịch: {item.soDuSau.toLocaleString('vi-VN')} điểm
                    </Text>
                  </View>
                  <Text
                    className={[
                      'text-[14px] font-extrabold',
                      tangDiem ? 'text-[#087A4B]' : 'text-[#C83D3D]',
                    ].join(' ')}
                  >
                    {dinhDangDiem(item.bienDongDiem)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {giaoDich.tong > giaoDich.gioiHan ? (
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
              {giaoDich.trang}/{tongTrang}
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
