import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { radius, space, theme } from './theme'

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Badge({ label, tone = 'leaf' }: { label: string; tone?: 'leaf' | 'warn' | 'danger' | 'muted' }) {
  const map = {
    leaf: { bg: theme.leafSoft, fg: theme.leafDark },
    warn: { bg: '#fdf3dc', fg: theme.warn },
    danger: { bg: '#fbe9e7', fg: theme.danger },
    muted: { bg: '#eef1ef', fg: theme.muted },
  } as const
  const c = map[tone]
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{label}</Text>
    </View>
  )
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  busy?: boolean
}) {
  const bg = variant === 'primary' ? theme.leaf : variant === 'secondary' ? theme.leafSoft : 'transparent'
  const fg = variant === 'primary' ? theme.white : theme.leafDark
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled || busy ? 0.55 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{busy ? 'Đang xử lý…' : label}</Text>
    </Pressable>
  )
}

/** Chip row for a small fixed set of options — the app's answer to a <select>. */
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: o.value === value }}
            style={[styles.choice, o.value === value && styles.choiceOn]}
          >
            <Text style={[styles.choiceText, o.value === value && styles.choiceTextOn]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  placeholder,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad'
  placeholder?: string
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null
  return <Text style={styles.error}>{message}</Text>
}
/** Uppercase muted section header — matches the website's `section-label` token. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>
}

/**
 * Screen shell: canvas background plus the 16 px page gutter. Put a ScrollView inside;
 * pass `padded={false}` when the child already owns its padding (full-bleed lists).
 */
export function Screen({ children, padded = true }: { children: React.ReactNode; padded?: boolean }) {
  return <View style={[styles.screen, padded && styles.screenPadded]}>{children}</View>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  )
}

export function Divider() {
  return <View style={styles.divider} />
}

export function KpiTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: space.lg,
    gap: space.sm,
  },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  button: { borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: space.lg, alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  label: { fontSize: 13, color: theme.muted, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.white,
  },
  error: { color: theme.danger, fontSize: 13, lineHeight: 19 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.muted,
    fontWeight: '600',
    marginTop: space.sm,
  },
  screen: { flex: 1, backgroundColor: theme.canvas },
  screenPadded: { paddingHorizontal: space.lg },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.xl, gap: space.xs },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: theme.text, textAlign: 'center' },
  emptyHint: { fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 19 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  kpi: {
    flex: 1,
    minWidth: 120,
    backgroundColor: theme.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    padding: space.lg,
    gap: 2,
  },
  kpiLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: theme.muted },
  kpiValue: { fontSize: 20, fontWeight: '700', color: theme.leafDark },
  kpiHint: { fontSize: 12, color: theme.muted },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 },
  choice: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: theme.white,
  },
  choiceOn: { backgroundColor: theme.leafSoft, borderColor: theme.leaf },
  choiceText: { fontSize: 13, color: theme.text },
  choiceTextOn: { color: theme.leafDark, fontWeight: '600' },
})
