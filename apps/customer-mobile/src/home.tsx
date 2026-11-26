import { useMemo, useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { Category, HomePayload, Product, ProductList } from './types'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { vnd } from './format'
import { favourites, recentlyViewed, useMemory } from './memory'
import { filterWards, uniqueById, type Ward } from '@agrimarket/core'
import { imgUrl, DEMO_TRACE_TOKEN, type Nav } from './nav'
import { radius, space, theme, font, display } from './theme'
import { useFetch } from './useFetch'
import { BottomSheet, EmptyState, ErrorText, SearchBar } from './ui'

/** Mirrors the website's sort list, so the same server param means the same order on both. */
const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'name', label: 'Tên A→Z' },
] as const
type Sort = (typeof SORTS)[number]['value']
const PAGE = 24

/** Heart on the photo corner; state is per device, exactly like the website's. */
function HeartButton({ id }: { id: string }) {
  const { favourites: ids } = useMemory()
  const on = ids.includes(id)
  return (
    <Pressable
      onPress={() => void favourites.toggle(id)}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={on ? 'Bỏ khỏi yêu thích' : 'Lưu vào yêu thích'}
      hitSlop={6}
      style={s.heart}
    >
      <Ionicons name={on ? 'heart' : 'heart-outline'} size={17} color={on ? theme.danger : theme.text} />
    </Pressable>
  )
}

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
          <HeartButton id={p.id} />
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

/**
 * Catalog + the same filters as `/san-pham` on the website: diacritic-free search, category,
 * price range, in-stock only, five sort orders, clear-all and an honest empty state.
 * Filters are not applied until "Áp dụng", so the list never refetches on every keystroke.
 */
