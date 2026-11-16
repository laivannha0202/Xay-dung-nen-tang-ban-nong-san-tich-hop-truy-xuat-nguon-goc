export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  unit: string
  base_price_vnd: number
  category_name: string | null
  available: number
  in_stock: boolean
  image: string | null
  rating: number
  review_count: number
  has_batch_promo: boolean
}

export interface ProductDetail extends Product {
  description: string | null
  storage: string | null
  origin_note: string | null
  images: Array<{ url: string }>
  reviews: Array<{ rating: number; comment: string | null; customer_name: string; created_at: string }>
  public_batches: Array<{
    code: string
    expiry_date: string
    farm_name: string
    province: string
    discount_percent: number | null
  }>
}

export interface HomePayload {
  featured: Product[]
  categories: Array<{ name: string; slug: string }>
}

export interface Quote {
  lines: Array<{
    product_name: string
    unit: string
    quantity: number
    line_total_vnd: number
    allocations: Array<{
      batch_code: string
      qty: number
      expiry_date: string
      discount_percent: number
      discount_vnd: number
    }>
  }>
  subtotal_vnd: number
  promotion_discount_vnd: number
  ship_fee_vnd: number
  total_vnd: number
  version: string
}

export interface OrderSummary {
  id: string
  code: string
  status: string
  payment_status: string
  total_vnd: number
  placed_at: string
  line_count: number
}

export interface OrderLine {
  id: string
  product_name: string
  unit: string
  quantity: number
  unit_price_vnd: number
  allocations: Array<{ batch_code: string; reserved_qty: number; shipped_qty: number }>
}

export interface Order {
  id: string
  code: string
  status: string
  payment_status: string
  payment_method: string
  total_vnd: number
  placed_at: string
  address_snapshot: Record<string, string>
  lines: OrderLine[]
  recalled_batches?: string[]
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

export interface TracePayload {
  batch: {
    code: string
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
  season: { code: string; variety: string | null; sown_at: string | null; expected_harvest_at: string | null; area_ha: number | null } | null
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
    attachment_url: string | null
    notes: string | null
    is_effective: boolean
    metrics: unknown
  }>
  certificates: Array<{ type: string; number: string; issuer: string | null; valid_from: string; valid_until: string | null; scope: string | null }>
  alert: string | null
  recall: { reason: string; recalled_at: string } | null
}
