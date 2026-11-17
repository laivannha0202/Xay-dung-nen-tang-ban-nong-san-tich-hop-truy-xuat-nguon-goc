import { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import { AuthProvider, useAuth } from './src/auth'
import { CartProvider, useCart } from './src/cart'
import type { Nav, Route } from './src/nav'
import { AccountScreen, ScanScreen } from './src/screens2'
import { CartScreen, HomeScreen, Screen } from './src/screens'
import { theme } from './src/theme'

type Tab = 'home' | 'cart' | 'scan' | 'orders' | 'account'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'home', label: 'Trang chủ' },
  { key: 'cart', label: 'Giỏ' },
  { key: 'scan', label: 'Quét QR' },
  { key: 'orders', label: 'Đơn hàng' },
  { key: 'account', label: 'Tài khoản' },
]

function Shell() {
  const { booting } = useAuth()
  const { count, reload } = useCart()
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Route[]>([])

  const nav = useMemo<Nav>(
    () => ({ push: (r) => setStack((s) => [...s, r]), pop: () => setStack((s) => s.slice(0, -1)) }),
    [],
  )

  const top = stack[stack.length - 1]

  if (booting) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={s.loading}>Đang khởi động…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        {top && (
          <Pressable onPress={nav.pop} accessibilityRole="button">
            <Text style={s.back}>‹ Quay lại</Text>
          </Pressable>
        )}
        <Text style={s.brand}>AgriMarket</Text>
      </View>

      <View style={{ flex: 1 }}>
        {top ? (
          <Screen nav={nav} route={top} />
        ) : tab === 'home' ? (
          <HomeScreen nav={nav} />
        ) : tab === 'cart' ? (
          <CartScreen nav={nav} />
        ) : tab === 'scan' ? (
          <ScanScreen nav={nav} />
        ) : tab === 'orders' ? (
          <Screen nav={nav} route={{ name: 'orders' }} />
        ) : (
          <AccountScreen nav={nav} />
        )}
      </View>

      <View style={s.tabbar}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            onPress={() => {
              setStack([])
              setTab(t.key)
              // Cart is shared with the web store, so re-read it whenever the user switches tabs.
              void reload().catch(() => {})
            }}
            style={s.tab}
          >
            <Text style={[s.tabText, tab === t.key && !top && s.tabActive]}>
              {t.label}
              {t.key === 'cart' && count > 0 ? ` (${count})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Shell />
      </CartProvider>
    </AuthProvider>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.white },
  loading: { padding: 24, color: theme.muted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  brand: { fontSize: 17, fontWeight: '700', color: theme.leafDark },
  back: { fontSize: 15, color: theme.leafDark },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.leafSoft,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabText: { fontSize: 12, color: theme.muted },
  tabActive: { color: theme.leafDark, fontWeight: '700' },
})
