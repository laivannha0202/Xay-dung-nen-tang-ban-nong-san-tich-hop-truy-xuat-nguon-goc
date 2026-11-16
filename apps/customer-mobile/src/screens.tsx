import { useState } from 'react'
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Address, HomePayload, Order, OrderSummary, Product, ProductDetail, Quote, TracePayload } from './types'
import { ApiError, api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { ORDER_STATUS, PAYMENT_STATUS, dateVN, qty, vnd } from './format'
import type { Nav, Route } from './nav'
import { radius, space, theme } from './theme'
import { useFetch } from './useFetch'
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorText,
  Field,
  KpiTile,
  SectionLabel,
} from './ui'
import { ComplaintsScreen, ProfileScreen, ReviewFormScreen, ReviewsScreen } from './screens3'

/** Random key for the checkout idempotency header (CUS-06-06). */
const newIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function Screen({ nav, route }: { nav: Nav; route: Route }) {
  switch (route.name) {
    case 'product':
      return <ProductScreen nav={nav} productKey={route.key} />
    case 'trace':
      return <TraceScreen nav={nav} token={route.token} />
    case 'checkout':
      return <CheckoutScreen nav={nav} />
    case 'orders':
      return <OrdersScreen nav={nav} />
    case 'order':
      return <OrderScreen nav={nav} id={route.id} />
    case 'review':
      return <ReviewFormScreen nav={nav} orderLineId={route.orderLineId} productName={route.productName} />
    case 'reviews':
      return <ReviewsScreen />
    case 'complaints':
      return <ComplaintsScreen />
    case 'profile':
      return <ProfileScreen />
  }
}

/** Square product thumbnail with an initial-letter fallback for missing art. */
function Thumb({ uri, name, size = 64 }: { uri: string | null; name: string; size?: number }) {
  const box = { width: size, height: size, borderRadius: radius.md }
  if (!uri) {
    return (
      <View style={[s.thumbFallback, box]}>
        <Text style={s.thumbInitial}>{name.trim().charAt(0).toUpperCase()}</Text>
      </View>
    )
  }
  return <Image source={{ uri }} style={box} resizeMode="cover" accessibilityLabel={name} />
}

function ProductCard({ p, onPress }: { p: Product; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card>
        <View style={s.productRow}>
          <Thumb uri={p.image} name={p.name} />
          <View style={s.productBody}>
            <Text style={s.cardTitle} numberOfLines={2}>
              {p.name}
            </Text>
            <Text style={s.price}>
              {vnd(p.base_price_vnd)}/{p.unit}
            </Text>
            <Text style={s.muted}>
              còn {qty(p.available)} {p.unit}
            </Text>
          </View>
        </View>
        <View style={s.wrap}>
          <Badge label={p.in_stock ? 'Còn hàng' : 'Hết hàng'} tone={p.in_stock ? 'leaf' : 'danger'} />
          <Badge label={`★ ${p.rating}`} tone="muted" />
          {p.has_batch_promo && <Badge label="Lô cận hạn giảm giá" tone="warn" />}
        </View>
      </Card>
    </Pressable>
  )
}

