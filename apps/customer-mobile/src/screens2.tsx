import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { api } from './api'
import { useAuth } from './auth'
import type { Nav } from './nav'
import { radius, space, theme, font } from './theme'
import { Button, Card, ErrorText, Field } from './ui'

/** Accepts a raw token or a full trace URL and pulls out the token. */
export const extractToken = (raw: string): string => {
  const t = raw.trim()
  const m = t.match(/\/t\/([^/?#\s]+)/)
  return m ? decodeURIComponent(m[1]!) : t
}

export function ScanScreen({ nav }: { nav: Nav }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [manual, setManual] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function openToken(raw: string) {
    const token = extractToken(raw)
    if (!token) return
    try {
      await api(`/public/trace/${encodeURIComponent(token)}/scan`, { method: 'POST' })
    } catch {
      /* scan counter is best-effort; the profile itself decides validity */
    }
    nav.push({ name: 'trace', token })
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.root}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <Text style={s.h1}>Quét tem truy xuất</Text>
        <Text style={s.muted}>Hướng camera vào mã QR in trên tem bao bì để xem nguồn gốc lô hàng.</Text>
      </View>

      {permission?.granted ? (
        <View style={s.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => void openToken(data)}
          />
          <View pointerEvents="none" style={s.frame} />
          <View pointerEvents="none" style={s.frameHint}>
            <Text style={s.frameHintText}>Căn mã QR vào giữa khung</Text>
          </View>
        </View>
      ) : (
        <Card style={s.blocked}>
          <Text style={s.cardTitle}>Chưa có quyền camera</Text>
          <Text style={s.muted}>
            Cần quyền camera để quét tem QR trên bao bì. Có thể nhập mã in trên tem thay thế.
          </Text>
          <ErrorText message={error} />
          <Button
            label="Cho phép dùng camera"
            variant="secondary"
            onPress={() => void requestPermission()}
          />
        </Card>
      )}

      <Card>
        <Text style={s.label}>NHẬP MÃ TEM</Text>
        <Field
          label="Mã tem hoặc đường dẫn QR"
          value={manual}
          onChangeText={setManual}
          placeholder="demo-ca-chua-lo-0001"
        />
        <ErrorText message={error} />
        <Button label="Tra cứu" onPress={() => void openToken(manual)} disabled={manual.trim().length === 0} />
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => nav.push({ name: 'trace', token: 'demo-ca-chua-lo-0001' })}
        style={s.sample}
      >
        <Text style={s.link}>Xem tem mẫu: demo-ca-chua-lo-0001</Text>
      </Pressable>
    </ScrollView>
  )
}

const MENU: { label: string; hint: string; route: 'orders' | 'profile' | 'reviews' | 'complaints' }[] = [
  { label: 'Đơn hàng của tôi', hint: 'Theo dõi đơn và trạng thái giao', route: 'orders' },
  { label: 'Hồ sơ & địa chỉ', hint: 'Thông tin cá nhân, sổ địa chỉ', route: 'profile' },
  { label: 'Đánh giá của tôi', hint: 'Đánh giá đã gửi', route: 'reviews' },
  { label: 'Khiếu nại', hint: 'Phản ánh chất lượng sản phẩm', route: 'complaints' },
]

export function AccountScreen({ nav }: { nav: Nav }) {
  const { user, login, register, logout } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register(form)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (user) {
    const name = user.name ?? user.email
    return (
      <View style={s.root}>
        <View style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {name
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]!.toUpperCase())
                .join('')}
            </Text>
          </View>
          <View style={s.profileText}>
            <Text style={s.h1}>{name}</Text>
            <Text style={s.muted}>{user.email}</Text>
            {user.phone ? <Text style={s.muted}>{user.phone}</Text> : null}
          </View>
        </View>

        <View style={s.kpiRow}>
          {[
            { label: 'Đơn hàng', route: 'orders' as const },
            { label: 'Đánh giá', route: 'reviews' as const },
            { label: 'Khiếu nại', route: 'complaints' as const },
          ].map((k) => (
            <Pressable key={k.label} accessibilityRole="button" style={s.kpi} onPress={() => nav.push({ name: k.route })}>
              <Text style={s.kpiLabel}>{k.label}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={s.menu}>
          {MENU.map((m, i) => (
            <Pressable
              key={m.route}
              accessibilityRole="button"
              onPress={() => nav.push({ name: m.route })}
              style={[s.menuRow, i < MENU.length - 1 && s.menuRowDivider]}
            >
              <View style={s.menuText}>
                <Text style={s.cardTitle}>{m.label}</Text>
                <Text style={s.muted}>{m.hint}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </Pressable>
          ))}
        </Card>

        <View style={s.logout}>
          <Button label="Đăng xuất" variant="secondary" onPress={() => void logout()} />
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.h1}>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
        <Text style={s.muted}>
          {mode === 'login'
            ? 'Đăng nhập để theo dõi đơn hàng, đánh giá và khiếu nại.'
            : 'Tạo tài khoản để lưu địa chỉ và theo dõi đơn hàng.'}
        </Text>
      </View>
      <Card>
        {mode === 'register' && (
          <>
            <Field label="Họ tên" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Field
              label="Điện thoại"
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              keyboardType="phone-pad"
            />
          </>
        )}
        <Field
          label="Email"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
        />
        <Field label="Mật khẩu" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
        <ErrorText message={error} />
        <Button label={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} onPress={() => void submit()} busy={busy} />
      </Card>
      <Pressable accessibilityRole="button" onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={s.sample}>
        <Text style={s.link}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  scroll: { backgroundColor: theme.canvas },
  root: { padding: space.lg, gap: space.lg },
  header: { gap: space.xs },
  h1: { fontSize: 22, fontWeight: '700', fontFamily: font[700], color: theme.text },
  muted: { fontSize: 13, lineHeight: 19, color: theme.muted, fontFamily: font[400] },
  label: { fontSize: 11, fontWeight: '700', fontFamily: font[700], letterSpacing: 0.8, color: theme.muted },
  cardTitle: { fontSize: 15, fontWeight: '600', fontFamily: font[600], color: theme.text },
  link: { color: theme.leafDark, fontSize: 14, fontWeight: '600', fontFamily: font[600] },
  sample: { alignItems: 'center', paddingVertical: space.sm },
  cameraWrap: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  frame: {
    position: 'absolute',
    top: 48,
    left: 48,
    right: 48,
    bottom: 48,
    borderWidth: 2,
    borderColor: theme.leaf,
    borderRadius: radius.md,
  },
  frameHint: {
    position: 'absolute',
    bottom: space.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.sm,
  },
  frameHintText: { color: theme.white, fontSize: 13, fontWeight: '500', fontFamily: font[500] },
  blocked: { gap: space.md },
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  profileText: { flex: 1, gap: 2 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.leafSoft,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', fontFamily: font[700], color: theme.leafDark },
  kpiRow: { flexDirection: 'row', gap: space.md },
  kpi: {
    flex: 1,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    alignItems: 'center',
  },
  kpiLabel: { fontSize: 13, fontWeight: '600', fontFamily: font[600], color: theme.leafDark },
  menu: { padding: 0, gap: 0 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  menuRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.border },
  menuText: { flex: 1, gap: 2 },
  chevron: { fontSize: 22, color: theme.muted, fontFamily: font[400] },
  logout: { marginTop: space.sm, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: space.lg },
})
