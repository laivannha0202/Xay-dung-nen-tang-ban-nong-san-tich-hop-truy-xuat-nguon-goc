import { useLayFlashSaleCongKhaiActive } from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/design-system';
import { Notice, PageHeader, SectionTitle } from '@/components/v2/page-kit';
import {
  KHUYEN_MAI_CONG_KHAI_MOBILE_QUERY_KEY,
  KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY,
  layKhuyenMaiCongKhaiMobile,
  layKhuyenMaiDaLuuMobile,
  luuKhuyenMaiMobile,
} from '@/lib/api-khuyen-mai-mobile';
import { moDangNhap } from '@/lib/auth-navigation';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function tien(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function ngay(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function phamVi(value: 'PLATFORM' | 'DANH_MUC' | 'SAN_PHAM'): string {
  if (value === 'PLATFORM') return 'Toàn sàn';
  if (value === 'DANH_MUC') return 'Theo danh mục';
  return 'Theo sản phẩm';
}

export default function KhuyenMaiMobile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThai = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThai === 'da-dang-nhap';

  const voucherQuery = useQuery({
    queryKey: KHUYEN_MAI_CONG_KHAI_MOBILE_QUERY_KEY,
    queryFn: layKhuyenMaiCongKhaiMobile,
    staleTime: 30_000,
  });
  const daLuuQuery = useQuery({
    queryKey: KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY,
    queryFn: layKhuyenMaiDaLuuMobile,
    enabled: daDangNhap,
    staleTime: 15_000,
  });
  const flashSaleQuery = useLayFlashSaleCongKhaiActive();

  const idsDaLuu = useMemo(() => new Set((daLuuQuery.data ?? []).map((item) => item.id)), [daLuuQuery.data]);
  const chienDich = flashSaleQuery.data?.data ?? [];

  const luuMutation = useMutation({
    mutationFn: luuKhuyenMaiMobile,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_CONG_KHAI_MOBILE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: KHUYEN_MAI_DA_LUU_MOBILE_QUERY_KEY }),
      ]);
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top']}>
      <PageHeader title="Khuyến mãi" subtitle="Voucher và Flash Sale từ backend AgriMarket" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Mã giảm giá" subtitle="Lưu mã vào tài khoản và chọn khi thanh toán" />

        {voucherQuery.isPending ? (
          <Notice title="Đang tải voucher..." />
        ) : voucherQuery.isError ? (
          <ErrorState
            title="Không tải được voucher"
            description="Hãy thử lại sau ít phút."
            actionLabel="Thử lại"
            onAction={() => void voucherQuery.refetch()}
          />
        ) : (voucherQuery.data?.length ?? 0) === 0 ? (
          <EmptyState title="Chưa có voucher đang phát hành" description="Voucher mới sẽ xuất hiện khi chương trình bắt đầu." />
        ) : (
          <View className="gap-3">
            {voucherQuery.data?.map((voucher) => {
              const daLuu = idsDaLuu.has(voucher.id);
              const dangLuu = luuMutation.isPending && luuMutation.variables === voucher.id;
              return (
                <View key={voucher.id} className="overflow-hidden rounded-[18px] border border-[#DCE7DF] bg-white">
                  <View className="flex-row">
                    <View className="w-[72px] items-center justify-center bg-[#087A4B] px-2 py-5">
                      <Ionicons name="ticket-outline" size={27} color="#FFFFFF" />
                      <Text className="mt-1 text-[10px] font-black text-white">AGRI</Text>
                    </View>
                    <View className="min-w-0 flex-1 p-4">
                      <View className="flex-row items-start justify-between gap-2">
                        <Text className="flex-1 text-[18px] font-black text-[#087A4B]">Giảm {tien(voucher.giaTriGiam)}</Text>
                        <View className="rounded-full bg-[#EAF7EF] px-2 py-1"><Text className="text-[9px] font-extrabold text-[#087A4B]">{phamVi(voucher.phamVi)}</Text></View>
                      </View>
                      <Text numberOfLines={1} className="mt-1 text-[14px] font-extrabold text-[#17251C]">{voucher.ten}</Text>
                      {voucher.moTa ? <Text numberOfLines={2} className="mt-1 text-[11px] leading-4 text-[#748078]">{voucher.moTa}</Text> : null}
                      <View className="mt-2 flex-row flex-wrap items-center gap-2">
                        <View className="rounded-md border border-[#C9D8CE] px-2 py-1"><Text className="text-[10px] font-black text-[#425249]">{voucher.ma}</Text></View>
                        <Text className="text-[10px] text-[#748078]">{voucher.donHangToiThieu > 0 ? `Đơn từ ${tien(voucher.donHangToiThieu)}` : 'Không yêu cầu đơn tối thiểu'}</Text>
                      </View>
                      <Text className="mt-2 text-[10px] text-[#748078]">HSD {ngay(voucher.ketThucLuc)}</Text>

                      {!daDangNhap ? (
                        <Pressable onPress={() => moDangNhap(router, '/khuyen-mai')} className="mt-3 self-start rounded-xl bg-[#EAF7EF] px-3 py-2">
                          <Text className="text-[11px] font-extrabold text-[#087A4B]">Đăng nhập để lưu</Text>
                        </Pressable>
                      ) : daLuu ? (
                        <View className="mt-3 self-start flex-row items-center gap-1 rounded-xl bg-[#EAF7EF] px-3 py-2">
                          <Ionicons name="checkmark-circle" size={15} color="#087A4B" />
                          <Text className="text-[11px] font-extrabold text-[#087A4B]">Đã lưu</Text>
                        </View>
                      ) : (
                        <Pressable
                          disabled={luuMutation.isPending}
                          onPress={() => luuMutation.mutate(voucher.id)}
                          className={`mt-3 self-start rounded-xl bg-[#087A4B] px-4 py-2 ${luuMutation.isPending && !dangLuu ? 'opacity-45' : ''}`}
                        >
                          <Text className="text-[11px] font-extrabold text-white">{dangLuu ? 'Đang lưu...' : 'Lưu mã'}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View className="mt-8">
          <SectionTitle title="Flash Sale" subtitle="Giá giảm và tồn kho do server xác nhận" />
          {flashSaleQuery.isPending ? (
            <Notice title="Đang tải Flash Sale..." />
          ) : flashSaleQuery.isError ? (
            <ErrorState
              title="Không tải được Flash Sale"
              description="Chương trình đang tạm thời không khả dụng."
              actionLabel="Thử lại"
              onAction={() => void flashSaleQuery.refetch()}
            />
          ) : chienDich.length === 0 ? (
            <Notice title="Hiện chưa có sản phẩm Flash Sale" />
          ) : (
            <View className="gap-5">
              {chienDich.map((cd) => (
                <View key={cd.id}>
                  <Text className="text-[16px] font-black text-[#B62F2A]">{cd.ten}</Text>
                  {cd.moTa ? <Text className="mt-1 text-[11px] text-[#748078]">{cd.moTa}</Text> : null}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingTop: 10, paddingRight: 14 }}>
                    {(cd.muc ?? []).map((muc) => (
                      <Pressable
                        key={muc.bienTheSanPhamId}
                        onPress={() => router.push({ pathname: '/san-pham/[id]', params: { id: muc.sanPhamId } })}
                        className="w-[170px] overflow-hidden rounded-[16px] border border-[#E6D8D6] bg-white active:opacity-80"
                      >
                        <View className="relative h-[110px] bg-[#FFF7F6]">
                          <Image source={muc.anhBiaUrl ? { uri: muc.anhBiaUrl } : undefined} contentFit="cover" style={{ width: '100%', height: 110 }} />
                          <View className="absolute left-2 top-2 rounded bg-[#D93B35] px-2 py-1"><Text className="text-[10px] font-black text-white">-{muc.phanTramGiam}%</Text></View>
                        </View>
                        <View className="p-3">
                          <Text numberOfLines={2} className="min-h-[36px] text-[13px] font-extrabold leading-[18px] text-[#17251C]">{muc.ten}</Text>
                          <Text className="mt-1 text-[14px] font-black text-[#087A4B]">{tien(muc.giaFlash)}</Text>
                          <Text className="text-[10px] text-[#87918B] line-through">{tien(muc.giaGoc)}</Text>
                          <Text className="mt-1 text-[10px] text-[#6E7D74]">{muc.soLuongKhaDung > 0 ? `Còn ${muc.soLuongKhaDung}` : 'Hết hàng'}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
