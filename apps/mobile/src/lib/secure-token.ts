import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_TOKEN_KEY = 'agrimarket.mobile.refresh-token';
let webMemoryToken: string | null = null;

export async function luuRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = token;
    return;
  }
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function docRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return webMemoryToken;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function xoaRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = null;
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
