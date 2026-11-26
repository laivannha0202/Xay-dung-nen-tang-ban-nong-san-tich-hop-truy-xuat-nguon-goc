import { useState } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
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

/** Matches the DB CHECK: NEW is the initial state, PROCESSING is the working one. */
const COMPLAINT_STATUS: Record<string, string> = {
  NEW: 'Mới gửi',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã xử lý',
  CLOSED: 'Đã đóng',
}
const complaintOpen = (status: string) => status === 'NEW' || status === 'PROCESSING'

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

export function ComplaintsScreen({ nav }: { nav: Nav }) {
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
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={`Khiếu nại ${c.code}`}
          onPress={() => nav.push({ name: 'complaint', id: c.id })}
        >
          <Card>
            <View style={s.between}>
              <Text style={s.cardTitle}>{c.code}</Text>
              <Badge
                label={COMPLAINT_STATUS[c.status] ?? c.status}
                tone={complaintOpen(c.status) ? 'warn' : 'leaf'}
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
            <Text style={s.muted}>{c.message_count} tin nhắn · Xem chi tiết ›</Text>
          </Card>
        </Pressable>
      ))}
    </Refreshable>
  )
}

interface ComplaintDetail {
  id: string
  code: string
  type: string
  status: string
  description: string
  resolution: string
  created_at: string
  batch_code: string | null
  order_code: string | null
  messages: Array<{ id: string; content: string; actor_role: string; created_at: string; actor_name: string }>
  files: Array<{ id: string; url: string; mime: string }>
}

