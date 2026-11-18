import { useMemo, useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { HomePayload, Product } from './types'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { qty, vnd } from './format'
import type { Ward } from '@agrimarket/core'
import { imgUrl, DEMO_TRACE_TOKEN, type Nav } from './nav'
import { radius, space, theme, font, display } from './theme'
import { useFetch } from './useFetch'
import { BottomSheet, EmptyState, ErrorText, SearchBar } from './ui'

/** One hero, same message as the website: choose by lot, know the farm. */
const HERO = {
  image: '/images/banners/concept-fresh-daily.jpg',
  title: 'Chọn theo lô,\nbiết rõ nông trại',
  body: 'Mỗi lô có tem QR truy xuất tới nông trại, nhật ký canh tác và phiếu kiểm nghiệm đạt trước khi lên kệ.',
}

const TRUST = [
  { icon: 'qr-code-outline' as const, label: 'Tem QR từng lô' },
  { icon: 'shield-checkmark-outline' as const, label: 'Kiểm nghiệm trước bán' },
  { icon: 'bicycle-outline' as const, label: 'Giao nội tỉnh 24h' },
  { icon: 'refresh-outline' as const, label: 'Đổi trả nếu lỗi' },
]

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()

/** Two-column shop card: big photo, price, origin, stock, one-tap add. */
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
              <Text style={s.promoTagText}>Lô cận hạn</Text>
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
        {p.origin_note ? (
          <Text style={s.origin} numberOfLines={1}>
            <Ionicons name="location-outline" size={11} color={theme.primary} /> {p.origin_note.replace(/\.$/, '')}
          </Text>
        ) : null}
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
        <Text style={out ? s.outText : s.stock}>{out ? 'Đang chờ lô mới' : `Còn ${qty(p.available)} ${p.unit}`}</Text>
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
          name={state === 'done' ? 'checkmark' : 'add'}
          size={15}
          color={out ? theme.muted : state === 'done' ? theme.white : theme.primary}
        />
        <Text style={[s.addBtnText, state === 'done' && { color: theme.white }, out && { color: theme.muted }]}>
          {out ? 'Tạm hết' : state === 'done' ? 'Đã thêm' : state === 'error' ? 'Thử lại' : 'Thêm'}
        </Text>
      </Pressable>
    </View>
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

  const featured = data?.featured ?? []
  const newest = data?.newest ?? []
  const categories = data?.categories ?? []

  const shownWards = useMemo(() => {
    if (!wards) return []
    const n = norm(q)
    return (n ? wards.filter((w) => norm(w.name).includes(n)) : wards).slice(0, 40)
  }, [wards, q])

  const refresh = () => {
    setSpinning(true)
    reload()
    setTimeout(() => setSpinning(false), 400)
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={spinning} onRefresh={refresh} tintColor={theme.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={() => setSheet(true)}
        accessibilityRole="button"
        accessibilityLabel="Chọn xã/phường giao hàng"
        style={s.location}
      >
        <View style={s.locIcon}>
          <Ionicons name="location" size={15} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.locLabel}>Giao tới</Text>
          <Text style={s.locValue} numberOfLines={1}>
            {ward}, Hưng Yên
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={theme.muted} />
      </Pressable>

      <SearchBar value={q} onChangeText={setQ} onSubmit={() => nav.push({ name: 'products', q })} />

      <View style={s.hero}>
        <Text style={s.heroOverline}>NÔNG SẢN HƯNG YÊN</Text>
        <Text style={s.heroTitle}>{HERO.title}</Text>
        <Text style={s.heroText}>{HERO.body}</Text>
        <View style={s.heroBtnRow}>
          <Pressable
            onPress={() => nav.push({ name: 'products' })}
            accessibilityRole="button"
            style={({ pressed }) => [s.heroBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={s.heroBtnText}>Mua nông sản</Text>
            <Ionicons name="arrow-forward" size={15} color={theme.white} />
          </Pressable>
          <Pressable
            onPress={() => nav.push({ name: 'trace', token: DEMO_TRACE_TOKEN })}
            accessibilityRole="button"
            style={({ pressed }) => [s.heroBtnGhost, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="qr-code-outline" size={15} color={theme.primaryDark} />
            <Text style={s.heroBtnGhostText}>Tra cứu tem</Text>
          </Pressable>
        </View>
        <Image source={{ uri: imgUrl(HERO.image) ?? undefined }} style={s.heroArt} resizeMode="cover" />
      </View>

      <View style={s.trustRow}>
        {TRUST.map((t) => (
          <View key={t.label} style={s.trustItem}>
            <Ionicons name={t.icon} size={15} color={theme.primary} />
            <Text style={s.trustText} numberOfLines={2}>
              {t.label}
            </Text>
          </View>
        ))}
      </View>

      <ErrorText message={error} />

      {categories.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Danh mục</Text>
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
        </>
      )}

      <Text style={s.sectionTitle}>Nổi bật</Text>
      {featured.length === 0 ? (
        <EmptyState title="Chưa có sản phẩm nào đang mở bán." hint="Quay lại sau khi lô mới được công bố." />
      ) : (
        <View style={s.grid}>
          {featured.slice(0, 8).map((p) => (
            <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
          ))}
        </View>
      )}

      <Pressable
        onPress={() => nav.push({ name: 'trace', token: DEMO_TRACE_TOKEN })}
        accessibilityRole="button"
        style={({ pressed }) => [s.traceCard, pressed && { opacity: 0.92 }]}
      >
        <View style={s.traceIcon}>
          <Ionicons name="qr-code" size={20} color={theme.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.traceTitle}>Tra cứu tem trên bao bì</Text>
          <Text style={s.traceText}>Nông trại, nhật ký canh tác, phiếu kiểm nghiệm của đúng lô bạn mua.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.white} />
      </Pressable>

      {newest.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Mới về kho</Text>
          <View style={s.grid}>
            {newest.slice(0, 8).map((p) => (
              <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
            ))}
          </View>
        </>
      )}

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Chọn xã/phường nhận hàng">
        <SearchBar value={q} onChangeText={setQ} onSubmit={() => undefined} />
        <ScrollView style={{ maxHeight: 340 }} keyboardShouldPersistTaps="handled">
          {shownWards.map((w) => (
            <Pressable
              key={w.code}
              onPress={() => {
                setWard(w.name)
                setSheet(false)
              }}
              accessibilityRole="button"
              style={({ pressed }) => [s.wardRow, pressed && { backgroundColor: theme.softGreen }]}
            >
              <Text style={s.wardName}>{w.name}</Text>
              {w.name === ward ? <Ionicons name="checkmark" size={16} color={theme.primary} /> : null}
            </Pressable>
          ))}
          {!wards && <Text style={s.muted}>Đang tải 104 xã/phường…</Text>}
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
        {list.length} sản phẩm{query ? ` cho “${query}”` : ''} · bán theo lô có tem truy xuất
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
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.md, paddingBottom: space.xl },
  location: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  locIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: theme.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locLabel: { fontSize: 10.5, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: font[400] },
  locValue: { fontSize: 13.5, fontWeight: '600', fontFamily: font[600], color: theme.text },
  muted: { fontSize: 13, color: theme.muted, fontFamily: font[400] },
  hero: {
    backgroundColor: theme.mintSoft,
    borderRadius: radius.xl,
    padding: space.lg,
    gap: 8,
    overflow: 'hidden',
  },
  heroArt: {
    height: 132,
    borderRadius: radius.lg,
    marginTop: space.sm,
    backgroundColor: theme.ivory,
  },
  heroOverline: { fontSize: 10.5, letterSpacing: 1.4, color: theme.primary, fontFamily: font[700] },
  heroTitle: { fontSize: 26, lineHeight: 30, color: theme.text, fontFamily: display, letterSpacing: -0.6 },
  heroText: { fontSize: 13, lineHeight: 19, color: theme.muted, fontFamily: font[400] },
  heroBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: 4 },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  heroBtnText: { fontSize: 13.5, fontWeight: '700', fontFamily: font[700], color: theme.white },
  heroBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.ivoryBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroBtnGhostText: { fontSize: 13.5, fontWeight: '600', fontFamily: font[600], color: theme.primaryDark },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustText: { fontSize: 10, lineHeight: 13, color: theme.muted, textAlign: 'center', fontFamily: font[500] },
  sectionTitle: { fontSize: 19, color: theme.text, fontFamily: display, letterSpacing: -0.3, marginTop: space.sm },
  catRow: { gap: space.sm, paddingRight: space.lg },
  catTile: { width: 84, gap: 4 },
  catImage: { width: 84, height: 84, borderRadius: radius.lg, backgroundColor: theme.ivory },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 12, fontWeight: '600', fontFamily: font[600], color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  card: {
    width: '48.2%',
    backgroundColor: theme.surface,
    borderRadius: radius.xl,
    paddingBottom: 10,
  },
  photoWrap: { position: 'relative', aspectRatio: 1, backgroundColor: theme.ivory, borderRadius: radius.lg, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  promoTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  outTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(23,43,34,0.82)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  promoTagText: { fontSize: 10, fontWeight: '700', fontFamily: font[700], color: theme.white },
  name: { fontSize: 13.5, fontWeight: '600', fontFamily: font[600], color: theme.text, lineHeight: 18, marginTop: 8, paddingHorizontal: 10 },
  origin: { fontSize: 11, color: theme.muted, marginTop: 2, paddingHorizontal: 10, fontFamily: font[400] },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  price: { fontSize: 16, fontWeight: '700', fontFamily: font[700], color: theme.primaryDark, letterSpacing: -0.3 },
  priceUnit: { fontSize: 11, fontWeight: '400', fontFamily: font[400], color: theme.muted },
  rating: { fontSize: 11, color: theme.clay, fontWeight: '600', fontFamily: font[600] },
  stock: { fontSize: 11, color: theme.muted, marginTop: 2, paddingHorizontal: 10, fontFamily: font[400] },
  outText: { fontSize: 11, color: theme.danger, marginTop: 2, paddingHorizontal: 10, fontFamily: font[400] },
  addBtn: {
    marginTop: 8,
    marginHorizontal: 10,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.softGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnPressed: { backgroundColor: '#E3F2E8' },
  addBtnDone: { backgroundColor: theme.primary, borderColor: theme.primary },
  addBtnOff: { backgroundColor: theme.bg },
  addBtnText: { fontSize: 12.5, fontWeight: '700', fontFamily: font[700], color: theme.primary },
  traceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: theme.primaryDark,
    borderRadius: radius.xl,
    padding: space.lg,
    marginTop: space.sm,
  },
  traceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traceTitle: { fontSize: 14.5, fontWeight: '700', fontFamily: font[700], color: theme.white },
  traceText: { fontSize: 11.5, color: '#D6ECDD', lineHeight: 16, marginTop: 2, fontFamily: font[400] },
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
