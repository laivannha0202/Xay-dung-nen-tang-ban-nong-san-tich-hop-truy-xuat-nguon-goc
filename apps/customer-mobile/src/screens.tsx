import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Address, HomePayload, Order, OrderSummary, ProductDetail, Quote, TracePayload } from './types'
import { api } from './api'
import { useAuth } from './auth'
import { useCart } from './cart'
import { ORDER_STATUS, PAYMENT_STATUS, dateVN, qty, vnd } from './format'
import type { Nav, Route } from './nav'
import { theme } from './theme'
import { useFetch } from './useFetch'
import { Badge, Button, Card, ErrorText, Field } from './ui'

export function Screen({ nav, route }: { nav: Nav; route: Route }) {
  switch (route.name) {
    case 'product':
      return <ProductScreen nav={nav} productKey={route.key} />
    case 'trace':
      return <TraceScreen token={route.token} />
    case 'checkout':
      return <CheckoutScreen nav={nav} />
    case 'orders':
      return <OrdersScreen nav={nav} />
    case 'order':
      return <OrderScreen nav={nav} id={route.id} />
  }
}

export function HomeScreen({ nav }: { nav: Nav }) {
  const { data, error } = useFetch<HomePayload>(() => api<HomePayload>('/home'), [])
  return (
    <Scroll>
      <View style={s.hero}>
        <Text style={s.heroTitle}>Nông sản theo lô</Text>
        <Text style={s.heroText}>
          Mỗi tem QR mở ra nông trại, nhật ký canh tác, phiếu kiểm nghiệm và hạn dùng thật.
        </Text>
      </View>
      <ErrorText message={error} />
      <Text style={s.section}>Danh mục</Text>
      <View style={s.wrap}>
        {(data?.categories ?? []).map((c) => (
          <Badge key={c.slug} label={c.name} />
        ))}
      </View>
      <Text style={s.section}>Đang bán chạy</Text>
      {(data?.featured ?? []).map((p) => (
        <Pressable key={p.id} onPress={() => nav.push({ name: 'product', key: p.slug })}>
          <Card>
            <Text style={s.cardTitle}>{p.name}</Text>
            <Text style={s.muted}>
              {vnd(p.base_price_vnd)}/{p.unit} · còn {qty(p.available)} {p.unit}
            </Text>
            <View style={s.wrap}>
              <Badge label={`★ ${p.rating}`} tone="muted" />
              {p.has_batch_promo && <Badge label="Lô cận hạn giảm giá" tone="warn" />}
            </View>
          </Card>
        </Pressable>
      ))}
      {data && data.featured.length === 0 && <Text style={s.muted}>Chưa có sản phẩm nào đang mở bán.</Text>}
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

  if (!p) return <Scroll>{loadError ? <ErrorText message={loadError} /> : <Text style={s.muted}>Đang tải…</Text>}</Scroll>

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
      <Text style={s.h1}>{p.name}</Text>
      <Text style={s.muted}>
        {vnd(p.base_price_vnd)}/{p.unit} · còn {qty(p.available)} {p.unit}
      </Text>
      {p.description && <Text style={s.body}>{p.description}</Text>}
      {p.origin_note && <Text style={s.muted}>Xuất xứ: {p.origin_note}</Text>}
      {p.storage && <Text style={s.muted}>Bảo quản: {p.storage}</Text>}
      <Button label={`Thêm 1 ${p.unit} vào giỏ`} onPress={() => void addToCart()} disabled={!p.in_stock} />
      {!p.in_stock && <Text style={s.muted}>Tạm hết hàng — chờ lô mới về.</Text>}
      {notice && <Text style={{ color: theme.leafDark }}>{notice}</Text>}
      <ErrorText message={error} />

      <Text style={s.section}>Lô đang bán ({p.public_batches.length})</Text>
      {p.public_batches.map((b) => (
        <Card key={b.code}>
          <Text style={s.cardTitle}>{b.code}</Text>
          <Text style={s.muted}>
            {b.farm_name} · {b.province} · HSD {dateVN(b.expiry_date)}
          </Text>
          {b.discount_percent ? <Badge label={`Giảm ${b.discount_percent}% do cận hạn`} tone="warn" /> : null}
        </Card>
      ))}

      <Text style={s.section}>Đánh giá ({p.reviews.length})</Text>
      {p.reviews.length === 0 && <Text style={s.muted}>Chưa có đánh giá.</Text>}
      {p.reviews.map((r, i) => (
        <Card key={i}>
          <Text style={s.cardTitle}>
            {'★'.repeat(r.rating)} {r.customer_name}
          </Text>
          {r.comment && <Text style={s.body}>{r.comment}</Text>}
          <Text style={s.muted}>{dateVN(r.created_at)}</Text>
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
        <Text style={s.muted}>Giỏ hàng trống.</Text>
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
      {cart.items.map((i) => (
        <Card key={i.product_id}>
          <Text style={s.cardTitle}>{i.name}</Text>
          <Text style={s.muted}>
            {vnd(i.base_price_vnd)}/{i.unit} · tạm tính {vnd(i.line_total_vnd)}
          </Text>
          <View style={s.rowCenter}>
            <Button label="−" variant="secondary" onPress={() => change(i.product_id, Math.max(0, i.quantity - 1))} />
            <Text style={{ minWidth: 64, textAlign: 'center' }}>
              {qty(i.quantity)} {i.unit}
            </Text>
            <Button label="+" variant="secondary" onPress={() => change(i.product_id, i.quantity + 1)} />
            {!i.is_available && <Badge label="Không đủ tồn" tone="danger" />}
          </View>
        </Card>
      ))}
      <ErrorText message={error} />
      <Card>
        <Text style={s.body}>Tạm tính: {vnd(cart.subtotal_vnd)}</Text>
        <Text style={s.cardTitle}>Tổng dự kiến: {vnd(cart.total_estimate_vnd)}</Text>
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
  const { data: quote, error: quoteError } = useFetch<Quote>(
    () => api<Quote>('/checkout/preview', { method: 'POST', body: {} }),
    [],
  )

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
        headers: { 'idempotency-key': `${quote.version}:${Date.now()}` },
        body: { address_id: selected, payment_method: payment, quote_version: quote.version },
      })
      await reload()
      setPlaced(res.code)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
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

      <Text style={s.section}>Địa chỉ giao hàng</Text>
      {(addresses ?? []).map((a) => (
        <Pressable key={a.id} onPress={() => setAddressId(a.id)}>
          <Card style={selected === a.id ? s.selected : undefined}>
            <Text style={s.cardTitle}>
              {a.recipient_name} · {a.phone}
            </Text>
            <Text style={s.muted}>
              {a.street_detail}, {a.ward}, {a.district}, {a.province}
            </Text>
            {a.is_default && <Badge label="Mặc định" tone="muted" />}
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

      <Text style={s.section}>Kiện hàng theo lô</Text>
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

      <Text style={s.section}>Phương thức thanh toán</Text>
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
          <Text style={s.body}>Tiền hàng: {vnd(quote.subtotal_vnd)}</Text>
          {quote.promotion_discount_vnd > 0 && <Text style={s.body}>Khuyến mãi: −{vnd(quote.promotion_discount_vnd)}</Text>}
          <Text style={s.body}>Phí giao: {vnd(quote.ship_fee_vnd)}</Text>
          <Text style={s.cardTitle}>Tổng: {vnd(quote.total_vnd)}</Text>
        </Card>
      )}

      <Button label="Xác nhận đặt hàng" onPress={() => void placeOrder()} busy={busy} disabled={!selected || !quote} />
    </Scroll>
  )
}

function OrdersScreen({ nav }: { nav: Nav }) {
  const { data, error } = useFetch<{ data: OrderSummary[] }>(() => api<{ data: OrderSummary[] }>('/me/orders'), [])
  return (
    <Scroll>
      <Text style={s.h1}>Đơn hàng</Text>
      <ErrorText message={error} />
      {data?.data.length === 0 && <Text style={s.muted}>Chưa có đơn nào.</Text>}
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
            <Text style={s.body}>{vnd(o.total_vnd)}</Text>
          </Card>
        </Pressable>
      ))}
    </Scroll>
  )
}