export function HomeScreen({ nav }: { nav: Nav }) {
  const { data, error, reload } = useFetch<HomePayload>(() => api<HomePayload>('/home'), [])
  const featured = data?.featured ?? []
  const newest = data?.newest ?? []
  return (
    <Scroll reload={reload}>
      <View style={s.hero}>
        <Text style={s.heroKicker}>Nông sản theo lô</Text>
        <Text style={s.heroTitle}>Truy xuất từ hạt giống tới bàn ăn</Text>
        <Text style={s.heroText}>
          Mỗi tem QR mở ra nông trại, nhật ký canh tác, phiếu kiểm nghiệm và hạn dùng thật.
        </Text>
      </View>
      <ErrorText message={error} />
      {data && (
        <View style={s.kpiRow}>
          <KpiTile label="Sản phẩm" value={qty(data.stats.products)} hint="đang mở bán" />
          <KpiTile label="Lô hàng" value={qty(data.stats.batches)} hint="đã công bố" />
        </View>
      )}

      <SectionLabel>Danh mục</SectionLabel>
      <View style={s.wrap}>
        {(data?.categories ?? []).map((c) => (
          <Badge key={c.slug} label={`${c.name} · ${c.product_count}`} tone="muted" />
        ))}
      </View>
      {data && data.categories.length === 0 && <Text style={s.muted}>Chưa có danh mục nào.</Text>}

      <SectionLabel>Nổi bật</SectionLabel>
      {featured.map((p) => (
        <ProductCard key={p.id} p={p} onPress={() => nav.push({ name: 'product', key: p.slug })} />
      ))}
      {data && featured.length === 0 && (
        <EmptyState title="Chưa có sản phẩm nào đang mở bán." hint="Quay lại sau khi lô mới được công bố." />
      )}

      {newest.length > 0 && (
        <>
          <SectionLabel>Mới nhất</SectionLabel>
          {newest.map((p) => (
            <ProductCard key={p.id} p={p} onPress={() => nav.push({ name: 'product', key: p.slug })} />
          ))}
        </>
      )}
    </Scroll>
  )
}

function ProductScreen({ nav, productKey }: { nav: Nav; productKey: string }) {
  const { user } = useAuth()
  const { add } = useCart()
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: p, error: loadError } = useFetch<ProductDetail>(
    () => api<ProductDetail>(`/products/${encodeURIComponent(productKey)}`),
    [productKey],
  )

  if (!p) {
    return (
      <Scroll>
        {loadError ? <ErrorText message={loadError} /> : <Text style={s.muted}>Đang tải…</Text>}
      </Scroll>
    )
  }

  async function addToCart() {
    if (!user) {
      setError('Vui lòng đăng nhập ở tab Tài khoản để thêm vào giỏ.')
      return
    }
    try {
      await add(p!.id, 1)
      setNotice(`Đã thêm 1 ${p!.unit} vào giỏ.`)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Scroll>
      {p.images[0]?.url || p.image ? (
        <Image
          source={{ uri: (p.images[0]?.url ?? p.image) as string }}
          style={s.heroImage}
          resizeMode="cover"
          accessibilityLabel={p.name}
        />
      ) : null}
      <View style={s.wrap}>
        <Badge label={p.in_stock ? 'Còn hàng' : 'Tạm hết hàng'} tone={p.in_stock ? 'leaf' : 'danger'} />
        <Badge label={`★ ${p.rating} · ${p.review_count}`} tone="muted" />
      </View>
      <Text style={s.h1}>{p.name}</Text>
      <Text style={s.price}>
        {vnd(p.base_price_vnd)}/{p.unit} · còn {qty(p.available)} {p.unit}
      </Text>
      {p.description && <Text style={s.body}>{p.description}</Text>}
      {(p.origin_note || p.storage) && (
        <Card>
          {p.origin_note && <Row label="Xuất xứ" value={p.origin_note} />}
          {p.storage && <Row label="Bảo quản" value={p.storage} />}
        </Card>
      )}
      <Button label={`Thêm 1 ${p.unit} vào giỏ`} onPress={() => void addToCart()} disabled={!p.in_stock} />
      {!p.in_stock && <Text style={s.muted}>Tạm hết hàng — chờ lô mới về.</Text>}
      {notice && <Text style={s.success}>{notice}</Text>}
      <ErrorText message={error} />

      <SectionLabel>Lô đang bán ({p.public_batches.length})</SectionLabel>
      {p.public_batches.map((b) => (
        <Card key={b.code}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{b.code}</Text>
            {b.discount_percent ? <Badge label={`−${b.discount_percent}%`} tone="warn" /> : null}
          </View>
          <Text style={s.muted}>
            {b.farm_name} · {b.province}
          </Text>
          <Divider />
          <Row label="Hạn sử dụng" value={dateVN(b.expiry_date)} />
          {b.discount_percent ? <Text style={s.muted}>Giảm giá do cận hạn.</Text> : null}
        </Card>
      ))}
      {p.public_batches.length === 0 && <EmptyState title="Chưa có lô nào đang bán." />}

      <SectionLabel>Đánh giá ({p.reviews.length})</SectionLabel>
      {p.reviews.length === 0 && <EmptyState title="Chưa có đánh giá." hint="Đơn đã giao mới có thể đánh giá." />}
      {p.reviews.map((r, i) => (
        <Card key={i}>
          <View style={s.between}>
            <Text style={s.cardTitle}>
              {'★'.repeat(r.rating)} {r.customer_name}
            </Text>
            <Text style={s.muted}>{dateVN(r.created_at)}</Text>
          </View>
          {r.comment && <Text style={s.body}>{r.comment}</Text>}
        </Card>
      ))}
    </Scroll>
  )
}

