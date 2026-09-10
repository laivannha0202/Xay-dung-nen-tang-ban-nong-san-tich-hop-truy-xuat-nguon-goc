import { THUONG_HIEU_AGRIMARKET } from '@agrimarket/api-client';

import { spacing } from './spacing';
import { typography } from './typography';

export const lightColors = {
  primary: THUONG_HIEU_AGRIMARKET.primary,
  primaryForeground: '#FFFFFF',
  background: THUONG_HIEU_AGRIMARKET.page,
  surface: THUONG_HIEU_AGRIMARKET.card,
  foreground: THUONG_HIEU_AGRIMARKET.text,
  muted: '#EFF4F1',
  mutedForeground: THUONG_HIEU_AGRIMARKET.mutedText,
  border: THUONG_HIEU_AGRIMARKET.border,
  success: THUONG_HIEU_AGRIMARKET.success,
  warning: THUONG_HIEU_AGRIMARKET.warning,
  danger: THUONG_HIEU_AGRIMARKET.danger,
  info: '#2F6B8A',
} as const;

export const darkColors = {
  primary: '#62CA91',
  primaryForeground: '#0A2516',
  background: '#0C1710',
  surface: '#16221B',
  foreground: '#EEF7F1',
  muted: '#233128',
  mutedForeground: '#A6B9AD',
  border: '#35483C',
  success: '#62CA91',
  warning: '#ECB658',
  danger: '#EF6C60',
  info: '#74B5D6',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const mobileTheme = {
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  spacing,
  typography,
  radius,
} as const;

export type MobileTheme = typeof mobileTheme;
