/**
 * Mobile palette mirrors the Amazon-style tokens in `packages/ui/src/styles.css`:
 * white canvas, green brand, yellow buy action, orange promo.
 */
export const theme = {
  primary: '#238B45',
  primaryDark: '#186231',
  fresh: '#43A973',
  accent: '#F97316',
  /** Yellow purchase action; text on it is ink-900. */
  buy: '#FFCC48',
  buyDark: '#FFBB1F',
  bg: '#FFFFFF',
  canvas: '#FFFFFF',
  surface: '#FFFFFF',
  muted: '#64748B',
  text: '#182230',
  border: '#E5E7EB',
  ivory: '#F4F5F7',
  ivoryBorder: '#E5E7EB',
  mint: '#F4F5F7',
  mintSoft: '#FFFFFF',
  softGreen: '#EFF8F2',
  softOrange: '#FFF5ED',
  danger: '#DC2626',
  warning: '#B45309',
  success: '#238B45',
  warn: '#B45309',
  white: '#FFFFFF',
  /** legacy aliases used by older screens */
  leaf: '#238B45',
  leafDark: '#186231',
  leafSoft: '#EFF8F2',
  clay: '#F97316',
  claySoft: '#FFF5ED',
}

/** Be Vietnam Pro loaded via expo-font (see App.tsx); keys are the registered family names. */
export const font = {
  400: 'BeVietnamPro-Regular',
  500: 'BeVietnamPro-Medium',
  600: 'BeVietnamPro-SemiBold',
  700: 'BeVietnamPro-Bold',
} as const

/** Headline weight for hero and section headings — same sans family as body copy. */
export const display = font[700]

export const radius = { sm: 6, md: 10, lg: 12, xl: 16, pill: 999 }

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
