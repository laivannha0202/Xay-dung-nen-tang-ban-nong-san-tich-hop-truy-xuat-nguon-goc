import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { api } from './api'
import { useAuth } from './auth'
import type { Nav, Route } from './nav'
import { theme } from './theme'
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
    <View style={s.root}>
      <Text style={s.h1}>Quét tem truy xuất</Text>
      {permission?.granted ? (
        <View style={s.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => void openToken(data)}
          />
        </View>
      ) : (
        <Card>
          <Text style={s.muted}>
            Cần quyền camera để quét tem QR trên bao bì. Có thể nhập mã in trên tem thay thế.
          </Text>
          <Button label="Cho phép dùng camera" onPress={() => void requestPermission()} />
        </Card>
      )}

      <Card>
        <Text style={s.cardTitle}>Nhập mã tem</Text>
        <Field label="Mã tem hoặc đường dẫn QR" value={manual} onChangeText={setManual} placeholder="demo-ca-chua-lo-0001" />
        <ErrorText message={error} />
        <Button label="Tra cứu" onPress={() => void openToken(manual)} disabled={manual.trim().length === 0} />
      </Card>

      {nav && (
        <Pressable onPress={() => nav.push({ name: 'trace', token: 'demo-ca-chua-lo-0001' })}>
          <Text style={s.link}>Xem tem mẫu: demo-ca-chua-lo-0001</Text>
        </Pressable>
      )}
    </View>
  )
}

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
    return (
      <View style={s.root}>
        <Text style={s.h1}>{user.name ?? user.email}</Text>
        <Text style={s.muted}>{user.email}</Text>
        {user.phone && <Text style={s.muted}>{user.phone}</Text>}
        <Card>
          <Pressable onPress={() => nav.push({ name: 'orders' })}>
            <Text style={s.cardTitle}>Đơn hàng của tôi</Text>
          </Pressable>
        </Card>
        <Card>
          <Pressable onPress={() => nav.push({ name: 'profile' })}>
            <Text style={s.cardTitle}>Hồ sơ & địa chỉ</Text>
          </Pressable>
        </Card>
        <Card>
          <Pressable onPress={() => nav.push({ name: 'reviews' })}>
            <Text style={s.cardTitle}>Đánh giá của tôi</Text>
          </Pressable>
        </Card>
        <Card>
          <Pressable onPress={() => nav.push({ name: 'complaints' })}>
            <Text style={s.cardTitle}>Khiếu nại</Text>
          </Pressable>
        </Card>
        <Button label="Đăng xuất" variant="secondary" onPress={() => void logout()} />
      </View>
    )
  }

  return (
    <View style={s.root}>
      <Text style={s.h1}>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Text>
      {mode === 'register' && (
        <>
          <Field label="Họ tên" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <Field label="Điện thoại" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
        </>
      )}
      <Field label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
      <Field label="Mật khẩu" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      <ErrorText message={error} />
      <Button label={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} onPress={() => void submit()} busy={busy} />
      <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={s.link}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, padding: 14, gap: 12 },
  h1: { fontSize: 21, fontWeight: '700', color: theme.text },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  muted: { fontSize: 13, color: theme.muted },
  link: { color: theme.leafDark, fontSize: 14, textDecorationLine: 'underline' },
  cameraWrap: { height: 300, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000' },
})