export function CartScreen({ nav }: { nav: Nav }) {
  const { cart, setQty, reload } = useCart()
  const [error, setError] = useState<string | null>(null)

  if (!cart || cart.items.length === 0) {
    return (
      <Scroll>
        <Text style={s.h1}>Giỏ hàng</Text>
        <EmptyState title="Giỏ hàng trống." hint="Chọn sản phẩm ở tab Trang chủ để bắt đầu." />
      </Scroll>
    )
  }

  const change = (productId: string, next: number) =>
    void setQty(productId, next)
      .then(reload)
      .catch((e: Error) => setError(e.message))

  return (
    <Scroll>
      <Text style={s.h1}>Giỏ hàng</Text>
      <Text style={s.muted}>{cart.items.length} sản phẩm</Text>
      {cart.items.map((i) => (
        <Card key={i.product_id}>
          <View style={s.productRow}>
            <Thumb uri={i.image} name={i.name} />
            <View style={s.productBody}>
              <Text style={s.cardTitle} numberOfLines={2}>
                {i.name}
              </Text>
              <Text style={s.muted}>
                {vnd(i.base_price_vnd)}/{i.unit}
              </Text>
              <Text style={s.price}>{vnd(i.line_total_vnd)}</Text>
            </View>
          </View>
          <Divider />
          <View style={s.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Giảm ${i.name}`}
              onPress={() => change(i.product_id, Math.max(0, i.quantity - 1))}
              style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
            >
              <Text style={s.stepText}>−</Text>
            </Pressable>
            <Text style={s.stepValue}>
              {qty(i.quantity)} {i.unit}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Tăng ${i.name}`}
              onPress={() => change(i.product_id, i.quantity + 1)}
              style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
            >
              <Text style={s.stepText}>+</Text>
            </Pressable>
            {!i.is_available && <Badge label="Không đủ tồn" tone="danger" />}
          </View>
        </Card>
      ))}
      <ErrorText message={error} />
      <Card>
        <Row label="Tạm tính" value={vnd(cart.subtotal_vnd)} />
        <Divider />
        <View style={s.between}>
          <Text style={s.cardTitle}>Tổng dự kiến</Text>
          <Text style={s.price}>{vnd(cart.total_estimate_vnd)}</Text>
        </View>
      </Card>
      <Button label="Tiến hành đặt hàng" onPress={() => nav.push({ name: 'checkout' })} />
    </Scroll>
  )
}

