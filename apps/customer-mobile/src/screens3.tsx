import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ApiError, api } from './api'
import { useAuth } from './auth'
import { dateVN } from './format'
import type { Nav } from './nav'
import { space, theme, font } from './theme'
import { useFetch } from './useFetch'
import { Badge, Button, Card, ErrorText, Field } from './ui'
import { WardPicker } from './ward-picker'

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  status: string
  created_at: string
  product_name: string
  order_code: string
}

interface ComplaintRow {
  id: string
  code: string
  type: string
  status: string
  created_at: string
  batch_code: string | null
  order_code: string | null
  message_count: number
}

import type { Address } from './types'

const COMPLAINT_STATUS: Record<string, string> = {
  OPEN: 'Đang xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  REJECTED: 'Từ chối',
  CLOSED: 'Đã đóng',
}

const COMPLAINT_TYPE: Record<string, string> = {
  QUALITY: 'Chất lượng',
  DAMAGED: 'Hư hỏng',
  WRONG_ITEM: 'Sai hàng',
  SUSPECTED_FAKE: 'Nghi hàng giả',
  OTHER: 'Khác',
}

/** Pull-to-refresh wrapper shared by the list screens (CUS-12-01). */
export function Refreshable({
  reload,
  children,
}: {
  reload: () => void
  children: React.ReactNode
}) {
  const [refreshing, setRefreshing] = useState(false)
  return (
    <ScrollView
      style={{ backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true)
            reload()
            setRefreshing(false)
          }}
        />
      }
    >
      {children}
    </ScrollView>
  )
}

