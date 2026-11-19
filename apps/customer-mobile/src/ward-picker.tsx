import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { filterWards, type Ward } from '@agrimarket/core'
import { api } from './api'
import { radius, space, theme } from './theme'
import { Button, ErrorText } from './ui'
import { useFetch } from './useFetch'

/**
 * Ward picker as a bottom sheet with search. Only Hưng Yên is served, so the
 * shopper never types a province or district — just picks a commune.
 */
export function WardPicker({
  label = 'Xã/Phường (Hưng Yên)',
  value,
  onChange,
}: {
  label?: string
  value: string
  onChange: (code: string, name: string) => void
}) {
  const { data, error } = useFetch<{ data: Ward[] }>(() => api<{ data: Ward[] }>('/locations/wards'), [])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const wards = data?.data ?? []
  const selected = wards.find((w) => w.code === value) ?? null
  const matches = useMemo(() => filterWards(wards, query), [wards, query])

  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chọn xã/phường, hiện tại ${selected?.name ?? 'chưa chọn'}`}
        onPress={() => setOpen(true)}
        style={styles.input}
      >
        <Text style={{ color: selected ? theme.text : theme.muted, fontSize: 15 }}>
          {selected?.name ?? 'Chọn xã/phường'}
        </Text>
      </Pressable>
      {error && <ErrorText message={error} />}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>Chọn xã/phường</Text>
            <Text style={styles.hint}>Tỉnh Hưng Yên · {matches.length} xã/phường</Text>
          </View>
          <TextInput
            style={[styles.input, styles.search]}
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Gõ tên, có dấu hoặc không dấu: pho hien, Phố Hiến"
            placeholderTextColor={theme.muted}
            accessibilityLabel="Tìm xã/phường"
          />
          {matches.length === 0 && <Text style={styles.hint}>Không có xã/phường khớp “{query}”.</Text>}
          <FlatList
            data={matches}
            keyExtractor={(w) => w.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item.code === value }}
                onPress={() => {
                  onChange(item.code, item.name)
                  setOpen(false)
                  setQuery('')
                }}
                style={[styles.row, item.code === value && styles.rowOn]}
              >
                <Text style={styles.rowText}>{item.name}</Text>
                <Text style={styles.code}>{item.code === value ? '✓' : ''}</Text>
              </Pressable>
            )}
          />
          <Button label="Đóng" variant="secondary" onPress={() => setOpen(false)} />
        </SafeAreaView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: theme.muted, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: theme.white,
    justifyContent: 'center',
  },
  sheet: { flex: 1, backgroundColor: theme.canvas, padding: space.lg, gap: space.sm },
  head: { gap: 2 },
  title: { fontSize: 18, fontWeight: '700', color: theme.text },
  hint: { fontSize: 13, color: theme.muted },
  search: { fontSize: 15, color: theme.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  rowOn: { backgroundColor: theme.leafSoft },
  rowText: { fontSize: 15, color: theme.text },
  code: { fontSize: 12, color: theme.muted },
})
