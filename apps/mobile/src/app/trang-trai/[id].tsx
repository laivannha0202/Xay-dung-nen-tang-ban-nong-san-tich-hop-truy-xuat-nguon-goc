import {
  dinhDangQuyCachSanPham,
  useLayChiTietTrangTraiCongKhai,
  useLaySanPhamTheoTrangTraiCongKhai,
} from '@agrimarket/api-client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  ProductCard,
  ProductCardSkeleton,
  Skeleton,
} from '@/components/design-system';
import { MobileBrandBar } from '@/components/navigation/mobile-brand-bar';
import { TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY } from '@/lib/api-tai-khoan';
import {
  boTheoDoiTrangTraiMobile,
  layTrangThaiTheoDoiTrangTraiMobile,
  theoDoiTrangTraiMobile,
  trangThaiTheoDoiTrangTraiMobileQueryKey,
} from '@/lib/api-theo-doi-trang-trai';
import { layVaXoaHanhDongSauDangNhap, moDangNhap } from '@/lib/auth-navigation';
import { quayLaiHoacVe } from '@/lib/navigation-mobile';
import { chuanHoaUrlAnhMobile } from '@/lib/url-anh';
import { useXacThucStore } from '@/stores/xac-thuc.store';

type FarmTab = 'gioi-thieu' | 'san-pham' | 'chung-nhan' | 'mua-vu' | 'danh-gia';

const PRIMARY = '#087A4B';
const FARM_TABS = [
  ['gioi-thieu', 'Giới thiệu'],
  ['san-pham', 'Sản phẩm'],
  ['chung-nhan', 'Chứng nhận'],
  ['mua-vu', 'Mùa vụ'],
  ['danh-gia', 'Đánh giá'],
] as const;

function dinhDangSo(value: number): string {
  return value.toLocaleString('vi-VN', { maximumFractionDigits: 3 });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="text-[12px] font-semibold text-[#7A8880]">{label}</Text>
      <Text className="text-[15px] font-bold leading-5 text-[#223028]">{value}</Text>
    </View>
  );
}