function OrderScreen({ id }: { nav: Nav; id: string }) {
  const { data: o, error } = useFetch<Order>(() => api<Order>(`/me/orders/${id}`), [id])
  if (!o) return <Scroll>{error ? <ErrorText message={error} /> : <Text style={s.muted}>Đang tải…</Text>}</Scroll>

  return (
    <Scroll>
      <Text style={s.h1}>Đơn {o.code}</Text>
      <View style={s.wrap}>
        <Badge label={ORDER_STATUS[o.status] ?? o.status} />
        <Badge label={PAYMENT_STATUS[o.payment_status] ?? o.payment_status} tone={o.payment_status === 'PAID' ? 'leaf' : 'warn'} />
      </View>
      {!!o.recalled_batches?.length && (
        <Text style={s.danger}>
          Lô đã giao thuộc diện thu hồi: {o.recalled_batches.join(', ')}. Ngừng sử dụng và liên hệ hỗ trợ.
        </Text>
      )}
      {o.lines.map((l) => (
        <Card key={l.id}>
          <Text style={s.cardTitle}>
            {l.product_name} · {qty(l.quantity)} {l.unit}
          </Text>
          <Text style={s.muted}>{vnd(l.quantity * l.unit_price_vnd)}</Text>
          {l.allocations.map((a, i) => (
            <Text key={i} style={s.muted}>
              Lô {a.batch_code} · giữ {qty(a.reserved_qty)} · đã xuất {qty(a.shipped_qty)}
            </Text>
          ))}
        </Card>
      ))}
      <Card>
        <Text style={s.cardTitle}>Giao tới</Text>
        <Text style={s.muted}>
          {o.address_snapshot?.recipient_name} · {o.address_snapshot?.phone}
        </Text>
        <Text style={s.muted}>{o.address_snapshot?.full_address ?? o.address_snapshot?.street_detail}</Text>
      </Card>
      <Text style={[s.cardTitle, { fontSize: 17 }]}>Tổng: {vnd(o.total_vnd)}</Text>
    </Scroll>
  )
}

