import { useMemo, useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { HomePayload, Product } from './types'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { vnd } from './format'
import { filterWards, uniqueById, type Ward } from '@agrimarket/core'
import { imgUrl, DEMO_TRACE_TOKEN, type Nav } from './nav'
import { radius, space, theme, font, display } from './theme'
import { useFetch } from './useFetch'
import { BottomSheet, EmptyState, ErrorText, SearchBar } from './ui'

/** Two-column shop card: big photo, price, stock state, one-tap add. */
function GridCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
  const { user } = useAuth()
  const { add } = useCart()
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const out = !p.in_stock || Number(p.available) <= 0

  async function quickAdd() {
    if (!user) return onOpen()
    setState('busy')
    try {
      await add(p.id, 1)
      setState('done')
      setTimeout(() => setState('idle'), 1400)
    } catch {
      setState('error')
    }
  }

  return (
    <View style={s.card}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${p.name}, ${vnd(p.base_price_vnd)} mỗi ${p.unit}`}>
        <View style={s.photoWrap}>
          {p.image ? (
            <Image source={{ uri: imgUrl(p.image) ?? undefined }} style={s.photo} resizeMode="cover" />
          ) : (
            <View style={[s.photo, s.photoFallback]}>
              <Ionicons name="leaf" size={26} color={theme.border} />
            </View>
          )}
          {p.has_batch_promo && !out ? (
            <View style={s.promoTag}>
              <Text style={s.promoTagText}>Ưu đãi</Text>
            </View>
          ) : null}
          {out ? (
            <View style={s.outTag}>
              <Text style={s.promoTagText}>Hết hàng</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.name} numberOfLines={2}>
          {p.name}
        </Text>
        <View style={s.priceRow}>
          <Text style={s.price}>
            {vnd(p.base_price_vnd)}
            <Text style={s.priceUnit}>/{p.unit}</Text>
          </Text>
          {p.review_count > 0 ? (
            <Text style={s.rating}>
              <Ionicons name="star" size={11} color={theme.accent} /> {Number(p.rating).toFixed(1)}
            </Text>
          ) : null}
        </View>
        <Text style={out ? s.outText : s.stock}>{out ? 'Hết hàng' : 'Còn hàng'}</Text>
      </Pressable>
      <Pressable
        onPress={() => void quickAdd()}
        disabled={out || state === 'busy'}
        accessibilityRole="button"
        accessibilityLabel={out ? `${p.name} tạm hết hàng` : `Thêm ${p.name} vào giỏ`}
        style={({ pressed }) => [
          s.addBtn,
          state === 'done' && s.addBtnDone,
          out && s.addBtnOff,
          pressed && !out && s.addBtnPressed,
        ]}
      >
        <Ionicons
          name={state === 'done' ? 'checkmark' : 'cart-outline'}
          size={14}
          color={out ? theme.muted : '#182230'}
        />
        <Text style={[s.addBtnText, out && { color: theme.muted }]}>
          {out ? 'Hết hàng' : state === 'done' ? 'Đã thêm' : state === 'error' ? 'Thử lại' : 'Thêm vào giỏ'}
        </Text>
      </Pressable>
    </View>
  )
}

/** Horizontal promo rail: one compact card per discounted product. */
function PromoCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" style={s.promoCard}>
      {p.image ? (
        <Image source={{ uri: imgUrl(p.image) ?? undefined }} style={s.promoImage} resizeMode="cover" />
      ) : (
        <View style={[s.promoImage, s.photoFallback]}>
          <Ionicons name="leaf" size={20} color={theme.border} />
        </View>
      )}
      <Text style={s.promoName} numberOfLines={1}>
        {p.name}
      </Text>
      <Text style={s.promoPrice}>{vnd(p.base_price_vnd)}</Text>
    </Pressable>
  )
}

export function HomeScreen({ nav }: { nav: Nav }) {
  const { data, error, reload } = useFetch<HomePayload>(() => api<HomePayload>('/home'), [])
  const { data: wardData } = useFetch<{ data: Ward[] }>(() => api<{ data: Ward[] }>('/locations/wards'), [])
  const wards = wardData?.data ?? null
  const [ward, setWard] = useState('Hưng Yên')
  const [sheet, setSheet] = useState(false)
  const [q, setQ] = useState('')
  const [spinning, setSpinning] = useState(false)

  const featureData = data?.featured ?? []
  const newestData = data?.newest ?? []
  const categories = data?.categories ?? []
  // The API may repeat a product across featured/newest; a repeat is a duplicate React key.
  const featured = uniqueById(featureData)
  const newest = uniqueById(newestData)

  const promos = featured.filter((p) => p.has_batch_promo)

  /** Products grouped by category, only for categories that actually have stock on the home payload. */
  const byCategory = useMemo(() => {
    const all = uniqueById([...featured, ...newest])
    return categories
      .map((c) => ({ category: c, items: all.filter((p) => p.category_slug === c.slug || p.category_id === c.id) }))
      .filter((g) => g.items.length > 0)
  }, [categories, featured, newest])

  const shownWards = useMemo(() => (wards ? filterWards(wards, q) : []), [wards, q])

  const refresh = () => {
    setSpinning(true)
    reload()
    setTimeout(() => setSpinning(false), 400)
  }

  return (
    <ScrollView
      style={s.screen}
      refreshControl={<RefreshControl refreshing={spinning} onRefresh={refresh} tintColor={theme.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.topRow}>
        <Pressable
          onPress={() => setSheet(true)}
          accessibilityRole="button"
          accessibilityLabel="Chọn xã/phường giao hàng"
          style={s.location}
        >
          <Ionicons name="location-outline" size={15} color={theme.primary} />
          <Text style={s.locValue} numberOfLines={1}>
            Giao tới: {ward}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.muted} />
        </Pressable>
        <Pressable
          onPress={() => nav.push({ name: 'trace', token: DEMO_TRACE_TOKEN })}
          accessibilityRole="button"
          accessibilityLabel="Tra cứu tem truy xuất"
          hitSlop={6}
          style={s.traceLink}
        >
          <Ionicons name="qr-code-outline" size={14} color={theme.primary} />
          <Text style={s.traceLinkText}>Tem QR</Text>
        </Pressable>
      </View>

      <Pressable style={s.banner} onPress={() => nav.push({ name: 'products' })} accessibilityRole="button" accessibilityLabel="Mua sắm nông sản tươi">
        <Image source={{ uri: imgUrl('/images/banners/hero-produce.jpg') ?? undefined }} style={s.bannerArt} resizeMode="cover" />
        <View style={s.bannerBody}>
          <Text style={s.bannerTitle}>Nông sản tươi, giá tốt mỗi ngày</Text>
          <View style={s.bannerBtn}>
            <Text style={s.bannerBtnText}>Mua ngay</Text>
          </View>
        </View>
      </Pressable>

      <ErrorText message={error} />

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
          {categories.map((c) => (
            <Pressable
              key={c.slug}
              onPress={() => nav.push({ name: 'products', category: c.slug })}
              accessibilityRole="button"
              style={s.catTile}
            >
              {c.image ? (
                <Image source={{ uri: imgUrl(c.image) ?? undefined }} style={s.catImage} resizeMode="cover" />
              ) : (
                <View style={[s.catImage, s.photoFallback]}>
                  <Ionicons name="leaf" size={20} color={theme.border} />
                </View>
              )}
              <Text style={s.catName} numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {promos.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ưu đãi hôm nay</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.promoRow}>
            {promos.map((p) => (
              <PromoCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
            ))}
          </ScrollView>
        </View>
      )}

      {featured.length === 0 && (
        <EmptyState title="Chưa có sản phẩm nào đang mở bán." hint="Quay lại sau khi lô mới được công bố." />
      )}

      {byCategory.map((g) => (
        <View key={g.category.slug} style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>{g.category.name}</Text>
            <Pressable
              onPress={() => nav.push({ name: 'products', category: g.category.slug })}
              accessibilityRole="button"
            >
              <Text style={s.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>
          <View style={s.grid}>
            {g.items.slice(0, 4).map((p) => (
              <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
            ))}
          </View>
        </View>
      ))}

      {byCategory.length === 0 && featured.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Nổi bật</Text>
          <View style={s.grid}>
            {featured.slice(0, 8).map((p) => (
              <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
            ))}
          </View>
        </View>
      )}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Chọn xã/phường nhận hàng">
        <SearchBar value={q} onChangeText={setQ} onSubmit={() => undefined} />
        <Text style={s.muted}>{wards ? `${shownWards.length} xã/phường` : 'Đang tải 104 xã/phường…'}</Text>
        <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
          {shownWards.map((w) => (
            <Pressable
              key={w.code}
              onPress={() => {
                setWard(w.name)
                setSheet(false)
                setQ('')
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: w.name === ward }}
              style={({ pressed }) => [s.wardRow, pressed && { backgroundColor: theme.ivory }]}
            >
              <Text style={[s.wardName, w.name === ward && { color: theme.primary, fontFamily: font[600] }]}>{w.name}</Text>
              {w.name === ward ? <Ionicons name="checkmark" size={16} color={theme.primary} /> : null}
            </Pressable>
          ))}
          {wards && shownWards.length === 0 && <Text style={s.muted}>Không tìm thấy xã/phường khớp.</Text>}
        </ScrollView>
        <Text style={s.sheetHint}>AgriMarket giao toàn tỉnh Hưng Yên; địa chỉ chính xác nhập ở bước thanh toán.</Text>
      </BottomSheet>
    </ScrollView>
  )
}

/** Catalog filtered by the home search box or a category tap. */
export function ProductListScreen({ nav, q, category }: { nav: Nav; q?: string; category?: string }) {
  const [term, setTerm] = useState(q ?? '')
  const [query, setQuery] = useState(q ?? '')
  const { data, error } = useFetch<{ data: Product[] }>(
    () =>
      api<{ data: Product[] }>(
        `/products?pageSize=40${query ? `&search=${encodeURIComponent(query)}` : ''}${
          category ? `&category_slug=${encodeURIComponent(category)}` : ''
        }`,
      ),
    [query, category],
  )
  const list = data?.data ?? []

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <SearchBar value={term} onChangeText={setTerm} onSubmit={() => setQuery(term.trim())} />
      <Text style={s.resultLine}>
        {list.length} sản phẩm{query ? ` cho “${query}”` : ''}
      </Text>
      <ErrorText message={error} />
      {list.length === 0 ? (
        <EmptyState title="Không tìm thấy sản phẩm" hint="Thử từ khoá khác hoặc xem danh mục khác." />
      ) : (
        <View style={s.grid}>
          {list.map((p) => (
            <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.canvas },
  content: { paddingHorizontal: 12, paddingVertical: space.md, gap: space.md, paddingBottom: space.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  locValue: { fontSize: 13, fontFamily: font[600], color: theme.text },
  traceLink: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  traceLinkText: { fontSize: 12, fontFamily: font[600], color: theme.primary },
  banner: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.primary,
    height: 150,
    justifyContent: 'flex-end',
  },
  bannerArt: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  bannerBody: {
    padding: space.md,
    gap: space.sm,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(24,34,48,0.55)',
  },
  bannerTitle: { fontSize: 17, lineHeight: 22, color: theme.white, fontFamily: display, letterSpacing: -0.2 },
  bannerBtn: {
    backgroundColor: theme.buy,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  bannerBtnText: { fontSize: 13, fontFamily: font[700], color: '#182230' },
  muted: { fontSize: 13, color: theme.muted, fontFamily: font[400] },
  section: { gap: space.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, color: theme.text, fontFamily: display, letterSpacing: -0.2 },
  seeAll: { fontSize: 12.5, color: theme.primary, fontFamily: font[600] },
  catRow: { gap: space.md, paddingRight: space.md },
  catTile: { width: 68, gap: 5, alignItems: 'center' },
  catImage: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.ivory },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 11.5, fontFamily: font[500], color: theme.text, textAlign: 'center' },
  promoRow: { gap: space.sm, paddingRight: space.md },
  promoCard: { width: 108, gap: 4 },
  promoImage: { width: 108, height: 108, borderRadius: radius.md, backgroundColor: theme.ivory },
  promoName: { fontSize: 12, fontFamily: font[500], color: theme.text },
  promoPrice: { fontSize: 13, fontFamily: font[700], color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  card: {
    width: '48.5%',
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    padding: 8,
    gap: 0,
  },
  photoWrap: { position: 'relative', aspectRatio: 1, backgroundColor: theme.ivory, borderRadius: radius.sm, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  promoTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: theme.accent,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  outTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(24,34,48,0.82)',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  promoTagText: { fontSize: 10, fontFamily: font[700], color: theme.white },
  name: { fontSize: 13, fontFamily: font[500], color: theme.text, lineHeight: 18, marginTop: 6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: { fontSize: 16, fontFamily: font[700], color: theme.text, letterSpacing: -0.3 },
  priceUnit: { fontSize: 11, fontFamily: font[400], color: theme.muted },
  rating: { fontSize: 11, color: theme.muted, fontFamily: font[500] },
  stock: { fontSize: 11, color: theme.primary, marginTop: 2, fontFamily: font[500] },
  outText: { fontSize: 11, color: theme.danger, marginTop: 2, fontFamily: font[500] },
  addBtn: {
    marginTop: 8,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: theme.buy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnPressed: { backgroundColor: theme.buyDark },
  addBtnDone: { backgroundColor: theme.primary },
  addBtnOff: { backgroundColor: theme.ivory },
  addBtnText: { fontSize: 12, fontFamily: font[700], color: '#182230' },
  wardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  wardName: { fontSize: 14.5, color: theme.text, fontFamily: font[400] },
  sheetHint: { fontSize: 11.5, color: theme.muted, marginTop: space.md, lineHeight: 16, fontFamily: font[400] },
  resultLine: { fontSize: 12.5, color: theme.muted, fontFamily: font[400] },
})