function CheckoutScreen({ nav }: { nav: Nav }) {
  const { reload } = useCart()
  const [addressId, setAddressId] = useState<string | null>(null)
  const [payment, setPayment] = useState<'COD' | 'BANK_TRANSFER'>('COD')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placed, setPlaced] = useState<string | null>(null)
  const [form, setForm] = useState({
    recipient_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street_detail: '',
  })
  const { data: addresses, reload: reloadAddresses } = useFetch<Address[]>(() => api<Address[]>('/me/addresses'), [])
  const { data: quote, error: quoteError, reload: reloadQuote } = useFetch<Quote>(
    () => api<Quote>('/checkout/preview', { method: 'POST', body: {} }),
    [],
  )
  // One key per checkout attempt; only a confirmed price change mints a new one.
  const [idemKey, setIdemKey] = useState(() => newIdempotencyKey())

  const selected = addressId ?? addresses?.find((a) => a.is_default)?.id ?? addresses?.[0]?.id ?? null

  async function createAddress() {
    setBusy(true)
    try {
      const created = await api<{ id: string }>('/me/addresses', { method: 'POST', body: { ...form, is_default: true } })
      setAddressId(created.id)
      reloadAddresses()
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function placeOrder() {
    if (!selected || !quote) return
    setBusy(true)
    try {
      const res = await api<{ order_id: string; code: string }>('/orders', {
        method: 'POST',
        // CUS-12-03: the key is minted once per cart version and reused on retry,
        // so a network timeout cannot produce a second order.
        headers: { 'idempotency-key': idemKey },
        body: { address_id: selected, payment_method: payment, quote_version: quote.version },
      })
      await reload()
      setPlaced(res.code)
      setError(null)
    } catch (e) {
      const err = e as ApiError
      if (err.code === 'PRICE_CHANGED') {
        setError('Giá hoặc tồn vừa thay đổi. Vui lòng xem lại tổng tiền rồi xác nhận lần nữa.')
        reloadQuote()
        // The shopper re-confirms against the fresh quote, so this is a new request,
        // not a retry of the rejected one.
        setIdemKey(newIdempotencyKey())
      } else if (err.code === 'OUT_OF_STOCK') {
        setError(err.message)
        reloadQuote()
      } else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (placed) {
    return (
      <Scroll>
        <Text style={s.h1}>Đặt hàng thành công</Text>
        <Text style={s.body}>Mã đơn {placed}. Tồn kho đã được giữ chỗ theo lô hiển thị.</Text>
        <Button label="Xem đơn hàng" variant="secondary" onPress={() => nav.push({ name: 'orders' })} />
      </Scroll>
    )
  }

  return (
    <Scroll>
      <Text style={s.h1}>Thanh toán</Text>
      <ErrorText message={error ?? quoteError} />

      <SectionLabel>Địa chỉ giao hàng</SectionLabel>
      {(addresses ?? []).map((a) => (
        <Pressable key={a.id} onPress={() => setAddressId(a.id)}>
          <Card style={selected === a.id ? s.selected : undefined}>
            <View style={s.between}>
              <Text style={s.cardTitle}>
                {a.recipient_name} · {a.phone}
              </Text>
              {a.is_default && <Badge label="Mặc định" tone="muted" />}
            </View>
            <Text style={s.muted}>
              {a.street_detail}, {a.ward}, {a.district}, {a.province}
            </Text>
          </Card>
        </Pressable>
      ))}
      {addresses?.length === 0 && (
        <Card>
          <Text style={s.cardTitle}>Thêm địa chỉ giao hàng</Text>
          <Field label="Người nhận" value={form.recipient_name} onChangeText={(v) => setForm({ ...form, recipient_name: v })} />
          <Field label="Điện thoại" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <Field label="Tỉnh/Thành" value={form.province} onChangeText={(v) => setForm({ ...form, province: v })} />
          <Field label="Quận/Huyện" value={form.district} onChangeText={(v) => setForm({ ...form, district: v })} />
          <Field label="Phường/Xã" value={form.ward} onChangeText={(v) => setForm({ ...form, ward: v })} />
          <Field label="Địa chỉ chi tiết" value={form.street_detail} onChangeText={(v) => setForm({ ...form, street_detail: v })} />
          <Button label="Lưu địa chỉ" onPress={() => void createAddress()} busy={busy} />
        </Card>
      )}

      <SectionLabel>Kiện hàng theo lô</SectionLabel>
      {(quote?.lines ?? []).map((l, i) => (
        <Card key={i}>
          <Text style={s.cardTitle}>
            {l.product_name} · {qty(l.quantity)} {l.unit}
          </Text>
          {l.allocations.map((a, j) => (
            <Text key={j} style={s.muted}>
              Lô {a.batch_code} — {qty(a.qty)} {l.unit} · HSD {dateVN(a.expiry_date)}
              {a.discount_vnd > 0 ? ` · giảm ${vnd(a.discount_vnd)} (cận hạn ${a.discount_percent}%)` : ''}
            </Text>
          ))}
        </Card>
      ))}

      <SectionLabel>Phương thức thanh toán</SectionLabel>
      {([
        ['COD', 'Thanh toán khi nhận hàng (COD)'],
        ['BANK_TRANSFER', 'Chuyển khoản — Admin xác nhận thủ công'],
      ] as const).map(([value, label]) => (
        <Pressable key={value} onPress={() => setPayment(value)}>
          <Card style={payment === value ? s.selected : undefined}>
            <Text style={s.body}>{label}</Text>
          </Card>
        </Pressable>
      ))}

      {quote && (
        <Card>
          <Row label="Tiền hàng" value={vnd(quote.subtotal_vnd)} />
          {quote.promotion_discount_vnd > 0 && <Row label="Khuyến mãi" value={`−${vnd(quote.promotion_discount_vnd)}`} />}
          <Row label="Phí giao" value={vnd(quote.ship_fee_vnd)} />
          <Divider />
          <View style={s.between}>
            <Text style={s.cardTitle}>Tổng</Text>
            <Text style={s.price}>{vnd(quote.total_vnd)}</Text>
          </View>
        </Card>
      )}

      <Button label="Xác nhận đặt hàng" onPress={() => void placeOrder()} busy={busy} disabled={!selected || !quote} />
    </Scroll>
  )
}

const ORDER_TABS: Array<{ v: string; label: string }> = [
  { v: '', label: 'Tất cả' },
  { v: 'PENDING', label: 'Chờ xác nhận' },
  { v: 'SHIPPING', label: 'Đang giao' },
  { v: 'DELIVERED', label: 'Đã giao' },
]

function OrdersScreen({ nav }: { nav: Nav }) {
  const [status, setStatus] = useState('')
  const { data, error, reload } = useFetch<{ data: OrderSummary[] }>(
    () => api<{ data: OrderSummary[] }>(`/me/orders${status ? `?status=${status}` : ''}`),
    [status],
  )
  return (
    <Scroll reload={reload}>
      <Text style={s.h1}>Đơn hàng</Text>
      <View style={s.tabs}>
        {ORDER_TABS.map((t) => (
          <Pressable key={t.v} onPress={() => setStatus(t.v)} style={[s.tab, status === t.v && s.tabOn]}>
            <Text style={[s.tabText, status === t.v && s.tabTextOn]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <ErrorText message={error} />
      {data?.data.length === 0 && <EmptyState title="Chưa có đơn nào." hint="Đơn mới sẽ xuất hiện ở đây." />}
      {(data?.data ?? []).map((o) => (
        <Pressable key={o.id} onPress={() => nav.push({ name: 'order', id: o.id })}>
          <Card>
            <View style={s.between}>
              <Text style={s.cardTitle}>{o.code}</Text>
              <Badge label={ORDER_STATUS[o.status] ?? o.status} />
            </View>
            <Text style={s.muted}>
              {dateVN(o.placed_at)} · {o.line_count} sản phẩm
            </Text>
            <Divider />
            <Text style={s.price}>{vnd(o.total_vnd)}</Text>
          </Card>
        </Pressable>
      ))}
    </Scroll>
  )
}

function OrderScreen({ nav, id }: { nav: Nav; id: string }) {
  const { data: o, error, reload } = useFetch<Order>(() => api<Order>(`/me/orders/${id}`), [id])
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  if (!o) {
    return (
      <Scroll>
        {error ? <ErrorText message={error} /> : <Text style={s.muted}>Đang tải…</Text>}
      </Scroll>
    )
  }

  const cancellable = ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)
  const reviewable = ['DELIVERED', 'COMPLETED'].includes(o.status)

  async function cancel() {
    setBusy(true)
    setActionError(null)
    try {
      await api(`/me/orders/${id}/cancel`, { method: 'POST', body: { reason: 'Khách hủy trên ứng dụng' } })
      reload()
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Không hủy được đơn.')
    } finally {
      setBusy(false)
    }
  }

  async function report(lineId: string, batchId: string | null) {
    setBusy(true)
    setActionError(null)
    try {
      await api('/me/complaints', {
        method: 'POST',
        body: {
          order_id: id,
          order_line_id: lineId,
          batch_id: batchId,
          type: 'QUALITY',
          description: 'Khách báo vấn đề chất lượng từ ứng dụng.',
        },
      })
      nav.push({ name: 'complaints' })
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Không gửi được khiếu nại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Scroll reload={reload}>
      <Text style={s.kicker}>{dateVN(o.placed_at)}</Text>
      <Text style={s.h1}>Đơn {o.code}</Text>
      <View style={s.wrap}>
        <Badge label={ORDER_STATUS[o.status] ?? o.status} />
        <Badge label={PAYMENT_STATUS[o.payment_status] ?? o.payment_status} tone={o.payment_status === 'PAID' ? 'leaf' : 'warn'} />
      </View>
      {!!o.recalled_batches?.length && (
        <View style={s.alert}>
          <Text style={s.alertTitle}>Lô đã giao thuộc diện thu hồi</Text>
          <Text style={s.body}>{o.recalled_batches.join(', ')}. Ngừng sử dụng và liên hệ hỗ trợ.</Text>
        </View>
      )}

      <SectionLabel>Sản phẩm</SectionLabel>
      {o.lines.map((l) => (
        <Card key={l.id}>
          <Text style={s.cardTitle}>
            {l.product_name} · {qty(l.quantity)} {l.unit}
          </Text>
          <Text style={s.price}>{vnd(l.quantity * l.unit_price_vnd)}</Text>
          {l.allocations.map((a, i) => (
            <Text key={i} style={s.muted}>
              Lô {a.batch_code} · giữ {qty(a.reserved_qty)} · đã xuất {qty(a.shipped_qty)}
            </Text>
          ))}
          {reviewable && l.review && (
            <Text style={s.muted}>
              Đã đánh giá {l.review.rating}★{l.review.status !== 'VISIBLE' ? ' (chờ duyệt)' : ''}
            </Text>
          )}
          {reviewable && !l.review && (
            <Button
              label="Đánh giá sản phẩm"
              variant="secondary"
              onPress={() => nav.push({ name: 'review', orderLineId: l.id, productName: l.product_name })}
            />
          )}
          {reviewable && (
            <Button
              label="Báo cáo vấn đề"
              variant="ghost"
              onPress={() => void report(l.id, l.allocations[0]?.batch_id ?? null)}
            />
          )}
        </Card>
      ))}

      <SectionLabel>Giao tới</SectionLabel>
      <Card>
        <Text style={s.cardTitle}>
          {o.address_snapshot?.recipient_name} · {o.address_snapshot?.phone}
        </Text>
        <Text style={s.muted}>{o.address_snapshot?.full_address ?? o.address_snapshot?.street_detail}</Text>
      </Card>

      <Card>
        <View style={s.between}>
          <Text style={s.cardTitle}>Tổng cộng</Text>
          <Text style={s.price}>{vnd(o.total_vnd)}</Text>
        </View>
      </Card>
      {cancellable && <Button label="Hủy đơn" variant="secondary" busy={busy} onPress={() => void cancel()} />}
      <ErrorText message={actionError} />
    </Scroll>
  )
}

export function TraceScreen({ nav, token }: { nav: Nav; token: string }) {
  const { data, error, reload } = useFetch<TracePayload>(() => api<TracePayload>(`/t/${encodeURIComponent(token)}`), [token])

  if (!data) {
    return (
      <Scroll>
        {error ? <ErrorText message={error} /> : <Text style={s.muted}>Đang tải…</Text>}
      </Scroll>
    )
  }

  const recalled = data.recall || data.batch.safety_status === 'RECALLED'

  return (
    <Scroll reload={reload}>
      {recalled && (
        <View style={s.alert}>
          <Text style={s.alertTitle}>Lô hàng đang bị thu hồi</Text>
          <Text style={s.body}>{data.recall?.reason ?? data.alert ?? 'Lô hàng đã bị thu hồi.'}</Text>
        </View>
      )}

      <Text style={s.kicker}>Hồ sơ truy xuất nguồn gốc</Text>
      <Text style={s.h1}>{data.product.name}</Text>
      <Text style={s.muted}>
        Lô {data.batch.code} · SKU {data.product.sku}
      </Text>
      <View style={s.wrap}>
        <Badge
          label={data.batch.is_expired ? 'Đã hết hạn sử dụng' : 'Trong hạn sử dụng'}
          tone={data.batch.is_expired ? 'danger' : 'leaf'}
        />
        <Badge label={`Kiểm nghiệm: ${data.batch.quality_status === 'PASS' ? 'Đạt' : data.batch.quality_status}`} tone="muted" />
      </View>

      <SectionLabel>Thông tin lô</SectionLabel>
      <Card>
        <Row label="Ngày thu hoạch" value={dateVN(data.batch.harvest_date)} />
        <Divider />
        <Row label="Ngày đóng gói" value={dateVN(data.batch.pack_date)} />
        <Divider />
        <Row label="Hạn sử dụng" value={dateVN(data.batch.expiry_date)} />
        <Divider />
        <Row label="Bảo quản" value={data.batch.storage_condition ?? '—'} />
        <Divider />
        <Row label="Kết quả kiểm nghiệm" value={data.batch.quality_status === 'PASS' ? 'Đạt' : data.batch.quality_status} />
      </Card>

      <SectionLabel>Nông trại</SectionLabel>
      <Card>
        <Row label="Tên" value={data.farm?.name ?? '—'} />
        <Divider />
        <Row label="Tỉnh/Thành" value={data.farm?.province ?? '—'} />
        <Divider />
        <Row label="Nhà cung cấp" value={data.supplier?.name ?? '—'} />
      </Card>

      <SectionLabel>Mùa vụ</SectionLabel>
      <Card>
        <Row label="Mã mùa vụ" value={data.season?.code ?? '—'} />
        <Divider />
        <Row label="Giống" value={data.season?.variety ?? '—'} />
        <Divider />
        <Row label="Gieo trồng" value={dateVN(data.season?.sown_at)} />
        <Divider />
        <Row label="Dự kiến thu hoạch" value={dateVN(data.season?.expected_harvest_at)} />
        <Divider />
        <Row label="Diện tích" value={data.season?.area_ha != null ? `${data.season.area_ha} ha` : '—'} />
      </Card>

      <SectionLabel>Nhật ký canh tác ({data.timeline.length})</SectionLabel>
      {data.timeline.length === 0 && <EmptyState title="Chưa có nhật ký canh tác." />}
      {data.timeline.map((t, i) => (
        <Card key={i}>
          <View style={s.timelineRow}>
            <View style={s.timelineMark} />
            <View style={s.timelineBody}>
              <Text style={s.cardTitle}>{labelActivity(t.activity)}</Text>
              <Text style={s.muted}>{dateVN(t.activity_at)}</Text>
              {t.pesticide_name && <Text style={s.body}>Thuốc BVTV: {t.pesticide_name}</Text>}
              {t.materials && <Text style={s.muted}>Vật tư: {t.materials}</Text>}
              {t.isolation_days != null && <Text style={s.muted}>Cách ly {t.isolation_days} ngày trước thu hoạch</Text>}
              {t.note && <Text style={s.muted}>{t.note}</Text>}
            </View>
          </View>
        </Card>
      ))}

      <SectionLabel>Phiếu kiểm nghiệm ({data.lab_tests.length})</SectionLabel>
      {data.lab_tests.length === 0 && <EmptyState title="Chưa có phiếu kiểm nghiệm." />}
      {data.lab_tests.map((t) => (
        <Card key={t.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{t.laboratory ?? 'Phòng kiểm nghiệm'}</Text>
            <Badge label={t.overall_result} tone={t.overall_result === 'PASS' ? 'leaf' : 'warn'} />
          </View>
          <Text style={s.muted}>Lấy mẫu {dateVN(t.sampled_at)}</Text>
          {t.notes && <Text style={s.muted}>{t.notes}</Text>}
        </Card>
      ))}

      {data.certificates.length > 0 && (
        <>
          <SectionLabel>Chứng nhận ({data.certificates.length})</SectionLabel>
          {data.certificates.map((c) => (
            <Card key={c.number}>
              <Text style={s.cardTitle}>{c.type}</Text>
              <Text style={s.muted}>
                {c.number} · {c.issuer ?? '—'}
              </Text>
              <Text style={s.muted}>Hiệu lực đến {dateVN(c.valid_until)}</Text>
            </Card>
          ))}
        </>
      )}

      <SectionLabel>Có vấn đề với lô này?</SectionLabel>
      <Card>
        <Text style={s.muted}>
          Khiếu nại sẽ được gắn trực tiếp với lô {data.batch.code} để bộ phận hỗ trợ kiểm tra đúng hồ sơ.
        </Text>
        <Button label="Báo cáo vấn đề" variant="secondary" onPress={() => nav.push({ name: 'complaints' })} />
      </Card>
    </Scroll>
  )
}

const ACT = {
  TILLING: 'Làm đất',
  SOWING: 'Gieo trồng',
  FERTILIZING: 'Bón phân',
  PESTICIDE: 'Phun thuốc BVTV',
  IRRIGATION: 'Tưới nước',
  PRUNING: 'Tỉa cành',
  HARVEST: 'Thu hoạch',
  OTHER: 'Khác',
} as const

const labelActivity = (a: string) => (ACT as Record<string, string>)[a] ?? a

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.between}>
      <Text style={s.muted}>{label}</Text>
      <Text style={[s.body, { flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </View>
  )
}

function Scroll({
  children,
  reload,
}: {
  children: React.ReactNode
  reload?: () => void
}) {
  // `reload` merely bumps a fetch counter, so the spinner needs its own frame to show.
  const [spinning, setSpinning] = useState(false)
  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.md }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        reload ? (
          <RefreshControl
            refreshing={spinning}
            onRefresh={() => {
              setSpinning(true)
              reload()
              setTimeout(() => setSpinning(false), 400)
            }}
            tintColor={theme.leaf}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.canvas },
  hero: { backgroundColor: theme.leafSoft, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  heroKicker: { fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: theme.leafDark, fontWeight: '700' },
  heroTitle: { fontSize: 21, fontWeight: '700', color: theme.leafDark, lineHeight: 27 },
  heroText: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  heroImage: { width: '100%', height: 200, borderRadius: radius.lg, backgroundColor: theme.leafSoft },
  kicker: { fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: theme.clay, fontWeight: '600' },
  h1: { fontSize: 22, fontWeight: '700', color: theme.text },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  body: { fontSize: 14, color: theme.text, lineHeight: 20 },
  muted: { fontSize: 13, color: theme.muted, lineHeight: 19 },
  success: { fontSize: 13, color: theme.leafDark, fontWeight: '600' },
  price: { fontSize: 16, fontWeight: '700', color: theme.leafDark },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  kpiRow: { flexDirection: 'row', gap: space.sm },
  productRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  productBody: { flex: 1, gap: 2 },
  thumbFallback: { backgroundColor: theme.leafSoft, alignItems: 'center', justifyContent: 'center' },
  thumbInitial: { fontSize: 22, fontWeight: '700', color: theme.leaf },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnPressed: { backgroundColor: theme.leafSoft },
  stepText: { fontSize: 18, fontWeight: '600', color: theme.leafDark },
  stepValue: { minWidth: 76, textAlign: 'center', fontSize: 14, fontWeight: '600', color: theme.text },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  tab: { paddingHorizontal: space.md, paddingVertical: 7, borderRadius: 999, backgroundColor: theme.leafSoft },
  tabOn: { backgroundColor: theme.leaf },
  tabText: { fontSize: 12, color: theme.leafDark, fontWeight: '600' },
  tabTextOn: { color: theme.white },
  selected: { borderColor: theme.leaf, borderWidth: 2 },
  alert: {
    backgroundColor: '#fbe9e7',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.danger,
    padding: space.md,
    gap: space.xs,
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: theme.danger, letterSpacing: 0.3 },
  timelineRow: { flexDirection: 'row', gap: space.md },
  timelineMark: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.leaf, marginTop: 6 },
  timelineBody: { flex: 1, gap: 2 },
})
