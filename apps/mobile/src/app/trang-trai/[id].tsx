import {
  useLayChiTietTrangTraiCongKhai,
  useLaySanPhamTheoTrangTraiCongKhai,
} from '@agrimarket/api-client';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

type FarmTab = 'gioi-thieu' | 'san-pham' | 'chung-nhan' | 'mua-vu' | 'danh-gia';

const FARM_TABS = [
  ['gioi-thieu', 'Giới thiệu'],
  ['san-pham', 'Sản phẩm'],
  ['chung-nhan', 'Chứng nhận'],
  ['mua-vu', 'Mùa vụ'],
  ['danh-gia', 'Đánh giá'],
] as const;

function dinhDangSo(value: number): string {
  return value.toLocaleString('vi-VN', {
    maximumFractionDigits: 3,
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="font-semibold text-foreground">{value}</Text>
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietTrangTrai() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [tab, setTab] = useState<FarmTab>('gioi-thieu');

  const { data, isPending, isError, refetch } = useLayChiTietTrangTraiCongKhai(id);

  const { data: productData, isPending: productPending } = useLaySanPhamTheoTrangTraiCongKhai(id, {
    trang: 1,
    gioiHan: 12,
    khaDung: 'TAT_CA',
    sapXep: 'TEN_AZ',
  });

  const farm = data?.data;
  const products = productData?.data.duLieu ?? [];

  function moSanPham(productId: string) {
    router.push({
      pathname: '/san-pham/[id]',
      params: { id: productId },
    });
  }

  if (isPending) {
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
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 20, padding: 20 }}>
          <Skeleton height={300} borderRadius={24} />
          <Skeleton width="70%" height={34} />
          <Skeleton width="55%" height={22} />
          <ProductCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !farm) {
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
            title="Không tải được trang trại"
            description="Trang trại có thể không còn công khai hoặc API đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => {
              void refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const mainImage = farm.anh[0]?.url ?? null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-border bg-background px-5 py-3">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-foreground">Quay lại</Text>
        </Pressable>
        <Text
          className="max-w-[62%] text-right text-sm font-semibold text-foreground"
          numberOfLines={1}
        >
          {farm.ten}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-6 border-b border-border bg-secondary px-5 pb-6 pt-5">
          <View className="overflow-hidden rounded-3xl border border-border bg-card">
            {mainImage ? (
              <Image
                source={{ uri: mainImage }}
                contentFit="cover"
                transition={150}
                style={{ width: '100%', height: 300 }}
              />
            ) : (
              <View className="h-[300px] items-center justify-center">
                <Text className="text-2xl font-bold text-secondary-foreground">FARM</Text>
                <Text className="mt-1 text-sm text-muted-foreground">Chưa có ảnh trang trại</Text>
              </View>
            )}
          </View>

          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2">
              <Badge variant="success">Trang trại</Badge>
              {farm.chungNhan.length > 0 ? (
                <Badge variant="info">Có chứng nhận xác minh</Badge>
              ) : null}
            </View>

            <Text className="text-3xl font-bold leading-10 text-foreground">{farm.ten}</Text>
            <Text className="text-base leading-6 text-muted-foreground">{farm.diaChi}</Text>

            <View className="flex-row gap-3 rounded-2xl bg-card p-4">
              <View className="flex-1 gap-1">
                <Text className="text-lg font-bold text-foreground">
                  {farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : '—'}
                </Text>
                <Text className="text-xs text-muted-foreground">Diện tích</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-lg font-bold text-foreground">{products.length}</Text>
                <Text className="text-xs text-muted-foreground">Sản phẩm đang tải</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-lg font-bold text-foreground">{farm.chungNhan.length}</Text>
                <Text className="text-xs text-muted-foreground">Chứng nhận</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 16 }}
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
                  selected ? 'border-primary bg-primary' : 'border-border bg-card',
                ].join(' ')}
              >
                <Text
                  className={
                    selected
                      ? 'font-semibold text-primary-foreground'
                      : 'font-semibold text-foreground'
                  }
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="gap-6 px-5">
          {tab === 'gioi-thieu' ? (
            <View className="gap-5">
              <Text className="text-2xl font-bold text-foreground">Giới thiệu trang trại</Text>

              <View className="gap-4 rounded-2xl border border-border bg-card p-4">
                <InfoRow label="Mã trang trại" value={farm.ma} />
                <InfoRow label="Địa chỉ" value={farm.diaChi} />
                <InfoRow label="Nhà cung cấp" value={farm.nhaCungCap.ten} />
                <InfoRow
                  label="Diện tích"
                  value={
                    farm.dienTichHa !== null ? `${dinhDangSo(farm.dienTichHa)} ha` : 'Chưa cập nhật'
                  }
                />
              </View>

              <View className="gap-4 rounded-2xl border border-border bg-card p-4">
                <Text className="text-lg font-semibold text-foreground">Vị trí GPS</Text>
                {farm.viDo !== null && farm.kinhDo !== null ? (
                  <>
                    <InfoRow label="Vĩ độ" value={String(farm.viDo)} />
                    <InfoRow label="Kinh độ" value={String(farm.kinhDo)} />
                    <Text className="text-xs leading-5 text-muted-foreground">
                      Dữ liệu vị trí do Backend cung cấp.
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-muted-foreground">
                    Trang trại chưa cập nhật GPS.
                  </Text>
                )}
              </View>

              {farm.anh.length > 1 ? (
                <View className="gap-3">
                  <Text className="text-lg font-semibold text-foreground">Hình ảnh trang trại</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                  >
                    {farm.anh.map((anh) => (
                      <Image
                        key={anh.tepTinId}
                        source={{ uri: anh.url }}
                        contentFit="cover"
                        transition={150}
                        style={{ width: 180, height: 130, borderRadius: 16 }}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          ) : null}

          {tab === 'san-pham' ? (
            <View className="gap-5">
              <Text className="text-2xl font-bold text-foreground">Sản phẩm từ trang trại</Text>
              {productPending ? (
                <View className="gap-4">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </View>
              ) : products.length > 0 ? (
                <View className="gap-4">
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      name={item.ten}
                      farmName={item.trangTrai.ten}
                      price={item.gia.tu}
                      unit="đơn vị"
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
              <Text className="text-2xl font-bold text-foreground">Chứng nhận</Text>
              {farm.chungNhan.length > 0 ? (
                <View className="gap-3">
                  {farm.chungNhan.map((item) => (
                    <View
                      key={item.id}
                      className="gap-2 rounded-2xl border border-border bg-card p-4"
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="min-w-0 flex-1 text-lg font-semibold text-foreground">
                          {item.loai}
                        </Text>
                        <Badge variant="success">Đã xác minh</Badge>
                      </View>
                      <Text className="text-sm text-foreground">Mã: {item.ma}</Text>
                      <Text className="text-sm text-muted-foreground">
                        Đơn vị cấp: {item.donViCap}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Hiệu lực: {item.ngayCap} → {item.ngayHetHan}
                      </Text>
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
              <Text className="text-2xl font-bold text-foreground">Mùa vụ</Text>
              {farm.muaVu.length > 0 ? (
                <View className="gap-3">
                  {farm.muaVu.map((item) => (
                    <View
                      key={item.id}
                      className="gap-2 rounded-2xl border border-border bg-card p-4"
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="min-w-0 flex-1 text-lg font-semibold text-foreground">
                          {item.cayTrong}
                        </Text>
                        <Badge variant="info">{item.trangThai}</Badge>
                      </View>
                      <Text className="text-sm text-foreground">Giống: {item.giong}</Text>
                      <Text className="text-sm text-muted-foreground">
                        Trồng {item.ngayTrong} · dự kiến thu hoạch {item.ngayDuKienThuHoach}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Sản lượng dự kiến: {dinhDangSo(item.sanLuongDuKienKg)} kg
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="Chưa có mùa vụ"
                  description="Backend chưa có dữ liệu mùa vụ cho trang trại này."
                />
              )}
            </View>
          ) : null}

          {tab === 'danh-gia' ? (
            <View className="gap-5">
              <Text className="text-2xl font-bold text-foreground">Đánh giá</Text>
              <EmptyState
                title="Chưa có đánh giá"
                description="Farm Detail không tạo điểm sao hoặc nhận xét giả khi Mobile chưa nối review flow."
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
