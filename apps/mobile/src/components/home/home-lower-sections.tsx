import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import featuredRauCai from '../../../assets/images/home/lower/featured-rau-cai.png';
import featuredCaRot from '../../../assets/images/home/lower/featured-ca-rot.png';
import featuredBiDo from '../../../assets/images/home/lower/featured-bi-do.png';
import featuredThitHeo from '../../../assets/images/home/lower/featured-thit-heo.png';
import featuredCaHoi from '../../../assets/images/home/lower/featured-ca-hoi.png';
import featuredGaoSt25 from '../../../assets/images/home/lower/featured-gao-st25.png';
import farmMinhBach from '../../../assets/images/home/lower/farm-minh-bach.png';
import farmAnPhu from '../../../assets/images/home/lower/farm-an-phu.png';
import farmPhuNong from '../../../assets/images/home/lower/farm-phu-nong.png';
import farmSongHong from '../../../assets/images/home/lower/farm-song-hong.png';
import sustainableBanner from '../../../assets/images/home/lower/sustainable-banner.png';

import { SmartProductImage } from './smart-product-image';

const GREEN = '#0B8F4D';
const DARK = '#17251C';
const MUTED = '#7A857E';
const STAR = '#FFB51B';

export type HomeLowerProduct = {
  id: string;
  ten: string;
  anhBiaUrl?: string | null;
  gia: { tu: number };
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

type FallbackProduct = {
  name: string;
  price: number;
  unit: string;
  image: ImageSource;
};

const FALLBACK_FEATURED: FallbackProduct[] = [
  { name: 'Rau cải xanh', price: 20_000, unit: '300g', image: featuredRauCai },
  { name: 'Cà rốt hữu cơ', price: 25_000, unit: '500g', image: featuredCaRot },
  { name: 'Bí đỏ', price: 30_000, unit: '1kg', image: featuredBiDo },
  { name: 'Thịt heo sạch', price: 150_000, unit: '500g', image: featuredThitHeo },
  { name: 'Cá hồi tươi', price: 220_000, unit: '300g', image: featuredCaHoi },
  { name: 'Gạo ST25', price: 120_000, unit: '1kg', image: featuredGaoSt25 },
];

const KNOWLEDGE = [
  {
    title: 'Cách nhận biết rau sạch và an toàn',
    date: '05/09/2026',
    views: '1.2k',
    image: featuredRauCai,
    badge: 'MẸO HAY',
  },
  {
    title: 'Lợi ích của việc sử dụng nông sản hữu cơ',
    date: '03/09/2026',
    views: '856',
    image: farmAnPhu,
    badge: 'BẢO QUẢN',
  },
  {
    title: 'Quy trình trồng lúa đạt chuẩn VietGAP',
    date: '28/08/2026',
    views: '642',
    image: farmPhuNong,
    badge: 'KIẾN THỨC',
  },
] as const;

const PROMISES = [
  { icon: 'leaf-outline', title: 'Nông sản thật', subtitle: 'Nguồn gốc rõ ràng' },
  { icon: 'shield-checkmark-outline', title: 'Thanh toán an toàn', subtitle: 'Bảo mật tuyệt đối' },
  { icon: 'car-outline', title: 'Giao hàng nhanh', subtitle: 'Tận nơi toàn quốc' },
  { icon: 'heart-outline', title: 'Vì cộng đồng', subtitle: 'Nông nghiệp bền vững' },
] as const;

function money(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
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
          <Ionicons name="chevron-forward" size={15} color="#087744" />
        </Pressable>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ApiFeaturedCard({
  item,
  index,
  onPress,
  onAdd,
  disabled,
}: {
  item: HomeLowerProduct;
  index: number;
  onPress: () => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
    >
      <View style={styles.featuredImage}>
        <SmartProductImage uri={item.anhBiaUrl} name={item.ten} />
      </View>
      <View style={styles.featuredInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.ten}</Text>
        <View style={styles.compactPriceRow}>
          <Text numberOfLines={1} style={styles.price}>{money(item.gia.tu)}</Text>
          <Text numberOfLines={1} style={styles.unit}>/ đơn vị</Text>
        </View>
        <View style={styles.featuredBottom}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={STAR} />
            <Text style={styles.rating}>{index % 3 === 1 ? '4.9' : '4.8'}</Text>
            <Text style={styles.reviews}>({98 + index * 17})</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Thêm ${item.ten} vào giỏ`}
            disabled={disabled || item.khaDung?.coTheDatHang === false}
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            style={[styles.cartButton, disabled && styles.disabled]}
          >
            <Ionicons name={disabled ? 'hourglass-outline' : 'cart-outline'} size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function FallbackFeaturedCard({ item }: { item: FallbackProduct }) {
  return (
    <View style={styles.featuredCard}>
      <Image source={item.image} contentFit="cover" style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
        <Text style={styles.price}>{money(item.price)}</Text>
        <Text style={styles.unit}>/ {item.unit}</Text>
        <View style={styles.featuredBottom}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={STAR} />
            <Text style={styles.rating}>4.8</Text>
          </View>
          <View style={styles.cartButton}>
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

function useCountdown(initial = 12 * 3600 + 18 * 60 + 45) {
  const [seconds, setSeconds] = useState(initial);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((current) => (current <= 0 ? initial : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [initial]);

  return useMemo(() => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }, [seconds]);
}

function DealCard({
  item,
  index,
  countdown,
  onPress,
  onAdd,
  disabled,
}: {
  item: HomeLowerProduct;
  index: number;
  countdown: string;
  onPress: () => void;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const discount = index % 2 === 0 ? 20 : 15;
  const oldPrice = item.gia.tu / (1 - discount / 100);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.dealCard, pressed && styles.pressed]}
    >
      <View style={styles.dealImageWrap}>
        <SmartProductImage uri={item.anhBiaUrl} name={item.ten} />
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>Giảm {discount}%</Text>
        </View>
      </View>
      <View style={styles.dealInfo}>
        <Text numberOfLines={2} style={styles.productName}>{item.ten}</Text>
        <Text numberOfLines={1} style={styles.farmText}>{item.trangTrai.ten}</Text>
        <View style={styles.dealPriceRow}>
          <Text style={styles.dealPrice}>{money(item.gia.tu)}</Text>
          <Text style={styles.oldPrice}>{money(oldPrice)}</Text>
        </View>
        <View style={styles.dealBottom}>
          <View style={styles.timer}>
            <Ionicons name="time-outline" size={12} color="#E34A33" />
            <Text numberOfLines={1} style={styles.timerText}>Còn {countdown}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
            disabled={disabled || item.khaDung?.coTheDatHang === false}
            style={[styles.cartButton, disabled && styles.disabled]}
          >
            <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
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

function KnowledgeCard({ item, onPress }: { item: (typeof KNOWLEDGE)[number]; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.knowledgeCard, pressed && styles.pressed]}>
      <View style={styles.knowledgeImageWrap}>
        <Image source={item.image} contentFit="cover" style={styles.fill} />
        <View style={styles.knowledgeBadge}><Text style={styles.knowledgeBadgeText}>{item.badge}</Text></View>
      </View>
      <Text style={styles.knowledgeDate}>{item.date}</Text>
      <Text numberOfLines={2} style={styles.knowledgeTitle}>{item.title}</Text>
      <View style={styles.knowledgeMeta}>
        <Ionicons name="eye-outline" size={13} color="#77817B" />
        <Text style={styles.knowledgeViews}>{item.views}</Text>
      </View>
    </Pressable>
  );
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
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.recentCard, pressed && styles.pressed]}>
      <View style={styles.recentImage}>
        <SmartProductImage uri={item.anhBiaUrl} name={item.ten} />
        <View style={styles.traceBadge}>
          <Ionicons name="shield-checkmark" size={12} color={GREEN} />
          <Text numberOfLines={1} style={styles.traceBadgeText}>
            {item.chungNhan?.[0]?.loai || 'Truy xuất được'}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.recentName}>{item.ten}</Text>
      <Text numberOfLines={1} style={styles.recentFarm}>{item.trangTrai.ten}</Text>
      <View style={styles.recentBottom}>
        <Text style={styles.recentPrice}>{money(item.gia.tu)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={(event) => {
            event.stopPropagation();
            onAdd();
          }}
          disabled={disabled || item.khaDung?.coTheDatHang === false}
          style={[styles.smallCart, disabled && styles.disabled]}
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
  const countdown = useCountdown();
  const openExplore = () => router.push('/kham-pha');

  const featured = products.slice(0, 6);
  const deals = (products.length >= 8 ? products.slice(6, 8) : products.slice(0, 2));
  const farms = useMemo(() => {
    const map = new Map<string, HomeLowerProduct['trangTrai']>();
    for (const product of products) {
      const key = product.trangTrai.id || product.trangTrai.ten;
      if (!map.has(key)) map.set(key, product.trangTrai);
    }
    return [...map.values()].slice(0, 4);
  }, [products]);

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <SectionHeader title="Sản phẩm nổi bật" subtitle="Nông sản chất lượng cao, được nhiều người tin chọn" onPress={openExplore} />
        <View style={styles.grid}>
          {(featured.length > 0 ? featured : FALLBACK_FEATURED).map((item, index) => {
            if ('id' in item) {
              return (
                <ApiFeaturedCard
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => onProductPress(item.id)}
                  onAdd={() => onAddToCart(item.id)}
                  disabled={isAdding}
                />
              );
            }
            return <FallbackFeaturedCard key={item.name} item={item} />;
          })}
        </View>
      </View>

      <Divider />

      <Pressable accessibilityRole="button" onPress={openExplore} style={({ pressed }) => [styles.bannerWrap, pressed && styles.pressed]}>
        <Image source={sustainableBanner} contentFit="cover" style={styles.banner} />
      </Pressable>

      <Divider />

      <View style={styles.section}>
        <SectionHeader title="Ưu đãi hôm nay" subtitle="Giá tốt mỗi ngày" onPress={openExplore} />
        <View style={styles.dealGrid}>
          {deals.map((item, index) => (
            <DealCard
              key={item.id}
              item={item}
              index={index}
              countdown={countdown}
              onPress={() => onProductPress(item.id)}
              onAdd={() => onAddToCart(item.id)}
              disabled={isAdding}
            />
          ))}
        </View>
      </View>

      <Divider />

      <View style={styles.section}>
        <SectionHeader title="Trang trại tiêu biểu" subtitle="Kết nối trực tiếp với các trang trại uy tín" onPress={openExplore} />
        <View style={styles.farmGrid}>
          {farms.length > 0 ? farms.map((farm, index) => (
            <Pressable
              key={farm.id || farm.ten}
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
                <Text numberOfLines={1} style={styles.farmName}>{farm.ten}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location" size={12} color="#68746D" />
                  <Text numberOfLines={1} style={styles.metaText}>{farm.diaChi || 'Việt Nam'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={13} color={STAR} />
                  <Text style={styles.farmRating}>{index === 1 ? '4.7' : '4.8'}</Text>
                  <Text style={styles.reviews}>({98 + index * 9})</Text>
                </View>
                <View style={styles.farmButton}><Text style={styles.farmButtonText}>Xem trang trại</Text></View>
              </View>
            </Pressable>
          )) : (
            [
              { name: 'Trang trại Minh Bạch', image: farmMinhBach },
              { name: 'Nông trại An Phú', image: farmAnPhu },
              { name: 'HTX Phú Nông', image: farmPhuNong },
              { name: 'Trang trại Sông Hồng', image: farmSongHong },
            ].map((farm) => (
              <Pressable key={farm.name} onPress={openExplore} style={styles.farmCard}>
                <Image source={farm.image} contentFit="cover" style={styles.farmImage} />
                <View style={styles.farmInfo}>
                  <Text style={styles.farmName}>{farm.name}</Text>
                  <Text style={styles.metaText}>Nông sản sạch · Minh bạch</Text>
                  <View style={styles.farmButton}><Text style={styles.farmButtonText}>Xem trang trại</Text></View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </View>

      <Divider />

      <View style={styles.section}>
        <SectionHeader title="Kiến thức nông sản" subtitle="Cùng tìm hiểu để chọn lựa nông sản tốt hơn" onPress={openExplore} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.knowledgeRow}>
          {KNOWLEDGE.map((item) => <KnowledgeCard key={item.title} item={item} onPress={openExplore} />)}
        </ScrollView>
      </View>

      {recentProducts.length > 0 ? (
        <>
          <Divider />
          <View style={styles.section}>
            <SectionHeader title="Sản phẩm đã xem gần đây" subtitle="Những sản phẩm bạn đã quan tâm" onPress={openExplore} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
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
        </>
      ) : null}

      <Divider />

      <Pressable accessibilityRole="button" onPress={openExplore} style={({ pressed }) => [styles.bannerWrap, pressed && styles.pressed]}>
        <Image source={sustainableBanner} contentFit="cover" style={styles.banner} />
      </Pressable>

      <View style={styles.promiseRow}>
        {PROMISES.map((item) => (
          <View key={item.title} style={styles.promiseItem}>
            <Ionicons name={item.icon} size={22} color={GREEN} />
            <Text style={styles.promiseTitle}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.promiseSubtitle}>{item.subtitle}</Text>
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
  viewAllText: { color: '#087744', fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.45 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featuredCard: { width: '48.7%', height: 126, overflow: 'hidden', flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4DF', backgroundColor: '#FFFFFF' },
  featuredImage: { width: '48%', height: '100%', backgroundColor: '#EEF4EF' },
  featuredInfo: { minWidth: 0, flex: 1, paddingHorizontal: 7, paddingVertical: 8 },
  productName: { color: '#202A24', fontSize: 12.5, lineHeight: 15, fontWeight: '800' },
  compactPriceRow: { marginTop: 5 },
  price: { color: '#087744', fontSize: 13, lineHeight: 16, fontWeight: '800' },
  unit: { marginTop: 1, color: MUTED, fontSize: 8.5 },
  featuredBottom: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  ratingRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { color: '#2D3932', fontSize: 9.5, fontWeight: '700' },
  reviews: { color: '#89918C', fontSize: 7.5 },
  cartButton: { width: 29, height: 29, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: GREEN },
  bannerWrap: { width: '100%', overflow: 'hidden', borderRadius: 15 },
  banner: { width: '100%', aspectRatio: 712 / 236 },
  dealGrid: { flexDirection: 'row', gap: 8 },
  dealCard: { width: '48.7%', height: 148, overflow: 'hidden', flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E8DED8', backgroundColor: '#FFFDFC' },
  dealImageWrap: { position: 'relative', width: '47%', height: '100%', backgroundColor: '#FFF4EF' },
  fill: { width: '100%', height: '100%' },
  discountBadge: { position: 'absolute', top: 7, left: 7, borderRadius: 5, backgroundColor: '#F14D31', paddingHorizontal: 6, paddingVertical: 3 },
  discountText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  dealInfo: { minWidth: 0, flex: 1, paddingHorizontal: 7, paddingVertical: 8 },
  farmText: { marginTop: 3, color: '#7B857F', fontSize: 8.5 },
  dealPriceRow: { marginTop: 7, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 3 },
  dealPrice: { color: '#087744', fontSize: 12.5, fontWeight: '800' },
  oldPrice: { color: '#9A9F9C', fontSize: 8.5, textDecorationLine: 'line-through' },
  dealBottom: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  timer: { minWidth: 0, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  timerText: { flexShrink: 1, color: '#E34A33', fontSize: 7.5, fontWeight: '700' },
  farmGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  farmCard: { width: '48.7%', height: 142, overflow: 'hidden', flexDirection: 'row', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#DDE4DF', backgroundColor: '#FFFFFF' },
  farmImage: { width: '48%', height: '100%', backgroundColor: '#EDF4EE' },
  farmInfo: { minWidth: 0, flex: 1, paddingHorizontal: 7, paddingVertical: 8 },
  farmName: { color: '#202A24', fontSize: 11.5, fontWeight: '800' },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { minWidth: 0, flex: 1, color: '#68746D', fontSize: 8.5 },
  farmRating: { color: '#D99300', fontSize: 9.5, fontWeight: '800' },
  farmButton: { marginTop: 'auto', alignItems: 'center', borderRadius: 12, backgroundColor: GREEN, paddingVertical: 6 },
  farmButtonText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '800' },
  knowledgeRow: { gap: 10, paddingRight: 8 },
  knowledgeCard: { width: 214, overflow: 'hidden', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E2E7E3', backgroundColor: '#FFFFFF', paddingBottom: 8 },
  knowledgeImageWrap: { height: 112, position: 'relative', backgroundColor: '#EEF4EF' },
  knowledgeBadge: { position: 'absolute', left: 8, top: 8, borderRadius: 7, backgroundColor: '#F1FBF4', paddingHorizontal: 8, paddingVertical: 4 },
  knowledgeBadgeText: { color: '#13653E', fontSize: 9, fontWeight: '800' },
  knowledgeDate: { marginTop: 7, paddingHorizontal: 8, color: '#7F8983', fontSize: 10 },
  knowledgeTitle: { minHeight: 36, marginTop: 3, paddingHorizontal: 8, color: '#1F2923', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  knowledgeMeta: { marginTop: 6, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  knowledgeViews: { color: '#77817B', fontSize: 10 },
  recentRow: { gap: 10, paddingRight: 8 },
  recentCard: { width: 168, overflow: 'hidden', borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E2E7E3', backgroundColor: '#FFFFFF', paddingBottom: 9 },
  recentImage: { height: 104, position: 'relative', backgroundColor: '#EEF4EF' },
  traceBadge: { position: 'absolute', right: 6, top: 6, maxWidth: 126, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, backgroundColor: '#E8F7ED', paddingHorizontal: 6, paddingVertical: 4 },
  traceBadgeText: { flexShrink: 1, color: '#087744', fontSize: 8.5, fontWeight: '800' },
  recentName: { marginTop: 7, paddingHorizontal: 8, color: '#202A24', fontSize: 12, fontWeight: '800' },
  recentFarm: { marginTop: 2, paddingHorizontal: 8, color: '#7F8983', fontSize: 9 },
  recentBottom: { marginTop: 7, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentPrice: { color: '#087744', fontSize: 13, fontWeight: '800' },
  smallCart: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN },
  promiseRow: { marginTop: 12, flexDirection: 'row', borderRadius: 14, backgroundColor: '#F8FBF9', paddingVertical: 10 },
  promiseItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  promiseTitle: { marginTop: 4, textAlign: 'center', color: '#234234', fontSize: 8.5, fontWeight: '800' },
  promiseSubtitle: { marginTop: 1, width: '100%', textAlign: 'center', color: '#849087', fontSize: 6.5 },
});
