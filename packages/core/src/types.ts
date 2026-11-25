/** Wire shapes shared by the website and the app; both talk to the same Fastify API. */

export interface Category {
  id: string
  slug: string
  name: string
  product_count: number
  image: string | null
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  unit: string
  base_price_vnd: number
  category_id?: string
  category_name: string | null
  category_slug?: string
  requires_trace?: boolean
  shelf_life_days?: number | null
  /** One-line provenance shown on cards; full text lives on ProductDetail. */
  origin_note?: string | null
  available: number
  in_stock: boolean
  image: string | null
  image_count?: number
  rating: number
  review_count: number
  has_batch_promo: boolean
  created_at?: string
}

export interface ProductDetail extends Product {
  description: string | null
  storage: string | null
  origin_note: string | null
  images: Array<{ url: string; alt?: string | null }>
  reviews: Array<{ id?: string; rating: number; comment: string | null; customer_name: string; created_at: string }>
  public_batches: Array<{
    code: string
    expiry_date: string
    harvest_date?: string
    farm_name: string
    province: string
    discount_percent: number | null
    qr_token: string | null
  }>
  /** Same-category neighbours chosen by the API (in-stock first). */
  related?: Product[]
}

export interface HomePayload {
  featured: Product[]
  newest: Product[]
  categories: Category[]
  stats: { products: number; batches: number }
}

export interface ProductList {
  data: Product[]
  page: number
  pageSize: number
  total: number
}

export interface CartLine {
  product_id: string
  quantity: number
  sku: string
  name: string
  slug: string
  unit: string
  base_price_vnd: number
  status: string
  image: string | null
  available: number
  is_available: boolean
  line_total_vnd: number
}

export interface Cart {
  items: CartLine[]
  subtotal_vnd: number
  ship_fee_estimate_vnd: number
  total_estimate_vnd: number
  free_ship_threshold_vnd?: number
  service_area?: ServiceArea
  item_count: number
}

export interface QuoteLine {
  product_name: string
  unit: string
  quantity: number
  line_total_vnd: number
  allocations: Array<{
    batch_code: string
    batch_id?: string
    qty: number
    expiry_date: string
    discount_percent: number
    discount_vnd: number
  }>
}


/** One voucher as the shopper must see it: value, window, and why it may not be usable yet. */
export interface Voucher {
  id: string
  code: string
  name: string
  type: 'PERCENT' | 'AMOUNT'
  value: number
  start_at: string
  end_at: string
  usage_limit: number | null
  min_subtotal_vnd: number
  state: 'AVAILABLE' | 'UPCOMING' | 'EXPIRED' | 'PAUSED' | 'USED_UP' | 'MIN_SUBTOTAL' | 'INVALID'
  reason: string
  remaining_vnd: number
  /** What this voucher would take off the shopper's current goods total. */
  discount_vnd: number
  saved: boolean

}
export interface Quote {
  lines: QuoteLine[]
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  version: string
  promotion?: { id: string; code: string; name: string } | null
  /** Set when the typed or picked code cannot be used; the quote still prices the goods. */
  promotion_error?: { code: string; state: Voucher['state']; reason: string } | null
  available_promotions?: Voucher[]
  /** False when no serviceable Hưng Yên address was quoted: the fee is an estimate. */
  ship_fee_final?: boolean
  address_status?: 'MISSING' | 'OUTSIDE_SERVICE_AREA' | 'NEEDS_UPDATE' | 'OK'
  ward_name?: string | null
  service_area?: ServiceArea
}

export interface OrderSummary {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  total_vnd: number
  placed_at: string
  line_count: number
  items: Array<{ name: string; image: string | null }> | null
}

export interface OrderLine {
  id: string
  product_name: string
  product_slug?: string
  unit: string
  quantity: number
  unit_price_vnd: number
  line_total_vnd?: number
  image?: string | null
  allocations: Array<{ batch_code: string; batch_id: string; reserved_qty: number; shipped_qty: number }>
  review?: { id: string; rating: number; comment: string | null; status: string } | null
}

