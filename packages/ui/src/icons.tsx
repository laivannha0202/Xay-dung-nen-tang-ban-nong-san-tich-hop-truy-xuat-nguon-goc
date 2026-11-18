/** Minimal inline icon set: no icon font, no external request, inherits currentColor. */
export type IconName =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'categories'
  | 'supplier'
  | 'season'
  | 'batch'
  | 'qr'
  | 'recall'
  | 'warehouse'
  | 'payment'
  | 'promotion'
  | 'customer'
  | 'review'
  | 'complaint'
  | 'report'
  | 'settings'
  | 'search'
  | 'cart'
  | 'user'
  | 'home'
  | 'leaf'
  | 'truck'
  | 'shield'
  | 'alert'
  | 'plus'
  | 'trash'
  | 'check'
  | 'close'
  | 'chevronRight'
  | 'menu'
  | 'logout'
  | 'phone'
  | 'pin'
  | 'clock'
  | 'download'
  | 'star'
  | 'heart'
  | 'copy'
  | 'print'

const PATHS: Record<IconName, string> = {
  dashboard: 'M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-4H4v4Zm10-13h6V4h-6v3Z',
  orders: 'M6 3h9l4 4v14H6V3Zm8 1.5V8h3.5M9 12h7M9 16h7',
  products: 'M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Zm0 0 9 4.5 9-4.5M12 13v7',
  categories: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  supplier: 'M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6',
  season: 'M12 21V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5Zm0 0C12 6 10 4 7 4c0 3 2 5 5 5Zm-5 4H3l4 4m10-4h4l-4 4',
  batch: 'M4 7h16v13H4V7Zm4-3h8v3H8V4Zm-1 8h10m-10 4h6',
  qr: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 2h2v4h-2v-4Zm4-2h2v2h-2v-2Z',
  recall: 'M12 3 2 21h20L12 3Zm0 6v6m0 3v.5',
  warehouse: 'M3 21V9l9-5 9 5v12M3 21h18M8 21v-6h8v6M8 12h8',
  payment: 'M2 7h20v11H2V7Zm0 4h20M6 15h3',
  promotion: 'M4 4h16v6H4V4Zm0 9h16v7H4v-7Zm8-9v16',
  customer: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c0-3.3 3.6-5 8-5s8 1.7 8 5',
  review: 'm12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z',
  complaint: 'M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8ZM9 9v.5M15 9v.5M9 15c1.8-1.5 4.2-1.5 6 0',
  report: 'M4 20V4h16v16H4Zm4-4v-4m4 4V8m4 8v-6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.5-2-3.4-2.3 1a8 8 0 0 0-3-1.7L14 2h-4l-.5 2.7a8 8 0 0 0-3 1.7l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6.1 1.2.2 1.7l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 3 1.7L10 22h4l.5-2.7a8 8 0 0 0 3-1.7l2.3 1 2-3.4-2-1.5c.1-.5.2-1.1.2-1.7Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21',
  cart: 'M3 4h2l2.5 11h10L20 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8c0-3.3 3.6-5 8-5s8 1.7 8 5',
  home: 'M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z',
  leaf: 'M20 4C10 4 4 9 4 16c0 2 1 4 1 4s1-6 6-8c-2 3-2 6-2 6 8 0 11-5 11-14Z',
  truck: 'M2 6h11v10H2V6Zm11 3h4l3 3v4h-7V9ZM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  shield: 'M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Zm-3 9 2.5 2.5L15.5 10',
  alert: 'M12 3 2 21h20L12 3Zm0 6v6m0 3v.5',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6M14 11v6',
  check: 'm4 12 5 5L20 6',
  close: 'M6 6l12 12M18 6 6 18',
  chevronRight: 'm9 5 7 7-7 7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  logout: 'M15 4h4v16h-4M11 8l-4 4 4 4M7 12h10',
  phone: 'M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2C11 20 4 13 4 5a2 2 0 0 1 2-2Z',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2',
  download: 'M12 4v10m0 0 4-4m-4 4-4-4M4 20h16',
  heart: 'M12 20S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 14.5 12 20 12 20Z',
  copy: 'M9 9h11v11H9V9Zm-5 6V4h11',
  print: 'M7 9V3h10v6M5 9h14v8h-3M8 17h8v4H8v-4Zm-3-8v8h2',
  star: 'm12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 3Z',
}

export function Icon({
  name,
  className = 'h-5 w-5',
  filled = false,
}: {
  name: IconName
  className?: string
  filled?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
