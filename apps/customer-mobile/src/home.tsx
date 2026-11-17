import { useMemo, useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { HomePayload, Product } from './types'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { qty, vnd } from './format'
import type { Ward } from '@agrimarket/core'
import { imgUrl, type Nav } from './nav'
import { radius, space, theme } from './theme'
import { useFetch } from './useFetch'
import { BottomSheet, EmptyState, ErrorText, SearchBar } from './ui'

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
        <Image source={{ uri: `${imgUrl('/images/banners/hero-farm.jpg')}` }} style={s.heroArt} resizeMode="cover" />
        <View style={s.heroVeil} />
        <View style={s.heroBody}>
          <View style={s.heroPill}>
            <Ionicons name="shield-checkmark" size={12} color="#DCFCE7" />
            <Text style={s.heroPillText}>Tem QR từng lô</Text>
          </View>
          <Text style={s.heroTitle}>Nông sản tươi, rõ nguồn gốc</Text>
          <Text style={s.heroText}>
            {data ? `${qty(data.stats.products)} sản phẩm · ${qty(data.stats.batches)} lô đã công khai` : 'Đang tải dữ liệu…'}
          </Text>
          <Pressable
            onPress={() => nav.push({ name: 'products' })}
            accessibilityRole="button"
            style={({ pressed }) => [s.heroBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={s.heroBtnText}>Mua nông sản</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primaryDark} />
          </Pressable>
        </View>
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
        onPress={() => nav.push({ name: 'trace', token: '' })}
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
  locLabel: { fontSize: 10.5, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  locValue: { fontSize: 13.5, fontWeight: '600', color: theme.text },
  muted: { fontSize: 13, color: theme.muted },
  hero: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: theme.primaryDark, minHeight: 210 },
  heroArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroVeil: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,46,27,0.78)' },
  heroBody: { padding: space.lg, gap: space.sm },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  heroPillText: { fontSize: 11, color: '#DCFCE7', fontWeight: '600' },
  heroTitle: { fontSize: 22, fontWeight: '700', color: theme.white, letterSpacing: -0.3, lineHeight: 28 },
  heroText: { fontSize: 12.5, color: '#D6ECDD' },
  heroBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.white,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  heroBtnText: { fontSize: 13.5, fontWeight: '700', color: theme.primaryDark },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text, letterSpacing: -0.2, marginTop: space.sm },
  catRow: { gap: space.sm, paddingRight: space.lg },
  catTile: { width: 84, gap: 4 },
  catImage: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: theme.softGreen },
  photoFallback: { alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 12, fontWeight: '600', color: theme.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  card: {
    width: '48.2%',
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingBottom: 10,
    overflow: 'hidden',
  },
  photoWrap: { position: 'relative', aspectRatio: 1, backgroundColor: theme.softGreen },
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
  promoTagText: { fontSize: 10, fontWeight: '700', color: theme.white },
  name: { fontSize: 13.5, fontWeight: '600', color: theme.text, lineHeight: 18, marginTop: 8, paddingHorizontal: 10 },
  origin: { fontSize: 11, color: theme.muted, marginTop: 2, paddingHorizontal: 10 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  price: { fontSize: 16, fontWeight: '700', color: theme.primaryDark, letterSpacing: -0.3 },
  priceUnit: { fontSize: 11, fontWeight: '400', color: theme.muted },
  rating: { fontSize: 11, color: theme.clay, fontWeight: '600' },
  stock: { fontSize: 11, color: theme.muted, marginTop: 2, paddingHorizontal: 10 },
  outText: { fontSize: 11, color: theme.danger, marginTop: 2, paddingHorizontal: 10 },
  addBtn: {
    marginTop: 8,
    marginHorizontal: 10,
    height: 32,
    borderRadius: radius.sm,
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
  addBtnText: { fontSize: 12.5, fontWeight: '700', color: theme.primary },
  traceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: theme.primary,
    borderRadius: radius.lg,
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
  traceTitle: { fontSize: 14.5, fontWeight: '700', color: theme.white },
  traceText: { fontSize: 11.5, color: '#D6ECDD', lineHeight: 16, marginTop: 2 },
  wardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  wardName: { fontSize: 14.5, color: theme.text },
  sheetHint: { fontSize: 11.5, color: theme.muted, marginTop: space.md, lineHeight: 16 },
  resultLine: { fontSize: 12.5, color: theme.muted },
})
