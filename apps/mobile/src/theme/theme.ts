import { spacing } from './spacing';
import { typography } from './typography';

export const lightColors = {
  primary: '#1C6F45',
  primaryForeground: '#FFFFFF',
  background: '#F7FAF8',
  surface: '#FFFFFF',
  foreground: '#17251C',
  muted: '#EFF4F1',
  mutedForeground: '#67776D',
  border: '#DCE7DF',
  success: '#1F7A49',
  warning: '#B46D12',
  danger: '#C0392B',
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