export function ProductListScreen({ nav, q, category }: { nav: Nav; q?: string; category?: string }) {
  const initial = { q: q ?? '', category: category ?? '', min: '', max: '', inStock: false, sort: 'newest' as Sort }
  const [applied, setApplied] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [term, setTerm] = useState(q ?? '')
  const [sheet, setSheet] = useState(false)
  const [page, setPage] = useState(1)

  const qs = new URLSearchParams({ pageSize: String(PAGE), sort: applied.sort })
  if (applied.q) qs.set('search', applied.q)
  if (applied.category) qs.set('category_slug', applied.category)
  if (applied.min) qs.set('min_price', applied.min)
  if (applied.max) qs.set('max_price', applied.max)
  if (applied.inStock) qs.set('in_stock', 'true')
  qs.set('page', String(page))

  const { data, error, pending } = useFetch<ProductList>(() => api<ProductList>(`/products?${qs.toString()}`), [qs.toString()])
  const categories = useFetch<Category[]>(() => api<Category[]>('/categories'), [])
  const list = uniqueById(data?.data ?? [])
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE))
  const active = [applied.q, applied.category, applied.min, applied.max, applied.inStock ? 'true' : ''].filter(Boolean).length
  const sortLabel = SORTS.find((x) => x.value === applied.sort)?.label ?? 'Mới nhất'

  const apply = (next: typeof initial) => {
    setApplied(next)
    setDraft(next)
    setPage(1)
    setSheet(false)
  }

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <SearchBar value={term} onChangeText={setTerm} onSubmit={() => apply({ ...applied, q: term.trim() })} />

        <View style={s.toolRow}>
          <Pressable onPress={() => setSheet(true)} accessibilityRole="button" style={s.toolBtn}>
            <Ionicons name="options-outline" size={15} color={theme.text} />
            <Text style={s.toolText}>Bộ lọc{active > 0 ? ` (${active})` : ''}</Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
            {SORTS.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => apply({ ...applied, sort: o.value })}
                accessibilityRole="button"
                accessibilityState={{ selected: applied.sort === o.value }}
                style={[s.chip, applied.sort === o.value && s.chipOn]}
              >
                <Text style={[s.chipText, applied.sort === o.value && s.chipTextOn]}>{o.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Text style={s.resultLine}>
          {pending && !data ? 'Đang tải…' : `${total} sản phẩm`}
          {applied.q ? ` cho “${applied.q}”` : ''} · {sortLabel}
        </Text>
        {active > 0 && (
          <View style={s.chipRow}>
            {(
              [
                applied.q ? { label: `“${applied.q}”`, patch: { q: '' } } : null,
                applied.category
                  ? { label: categories.data?.find((c) => c.slug === applied.category)?.name ?? applied.category, patch: { category: '' } }
                  : null,
                applied.min ? { label: `từ ${vnd(Number(applied.min))}`, patch: { min: '' } } : null,
                applied.max ? { label: `đến ${vnd(Number(applied.max))}`, patch: { max: '' } } : null,
                applied.inStock ? { label: 'Còn hàng', patch: { inStock: false } } : null,
              ] as Array<{ label: string; patch: Partial<typeof initial> } | null>
            )
              .filter((f) => f !== null)
              .map((f) => (
                <Pressable
                  key={f.label}
                  onPress={() => apply({ ...applied, ...f.patch })}
                  accessibilityRole="button"
                  accessibilityLabel={`Bỏ lọc ${f.label}`}
                  style={s.chipOn}
                >
                  <Text style={s.chipTextOn}>
                    {f.label} <Ionicons name="close" size={11} color={theme.primaryDark} />
                  </Text>
                </Pressable>
              ))}
            <Pressable onPress={() => apply(initial)} accessibilityRole="button" style={s.clearBtn}>
              <Text style={s.clearText}>Xóa bộ lọc</Text>
            </Pressable>
          </View>
        )}
        <ErrorText message={error} />

        {list.length === 0 ? (
          pending ? null : (
            <EmptyState
              title="Không tìm thấy sản phẩm phù hợp"
              hint="Thử bỏ bớt điều kiện lọc hoặc tìm với từ khoá khác, ví dụ “ca chua” không dấu vẫn tìm được."
            />
          )
        ) : (
          <View style={s.grid}>
            {list.map((p) => (
              <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
            ))}
          </View>
        )}

        {pageCount > 1 && list.length > 0 && (
          <View style={s.pager}>
            <Pressable
              onPress={() => setPage((n) => Math.max(1, n - 1))}
              disabled={page <= 1}
              accessibilityRole="button"
              style={[s.pagerBtn, page <= 1 && { opacity: 0.4 }]}
            >
              <Text style={s.pagerText}>Trước</Text>
            </Pressable>
            <Text style={s.resultLine}>
              Trang {page}/{pageCount}
            </Text>
            <Pressable
              onPress={() => setPage((n) => Math.min(pageCount, n + 1))}
              disabled={page >= pageCount}
              accessibilityRole="button"
              style={[s.pagerBtn, page >= pageCount && { opacity: 0.4 }]}
            >
              <Text style={s.pagerText}>Sau</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Bộ lọc sản phẩm">
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          <Text style={s.filterLabel}>Danh mục</Text>
          <View style={s.chipRow}>
            <Pressable onPress={() => setDraft({ ...draft, category: '' })} accessibilityRole="button" style={[s.chip, !draft.category && s.chipOn]}>
              <Text style={[s.chipText, !draft.category && s.chipTextOn]}>Tất cả</Text>
            </Pressable>
            {(categories.data ?? []).map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setDraft({ ...draft, category: c.slug })}
                accessibilityRole="button"
                style={[s.chip, draft.category === c.slug && s.chipOn]}
              >
                <Text style={[s.chipText, draft.category === c.slug && s.chipTextOn]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.filterLabel}>Khoảng giá (₫)</Text>
          <View style={s.priceInputRow}>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={draft.min}
              onChangeText={(v) => setDraft({ ...draft, min: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              placeholder="Từ"
              placeholderTextColor={theme.muted}
              accessibilityLabel="Giá tối thiểu"
            />
            <Text style={s.muted}>—</Text>
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={draft.max}
              onChangeText={(v) => setDraft({ ...draft, max: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              placeholder="Đến"
              placeholderTextColor={theme.muted}
              accessibilityLabel="Giá tối đa"
            />
          </View>

          <Pressable
            onPress={() => setDraft({ ...draft, inStock: !draft.inStock })}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: draft.inStock }}
            style={s.checkRow}
          >
            <Ionicons name={draft.inStock ? 'checkbox' : 'square-outline'} size={20} color={draft.inStock ? theme.primary : theme.muted} />
            <Text style={s.chipText}>Chỉ xem sản phẩm còn hàng</Text>
          </Pressable>
        </ScrollView>

        <View style={s.sheetActions}>
          <Pressable onPress={() => setDraft(initial)} accessibilityRole="button" style={[s.pagerBtn, { flex: 1 }]}>
            <Text style={s.pagerText}>Đặt lại</Text>
          </Pressable>
          <Pressable
            onPress={() => apply({ ...draft, q: draft.q.trim(), min: draft.min, max: draft.max })}
            accessibilityRole="button"
            style={s.applyBtn}
          >
            <Text style={s.applyText}>Áp dụng bộ lọc</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  )
}

/** Favourites / recently viewed: the device holds the ids, the API holds today's price and stock. */
export function SavedScreen({ nav, kind }: { nav: Nav; kind: 'favourites' | 'viewed' }) {
  const memory = useMemory()
  const ids = kind === 'favourites' ? memory.favourites : memory.viewed
  const { data, error } = useFetch<{ data: Product[] }>(
    () => (ids.length === 0 ? Promise.resolve({ data: [] }) : api<{ data: Product[] }>(`/products/by-ids?ids=${ids.join(',')}`)),
    [ids.join(',')],
  )
  // Keep the device's own order: most wanted / most recent first; products gone from sale drop out.
  const byId = new Map((data?.data ?? []).map((p) => [p.id, p]))
  const rows = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p)

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.h1}>{kind === 'favourites' ? 'Sản phẩm yêu thích' : 'Đã xem gần đây'}</Text>
      <Text style={s.muted}>
        {kind === 'favourites'
          ? 'Lưu trên thiết bị này. Giá và tồn kho lấy mới mỗi lần mở.'
          : 'Danh sách lưu trên thiết bị này; giá và tồn kho luôn lấy mới từ cửa hàng.'}
      </Text>
      <ErrorText message={error} />
      {rows.length === 0 ? (
        <EmptyState
          title={kind === 'favourites' ? 'Chưa có sản phẩm yêu thích' : 'Chưa có sản phẩm nào'}
          hint={kind === 'favourites' ? 'Bấm ♥ trên thẻ sản phẩm để lưu lại.' : 'Hãy xem vài sản phẩm để chúng hiện lại ở đây.'}
        />
      ) : (
        <View style={s.grid}>
          {rows.map((p) => (
            <GridCard key={p.id} p={p} onOpen={() => nav.push({ name: 'product', key: p.slug })} />
          ))}
        </View>
      )}
      {rows.length === 0 && (
        <Pressable onPress={() => nav.push({ name: 'products' })} accessibilityRole="button" style={s.applyBtn}>
          <Text style={s.applyText}>Xem sản phẩm</Text>
        </Pressable>
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
  heart: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  toolRow: { gap: space.sm },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.white,
  },
  toolText: { fontSize: 13, fontFamily: font[600], color: theme.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: theme.white,
  },
  chipOn: {
    borderWidth: 1,
    borderColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: theme.softGreen,
  },
  chipText: { fontSize: 12.5, fontFamily: font[500], color: theme.text },
  chipTextOn: { fontSize: 12.5, fontFamily: font[600], color: theme.primaryDark },
  clearBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  clearText: { fontSize: 12.5, fontFamily: font[600], color: theme.danger },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingVertical: space.sm },
  pagerBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: theme.white,
  },
  pagerText: { fontSize: 13, fontFamily: font[600], color: theme.text },
  filterLabel: { fontSize: 12.5, fontFamily: font[700], color: theme.text, marginTop: space.md, marginBottom: 6 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.white,
    fontFamily: font[400],
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  sheetActions: { flexDirection: 'row', gap: space.sm, paddingTop: space.sm },
  applyBtn: {
    flex: 2,
    backgroundColor: theme.buy,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: { fontSize: 14, fontFamily: font[700], color: '#182230' },
  h1: { fontSize: 21, fontFamily: display, color: theme.text, letterSpacing: -0.2 },
})
