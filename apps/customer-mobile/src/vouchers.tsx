import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ApiError, api } from './api'
import { dateVN, vnd } from './format'
import type { Voucher } from './types'
import type { Nav } from './nav'
import { font, radius, space, theme } from './theme'
import { useFetch } from './useFetch'
import { Badge, BottomSheet, Button, Card, ErrorText, SectionLabel } from './ui'

/**
 * Voucher list for the app. Order: what the shopper kept, then what runs today, then the
 * rest. Everything is re-read from the API, so a voucher saved on the website is here.
 */
export function VouchersScreen({ nav }: { nav: Nav }) {
  const wallet = useFetch<{ subtotal_vnd: number; items: Voucher[] }>(() => api('/me/promotions'), [])
  const publicList = useFetch<Voucher[]>(() => api('/promotions'), [])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function toggleSave(v: Voucher) {
    setBusy(v.code)
    setError(null)
    try {
      if (v.saved) await api(`/me/promotions/${v.id}`, { method: 'DELETE' })
      else await api(`/me/promotions/${v.id}`, { method: 'POST' })
      wallet.reload()
      publicList.reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Không lưu được voucher.')
    } finally {
      setBusy(null)
    }
  }

  const saved = wallet.data?.items ?? []
  const savedCodes = new Set(saved.map((v) => v.code))
  const unsaved = (publicList.data ?? []).filter((v) => !savedCodes.has(v.code))
  const usable = unsaved.filter((v) => v.state === 'AVAILABLE')
  const short = unsaved.filter((v) => v.state === 'MIN_SUBTOTAL' || v.state === 'UPCOMING')
  const gone = unsaved.filter((v) => ['USED_UP', 'EXPIRED', 'PAUSED'].includes(v.state))

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.h1}>Ưu đãi AgriMarket</Text>
      <Text style={s.muted}>Lưu mã để chọn nhanh khi thanh toán. Áp mã không cần lưu trước.</Text>
      <ErrorText message={error ?? wallet.error ?? publicList.error} />

      {saved.length > 0 && (
        <>
          <SectionLabel>Ví voucher của tôi ({saved.length})</SectionLabel>
          {saved.map((v) => (
            <VoucherTile
              key={v.id}
              v={v}
              busy={busy === v.code}
              onToggle={() => void toggleSave(v)}
              onUse={() => nav.push({ name: 'checkout', code: v.state === 'AVAILABLE' ? v.code : undefined })}
            />
          ))}
        </>
      )}

      {saved.length === 0 && (
        <Card>
          <Text style={s.cardTitle}>Ví voucher đang trống</Text>
          <Text style={s.muted}>Lưu mã bên dưới; mã đã lưu hiện ở đây và trên website với cùng tài khoản.</Text>
        </Card>
      )}

      {([
        ['Ưu đãi đang chạy', usable, 'Chưa có ưu đãi mới.'],
        ['Chưa đủ điều kiện đơn hàng', short, ''],
        ['Đã hết hiệu lực', gone, ''],
      ] as const).map(([title, list, empty]) =>
        list.length === 0 ? (empty ? (
          <View key={title}>
            <SectionLabel>{title}</SectionLabel>
            <Card>
              <Text style={s.muted}>{empty}</Text>
            </Card>
          </View>
        ) : null) : (
          <View key={title}>
            <SectionLabel>{title}</SectionLabel>
            {list.map((v) => (
              <VoucherTile
                key={v.id}
                v={v}
                busy={busy === v.code}
                onToggle={() => void toggleSave(v)}
                onUse={() => nav.push({ name: 'checkout', code: v.state === 'AVAILABLE' ? v.code : undefined })}
              />
            ))}
          </View>
        ),
      )}
      <Text style={s.foot}>Lưu voucher không trừ lượt dùng của chương trình. Lượt chỉ ghi nhận khi đơn được tạo.</Text>
    </ScrollView>
  )
}

