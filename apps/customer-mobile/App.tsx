import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import { AuthProvider, useAuth } from './src/auth'
import { CartProvider, useCart } from './src/cart'
import type { Nav, Route } from './src/nav'
import { AccountScreen, ScanScreen } from './src/screens2'
import { CartScreen, Screen } from './src/screens'
import { HomeScreen, ProductListScreen } from './src/home'
import { display, font, radius, theme } from './src/theme'
import { BrandLogo } from './src/ui'

/** `scan` is reachable from the header and the account menu, so it is not a tab. */
type Tab = 'home' | 'catalog' | 'cart' | 'orders' | 'account' | 'scan'

const TABS: Array<{ key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; active: keyof typeof Ionicons.glyphMap }> = [
  { key: 'home', label: 'Trang chủ', icon: 'home-outline', active: 'home' },
  { key: 'catalog', label: 'Danh mục', icon: 'grid-outline', active: 'grid' },
  { key: 'cart', label: 'Giỏ hàng', icon: 'cart-outline', active: 'cart' },
  { key: 'orders', label: 'Đơn hàng', icon: 'receipt-outline', active: 'receipt' },
  { key: 'account', label: 'Tài khoản', icon: 'person-outline', active: 'person' },
]

/** Be Vietnam Pro ships in the bundle so the app matches the websites on every device. */
const FONTS = {
  [font[400]]: require('./assets/fonts/BeVietnamPro-400.ttf'),
  [font[500]]: require('./assets/fonts/BeVietnamPro-500.ttf'),
  [font[600]]: require('./assets/fonts/BeVietnamPro-600.ttf'),
  [font[700]]: require('./assets/fonts/BeVietnamPro-700.ttf'),
}

function Shell() {
  const [fontsLoaded] = useFonts(FONTS)
  const { booting } = useAuth()
  const { count, reload } = useCart()
  const [tab, setTab] = useState<Tab>('home')
  const [stack, setStack] = useState<Route[]>([])
  const [term, setTerm] = useState('')

  const nav = useMemo<Nav>(
    () => ({ push: (r) => setStack((s) => [...s, r]), pop: () => setStack((s) => s.slice(0, -1)) }),
    [],
  )

  const top = stack[stack.length - 1]

  const openTab = (next: Tab) => {
    setStack([])
    setTab(next)
    // Cart is shared with the web store, so re-read it whenever the user switches tabs.
    void reload().catch(() => {})
  }

  if (booting || !fontsLoaded) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.bootstrap}>
          <BrandLogo size={34} />
          <ActivityIndicator color={theme.primary} />
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
          <View style={s.barRow}>
            <Pressable onPress={nav.pop} accessibilityRole="button" accessibilityLabel="Quay lại" style={s.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={theme.text} />
              <Text style={s.back}>Quay lại</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={s.barRow}>
              <View style={s.brandRow}>
                <BrandLogo size={28} />
                <Text style={s.brand}>AgriMarket</Text>
              </View>
              <View style={s.headerActions}>
                <Pressable
                  onPress={() => openTab('scan')}
                  accessibilityRole="button"
                  accessibilityLabel="Quét mã QR truy xuất"
                  hitSlop={8}
                  style={s.iconBtn}
                >
                  <Ionicons name="qr-code-outline" size={20} color={theme.text} />
                </Pressable>
                <Pressable
                  onPress={() => openTab('cart')}
                  accessibilityRole="button"
                  accessibilityLabel={`Giỏ hàng, ${count} sản phẩm`}
                  hitSlop={8}
                  style={s.iconBtn}
                >
                  <Ionicons name="cart-outline" size={21} color={theme.text} />
                  {count > 0 && (
                    <View style={s.cartBadge}>
                      <Text style={s.cartBadgeText}>{count > 9 ? '9+' : count}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
            <View style={s.searchRow}>
              <View style={s.searchField}>
                <Ionicons name="search" size={16} color={theme.muted} />
                <TextInput
                  style={s.searchInput}
                  value={term}
                  onChangeText={setTerm}
                  placeholder="Tìm nông sản…"
                  placeholderTextColor={theme.muted}
                  returnKeyType="search"
                  accessibilityLabel="Tìm kiếm nông sản"
                  onSubmitEditing={() =>
                    nav.push({ name: 'products', q: term.trim() || undefined })
                  }
                />
              </View>
              <Pressable
                onPress={() => nav.push({ name: 'products', q: term.trim() || undefined })}
                accessibilityRole="button"
                accessibilityLabel="Tìm kiếm"
                style={({ pressed }) => [s.searchBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="search" size={18} color="#182230" />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {top?.name === 'products' ? (
          <ProductListScreen nav={nav} q={top.q} category={top.category} />
        ) : top ? (
          <Screen nav={nav} route={top} />
        ) : tab === 'home' ? (
          <HomeScreen nav={nav} />
        ) : tab === 'catalog' ? (
          <ProductListScreen nav={nav} />
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
              onPress={() => openTab(t.key)}
              style={s.tab}
            >
              <View>
                <Ionicons name={on ? t.active : t.icon} size={22} color={on ? theme.primary : theme.muted} />
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
  safe: { flex: 1, backgroundColor: theme.surface },
  bootstrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loading: { color: theme.muted, fontSize: 14, fontFamily: font[400] },
  header: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brand: { fontSize: 17, fontFamily: display, color: theme.text, letterSpacing: -0.2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute',
    top: 1,
    right: 0,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: theme.white, fontSize: 10, fontFamily: font[700] },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.white,
  },
  searchInput: { flex: 1, fontSize: 14.5, color: theme.text, padding: 0, fontFamily: font[400] },
  searchBtn: {
    width: 44,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: theme.buy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -4 },
  back: { fontSize: 15, color: theme.text, fontFamily: font[600] },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  tab: { flex: 1, paddingTop: 8, paddingBottom: 8, alignItems: 'center', gap: 3, minHeight: 54 },
  tabText: { fontSize: 10.5, color: theme.muted, fontFamily: font[500] },
  tabActive: { color: theme.primary, fontFamily: font[700] },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: { color: theme.white, fontSize: 10, fontFamily: font[700] },
})
