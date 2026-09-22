import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'agrimarket.mobile.refresh-token';
const PERSISTENCE_MODE_KEY = 'agrimarket.mobile.persistence-mode';

let memoryToken: string | null = null;
let memoryMode: 'local' | 'session' | null = null;

function isWeb(): boolean {
  return Platform.OS === 'web';
}

function isBrowserAvailable(): boolean {
  return isWeb() && typeof window !== 'undefined';
}

function getStorage(mode: 'local' | 'session'): Storage | null {
  if (!isBrowserAvailable()) return null;
  return mode === 'local' ? window.localStorage : window.sessionStorage;
}

function readStoredModeSync(): 'local' | 'session' | null {
  if (!isBrowserAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(PERSISTENCE_MODE_KEY);
    if (raw === 'local' || raw === 'session') return raw;
  } catch {
    // ignore
  }
  return null;
}

async function writeMode(mode: 'local' | 'session'): Promise<void> {
  if (!isBrowserAvailable()) return;
  try {
    await window.localStorage.setItem(PERSISTENCE_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

async function removeMode(): Promise<void> {
  if (!isBrowserAvailable()) return;
  try {
    await window.localStorage.removeItem(PERSISTENCE_MODE_KEY);
  } catch {
    // ignore
  }
}

function resolveMode(ghiNho?: boolean): 'local' | 'session' {
  if (ghiNho === true) return 'local';
  if (ghiNho === false) return 'session';
  if (memoryMode) return memoryMode;
  const stored = readStoredModeSync();
  if (stored) return stored;
  return 'session';
}

async function xoaTokenKhoaStorage(mode: 'local' | 'session'): Promise<void> {
  if (!isBrowserAvailable()) return;
  const otherMode: 'local' | 'session' = mode === 'local' ? 'session' : 'local';
  const otherStorage = getStorage(otherMode);
  if (otherStorage) {
    try {
      otherStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // ignore
    }
  }
}

export async function luuRefreshToken(token: string, ghiNho?: boolean): Promise<void> {
  if (isWeb()) {
    const mode = resolveMode(ghiNho);
    memoryToken = token;
    memoryMode = mode;
    await writeMode(mode);
    const storage = getStorage(mode);
    if (storage) {
      try {
        storage.setItem(REFRESH_TOKEN_KEY, token);
      } catch {
        // ignore
      }
    }
    await xoaTokenKhoaStorage(mode);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function docRefreshToken(): Promise<string | null> {
  if (isWeb()) {
    if (memoryToken) return memoryToken;
    const mode = memoryMode ?? readStoredModeSync() ?? 'session';
    const storage = getStorage(mode);
    if (storage) {
      try {
        const token = storage.getItem(REFRESH_TOKEN_KEY);
        if (token) {
          memoryToken = token;
          memoryMode = mode;
        }
        return token;
      } catch {
        // ignore
      }
    }
    return null;
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function xoaRefreshToken(): Promise<void> {
  if (isWeb()) {
    memoryToken = null;
    memoryMode = null;
    try {
      await removeMode();
    } catch {
      // ignore
    }
    if (isBrowserAvailable()) {
      try {
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        // ignore
      }
      try {
        window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      } catch {
        // ignore
      }
    }
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