/** One ticket: value on the left, conditions and actions on the right. */
function VoucherTile({ v, busy, onToggle, onUse }: { v: Voucher; busy: boolean; onToggle: () => void; onUse: () => void }) {
  const usable = v.state === 'AVAILABLE'
  const dead = v.state === 'EXPIRED' || v.state === 'PAUSED' || v.state === 'USED_UP'
  return (
    <View style={[s.ticket, dead && s.ticketDead]}>
      <View style={s.ticketValue}>
        <Text style={s.valueEyebrow}>GIẢM</Text>
        <Text style={s.value}>{v.type === 'PERCENT' ? `${v.value}%` : vnd(v.value)}</Text>
      </View>
      <View style={s.ticketBody}>
        <View style={s.between}>
          <Text style={s.cardTitle} numberOfLines={1}>{v.name}</Text>
          {v.saved && <Badge label="Đã lưu" />}
        </View>
        <Text style={s.code}>{v.code}</Text>
        <Text style={s.muted}>
          {v.min_subtotal_vnd > 0 ? `Đơn từ ${vnd(v.min_subtotal_vnd)}` : 'Mọi đơn hàng'}
          {v.usage_limit !== null ? ` · tối đa ${v.usage_limit.toLocaleString('vi-VN')} lượt cho cả chương trình` : ''}
        </Text>
        <Text style={s.muted}>
          {usable ? 'Hạn dùng' : 'Thời gian'} {dateVN(v.start_at)} – {dateVN(v.end_at)}
        </Text>
        {!usable && <Text style={[s.reason, dead && s.reasonDead]}>{v.reason}</Text>}
        <View style={s.actions}>
          <Pressable
            onPress={onToggle}
            disabled={busy || dead}
            accessibilityRole="button"
            style={[s.action, s.actionGhost, (busy || dead) && s.actionOff]}
          >
            <Ionicons name={v.saved ? 'checkmark' : 'heart-outline'} size={14} color={theme.primaryDark} />
            <Text style={s.actionGhostText}>{busy ? 'Đang lưu…' : v.saved ? 'Bỏ lưu' : 'Lưu voucher'}</Text>
          </Pressable>
          <Pressable
            onPress={onUse}
            disabled={!usable}
            accessibilityRole="button"
            style={[s.action, usable ? s.actionPrimary : s.actionGhost, !usable && s.actionOff]}
          >
            <Text style={usable ? s.actionPrimaryText : s.actionGhostText}>
              {usable ? `Dùng · −${vnd(v.discount_vnd)}` : 'Chưa dùng được'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

/** Checkout-side picker: wallet first, then public programs, then a typed code. */
export function VoucherSheet({
  open,
  onClose,
  subtotal,
  vouchers,
  current,
  busy,
  onApply,
  onRemove,
}: {
  open: boolean
  onClose: () => void
  subtotal: number
  vouchers: Voucher[]
  current: string | null
  busy: boolean
  onApply: (code: string) => void
  onRemove: () => void
}) {
  const [typed, setTyped] = useState('')
  const saved = vouchers.filter((v) => v.saved)
  const usable = vouchers.filter((v) => v.state === 'AVAILABLE' && !v.saved)
  const others = vouchers.filter((v) => v.state !== 'AVAILABLE')

  function pick(code: string) {
    setTyped('')
    onApply(code)
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Voucher AgriMarket">
      <ScrollView style={s.sheetScroll} keyboardShouldPersistTaps="handled">
        {current && (
          <View style={s.currentRow}>
            <Badge label={`Đang dùng ${current}`} />
            <Button label="Gỡ mã" variant="ghost" onPress={onRemove} disabled={busy} />
          </View>
        )}
        <View style={s.typedRow}>
          <TextInput
            value={typed}
            onChangeText={(t) => setTyped(t.toUpperCase())}
            placeholder="Nhập mã khuyến mãi"
            autoCapitalize="characters"
            autoCorrect={false}
            style={s.typedInput}
            accessibilityLabel="Mã khuyến mãi"
          />
          <Button label="Áp dụng" variant="secondary" disabled={!typed.trim() || busy} onPress={() => pick(typed.trim())} />
        </View>

        {saved.length > 0 && (
          <>
            <SectionLabel>Trong ví của bạn</SectionLabel>
            {saved.map((v) => <SheetRow key={v.id} v={v} onPick={pick} />)}
          </>
        )}
        {usable.length > 0 && (
          <>
            <SectionLabel>Ưu đãi đang chạy</SectionLabel>
            {usable.map((v) => <SheetRow key={v.id} v={v} onPick={pick} />)}
          </>
        )}
        {others.length > 0 && (
          <>
            <SectionLabel>Mã chưa dùng được</SectionLabel>
            {others.map((v) => <SheetRow key={v.id} v={v} onPick={pick} />)}
          </>
        )}
        <Text style={s.foot}>Giảm giá tính trên tiền hàng {vnd(subtotal)}. Phí giao không đổi theo voucher.</Text>
      </ScrollView>
    </BottomSheet>
  )
}

function SheetRow({ v, onPick }: { v: Voucher; onPick: (code: string) => void }) {
  const usable = v.state === 'AVAILABLE'
  return (
    <Pressable onPress={() => usable && onPick(v.code)} disabled={!usable} accessibilityRole="button">
      <Card style={usable ? undefined : s.rowOff}>
        <View style={s.between}>
          <Text style={s.code}>{v.code}</Text>
          <Text style={s.valueSmall}>{v.type === 'PERCENT' ? `−${v.value}%` : `−${vnd(v.value)}`}</Text>
        </View>
        <Text style={s.muted} numberOfLines={1}>{v.name}</Text>
        {usable ? (
          <Text style={s.pick}>{`Chọn · giảm ${vnd(v.discount_vnd)}`}</Text>
        ) : (
          <Text style={s.reason}>
            {v.reason}
            {v.remaining_vnd > 0 ? ` Thêm ${vnd(v.remaining_vnd)}.` : ''}
          </Text>
        )}
      </Card>
    </Pressable>
  )
}

const s = StyleSheet.create({
  page: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  h1: { fontFamily: font[700], fontSize: 22, color: theme.text },
  muted: { fontFamily: font[400], fontSize: 12, color: theme.muted },
  cardTitle: { fontFamily: font[600], fontSize: 14, color: theme.text, flexShrink: 1 },
  foot: { fontFamily: font[400], fontSize: 11, color: theme.muted, marginTop: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  ticket: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#B3DDC5',
    backgroundColor: theme.surface,
    overflow: 'hidden',
  },
  ticketDead: { borderColor: theme.border, opacity: 0.75 },
  ticketValue: { width: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF2C7', paddingVertical: space.md },
  valueEyebrow: { fontFamily: font[600], fontSize: 9, letterSpacing: 1, color: '#B45309' },
  value: { fontFamily: font[700], fontSize: 17, color: theme.text, textAlign: 'center' },
  ticketBody: { flex: 1, padding: space.md, gap: 2, borderLeftWidth: 1, borderLeftColor: '#B3DDC5', borderStyle: 'dashed' },
  code: { fontFamily: font[600], fontSize: 12, color: theme.primaryDark, letterSpacing: 0.5 },
  valueSmall: { fontFamily: font[700], fontSize: 13, color: theme.text },
  reason: { fontFamily: font[500], fontSize: 11, color: theme.warning, marginTop: 2 },
  reasonDead: { color: theme.danger },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: 7 },
  actionPrimary: { backgroundColor: theme.primary },
  actionPrimaryText: { fontFamily: font[600], fontSize: 12, color: theme.white },
  actionGhost: { backgroundColor: theme.ivory },
  actionGhostText: { fontFamily: font[600], fontSize: 12, color: theme.primaryDark },
  actionOff: { opacity: 0.5 },
  sheetScroll: { maxHeight: 460 },
  currentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  typedRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center', marginBottom: space.sm },
  typedInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontFamily: font[500],
    fontSize: 13,
    color: theme.text,
    backgroundColor: theme.white,
  },
  pick: { fontFamily: font[600], fontSize: 12, color: theme.primary, marginTop: 4 },
  rowOff: { opacity: 0.7 },
})
