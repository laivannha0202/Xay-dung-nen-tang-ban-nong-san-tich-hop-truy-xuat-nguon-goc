import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import farmMinhBach from '../../../assets/images/home/lower/farm-minh-bach.png';
import farmAnPhu from '../../../assets/images/home/lower/farm-an-phu.png';
import farmPhuNong from '../../../assets/images/home/lower/farm-phu-nong.png';
import farmSongHong from '../../../assets/images/home/lower/farm-song-hong.png';
import sustainableBanner from '../../../assets/images/home/lower/sustainable-banner.png';

import { SmartProductImage } from './smart-product-image';

const GREEN = '#087A4B';
const DARK = '#17251C';
const MUTED = '#7A857E';

export type HomeLowerProduct = {
  id: string;
  ten: string;
  anhBiaUrl?: string | null;
  gia: { tu: number };
  quyCach?: {
    khoiLuong: number;
    donVi: string;
  };
  trangTrai: {
    id?: string;
    ten: string;
    diaChi?: string | null;
  };
  chungNhan?: Array<{ loai?: string | null }>;
  khaDung?: { coTheDatHang?: boolean };
};

type Props = {
  products: HomeLowerProduct[];
  recentProducts: HomeLowerProduct[];
  onProductPress: (id: string) => void;
  onAddToCart: (id: string) => void;
  isAdding?: boolean;
};

const PROMISES = [
  { icon: 'leaf-outline', title: 'Nông sản thật', subtitle: 'Nguồn gốc rõ ràng' },
  { icon: 'shield-checkmark-outline', title: 'Thanh toán an toàn', subtitle: 'Thông tin được bảo vệ' },
  { icon: 'receipt-outline', title: 'Theo dõi đơn hàng', subtitle: 'Cập nhật trạng thái' },
  { icon: 'heart-outline', title: 'Vì cộng đồng', subtitle: 'Nông nghiệp bền vững' },
] as const;

function money(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function formatUnit(quyCach?: { khoiLuong: number; donVi: string }): string | null {
  if (!quyCach || !Number.isFinite(quyCach.khoiLuong) || quyCach.khoiLuong <= 0) return null;

  const unit = quyCach.donVi.trim().toLowerCase();
  const amount = quyCach.khoiLuong;
  if (unit === 'kg' && amount < 1) return `${Math.round(amount * 1000)}g`;
  if ((unit === 'l' || unit === 'lít' || unit === 'lit') && amount < 1) {
    return `${Math.round(amount * 1000)}ml`;
  }

  const value = Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)));
  return `${value}${unit === 'quả' || unit === 'qua' ? ' quả' : unit}`;
}

