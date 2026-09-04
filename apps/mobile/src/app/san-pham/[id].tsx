import {
  useLayChiTietSanPhamCongKhai,
  useLaySanPhamLienQuanCongKhai,
} from '@agrimarket/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
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
import { GIO_HANG_MOBILE_QUERY_KEY, themMucGioHangMobile } from '@/lib/api-gio-hang';
import { useXacThucStore } from '@/stores/xac-thuc.store';

function dinhDangGia(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} ₫`;
}

function dinhDangSoLuong(value: number): string {
  return value.toLocaleString('vi-VN', {
    maximumFractionDigits: 3,
  });
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-2xl font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

export async function generateStaticParams() {
  return [];
}

export default function TrangChiTietSanPham() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trangThaiXacThuc = useXacThucStore((state) => state.trangThai);
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data, isPending, isError, refetch } = useLayChiTietSanPhamCongKhai(id);
  const { data: relatedData, isPending: relatedPending } = useLaySanPhamLienQuanCongKhai(id);

  const [bienTheDaChonId, setBienTheDaChonId] = useState<string | null>(null);
  const [anhDaChonUrl, setAnhDaChonUrl] = useState<string | null>(null);
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);

  const themGioHangMutation = useMutation({
    mutationFn: ({ bienTheSanPhamId, soLuong }: { bienTheSanPhamId: string; soLuong: number }) =>
      themMucGioHangMobile(bienTheSanPhamId, soLuong),
    onSuccess: (gioHang) => {
      queryClient.setQueryData(GIO_HANG_MOBILE_QUERY_KEY, gioHang);
      setCtaMessage('Đã thêm vào giỏ và đồng bộ với Backend.');
    },
    onError: () => {
      setCtaMessage('Không thêm được vào giỏ. Hãy kiểm tra đăng nhập, giá và tồn hiện tại.');
    },
  });

  const item = data?.data;

  const bienTheDaChon = useMemo(() => {
    if (!item) return null;
    return (
      item.bienThe.find((bienThe) => bienThe.id === bienTheDaChonId) ?? item.bienThe[0] ?? null
    );
  }, [item, bienTheDaChonId]);

  const anhSapXep = useMemo(() => {
    if (!item) return [];
    return [...item.anh].sort(
      (a, b) => Number(b.laAnhBia) - Number(a.laAnhBia) || a.thuTu - b.thuTu,
    );
  }, [item]);

  const anhDangXem = anhSapXep.find((anh) => anh.url === anhDaChonUrl) ?? anhSapXep[0] ?? null;

  const related = relatedData?.data.duLieu ?? [];
  const thuHoach = item?.thuHoachGanNhatTaiTrangTrai ?? null;
  const coTheDatHang = Boolean(bienTheDaChon) && (bienTheDaChon?.soLuongKhaDung ?? 0) > 0;

  function moSanPham(productId: string) {
    router.push({
      pathname: '/san-pham/[id]',
      params: { id: productId },
    });
  }

  function themVaoGioHang() {
    if (!bienTheDaChon || !coTheDatHang) return;

    if (trangThaiXacThuc !== 'da-dang-nhap') {
      setCtaMessage('Hãy đăng nhập để đồng bộ giỏ hàng với Backend.');
      router.push('/dang-nhap');
      return;
    }

    themGioHangMutation.mutate({
      bienTheSanPhamId: bienTheDaChon.id,
      soLuong: 1,
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
          <Skeleton height={320} borderRadius={24} />
          <Skeleton width="40%" height={24} />
          <Skeleton width="85%" height={34} />
          <Skeleton width="60%" height={24} />
          <ProductCardSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !item) {
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
            title="Không tải được sản phẩm"
            description="Sản phẩm có thể không còn công khai hoặc API đang tạm thời không khả dụng."
            actionLabel="Thử lại"
            onAction={() => {
              void refetch();
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

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
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/gio-hang')}
          className="rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
        >
          <Text className="font-semibold text-primary">Giỏ hàng</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 36, padding: 20, paddingBottom: 36 }}
      >
        <View className="gap-3">
          <View className="overflow-hidden rounded-3xl border border-border bg-secondary">
            {anhDangXem ? (
              <Image
                source={{ uri: anhDangXem.url }}
                contentFit="cover"
                transition={150}
                style={{ width: '100%', height: 340 }}
              />
            ) : (
              <View className="h-[340px] items-center justify-center">
                <Text className="text-lg font-bold text-secondary-foreground">AgriMarket</Text>
                <Text className="mt-1 text-sm text-muted-foreground">Chưa có ảnh sản phẩm</Text>
              </View>
            )}
          </View>

          {anhSapXep.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 20 }}
            >
              {anhSapXep.map((anh) => {
                const selected = anh.url === anhDangXem?.url;
                return (
                  <Pressable
                    key={`${anh.url}-${anh.thuTu}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setAnhDaChonUrl(anh.url)}
                    className={[
                      'overflow-hidden rounded-xl border-2',
                      selected ? 'border-primary' : 'border-border',
                    ].join(' ')}
                  >
                    <Image
                      source={{ uri: anh.url }}
                      contentFit="cover"
                      style={{ width: 76, height: 76 }}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View className="gap-4">
          <View className="flex-row flex-wrap gap-2">
            <Badge variant="neutral">{item.danhMuc.ten}</Badge>
            {item.chungNhan.slice(0, 2).map((chungNhan) => (
              <Badge key={`${chungNhan.loai}-${chungNhan.ma}`} variant="success">
                {chungNhan.loai}
              </Badge>
            ))}
          </View>

          <Text className="text-3xl font-bold leading-10 text-foreground">{item.ten}</Text>
          <Text className="text-base leading-6 text-muted-foreground">
            {item.moTa ?? 'Sản phẩm chưa có mô tả chi tiết.'}
          </Text>

          <View className="gap-1 rounded-2xl border border-border bg-card p-4">
            <Text className="text-sm text-muted-foreground">Giá theo biến thể</Text>
            <Text className="text-3xl font-bold text-primary">
              {bienTheDaChon ? dinhDangGia(bienTheDaChon.gia) : dinhDangGia(item.gia.tu)}
            </Text>
            {item.gia.tu !== item.gia.den ? (
              <Text className="text-sm text-muted-foreground">
                Khoảng giá {dinhDangGia(item.gia.tu)} – {dinhDangGia(item.gia.den)}
              </Text>
            ) : null}
          </View>
        </View>

        <Section title="Chọn biến thể">
          {item.bienThe.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {item.bienThe.map((bienThe) => {
                const selected = bienThe.id === bienTheDaChon?.id;
                const outOfStock = bienThe.soLuongKhaDung <= 0;

                return (
                  <Pressable
                    key={bienThe.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled: outOfStock }}
                    disabled={outOfStock}
                    onPress={() => {
                      setBienTheDaChonId(bienThe.id);
                      setCtaMessage(null);
                    }}
                    className={[
                      'rounded-xl border px-4 py-3',
                      selected ? 'border-primary bg-primary' : 'border-border bg-card',
                      outOfStock ? 'opacity-40' : 'active:opacity-80',
                    ].join(' ')}
                  >
                    <Text
                      className={
                        selected
                          ? 'font-semibold text-primary-foreground'
                          : 'font-semibold text-foreground'
                      }
                    >
                      {dinhDangSoLuong(bienThe.khoiLuong)} {bienThe.donVi}
                    </Text>
                    <Text
                      className={
                        selected
                          ? 'mt-1 text-xs text-primary-foreground'
                          : 'mt-1 text-xs text-muted-foreground'
                      }
                    >
                      {dinhDangGia(bienThe.gia)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <EmptyState
              title="Chưa có biến thể"
              description="Backend chưa trả biến thể có thể bán cho sản phẩm này."
            />
          )}
        </Section>

        <Section title="Tồn khả dụng">
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-semibold text-foreground">Trạng thái</Text>
              <Badge variant={coTheDatHang ? 'success' : 'warning'}>
                {coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng'}
              </Badge>
            </View>
            <Text className="text-xl font-bold text-foreground">
              {bienTheDaChon
                ? `${dinhDangSoLuong(bienTheDaChon.soLuongKhaDung)} khả dụng`
                : item.khaDung.lyDo}
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Tồn do Backend tính từ InventoryLot hợp lệ; Mobile không tự suy diễn FEFO hoặc
              reservation.
            </Text>
          </View>
        </Section>

        <Section title="Trang trại">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/trang-trai/[id]',
                params: { id: item.trangTrai.id },
              })
            }
            className="gap-2 rounded-2xl border border-border bg-card p-4 active:opacity-80"
          >
            <Text className="text-xl font-bold text-foreground">{item.trangTrai.ten}</Text>
            <Text className="text-sm text-muted-foreground">{item.trangTrai.diaChi}</Text>
            <Text className="text-sm text-muted-foreground">
              Mã trang trại: {item.trangTrai.ma}
            </Text>
            <Text className="text-sm font-semibold text-primary">Xem chi tiết trang trại</Text>
          </Pressable>
        </Section>

        <Section title="Thu hoạch">
          {thuHoach ? (
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-muted-foreground">Ngày thu hoạch</Text>
                  <Text className="font-semibold text-foreground">{thuHoach.ngayThuHoach}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-muted-foreground">Cây trồng</Text>
                  <Text className="font-semibold text-foreground">{thuHoach.cayTrong}</Text>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-muted-foreground">Giống</Text>
                  <Text className="font-semibold text-foreground">{thuHoach.giong}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-muted-foreground">Phân loại</Text>
                  <Text className="font-semibold text-foreground">{thuHoach.phanLoai}</Text>
                </View>
              </View>
            </View>
          ) : (
            <EmptyState
              title="Chưa có thông tin thu hoạch"
              description="Backend chưa trả dữ liệu thu hoạch gần nhất cho trang trại này."
            />
          )}
        </Section>

        <Section title="Chứng nhận">
          {item.chungNhan.length > 0 ? (
            <View className="gap-3">
              {item.chungNhan.map((chungNhan) => (
                <View
                  key={`${chungNhan.loai}-${chungNhan.ma}`}
                  className="gap-2 rounded-2xl border border-border bg-card p-4"
                >
                  <View className="flex-row items-center justify-between gap-3">
                    <Text className="min-w-0 flex-1 text-lg font-semibold text-foreground">
                      {chungNhan.loai}
                    </Text>
                    <Badge variant="success">Đã xác minh</Badge>
                  </View>
                  <Text className="text-sm text-foreground">Mã: {chungNhan.ma}</Text>
                  <Text className="text-sm text-muted-foreground">
                    {chungNhan.donViCap} · hết hạn {chungNhan.ngayHetHan}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="Chưa có chứng nhận"
              description="Sản phẩm chưa có chứng nhận được Backend công khai."
            />
          )}
        </Section>

        <Section title="Truy xuất nguồn gốc">
          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="self-start">
              <Badge variant="info">Product ≠ Batch</Badge>
            </View>
            <Text className="leading-6 text-foreground">
              Mã truy xuất thuộc lô/QR cụ thể, không thuộc một Product chung. Mobile không gán mã lô
              giả cho toàn bộ sản phẩm.
            </Text>
            <Text className="text-sm leading-5 text-muted-foreground">
              Luồng QR/timeline đúng lô được triển khai ở các phiên Mobile Traceability sau.
            </Text>
          </View>
        </Section>

        <Section title="Có thể bạn cũng quan tâm">
          {relatedPending ? (
            <View className="gap-4">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </View>
          ) : related.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {related.map((product) => (
                <View key={product.id} style={{ width: 280 }}>
                  <ProductCard
                    name={product.ten}
                    farmName={product.trangTrai.ten}
                    price={product.gia.tu}
                    unit="đơn vị"
                    imageUrl={product.anhBiaUrl}
                    badges={[
                      { label: product.danhMuc.ten, variant: 'neutral' },
                      {
                        label: product.khaDung.coTheDatHang ? 'Còn hàng' : 'Tạm hết hàng',
                        variant: product.khaDung.coTheDatHang ? 'success' : 'warning',
                      },
                    ]}
                    onPress={() => moSanPham(product.id)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              title="Chưa có sản phẩm liên quan"
              description="Backend chưa trả sản phẩm liên quan cho danh mục này."
            />
          )}
        </Section>
      </ScrollView>

      <View className="gap-2 border-t border-border bg-background px-5 pb-2 pt-3">
        {ctaMessage ? (
          <Text className="text-center text-xs leading-5 text-muted-foreground">{ctaMessage}</Text>
        ) : null}
        <View className="flex-row items-center gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-xs text-muted-foreground">
              {bienTheDaChon
                ? `${dinhDangSoLuong(bienTheDaChon.khoiLuong)} ${bienTheDaChon.donVi}`
                : 'Chưa có biến thể'}
            </Text>
            <Text className="text-xl font-bold text-primary">
              {bienTheDaChon ? dinhDangGia(bienTheDaChon.gia) : dinhDangGia(item.gia.tu)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!coTheDatHang || themGioHangMutation.isPending}
            onPress={themVaoGioHang}
            className={[
              'min-h-12 min-w-[150px] items-center justify-center rounded-xl bg-primary px-4 py-3',
              coTheDatHang && !themGioHangMutation.isPending ? 'active:opacity-80' : 'opacity-40',
            ].join(' ')}
          >
            <Text className="font-semibold text-primary-foreground">
              {themGioHangMutation.isPending
                ? 'Đang thêm...'
                : coTheDatHang
                  ? 'Thêm vào giỏ'
                  : 'Tạm hết hàng'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