export interface Order {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  subtotal_vnd?: number
  discount_vnd?: number
  ship_fee_vnd?: number
  total_vnd: number
  placed_at: string
  cancel_reason?: string | null
  promotion_snapshot?: { code?: string; name?: string; discount_vnd?: number } | null
  address_snapshot: Record<string, string>
  lines: OrderLine[]
  recalled_batches?: string[]
  events?: Array<{ status: string; occurred_at: string; note?: string | null }>
  /** Sum of every receipt, not one arbitrary row: what COD can no longer collect. */
  payment?: { paid_vnd: number; is_paid: boolean; paid_at: string | null; method: string | null } | null
  shipment?: { carrier: string; tracking_code: string; status: string; shipped_at: string | null; delivered_at: string | null } | null
  refunds?: Array<{ amount_vnd: number; status: string; reason: string }>
}

/** Commune-level unit of the Hưng Yên delivery area (post-2025 merger). */
export interface Ward {
  code: string
  name: string
  type: 'Xã' | 'Phường'
  province_code: string
  in_service_area: boolean
}

export interface ServiceArea {
  province: { code: string; name: string }
  dataset_version: string
  ward_count: number
  serviceable_ward_count: number
  ship_fee_vnd: number
  free_ship_threshold_vnd: number
}

export interface Address {
  id: string
  recipient_name: string
  phone: string
  /** Kept for ordering snapshots of pre-migration addresses only. */
  district: string | null
  province: string
  province_code: string | null
  /** Null on legacy addresses, which must be re-picked before checkout. */
  ward_code: string | null
  /** Resolved server-side from `ward_code`; the client never sends a ward name. */
  ward: string
  ward_name?: string | null
  ward_type?: string | null
  in_service_area?: boolean | null
  needs_confirmation?: boolean
  street_detail: string
  is_default: boolean
}

/** Body accepted by POST/PATCH /me/addresses. */
export interface AddressInput {
  recipient_name: string
  phone: string
  ward_code: string
  street_detail: string
  is_default?: boolean
}

export interface SessionUser {
  id: string
  email: string
  role: 'ADMIN' | 'CUSTOMER'
  status: string
  name: string | null
  phone: string | null
}

export interface TracePayload {
  batch: {
    code: string
    id: string
    harvest_date: string
    pack_date: string | null
    expiry_date: string
    harvested_qty: number
    quality_status: string
    publication_status: string
    safety_status: string
    storage_condition: string | null
    is_expired: boolean
    /** Seeded demo row: the UI must label it as illustrative, never as verified provenance. */
    is_demo?: boolean
  }
  product: {
    name: string
    sku: string
    slug: string
    unit: string
    description: string | null
    storage: string | null
    origin_note: string | null
    image: string | null
  }
  farm: { name: string; province: string; district: string | null; commune: string | null } | null
  supplier: { name: string; business_type: string | null } | null
  season: {
    code: string
    variety: string | null
    sown_at: string | null
    expected_harvest_at: string | null
    area_ha: number | null
  } | null
  timeline: Array<{
    activity: string
    activity_at: string
    performer: string | null
    materials: string | null
    pesticide_name: string | null
    isolation_days: number | null
    note: string | null
  }>
  lab_tests: Array<{
    id: string
    laboratory: string | null
    sampled_at: string
    resulted_at: string | null
    overall_result: string
    attachment_url?: string | null
    notes: string | null
    is_effective: boolean
    /** True when the "lab test" is seeded demo data, never a document issued by a real laboratory. */
    is_demo: boolean
    metrics: unknown
  }>
  certificates: Array<{
    type: string
    number: string
    issuer: string | null
    valid_from: string
    valid_until: string | null
    scope: string | null
  }>
  alert: string | null
  recall: { reason: string; recalled_at: string } | null
}