function SectionHeader({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPress}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
          <Ionicons name="chevron-forward" size={15} color={GREEN} />
        </Pressable>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ProductCompactCard({
  item,
  onPress,
  onAdd,
  disabled,
}: {
  item: HomeLowerProduct;
  onPress: () => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const certificate = item.chungNhan?.find((entry) => entry.loai)?.loai;
  const unit = formatUnit(item.quyCach);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Xem ${item.ten}`}
      style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
    >
      <View style={styles.featuredImage}>
        <SmartProductImage uri={item.anhBiaUrl} name={item.ten} />
        {certificate ? (
          <View style={styles.certificateBadge}>
            <Ionicons name="shield-checkmark" size={11} color={GREEN} />
            <Text numberOfLines={1} style={styles.certificateText}>{certificate}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.featuredInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.ten}</Text>
        <Text numberOfLines={1} style={styles.farmText}>{item.trangTrai.ten}</Text>
        <View style={styles.compactPriceRow}>
          <Text numberOfLines={1} style={styles.price}>{money(item.gia.tu)}</Text>
          {unit ? <Text numberOfLines={1} style={styles.unit}>/ {unit}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${item.ten} vào giỏ`}
          disabled={disabled || item.khaDung?.coTheDatHang === false}
          onPress={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          style={[
            styles.cartButton,
            (disabled || item.khaDung?.coTheDatHang === false) && styles.disabled,
          ]}
        >
          <Ionicons name={disabled ? 'hourglass-outline' : 'cart-outline'} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function farmImage(name: string): ImageSource {
  const normalized = name.toLowerCase();
  if (normalized.includes('an phú') || normalized.includes('an phu')) return farmAnPhu;
  if (normalized.includes('phú nông') || normalized.includes('phu nong')) return farmPhuNong;
  if (normalized.includes('sông hồng') || normalized.includes('song hong')) return farmSongHong;
  return farmMinhBach;
}

function RecentCard({
  item,
  onPress,
  onAdd,
  disabled,
}: {
  item: HomeLowerProduct;
  onPress: () => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const certificate = item.chungNhan?.find((entry) => entry.loai)?.loai;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem lại ${item.ten}`}
      onPress={onPress}
      style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}
    >
      <View style={styles.recentImage}>
        <SmartProductImage uri={item.anhBiaUrl} name={item.ten} />
        {certificate ? (
          <View style={styles.traceBadge}>
            <Ionicons name="shield-checkmark" size={12} color={GREEN} />
            <Text numberOfLines={1} style={styles.traceBadgeText}>{certificate}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} style={styles.recentName}>{item.ten}</Text>
      <Text numberOfLines={1} style={styles.recentFarm}>{item.trangTrai.ten}</Text>
      <View style={styles.recentBottom}>
        <Text style={styles.recentPrice}>{money(item.gia.tu)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${item.ten} vào giỏ`}
          onPress={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          disabled={disabled || item.khaDung?.coTheDatHang === false}
          style={[
            styles.smallCart,
            (disabled || item.khaDung?.coTheDatHang === false) && styles.disabled,
          ]}
        >
          <Ionicons name="cart-outline" size={15} color="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

export function HomeLowerSections({
  products,
  recentProducts,
  onProductPress,
  onAddToCart,
  isAdding,
}: Props) {
  const router = useRouter();
  const openExplore = () => router.push('/kham-pha');

  const featured = products.slice(0, 6);
  const farms = useMemo(() => {
    const map = new Map<string, HomeLowerProduct['trangTrai']>();
    for (const product of products) {
      const key = product.trangTrai.id || product.trangTrai.ten;
      if (!map.has(key)) map.set(key, product.trangTrai);
    }
    return [...map.values()]
      .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'))
      .slice(0, 4);
  }, [products]);

  return (
    <View style={styles.root}>
      {featured.length > 0 ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Sản phẩm nổi bật"
              subtitle="Nông sản đang sẵn sàng đặt hàng"
              onPress={openExplore}
            />
            <View style={styles.grid}>
              {featured.map((item) => (
                <ProductCompactCard
                  key={item.id}
                  item={item}
                  onPress={() => onProductPress(item.id)}
                  onAdd={() => onAddToCart(item.id)}
                  disabled={isAdding}
                />
              ))}
            </View>
          </View>
          <Divider />
        </>
      ) : null}

      {farms.length > 0 ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Trang trại tiêu biểu"
              subtitle="Trang trại đang có sản phẩm công khai"
              onPress={openExplore}
            />
            <View style={styles.farmGrid}>
              {farms.map((farm) => (
                <Pressable
                  key={farm.id || farm.ten}
                  accessibilityRole="button"
                  accessibilityLabel={`Xem ${farm.ten}`}
                  onPress={() => {
                    if (farm.id) {
                      router.push({ pathname: '/trang-trai/[id]', params: { id: farm.id } });
                    } else {
                      openExplore();
                    }
                  }}
                  style={({ pressed }) => [styles.farmCard, pressed && styles.pressed]}
                >
                  <Image source={farmImage(farm.ten)} contentFit="cover" style={styles.farmImage} />
                  <View style={styles.farmInfo}>
                    <Text numberOfLines={2} style={styles.farmName}>{farm.ten}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={12} color="#68746D" />
                      <Text numberOfLines={2} style={styles.metaText}>
                        {farm.diaChi || 'Địa chỉ đang cập nhật'}
                      </Text>
                    </View>
                    <View style={styles.farmButton}>
                      <Text style={styles.farmButtonText}>Xem trang trại</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
          <Divider />
        </>
      ) : null}

      {recentProducts.length > 0 ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Sản phẩm đã xem gần đây"
              subtitle="Những sản phẩm bạn đã quan tâm"
              onPress={openExplore}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRow}
            >
              {recentProducts.slice(0, 4).map((item) => (
                <RecentCard
                  key={item.id}
                  item={item}
                  onPress={() => onProductPress(item.id)}
                  onAdd={() => onAddToCart(item.id)}
                  disabled={isAdding}
                />
              ))}
            </ScrollView>
          </View>
          <Divider />
        </>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tìm hiểu thêm về AgriMarket"
        onPress={openExplore}
        style={({ pressed }) => [styles.bannerWrap, pressed && styles.pressed]}
      >
        <Image source={sustainableBanner} contentFit="cover" style={styles.banner} />
      </Pressable>

      <View style={styles.promiseRow}>
        {PROMISES.map((item) => (
          <View key={item.title} style={styles.promiseItem}>
            <Ionicons name={item.icon} size={22} color={GREEN} />
            <Text style={styles.promiseTitle}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.promiseSubtitle}>{item.subtitle}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', paddingTop: 2, paddingBottom: 8 },
  section: { width: '100%' },
  divider: { height: 8, marginHorizontal: -20, marginVertical: 16, backgroundColor: '#F5F6F5' },
  headerWrap: { marginBottom: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, color: DARK, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.25 },
  subtitle: { marginTop: 2, color: '#929A95', fontSize: 12, lineHeight: 16 },
  viewAll: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 1 },
  viewAllText: { color: GREEN, fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredCard: { width: '48.7%', minHeight: 132, overflow: 'hidden', flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4DF', backgroundColor: '#FFFFFF' },
  featuredImage: { position: 'relative', width: '48%', minHeight: 132, backgroundColor: '#EEF4EF' },
  featuredInfo: { minWidth: 0, flex: 1, paddingHorizontal: 7, paddingVertical: 8 },
  productName: { color: '#202A24', fontSize: 12.5, lineHeight: 15, fontWeight: '800' },
  farmText: { marginTop: 3, color: '#7B857F', fontSize: 8.5 },
  compactPriceRow: { marginTop: 7 },
  price: { color: GREEN, fontSize: 13, lineHeight: 16, fontWeight: '800' },
  unit: { marginTop: 1, color: MUTED, fontSize: 8.5 },
  cartButton: { position: 'absolute', right: 7, bottom: 8, width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: GREEN },
  certificateBadge: { position: 'absolute', left: 5, top: 5, maxWidth: '90%', flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, backgroundColor: '#F1FAF5', paddingHorizontal: 5, paddingVertical: 3 },
  certificateText: { flexShrink: 1, color: GREEN, fontSize: 7.5, fontWeight: '800' },
  farmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  farmCard: { width: '48.7%', minHeight: 148, overflow: 'hidden', flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4DF', backgroundColor: '#FFFFFF' },
  farmImage: { width: '48%', minHeight: 148, backgroundColor: '#EDF4EE' },
  farmInfo: { minWidth: 0, flex: 1, paddingHorizontal: 7, paddingVertical: 8 },
  farmName: { minHeight: 29, color: '#202A24', fontSize: 11.5, lineHeight: 14, fontWeight: '800' },
  metaRow: { marginTop: 5, flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  metaText: { minWidth: 0, flex: 1, color: '#68746D', fontSize: 8.5, lineHeight: 11 },
  farmButton: { marginTop: 'auto', alignItems: 'center', borderRadius: 12, backgroundColor: '#F1FAF5', paddingVertical: 7 },
  farmButtonText: { color: GREEN, fontSize: 8.5, fontWeight: '800' },
  recentRow: { gap: 10, paddingRight: 8 },
  recentCard: { width: 168, overflow: 'hidden', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E2E7E3', backgroundColor: '#FFFFFF', paddingBottom: 9 },
  recentImage: { height: 104, position: 'relative', backgroundColor: '#EEF4EF' },
  traceBadge: { position: 'absolute', right: 6, top: 6, maxWidth: 126, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, backgroundColor: '#E8F7ED', paddingHorizontal: 6, paddingVertical: 4 },
  traceBadgeText: { flexShrink: 1, color: GREEN, fontSize: 8.5, fontWeight: '800' },
  recentName: { marginTop: 7, paddingHorizontal: 8, color: '#202A24', fontSize: 12, fontWeight: '800' },
  recentFarm: { marginTop: 2, paddingHorizontal: 8, color: '#7F8983', fontSize: 9 },
  recentBottom: { marginTop: 7, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentPrice: { color: GREEN, fontSize: 13, fontWeight: '800' },
  smallCart: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN },
  bannerWrap: { width: '100%', overflow: 'hidden', borderRadius: 15 },
  banner: { width: '100%', aspectRatio: 712 / 236 },
  promiseRow: { marginTop: 12, flexDirection: 'row', borderRadius: 14, backgroundColor: '#F8FBF9', paddingVertical: 10 },
  promiseItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  promiseTitle: { marginTop: 4, textAlign: 'center', color: '#234234', fontSize: 8.5, fontWeight: '800' },
  promiseSubtitle: { marginTop: 1, width: '100%', textAlign: 'center', color: '#849087', fontSize: 6.5, lineHeight: 9 },
});