export function ReviewsScreen() {
  const { data, error, reload } = useFetch<ReviewRow[]>(() => api<ReviewRow[]>('/me/reviews'), [])
  return (
    <Refreshable reload={reload}>
      <Text style={s.h1}>Đánh giá của tôi</Text>
      <ErrorText message={error} />
      {data?.length === 0 && (
        <Card style={s.empty}>
          <Text style={s.cardTitle}>Chưa có đánh giá</Text>
          <Text style={s.muted}>Bạn chưa gửi đánh giá nào. Đánh giá sản phẩm từ chi tiết đơn hàng đã giao.</Text>
        </Card>
      )}
      {(data ?? []).map((r) => (
        <Card key={r.id}>
          <View style={s.between}>
            <Text style={[s.cardTitle, s.flex]}>{r.product_name}</Text>
            <Badge
              label={r.status === 'VISIBLE' ? 'Đã duyệt' : 'Đang chờ duyệt'}
              tone={r.status === 'VISIBLE' ? 'leaf' : 'warn'}
            />
          </View>
          <Text style={s.stars}>{'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</Text>
          <Text style={s.muted}>
            Đơn {r.order_code} · {dateVN(r.created_at)}
          </Text>
          {r.comment ? <Text style={s.body}>{r.comment}</Text> : null}
        </Card>
      ))}
    </Refreshable>
  )
}

export function ComplaintsScreen() {
  const { data, error, reload } = useFetch<ComplaintRow[]>(() => api<ComplaintRow[]>('/me/complaints'), [])
  return (
    <Refreshable reload={reload}>
      <Text style={s.h1}>Khiếu nại</Text>
      <Text style={s.muted}>Gửi khiếu nại từ chi tiết đơn hàng hoặc từ hồ sơ tem QR.</Text>
      <ErrorText message={error} />
      {data?.length === 0 && (
        <Card style={s.empty}>
          <Text style={s.cardTitle}>Chưa có khiếu nại</Text>
          <Text style={s.muted}>Mọi khiếu nại bạn gửi sẽ được theo dõi tại đây.</Text>
        </Card>
      )}
      {(data ?? []).map((c) => (
        <Card key={c.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{c.code}</Text>
            <Badge
              label={COMPLAINT_STATUS[c.status] ?? c.status}
              tone={c.status === 'OPEN' || c.status === 'IN_PROGRESS' ? 'warn' : c.status === 'REJECTED' ? 'danger' : 'leaf'}
            />
          </View>
          <Text style={s.muted}>
            {COMPLAINT_TYPE[c.type] ?? c.type} · {dateVN(c.created_at)}
          </Text>
          {(c.batch_code || c.order_code) && (
            <Text style={s.muted}>
              {[c.batch_code ? `Lô ${c.batch_code}` : null, c.order_code ? `Đơn ${c.order_code}` : null]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
          <Text style={s.muted}>{c.message_count} tin nhắn</Text>
        </Card>
      ))}
    </Refreshable>
  )
}

export function ProfileScreen() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const addresses = useFetch<Address[]>(() => api<Address[]>('/me/addresses'), [])
  const [newAddr, setNewAddr] = useState({ ward_code: '', street_detail: '' })
  const [addrError, setAddrError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  async function addAddress() {
    if (!newAddr.ward_code) {
      setAddrError('Chọn xã/phường nhận hàng trong tỉnh Hưng Yên.')
      return
    }
    setAdding(true)
    try {
      await api('/me/addresses', {
        method: 'POST',
        body: { recipient_name: user?.name ?? '', phone: user?.phone ?? '', ...newAddr },
      })
      setNewAddr({ ward_code: '', street_detail: '' })
      setAddrError(null)
      addresses.reload()
    } catch (e) {
      setAddrError(e instanceof ApiError ? e.message : 'Không lưu được địa chỉ.')
    } finally {
      setAdding(false)
    }
  }

  async function makeDefault(id: string) {
    try {
      await api(`/me/addresses/${id}`, { method: 'PATCH', body: { is_default: true } })
      addresses.reload()
    } catch (e) {
      setAddrError(e instanceof ApiError ? e.message : 'Không đặt được mặc định.')
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      // `name` is optional but cannot be blank; `phone` is always sent so it can be cleared.
      const payload: { phone: string; name?: string } = { phone: form.phone.trim() }
      if (form.name.trim().length > 0) payload.name = form.name.trim()
      await api('/me', { method: 'PATCH', body: payload })
      setOk(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không lưu được hồ sơ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Refreshable reload={addresses.reload}>
      <Text style={s.h1}>Hồ sơ của tôi</Text>
      <Text style={s.muted}>{user?.email}</Text>
      <Card>
        <Text style={s.label}>THÔNG TIN CÁ NHÂN</Text>
        <Field label="Họ tên" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Field
          label="Điện thoại"
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
        />
        <ErrorText message={error} />
        {ok && <Text style={s.ok}>Đã lưu hồ sơ.</Text>}
        <Button label="Lưu hồ sơ" onPress={() => void save()} busy={busy} />
      </Card>

      <Text style={s.label}>ĐỊA CHỈ GIAO HÀNG ({addresses.data?.length ?? 0})</Text>
      <ErrorText message={addresses.error} />
      {addresses.data?.length === 0 && (
        <Card style={s.empty}>
          <Text style={s.cardTitle}>Chưa có địa chỉ</Text>
          <Text style={s.muted}>Thêm địa chỉ ở bước thanh toán để dùng cho lần đặt sau.</Text>
        </Card>
      )}
      {(addresses.data ?? []).map((a) => (
        <Card key={a.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{a.recipient_name}</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {a.is_default && <Badge label="Mặc định" />}
              {a.needs_confirmation && <Badge label="Cần chọn lại xã/phường" tone="warn" />}
              {a.in_service_area === false && <Badge label="Ngoài vùng giao" tone="danger" />}
            </View>
          </View>
          <Text style={s.muted}>{a.phone}</Text>
          <Text style={s.muted}>
            {[a.street_detail, a.ward_name ?? a.ward, a.province].filter(Boolean).join(', ')}
          </Text>
          {!a.is_default && (
            <Button label="Đặt mặc định" variant="ghost" onPress={() => void makeDefault(a.id)} />
          )}
        </Card>
      ))}

      <Card>
        <Text style={s.cardTitle}>Thêm địa chỉ</Text>
        <Text style={s.muted}>Tỉnh Hưng Yên — chỉ cần chọn xã/phường và ghi số nhà.</Text>
        <WardPicker value={newAddr.ward_code} onChange={(code) => setNewAddr({ ...newAddr, ward_code: code })} />
        <Field
          label="Số nhà, đường, thôn/tổ dân phố"
          value={newAddr.street_detail}
          onChangeText={(v) => setNewAddr({ ...newAddr, street_detail: v })}
        />
        <ErrorText message={addrError} />
        <Button label="Lưu địa chỉ" onPress={() => void addAddress()} busy={adding} />
      </Card>
    </Refreshable>
  )
}

/** Post-delivery review (CUS-10). Rating is required; the server re-checks delivery state. */
export function ReviewFormScreen({
  nav,
  orderLineId,
  productName,
}: {
  nav: Nav
  orderLineId: string
  productName: string
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await api('/me/reviews', { method: 'POST', body: { order_line_id: orderLineId, rating, comment } })
      nav.pop()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không gửi được đánh giá.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.canvas }}
      contentContainerStyle={{ padding: space.lg, gap: space.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.h1}>Đánh giá {productName}</Text>
      <Card>
        <Text style={s.label}>CHẤT LƯỢNG SẢN PHẨM</Text>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              onPress={() => setRating(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n} sao`}
              hitSlop={6}
            >
              <Text style={[s.star, n <= rating ? s.starOn : null]}>{'★'}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Nhận xét (không bắt buộc)" value={comment} onChangeText={setComment} />
        <ErrorText message={error} />
        <Button label="Gửi đánh giá" onPress={() => void submit()} busy={busy} />
      </Card>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  h1: { fontSize: 22, fontWeight: '700', fontFamily: font[700], color: theme.text },
  label: { fontSize: 11, fontWeight: '700', fontFamily: font[700], letterSpacing: 0.8, color: theme.muted },
  cardTitle: { fontSize: 15, fontWeight: '600', fontFamily: font[600], color: theme.text },
  body: { fontSize: 14, lineHeight: 20, color: theme.text, fontFamily: font[400] },
  muted: { fontSize: 13, lineHeight: 19, color: theme.muted, fontFamily: font[400] },
  ok: { fontSize: 13, color: theme.success, fontFamily: font[400] },
  stars: { fontSize: 15, letterSpacing: 2, color: theme.clay, fontFamily: font[400] },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  empty: { alignItems: 'flex-start', gap: space.xs },
  starsRow: { flexDirection: 'row', gap: space.sm, paddingVertical: space.xs },
  star: { fontSize: 32, color: theme.border, fontFamily: font[400] },
  starOn: { color: theme.clay },
})