/** One complaint with its reply history; a reply is only offered while support still has it open. */
export function ComplaintDetailScreen({ id }: { id: string }) {
  const { data, error, reload } = useFetch<ComplaintDetail>(() => api<ComplaintDetail>(`/me/complaints/${id}`), [id])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  async function send() {
    setBusy(true)
    setReplyError(null)
    try {
      await api(`/me/complaints/${id}/messages`, { method: 'POST', body: { content: reply.trim() } })
      setReply('')
      reload()
    } catch (e) {
      setReplyError(readError(e, 'Không gửi được phản hồi.'))
    } finally {
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <Refreshable reload={reload}>
        {error ? <ErrorText message={error} /> : <Text style={s.muted}>Đang tải…</Text>}
      </Refreshable>
    )
  }
  const open = complaintOpen(data.status)

  return (
    <Refreshable reload={reload}>
      <Text style={s.h1}>Khiếu nại {data.code}</Text>
      <View style={s.between}>
        <Badge label={COMPLAINT_STATUS[data.status] ?? data.status} tone={open ? 'warn' : 'leaf'} />
        <Text style={s.muted}>{dateVN(data.created_at)}</Text>
      </View>
      <Card>
        <Text style={s.label}>NỘI DUNG</Text>
        <Text style={s.muted}>{COMPLAINT_TYPE[data.type] ?? data.type}</Text>
        <Text style={s.body}>{data.description}</Text>
        {(data.batch_code || data.order_code) && (
          <Text style={s.muted}>
            {[data.batch_code ? `Lô ${data.batch_code}` : null, data.order_code ? `Đơn ${data.order_code}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}
      </Card>
      {data.resolution ? (
        <Card>
          <Text style={s.label}>KẾT QUẢ XỬ LÝ</Text>
          <Text style={s.body}>{data.resolution}</Text>
          <Text style={s.muted}>Tiền chỉ được hoàn sau khi bộ phận hỗ trợ xác nhận hoàn tất.</Text>
        </Card>
      ) : null}

      <Text style={s.label}>TRAO ĐỔI ({data.messages.length})</Text>
      {data.messages.length === 0 && <Text style={s.muted}>Chưa có phản hồi. Bổ sung thông tin bên dưới nếu cần.</Text>}
      {data.messages.map((m) => (
        <Card key={m.id}>
          <View style={s.between}>
            <Text style={s.cardTitle}>{m.actor_role === 'CUSTOMER' ? 'Bạn' : 'AgriMarket'}</Text>
            <Text style={s.muted}>{dateVN(m.created_at)}</Text>
          </View>
          <Text style={s.body}>{m.content}</Text>
        </Card>
      ))}

      {open ? (
        <Card>
          <Text style={s.cardTitle}>Gửi phản hồi bổ sung</Text>
          <Field label="Nội dung" value={reply} onChangeText={setReply} placeholder="Tối thiểu 1 ký tự" />
          <ErrorText message={replyError} />
          <Button icon="send-outline" label="Gửi phản hồi" onPress={() => void send()} busy={busy} disabled={reply.trim().length === 0} />
        </Card>
      ) : (
        <Text style={s.muted}>Khiếu nại đã đóng. Liên hệ hotline AgriMarket nếu cần hỗ trợ thêm.</Text>
      )}
    </Refreshable>
  )
}


/** Field-level rejections the API sends back; shown instead of the generic message when present. */
const readError = (e: unknown, fallback: string) => {
  if (!(e instanceof ApiError)) return fallback
  const field = e.fieldErrors && Object.values(e.fieldErrors)[0]
  return field ?? e.message
}

export function ProfileScreen() {
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function save() {
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      // `name` is optional but cannot be blank; `phone` is always sent so it can be cleared.
      const payload: { phone: string; name?: string } = { phone: form.phone.trim() }
      if (form.name.trim().length > 0) payload.name = form.name.trim()
      await api('/me', { method: 'PATCH', body: payload })
      // Re-read the account so every header shows the saved name, not the boot-time one.
      await refresh()
      setOk(true)
    } catch (e) {
      setError(readError(e, 'Không lưu được hồ sơ.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Refreshable reload={() => void refresh().catch(() => {})}>
      <Text style={s.h1}>Hồ sơ cá nhân</Text>
      <Card>
        <Text style={s.label}>THÔNG TIN CÁ NHÂN</Text>
        <Field label="Họ tên" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
        <Field
          label="Điện thoại"
          value={form.phone}
          onChangeText={(v) => setForm({ ...form, phone: v })}
          keyboardType="phone-pad"
        />
        <Field label="Email (không đổi được)" value={user?.email ?? ''} editable={false} />
        <ErrorText message={error} />
        {ok && <Text style={s.ok}>Đã lưu hồ sơ.</Text>}
        <Button icon="checkmark-circle-outline" label="Lưu hồ sơ" onPress={() => void save()} busy={busy} />
      </Card>
    </Refreshable>
  )
}

/** Address book: add, edit, delete (with confirmation) and set the default — same rules as the site. */
export function AddressBookScreen() {
  const { user } = useAuth()
  const { data, error, reload } = useFetch<Address[]>(() => api<Address[]>('/me/addresses'), [])
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const [form, setForm] = useState({ recipient_name: '', phone: '', ward_code: '', street_detail: '' })
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function startNew() {
    setForm({ recipient_name: user?.name ?? '', phone: user?.phone ?? '', ward_code: '', street_detail: '' })
    setFormError(null)
    setEditing('new')
  }

  function startEdit(a: Address) {
    setForm({
      recipient_name: a.recipient_name,
      phone: a.phone,
      ward_code: a.ward_code ?? '',
      street_detail: a.street_detail,
    })
    setFormError(null)
    setEditing(a)
  }

  async function save() {
    if (!form.ward_code) {
      setFormError('Chọn xã/phường nhận hàng trong tỉnh Hưng Yên.')
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const body = {
        recipient_name: form.recipient_name.trim(),
        phone: form.phone.trim(),
        ward_code: form.ward_code,
        street_detail: form.street_detail.trim(),
      }
      if (editing === 'new') await api('/me/addresses', { method: 'POST', body })
      else if (editing) await api(`/me/addresses/${editing.id}`, { method: 'PATCH', body })
      setEditing(null)
      setOk(true)
      reload()
    } catch (e) {
      setFormError(readError(e, 'Không lưu được địa chỉ.'))
    } finally {
      setBusy(false)
    }
  }

  async function makeDefault(id: string) {
    setFormError(null)
    try {
      await api(`/me/addresses/${id}`, { method: 'PATCH', body: { is_default: true } })
      reload()
    } catch (e) {
      setFormError(readError(e, 'Không đặt được mặc định.'))
    }
  }

  function confirmDelete(a: Address) {
    Alert.alert('Xóa địa chỉ?', `${a.recipient_name} · ${a.phone}`, [
      { text: 'Giữ lại', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void api(`/me/addresses/${a.id}`, { method: 'DELETE' })
            .then(() => {
              if (editing !== 'new' && editing?.id === a.id) setEditing(null)
              reload()
            })
            .catch((e: unknown) => setFormError(readError(e, 'Không xóa được địa chỉ.')))
        },
      },
    ])
  }

  return (
    <Refreshable reload={reload}>
      <Text style={s.h1}>Địa chỉ giao hàng</Text>
      <Text style={s.muted}>
        AgriMarket chỉ giao trong tỉnh Hưng Yên. Địa chỉ đã lưu trên website hiện ở đây và ngược lại.
      </Text>
      <ErrorText message={error ?? formError} />
      {ok && editing === null && <Text style={s.ok}>Đã cập nhật sổ địa chỉ.</Text>}
      {data?.length === 0 && (
        <Card style={s.empty}>
          <Text style={s.cardTitle}>Chưa có địa chỉ</Text>
          <Text style={s.muted}>Thêm địa chỉ để dùng ngay ở bước thanh toán.</Text>
        </Card>
      )}
      {(data ?? []).map((a) => (
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
          <View style={s.actions}>
            <Button icon="create-outline" label="Sửa" variant="secondary" onPress={() => startEdit(a)} disabled={busy} />
            {!a.is_default && <Button icon="checkmark-circle-outline" label="Đặt mặc định" variant="ghost" onPress={() => void makeDefault(a.id)} />}
            <Button icon="trash-outline" label="Xóa" variant="ghost" onPress={() => confirmDelete(a)} disabled={busy} />
          </View>
        </Card>
      ))}

      {editing === null ? (
        <Button icon="add-circle-outline" label="Thêm địa chỉ mới" onPress={startNew} />
      ) : (
        <Card>
          <Text style={s.cardTitle}>{editing === 'new' ? 'Thêm địa chỉ' : 'Sửa địa chỉ'}</Text>
          <Field
            label="Người nhận"
            value={form.recipient_name}
            onChangeText={(v) => setForm({ ...form, recipient_name: v })}
          />
          <Field
            label="Điện thoại"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            keyboardType="phone-pad"
          />
          <WardPicker value={form.ward_code} onChange={(code) => setForm({ ...form, ward_code: code })} />
          <Field
            label="Số nhà, đường, thôn/tổ dân phố"
            value={form.street_detail}
            onChangeText={(v) => setForm({ ...form, street_detail: v })}
          />
          <ErrorText message={formError} />
          <View style={s.actions}>
            <Button icon="checkmark-circle-outline" label="Lưu địa chỉ" onPress={() => void save()} busy={busy} />
            <Button label="Hủy" variant="secondary" onPress={() => setEditing(null)} disabled={busy} />
          </View>
        </Card>
      )}
    </Refreshable>
  )
}

/**
 * Password change. The API bumps `token_version` and hands back a fresh bearer, so the old one
 * is dead the moment this succeeds — it must be replaced here or the next request logs out.
 */
export function SecurityScreen() {
  const { adoptToken, logout } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit() {
    setError(null)
    setOk(false)
    if (form.next.length < 8) {
      setError('Mật khẩu mới cần tối thiểu 8 ký tự.')
      return
    }
    if (form.next !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (form.next === form.current) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }
    setBusy(true)
    try {
      const res = await api<{ token?: string }>('/me/password', {
        method: 'POST',
        body: { current_password: form.current, new_password: form.next },
      })
      if (res.token) await adoptToken(res.token)
      setForm({ current: '', next: '', confirm: '' })
      setOk(true)
    } catch (e) {
      const field = e instanceof ApiError && e.fieldErrors ? Object.values(e.fieldErrors)[0] : undefined
      setError(field ?? (e instanceof ApiError ? e.message : 'Không đổi được mật khẩu.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Refreshable reload={() => setOk(false)}>
      <Text style={s.h1}>Đăng nhập & bảo mật</Text>
      <Card>
        <Text style={s.label}>ĐỔI MẬT KHẨU</Text>
        <Field
          label="Mật khẩu hiện tại"
          value={form.current}
          onChangeText={(v) => setForm({ ...form, current: v })}
          secureTextEntry={!show}
        />
        <Field
          label="Mật khẩu mới (tối thiểu 8 ký tự)"
          value={form.next}
          onChangeText={(v) => setForm({ ...form, next: v })}
          secureTextEntry={!show}
        />
        <Field
          label="Xác nhận mật khẩu mới"
          value={form.confirm}
          onChangeText={(v) => setForm({ ...form, confirm: v })}
          secureTextEntry={!show}
        />
        <Button icon={show ? 'eye-off-outline' : 'eye-outline'} label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} variant="ghost" onPress={() => setShow(!show)} />
        <ErrorText message={error} />
        {ok && <Text style={s.ok}>Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.</Text>}
        <Button
          label="Đổi mật khẩu"
          onPress={() => void submit()}
          busy={busy}
          disabled={!form.current || !form.next || !form.confirm}
        />
      </Card>
      <Card>
        <Text style={s.cardTitle}>Đăng xuất</Text>
        <Text style={s.muted}>
          Đăng xuất sẽ thu hồi phiên trên máy chủ. Nếu đang mất mạng, phiên chỉ hết hạn khi token hết hiệu lực.
        </Text>
        <Button
          label="Đăng xuất khỏi thiết bị này"
          variant="secondary"
          onPress={() => {
            void logout().then(({ revoked }) => setError(revoked ? null : 'Đã đăng xuất trên máy này; máy chủ chưa xác nhận thu hồi phiên.'))
          }}
        />
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
        <Button icon="star-outline" label="Gửi đánh giá" onPress={() => void submit()} busy={busy} />
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, paddingTop: space.xs },
})