export function TraceScreen({ token }: { token: string }) {
  const { data, error } = useFetch<TracePayload>(() => api<TracePayload>(`/t/${encodeURIComponent(token)}`), [token])

  if (!data) return <Scroll>{error ? <ErrorText message={error} /> : <Text style={s.muted}>Đang tải…</Text>}</Scroll>

  return (
    <Scroll>
      {(data.recall || data.batch.safety_status === 'RECALLED') && (
        <View style={s.alert}>
          <Text style={s.alertTitle}>LÔ HÀNG ĐANG BỊ THU HỒI</Text>
          <Text style={s.body}>{data.recall?.reason ?? data.alert ?? 'Lô hàng đã bị thu hồi.'}</Text>
        </View>
      )}
      <Text style={s.kicker}>Hồ sơ truy xuất nguồn gốc</Text>
      <Text style={s.h1}>{data.product.name}</Text>
      <Text style={s.muted}>
        Lô {data.batch.code} · SKU {data.product.sku}
      </Text>
      {data.batch.is_expired && <Badge label="Đã hết hạn sử dụng" tone="danger" />}

      <Text style={s.section}>Thông tin lô</Text>
      <Card>
        <Row label="Ngày thu hoạch" value={dateVN(data.batch.harvest_date)} />
        <Row label="Ngày đóng gói" value={dateVN(data.batch.pack_date)} />
        <Row label="Hạn sử dụng" value={dateVN(data.batch.expiry_date)} />
        <Row label="Bảo quản" value={data.batch.storage_condition ?? '—'} />
        <Row label="Kết quả kiểm nghiệm" value={data.batch.quality_status === 'PASS' ? 'Đạt' : data.batch.quality_status} />
      </Card>

      <Text style={s.section}>Nông trại</Text>
      <Card>
        <Row label="Tên" value={data.farm?.name ?? '—'} />
        <Row label="Tỉnh/Thành" value={data.farm?.province ?? '—'} />
        <Row label="Mùa vụ" value={data.season ? `${data.season.code}${data.season.variety ? ` · ${data.season.variety}` : ''}` : '—'} />
        <Row label="Nhà cung cấp" value={data.supplier?.name ?? '—'} />
      </Card>

      <Text style={s.section}>Nhật ký canh tác ({data.timeline.length})</Text>
      {data.timeline.map((t, i) => (
        <Card key={i}>
          <Text style={s.cardTitle}>{labelActivity(t.activity)}</Text>
          <Text style={s.muted}>{dateVN(t.activity_at)}</Text>
          {t.pesticide_name && <Text style={s.body}>Thuốc BVTV: {t.pesticide_name}</Text>}
          {t.materials && <Text style={s.muted}>Vật tư: {t.materials}</Text>}
          {t.isolation_days != null && <Text style={s.muted}>Cách ly {t.isolation_days} ngày trước thu hoạch</Text>}
          {t.note && <Text style={s.muted}>{t.note}</Text>}
        </Card>
      ))}

      <Text style={s.section}>Phiếu kiểm nghiệm ({data.lab_tests.length})</Text>
      {data.lab_tests.map((t) => (
        <Card key={t.id}>
          <Text style={s.cardTitle}>{t.laboratory ?? 'Phòng kiểm nghiệm'}</Text>
          <Text style={s.muted}>
            Lấy mẫu {dateVN(t.sampled_at)} · {t.overall_result}
          </Text>
          {t.notes && <Text style={s.muted}>{t.notes}</Text>}
        </Card>
      ))}

      {data.certificates.length > 0 && (
        <>
          <Text style={s.section}>Chứng nhận ({data.certificates.length})</Text>
          {data.certificates.map((c) => (
            <Card key={c.number}>
              <Text style={s.cardTitle}>{c.type}</Text>
              <Text style={s.muted}>
                {c.number} · {c.issuer ?? '—'} · hiệu lực đến {dateVN(c.valid_until)}
              </Text>
            </Card>
          ))}
        </>
      )}
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

function Scroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  hero: { backgroundColor: theme.leafSoft, borderRadius: 16, padding: 16, gap: 6 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: theme.leafDark },
  heroText: { fontSize: 14, color: theme.muted, lineHeight: 20 },
  kicker: { fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: theme.clay },
  h1: { fontSize: 21, fontWeight: '700', color: theme.text },
  section: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  body: { fontSize: 14, color: theme.text },
  muted: { fontSize: 13, color: theme.muted },
  danger: { fontSize: 13, color: theme.danger },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selected: { borderColor: theme.leaf, borderWidth: 2 },
  alert: { backgroundColor: '#fbe9e7', borderRadius: 12, padding: 12, gap: 4 },
  alertTitle: { fontSize: 15, fontWeight: '700', color: theme.danger },
})