function HeaderBack({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      onPress={onPress}
      className="h-10 w-10 items-center justify-center rounded-full bg-[#F2F7F4] active:opacity-70"
    >
      <Ionicons name="chevron-back" size={25} color={PRIMARY} />
    </Pressable>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietTrangTrai() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [tab, setTab] = useState<FarmTab>('gioi-thieu');
  const [anhLoi, setAnhLoi] = useState(false);
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const daDangNhap = trangThaiXacThuc === 'da-dang-nhap';

  const { data, isPending, isError, refetch } = useLayChiTietTrangTraiCongKhai(id);
  const { data: productData, isPending: productPending } = useLaySanPhamTheoTrangTraiCongKhai(id, {
    trang: 1,
    gioiHan: 12,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  const followQuery = useQuery({
    queryKey: trangThaiTheoDoiTrangTraiMobileQueryKey(id),
    queryFn: () => layTrangThaiTheoDoiTrangTraiMobile(id),
    enabled: daDangNhap && Boolean(id),
    staleTime: 30_000,
  });

  const followMutation = useMutation({
    mutationFn: ({ dangTheoDoi }: { dangTheoDoi: boolean }) =>
      dangTheoDoi ? boTheoDoiTrangTraiMobile(id) : theoDoiTrangTraiMobile(id),
    onSuccess: (result) => {
      queryClient.setQueryData(trangThaiTheoDoiTrangTraiMobileQueryKey(id), result);
      void queryClient.invalidateQueries({ queryKey: TRANG_TRAI_THEO_DOI_TAI_KHOAN_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!daDangNhap || !id || followMutation.isPending) return;
    const returnTo = `/trang-trai/${encodeURIComponent(id)}`;
    const pendingAction = layVaXoaHanhDongSauDangNhap(returnTo);
    if (!pendingAction || pendingAction.loai !== 'theo-doi-trang-trai') return;
    if (pendingAction.trangTraiId !== id || followQuery.data?.dangTheoDoi) return;
    followMutation.mutate({ dangTheoDoi: false });
  }, [daDangNhap, followMutation.isPending, followQuery.data?.dangTheoDoi, id]);

  const farm = data?.data;
  const products = productData?.data.duLieu ?? [];
  const mainImage = useMemo(
    () => chuanHoaUrlAnhMobile(farm?.anh[0]?.url ?? null),
    [farm?.anh],
  );
  const dangTheoDoi = followQuery.data?.dangTheoDoi ?? false;

  useEffect(() => {
    setAnhLoi(false);
  }, [mainImage]);

  function moSanPham(productId: string) {
    router.push({ pathname: '/san-pham/[id]', params: { id: productId } });
  }

  function toggleTheoDoi() {
    if (!id || followMutation.isPending) return;
    if (!daDangNhap) {
      const returnTo = `/trang-trai/${encodeURIComponent(id)}`;
      moDangNhap(router, returnTo, {
        loai: 'theo-doi-trang-trai',
        returnTo,
        trangTraiId: id,
      });
      return;
    }
    followMutation.mutate({ dangTheoDoi });
  }

  if (isPending) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="border-b border-[#E1E9E4] bg-white px-5 pb-3 pt-2">
          <MobileBrandBar />
        </View>
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 18, padding: 20 }}>
          <Skeleton height={300} borderRadius={24} />
          <Skeleton width="72%" height={34} />
          <Skeleton width="58%" height={22} />
          <ProductCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !farm) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
        <View className="border-b border-[#E1E9E4] bg-white px-5 pb-3 pt-2">
          <MobileBrandBar />
          <View className="mt-2"><HeaderBack onPress={() => quayLaiHoacVe(router, '/')} /></View>
        </View>
        <View className="flex-1 justify-center px-5">
          <ErrorState
            title="Không tải được trang trại"
            description="Trang trại có thể không còn công khai hoặc dịch vụ đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => void refetch()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7FAF8]" edges={['top', 'bottom']}>
      <View className="border-b border-[#E1E9E4] bg-white px-5 pb-3 pt-2">
        <MobileBrandBar />
        <View className="mt-2 flex-row items-center justify-between gap-3">
          <HeaderBack onPress={() => quayLaiHoacVe(router, '/')} />
          <Text numberOfLines={1} className="min-w-0 flex-1 text-center text-[16px] font-extrabold text-[#17452F]">
            Trang trại AgriMarket
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dangTheoDoi ? 'Bỏ theo dõi trang trại' : 'Theo dõi trang trại'}
            disabled={followMutation.isPending || (daDangNhap && followQuery.isPending)}
            onPress={toggleTheoDoi}
            className={[
              'h-10 min-w-10 flex-row items-center justify-center gap-1.5 rounded-full px-3',
              dangTheoDoi ? 'bg-[#E0F5E9]' : 'bg-[#087A4B]',
              followMutation.isPending ? 'opacity-55' : 'active:opacity-75',
            ].join(' ')}
          >
            <Ionicons
              name={dangTheoDoi ? 'checkmark-circle' : 'add-circle-outline'}
              size={18}
              color={dangTheoDoi ? PRIMARY : '#FFFFFF'}
            />
            <Text className={dangTheoDoi ? 'text-[12px] font-extrabold text-[#087A4B]' : 'text-[12px] font-extrabold text-white'}>
              {followMutation.isPending ? 'Đang lưu' : dangTheoDoi ? 'Đang theo dõi' : 'Theo dõi'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 44 }}
      >
        <View className="bg-white px-5 pb-6 pt-5">
          <View className="overflow-hidden rounded-[24px] border border-[#DCE7DF] bg-[#EEF6F1]">
            {mainImage && !anhLoi ? (
              <Image
                source={{ uri: mainImage }}
                cachePolicy="memory-disk"
                recyclingKey={mainImage}
                contentFit="cover"
                transition={150}
                onError={() => setAnhLoi(true)}
                style={{ width: '100%', height: 300 }}
              />
            ) : (
              <View className="h-[300px] items-center justify-center bg-[#EAF5EE]">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
                  <Ionicons name="leaf-outline" size={34} color={PRIMARY} />
                </View>
                <Text className="mt-3 text-[18px] font-extrabold text-[#075E3B]">AgriMarket Farm</Text>
                <Text className="mt-1 text-[12px] text-[#748279]">Trang trại chưa có ảnh công khai</Text>
              </View>
            )}
          </View>

          <View className="mt-5 gap-3">
            <View className="flex-row flex-wrap gap-2">
              <Badge variant="success">Trang trại xác thực</Badge>
              {farm.chungNhan.length > 0 ? <Badge variant="info">{farm.chungNhan.length} chứng nhận</Badge> : null}
            </View>
            <Text className="text-[30px] font-extrabold leading-9 text-[#17251C]">{farm.ten}</Text>
            <View className="flex-row items-start gap-2">
              <Ionicons name="location-outline" size={19} color="#5E6D64" />
              <Text className="min-w-0 flex-1 text-[14px] leading-5 text-[#65736A]">{farm.diaChi}</Text>
            </View>
            {followMutation.isError ? (
              <View className="rounded-2xl border border-[#F0C8C8] bg-[#FFF7F7] px-4 py-3">
                <Text className="text-[12px] font-semibold text-[#B43F49]">
                  Không cập nhật được trạng thái theo dõi. Hãy thử lại.
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-5 flex-row overflow-hidden rounded-[18px] border border-[#DCE7DF] bg-[#F7FAF8]">
            <View className="flex-1 items-center px-2 py-4">
              <Text className="text-[18px] font-extrabold text-[#075E3B]">
                {farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : '—'}
              </Text>
              <Text className="mt-1 text-[11px] text-[#758179]">Diện tích</Text>
            </View>
            <View className="w-px bg-[#DCE7DF]" />
            <View className="flex-1 items-center px-2 py-4">
              <Text className="text-[18px] font-extrabold text-[#075E3B]">{products.length}</Text>
              <Text className="mt-1 text-[11px] text-[#758179]">Sản phẩm</Text>
            </View>
            <View className="w-px bg-[#DCE7DF]" />
            <View className="flex-1 items-center px-2 py-4">
              <Text className="text-[18px] font-extrabold text-[#075E3B]">{farm.chungNhan.length}</Text>
              <Text className="mt-1 text-[11px] text-[#758179]">Chứng nhận</Text>
            </View>
          </View>
        </View>

        <View className="border-y border-[#E5ECE7] bg-white">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 14 }}
          >
            {FARM_TABS.map(([value, label]) => {
              const selected = tab === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setTab(value)}
                  className={[
                    'rounded-full border px-4 py-2.5 active:opacity-80',
                    selected ? 'border-[#087A4B] bg-[#087A4B]' : 'border-[#DCE7DF] bg-white',
                  ].join(' ')}
                >
                  <Text className={selected ? 'font-extrabold text-white' : 'font-bold text-[#46564D]'}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="gap-6 px-5 py-6">
          {tab === 'gioi-thieu' ? (
            <View className="gap-5">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Giới thiệu trang trại</Text>

              <View className="gap-4 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <InfoRow label="Mã trang trại" value={farm.ma} />
                <View className="h-px bg-[#EEF2EF]" />
                <InfoRow label="Địa chỉ" value={farm.diaChi} />
                <View className="h-px bg-[#EEF2EF]" />
                <InfoRow label="Nhà cung cấp" value={farm.nhaCungCap.ten} />
                <View className="h-px bg-[#EEF2EF]" />
                <InfoRow
                  label="Diện tích"
                  value={farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : 'Chưa cập nhật'}
                />
              </View>

              <View className="gap-4 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="navigate-circle-outline" size={24} color={PRIMARY} />
                  <Text className="text-[17px] font-extrabold text-[#223028]">Vị trí GPS</Text>
                </View>
                {farm.viDo !== null && farm.kinhDo !== null ? (
                  <>
                    <InfoRow label="Vĩ độ" value={String(farm.viDo)} />
                    <InfoRow label="Kinh độ" value={String(farm.kinhDo)} />
                    <Text className="text-[11px] leading-4 text-[#7A8880]">Dữ liệu vị trí do hệ thống trang trại cung cấp.</Text>
                  </>
                ) : (
                  <Text className="text-[13px] text-[#7A8880]">Trang trại chưa cập nhật GPS.</Text>
                )}
              </View>

              {farm.anh.length > 1 ? (
                <View className="gap-3">
                  <Text className="text-[17px] font-extrabold text-[#223028]">Hình ảnh trang trại</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                  >
                    {farm.anh.map((anh) => {
                      const uri = chuanHoaUrlAnhMobile(anh.url);
                      if (!uri) return null;
                      return (
                        <Image
                          key={anh.tepTinId}
                          source={{ uri }}
                          cachePolicy="memory-disk"
                          recyclingKey={uri}
                          contentFit="cover"
                          transition={150}
                          style={{ width: 180, height: 130, borderRadius: 16 }}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}

          {tab === 'san-pham' ? (
            <View className="gap-5">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Sản phẩm từ trang trại</Text>
              {productPending ? (
                <View className="gap-4"><ProductCardSkeleton /><ProductCardSkeleton /></View>
              ) : products.length > 0 ? (
                <View className="gap-4">
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      name={item.ten}
                      farmName={item.trangTrai.ten}
                      price={item.gia.tu}
                      unit={dinhDangQuyCachSanPham(item.quyCach)}
                      imageUrl={item.anhBiaUrl}
                      badges={[
                        { label: item.danhMuc.ten, variant: 'neutral' },
                        {
                          label: item.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                          variant: item.khaDung.coTheDatHang ? 'success' : 'warning',
                        },
                      ]}
                      onPress={() => moSanPham(item.id)}
                    />
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="Chưa có sản phẩm công khai"
                  description="Trang trại chưa có sản phẩm phù hợp để hiển thị."
                />
              )}
            </View>
          ) : null}

          {tab === 'chung-nhan' ? (
            <View className="gap-5">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Chứng nhận</Text>
              {farm.chungNhan.length > 0 ? (
                <View className="gap-3">
                  {farm.chungNhan.map((item) => (
                    <View key={item.id} className="gap-2 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="min-w-0 flex-1 text-[17px] font-extrabold text-[#223028]">{item.loai}</Text>
                        <Badge variant="success">Đã xác minh</Badge>
                      </View>
                      <Text className="text-[13px] font-semibold text-[#35443B]">Mã: {item.ma}</Text>
                      <Text className="text-[13px] text-[#68766D]">Đơn vị cấp: {item.donViCap}</Text>
                      <Text className="text-[13px] text-[#68766D]">Hiệu lực: {item.ngayCap} → {item.ngayHetHan}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="Chưa có chứng nhận công khai"
                  description="Chỉ chứng nhận đã xác minh và còn hiệu lực được hiển thị."
                />
              )}
            </View>
          ) : null}

          {tab === 'mua-vu' ? (
            <View className="gap-5">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Mùa vụ</Text>
              {farm.muaVu.length > 0 ? (
                <View className="gap-3">
                  {farm.muaVu.map((item) => (
                    <View key={item.id} className="gap-2 rounded-[20px] border border-[#DCE7DF] bg-white p-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="min-w-0 flex-1 text-[17px] font-extrabold text-[#223028]">{item.cayTrong}</Text>
                        <Badge variant="info">{item.trangThai}</Badge>
                      </View>
                      <Text className="text-[13px] font-semibold text-[#35443B]">Giống: {item.giong}</Text>
                      <Text className="text-[13px] text-[#68766D]">Trồng {item.ngayTrong} · dự kiến thu hoạch {item.ngayDuKienThuHoach}</Text>
                      <Text className="text-[13px] text-[#68766D]">Sản lượng dự kiến: {dinhDangSo(item.sanLuongDuKienKg)} kg</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState title="Chưa có mùa vụ" description="Hệ thống chưa có dữ liệu mùa vụ cho trang trại này." />
              )}
            </View>
          ) : null}

          {tab === 'danh-gia' ? (
            <View className="gap-5">
              <Text className="text-[22px] font-extrabold text-[#17251C]">Đánh giá</Text>
              <EmptyState
                title="Chưa có đánh giá cấp trang trại"
                description="Đánh giá sản phẩm được xác minh theo đơn hàng; hệ thống chưa cung cấp tổng hợp đánh giá riêng ở cấp trang trại."
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
