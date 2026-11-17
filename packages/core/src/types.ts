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

export interface Quote {
  lines: QuoteLine[]
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  version: string
  promotion?: { code: string; label: string } | null
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
  address_snapshot: Record<string, string>
  lines: OrderLine[]
  recalled_batches?: string[]
  events?: Array<{ status: string; occurred_at: string; note?: string | null }>
}

export interface Address {
  id: string
  recipient_name: string
  phone: string
  province: string
  district: string
  ward: string
  street_detail: string
  is_default: boolean
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
