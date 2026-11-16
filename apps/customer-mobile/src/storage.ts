import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

/**
 * expo-secure-store has no web implementation, so web falls back to localStorage.
 * ponytail: localStorage is XSS-readable; add a httpOnly cookie flow if the web build ever ships.
 */
export const storage = {
  get: (k: string) => (Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.getItem(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.setItem(k, v)) : SecureStore.setItemAsync(k, v),
  del: (k: string) =>
    Platform.OS === 'web' ? Promise.resolve(globalThis.localStorage?.removeItem(k)) : SecureStore.deleteItemAsync(k),
}
