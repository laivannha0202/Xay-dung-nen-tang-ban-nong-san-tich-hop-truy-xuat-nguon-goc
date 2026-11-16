import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ApiError, api } from './api'
import { useAuth } from './auth'
import { dateVN } from './format'
import type { Nav } from './nav'
import { theme } from './theme'
import { useFetch } from './useFetch'
import { Badge, Button, Card, ErrorText, Field } from './ui'

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

interface Address {
  id: string
  recipient_name: string
  phone: string
  province: string
  district: string
  ward: string
  street_detail: string
  is_default: boolean
}

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
      contentContainerStyle={{ padding: 14, gap: 12 }}
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
      {data?.length === 0 && <Text style={s.muted}>Bạn chưa gửi đánh giá nào.</Text>}
      {(data ?? []).map((r) => (
        <Card key={r.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{r.product_name}</Text>
            <Text style={s.stars}>{'★'.repeat(r.rating)}</Text>
          </View>
          <Text style={s.muted}>
            Đơn {r.order_code} · {dateVN(r.created_at)}
          </Text>
          {r.comment ? <Text style={s.body}>{r.comment}</Text> : null}
          {r.status !== 'VISIBLE' && <Badge label="Đang chờ duyệt" tone="warn" />}
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
      {data?.length === 0 && <Text style={s.muted}>Chưa có khiếu nại nào.</Text>}
      {(data ?? []).map((c) => (
        <Card key={c.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{c.code}</Text>
            <Badge label={COMPLAINT_STATUS[c.status] ?? c.status} tone={c.status === 'OPEN' ? 'warn' : 'leaf'} />
          </View>
          <Text style={s.muted}>
            {COMPLAINT_TYPE[c.type] ?? c.type} · {dateVN(c.created_at)}
          </Text>
          {c.batch_code ? <Text style={s.muted}>Lô {c.batch_code}</Text> : null}
          {c.order_code ? <Text style={s.muted}>Đơn {c.order_code}</Text> : null}
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

      <Text style={s.section}>Địa chỉ giao hàng ({addresses.data?.length ?? 0})</Text>
      <ErrorText message={addresses.error} />
      {addresses.data?.length === 0 && <Text style={s.muted}>Chưa có địa chỉ. Thêm ở bước thanh toán.</Text>}
      {(addresses.data ?? []).map((a) => (
        <Card key={a.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{a.recipient_name}</Text>
            {a.is_default && <Badge label="Mặc định" />}
          </View>
          <Text style={s.muted}>{a.phone}</Text>
          <Text style={s.muted}>
            {[a.street_detail, a.ward, a.district, a.province].filter(Boolean).join(', ')}
          </Text>
        </Card>
      ))}
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
    <ScrollView contentContainerStyle={{ padding: 14, gap: 12 }} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>Đánh giá {productName}</Text>
      <Card>
        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} sao`}>
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
  h1: { fontSize: 21, fontWeight: '700', color: theme.text },
  section: { fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  body: { fontSize: 14, color: theme.text },
  muted: { fontSize: 13, color: theme.muted },
  ok: { fontSize: 13, color: theme.leafDark },
  stars: { fontSize: 14, color: theme.clay },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  starsRow: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 30, color: theme.border },
  starOn: { color: theme.clay },
})
