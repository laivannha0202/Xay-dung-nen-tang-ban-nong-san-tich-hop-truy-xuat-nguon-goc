/**
 * Mobile palette mirrors `packages/ui/src/styles.css` brand/sand/ink tokens so the app
 * and both websites look like one product. V5 values: canvas #fafaf7, muted #5b6b60
 * (WCAG AA on both white and ivory), plus the ivory frame used behind photos.
 */
export const theme = {
  primary: '#166534',
  primaryDark: '#14532D',
  fresh: '#22C55E',
  accent: '#F97316',
  bg: '#FAFAF7',
  text: '#172B22',
  muted: '#5B6B60',
  border: '#E2E8E0',
  surface: '#FFFFFF',
  ivory: '#F6F2E9',
  ivoryBorder: '#ECE6D7',
  mint: '#E3EFE2',
  mintSoft: '#F0F6EF',
  danger: '#DC2626',
  warning: '#B45309',
  success: '#16A34A',
  white: '#FFFFFF',
  softGreen: '#F1F8F3',
  softOrange: '#FFF7ED',
  /** legacy aliases used by older screens */
  leaf: '#166534',
  leafDark: '#14532D',
  leafSoft: '#F1F8F3',
  clay: '#C2410C',
  claySoft: '#FFF7ED',
  canvas: '#FAFAF7',
  warn: '#B45309',
}

/** Be Vietnam Pro loaded via expo-font (see App.tsx); keys are the registered family names. */
export const font = {
  400: 'BeVietnamPro-Regular',
  500: 'BeVietnamPro-Medium',
  600: 'BeVietnamPro-SemiBold',
  700: 'BeVietnamPro-Bold',
} as const

/** Editorial serif for hero and section headings, matching the website's `display` utility. */
export const display = 'Fraunces-SemiBold'

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
