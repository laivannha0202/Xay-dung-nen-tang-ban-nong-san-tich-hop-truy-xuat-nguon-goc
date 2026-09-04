import { useLayDanhSachSanPhamCongKhai } from '@agrimarket/api-client';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Badge,
  EmptyState,
  ErrorState,
  FarmCard,
  ProductCard,
  ProductCardSkeleton,
  type ProductCardBadge,
} from '@/components/design-system';
import { HarvestProductCard } from '@/components/home/harvest-product-card';
import { HomeSection } from '@/components/home/home-section';

const GIOI_HAN_TRANG_CHU = 24;
const SO_SAN_PHAM_SECTION = 6;
const SO_SAN_PHAM_MOI_THU_HOACH = 3;

function chuanHoa(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function HomeAction({
  label,
  secondary = false,
  onPress,
}: {
  label: string;
  secondary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={[
        'min-h-12 flex-1 items-center justify-center rounded-xl px-4 py-3 active:opacity-80',
        secondary ? 'border border-border bg-card' : 'bg-primary',
      ].join(' ')}
    >
      <Text
        className={
          secondary ? 'font-semibold text-foreground' : 'font-semibold text-primary-foreground'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HorizontalProductList({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 20 }}
    >
      {children}
    </ScrollView>
  );
}

export default function TrangChu() {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useLayDanhSachSanPhamCongKhai({
    trang: 1,
    gioiHan: GIOI_HAN_TRANG_CHU,
  });

  const response = data?.data;
  const sanPham = response?.duLieu ?? [];

  const danhMuc = Array.from(
    sanPham
      .reduce(
        (map, item) => {
          const current = map.get(item.danhMuc.id);
          map.set(item.danhMuc.id, {
            ...item.danhMuc,
            soSanPham: (current?.soSanPham ?? 0) + 1,
          });
          return map;
        },
        new Map<
          string,
          {
            id: string;
            ten: string;
            slug: string;
            soSanPham: number;
          }
        >(),
      )
      .values(),
  )
    .sort((a, b) => b.soSanPham - a.soSanPham)
    .slice(0, 8);

  const trangTrai = Array.from(
    sanPham
      .reduce(
        (map, item) => {
          const current = map.get(item.trangTrai.id);
          map.set(item.trangTrai.id, {
            ...item.trangTrai,
            soSanPham: (current?.soSanPham ?? 0) + 1,
            daXacMinh: (current?.daXacMinh ?? false) || item.chungNhan.length > 0,
            chungNhan: current?.chungNhan ?? item.chungNhan[0]?.loai ?? null,
          });
          return map;
        },
        new Map<
          string,
          {
            id: string;
            ma: string;
            ten: string;
            diaChi: string;
            soSanPham: number;
            daXacMinh: boolean;
            chungNhan: string | null;
          }
        >(),
      )
      .values(),
  )
    .sort(
      (a, b) =>
        Number(b.daXacMinh) - Number(a.daXacMinh) ||
        b.soSanPham - a.soSanPham ||
        a.ten.localeCompare(b.ten, 'vi'),
    )
    .slice(0, 4);

  const organic = sanPham
    .filter((item) =>
      item.chungNhan.some((chungNhan) => {
        const value = chuanHoa(chungNhan.loai);
        return value.includes('organic') || value.includes('huu co');
      }),
    )
    .slice(0, SO_SAN_PHAM_SECTION);

  const conHang = sanPham.filter((item) => item.khaDung.coTheDatHang);

  const goiY = [...sanPham]
    .sort(
      (a, b) =>
        Number(b.khaDung.coTheDatHang) - Number(a.khaDung.coTheDatHang) ||
        b.chungNhan.length - a.chungNhan.length ||
        b.khaDung.soLuongKhaDung - a.khaDung.soLuongKhaDung ||
        a.gia.tu - b.gia.tu ||
        a.ten.localeCompare(b.ten, 'vi'),
    )
    .slice(0, SO_SAN_PHAM_SECTION);

  const theoMua = Array.from(
    conHang.reduce((map, item) => {
      if (!map.has(item.danhMuc.id)) {
        map.set(item.danhMuc.id, item);
      }
      return map;
    }, new Map<string, (typeof conHang)[number]>()),
  )
    .map(([, item]) => item)
    .slice(0, SO_SAN_PHAM_SECTION);

  const moiThuHoach = (conHang.length > 0 ? conHang : sanPham).slice(0, SO_SAN_PHAM_MOI_THU_HOACH);

  function badgesSanPham(
    item: (typeof sanPham)[number],
    custom?: ProductCardBadge[],
  ): ProductCardBadge[] {
    if (custom) return custom;

    const badges: ProductCardBadge[] = [{ label: item.danhMuc.ten, variant: 'neutral' }];

    if (item.chungNhan[0]?.loai) {
      badges.push({ label: item.chungNhan[0].loai, variant: 'success' });
    }

    if (!item.khaDung.coTheDatHang) {
      badges.push({ label: 'Tạm hết hàng', variant: 'warning' });
    }

    return badges.slice(0, 2);
  }

  function cardSanPham(item: (typeof sanPham)[number], custom?: ProductCardBadge[]) {
    return (
      <View key={item.id} style={{ width: 280 }}>
        <ProductCard
          name={item.ten}
          farmName={item.trangTrai.ten}
          price={item.gia.tu}
          unit="đơn vị"
          imageUrl={item.anhBiaUrl}
          badges={badgesSanPham(item, custom)}
          onPress={() =>
            router.push({
              pathname: '/san-pham/[id]',
              params: { id: item.id },
            })
          }
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-8 px-5 pb-8 pt-5">
          <View className="gap-5 rounded-3xl bg-secondary p-5">
            <View className="flex-row flex-wrap gap-2">
              <Badge variant="success">Nông sản minh bạch</Badge>
              <Badge variant="info">Truy xuất nguồn gốc</Badge>
            </View>

            <View className="gap-3">
              <Text className="text-4xl font-bold leading-[44px] text-foreground">
                Nông sản rõ nguồn gốc, gần hơn với người mua
              </Text>
              <Text className="text-base leading-6 text-muted-foreground">
                Khám phá nông sản từ các trang trại, xem chứng nhận và kết nối với dữ liệu truy xuất
                trên cùng một ứng dụng.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <HomeAction label="Khám phá" onPress={() => router.push('/kham-pha')} />
              <HomeAction label="Quét QR" secondary onPress={() => router.push('/quet-qr')} />
            </View>

            <View className="flex-row rounded-2xl bg-primary p-4">
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold text-primary-foreground">
                  {response?.tong ?? 0}
                </Text>
                <Text className="text-xs text-primary-foreground">sản phẩm</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold text-primary-foreground">{danhMuc.length}</Text>
                <Text className="text-xs text-primary-foreground">danh mục</Text>
              </View>
              <View className="flex-1 gap-1">
                <Text className="text-xl font-bold text-primary-foreground">
                  {trangTrai.length}
                </Text>
                <Text className="text-xs text-primary-foreground">trang trại</Text>
              </View>
            </View>
          </View>

          {isPending ? (
            <HomeSection
              label="Đang tải"
              title="Nông sản từ AgriMarket"
              description="Đang lấy dữ liệu sản phẩm công khai."
            >
              <View className="gap-4">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            </HomeSection>
          ) : isError ? (
            <ErrorState
              title="Không tải được Trang chủ"
              description="Không thể lấy danh sách sản phẩm công khai từ API."
              actionLabel="Thử lại"
              onAction={() => {
                void refetch();
              }}
            />
          ) : sanPham.length === 0 ? (
            <EmptyState
              title="Chưa có nông sản công khai"
              description="Trang chủ sẽ tự hiển thị dữ liệu khi sản phẩm được công khai."
            />
          ) : (
            <View className="gap-12">
              <HomeSection
                label="Danh mục"
                title="Khám phá theo nhóm nông sản"
                description="Các danh mục được tổng hợp trực tiếp từ sản phẩm công khai."
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingRight: 20 }}
                >
                  {danhMuc.map((item) => (
                    <View
                      key={item.id}
                      className="min-w-[150px] gap-1 rounded-2xl border border-border bg-card p-4"
                    >
                      <Text className="font-semibold text-foreground">{item.ten}</Text>
                      <Text className="text-sm text-muted-foreground">
                        {item.soSanPham} sản phẩm
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </HomeSection>

              <HomeSection
                label="Mới thu hoạch"
                title="Thông tin thu hoạch gần nhất"
                description="Đọc chi tiết sản phẩm để hiển thị ngày thu hoạch thật từ Backend."
              >
                <HorizontalProductList>
                  {moiThuHoach.map((item) => (
                    <View key={item.id} style={{ width: 280 }}>
                      <HarvestProductCard id={item.id} />
                    </View>
                  ))}
                </HorizontalProductList>
              </HomeSection>

              <HomeSection
                label="Organic"
                title="Nông sản có chứng nhận hữu cơ"
                description="Chỉ hiển thị sản phẩm có chứng nhận Organic/Hữu cơ từ API."
              >
                {organic.length > 0 ? (
                  <HorizontalProductList>
                    {organic.map((item) =>
                      cardSanPham(item, [
                        { label: 'Organic', variant: 'success' },
                        { label: item.danhMuc.ten, variant: 'neutral' },
                      ]),
                    )}
                  </HorizontalProductList>
                ) : (
                  <EmptyState
                    title="Chưa có sản phẩm Organic"
                    description="Không gắn nhãn Organic nếu API chưa có chứng nhận phù hợp."
                  />
                )}
              </HomeSection>

              <HomeSection
                label="Trang trại nổi bật"
                title="Nguồn cung đang có nhiều nông sản"
                description="Xếp hạng rule-based theo chứng nhận và số sản phẩm xuất hiện trong feed."
              >
                <View className="gap-3">
                  {trangTrai.map((item) => (
                    <FarmCard
                      key={item.id}
                      name={item.ten}
                      address={item.diaChi}
                      certification={item.daXacMinh ? (item.chungNhan ?? 'Có chứng nhận') : null}
                      onPress={() =>
                        router.push({
                          pathname: '/trang-trai/[id]',
                          params: { id: item.id },
                        })
                      }
                    />
                  ))}
                </View>
              </HomeSection>

              <HomeSection
                label="Theo mùa"
                title="Lựa chọn đa dạng theo nhóm nông sản"
                description="Ưu tiên còn hàng và mỗi danh mục một sản phẩm; không giả dữ liệu mùa vụ chưa có trong list API."
              >
                <HorizontalProductList>
                  {theoMua.map((item) =>
                    cardSanPham(item, [
                      { label: 'Theo mùa', variant: 'info' },
                      { label: item.danhMuc.ten, variant: 'neutral' },
                    ]),
                  )}
                </HorizontalProductList>
              </HomeSection>

              <HomeSection
                label="Gợi ý"
                title="Gợi ý cho bạn hôm nay"
                description="Recommendation MVP xếp hạng theo khả dụng, chứng nhận và lượng tồn."
              >
                <HorizontalProductList>
                  {goiY.map((item) => cardSanPham(item))}
                </HorizontalProductList>
              </HomeSection>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
