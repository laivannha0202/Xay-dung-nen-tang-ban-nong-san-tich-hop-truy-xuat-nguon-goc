import { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuthProvider, useAuth } from './src/auth'
import { CartProvider, useCart } from './src/cart'
import type { Nav, Route } from './src/nav'
import { AccountScreen, ScanScreen } from './src/screens2'
import { CartScreen, Screen } from './src/screens'
import { HomeScreen, ProductListScreen } from './src/home'
import { radius, theme } from './src/theme'

type Tab = 'home' | 'cart' | 'scan' | 'orders' | 'account'

const TABS: Array<{ key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline', active: 'home' },
  { key: 'cart', label: 'Giỏ', icon: 'bag-outline', active: 'bag' },
  { key: 'scan', label: 'Quét QR', icon: 'qr-code-outline', active: 'qr-code' },
  { key: 'orders', label: 'Đơn hàng', icon: 'receipt-outline', active: 'receipt' },
  { key: 'account', label: 'Tài khoản', icon: 'person-outline', active: 'person' },
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
        <View style={s.bootstrap}>
          <View style={s.brandMark}>
            <Ionicons name="leaf" size={18} color={theme.white} />
          </View>
          <Text style={s.loading}>Đang khởi động AgriMarket…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={s.header}>
        {top ? (
          <Pressable onPress={nav.pop} accessibilityRole="button" accessibilityLabel="Quay lại" style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.leafDark} />
            <Text style={s.back}>Quay lại</Text>
          </Pressable>
        ) : (
          <View style={s.brandRow}>
            <View style={s.brandMark}>
              <Ionicons name="leaf" size={16} color={theme.white} />
            </View>
            <Text style={s.brand}>AgriMarket</Text>
          </View>
        )}
        <View style={s.headerRight}>
          <Ionicons name="shield-checkmark-outline" size={15} color={theme.muted} />
          <Text style={s.headerNote}>Tem QR mỗi lô</Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {top?.name === 'products' ? (
          <ProductListScreen nav={nav} q={top.q} category={top.category} />
        ) : top ? (
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
        {TABS.map((t) => {
          const on = tab === t.key && !top
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t.label}
              onPress={() => {
                setStack([])
                setTab(t.key)
                // Cart is shared with the web store, so re-read it whenever the user switches tabs.
                void reload().catch(() => {})
              }}
              style={s.tab}
            >
              <View>
                <Ionicons name={on ? t.active : t.icon} size={22} color={on ? theme.leafDark : theme.muted} />
                {t.key === 'cart' && count > 0 && (
                  <View style={s.tabBadge}>
                    <Text style={s.tabBadgeText}>{count > 9 ? '9+' : count}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.tabText, on && s.tabActive]}>{t.label}</Text>
            </Pressable>
          )
        })}
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
  bootstrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loading: { color: theme.muted, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.white,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    backgroundColor: theme.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 17, fontWeight: '700', color: theme.leafDark },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -4 },
  back: { fontSize: 15, color: theme.leafDark },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  headerNote: { fontSize: 11, color: theme.muted },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.white,
  },
  tab: { flex: 1, paddingTop: 8, paddingBottom: 6, alignItems: 'center', gap: 2 },
  tabText: { fontSize: 11, color: theme.muted },
  tabActive: { color: theme.leafDark, fontWeight: '700' },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: theme.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: theme.white, fontSize: 10, fontWeight: '700' },
})
