-- AgriMarket schema. P1 entities per Admin V3.0 §17 + Customer V1.0 §18.
-- Money: integer VND. Quantities: numeric(12,3). Timestamps: timestamptz (UTC).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- users & auth ----------
CREATE TYPE user_role AS ENUM ('ADMIN','CUSTOMER');
CREATE TYPE user_status AS ENUM ('ACTIVE','LOCKED');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  token_version int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_uniq ON users (lower(email));

CREATE TABLE customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text
);

CREATE TABLE addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name text NOT NULL,
  phone text NOT NULL,
  province text NOT NULL,
  district text NOT NULL,
  ward text NOT NULL,
  street_detail text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX addresses_user_idx ON addresses (user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX addresses_one_default ON addresses (user_id) WHERE is_default AND deleted_at IS NULL;

CREATE TABLE login_attempts (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  ip text,
  success boolean NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_idx ON login_attempts (lower(email), at DESC);

-- ---------- catalog ----------
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','HIDDEN')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id),
  sku text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  storage text NOT NULL DEFAULT '',
  origin_note text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'kg',
  base_price_vnd int NOT NULL CHECK (base_price_vnd >= 0),
  shelf_life_days int NOT NULL DEFAULT 7 CHECK (shelf_life_days > 0),
  requires_trace boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX product_images_product_idx ON product_images (product_id, sort_order);

-- ---------- provenance ----------
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  business_type text NOT NULL DEFAULT 'Hợp tác xã',
  contact_name text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  name text NOT NULL,
  province text NOT NULL,
  district text NOT NULL,
  commune text NOT NULL,
  address_detail text NOT NULL DEFAULT '',
  latitude numeric(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9,6) CHECK (longitude BETWEEN -180 AND 180),
  area_ha numeric(10,2) NOT NULL DEFAULT 0,
  crops text NOT NULL DEFAULT '',
  manager_name text NOT NULL DEFAULT '',
  manager_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crop_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES farms(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL UNIQUE,
  variety text NOT NULL DEFAULT '',
  area_ha numeric(10,2) NOT NULL DEFAULT 0,
  sown_at date NOT NULL,
  expected_harvest_at date NOT NULL,
  status text NOT NULL DEFAULT 'GROWING' CHECK (status IN ('GROWING','HARVESTED','CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cultivation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES crop_seasons(id) ON DELETE CASCADE,
  activity text NOT NULL CHECK (activity IN ('TILLING','SOWING','FERTILIZING','PESTICIDE','IRRIGATION','PRUNING','HARVEST','OTHER')),
  activity_at date NOT NULL,
  performer text NOT NULL DEFAULT '',
  materials text NOT NULL DEFAULT '',
  pesticide_name text,
  isolation_days int CHECK (isolation_days IS NULL OR isolation_days >= 0),
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pesticide_needs_isolation CHECK (activity <> 'PESTICIDE' OR (pesticide_name IS NOT NULL AND isolation_days IS NOT NULL))
);
CREATE INDEX cultivation_logs_season_idx ON cultivation_logs (season_id, activity_at);

CREATE TABLE batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES crop_seasons(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL UNIQUE,
  harvest_date date NOT NULL,
  pack_date date NOT NULL,
  expiry_date date NOT NULL,
  harvested_qty numeric(12,3) NOT NULL CHECK (harvested_qty > 0),
  storage_condition text NOT NULL DEFAULT '',
  quality_status text NOT NULL DEFAULT 'PENDING' CHECK (quality_status IN ('PENDING','PASS','FAIL')),
  publication_status text NOT NULL DEFAULT 'DRAFT' CHECK (publication_status IN ('DRAFT','PUBLISHED','UNPUBLISHED')),
  safety_status text NOT NULL DEFAULT 'NORMAL' CHECK (safety_status IN ('NORMAL','HOLD','RECALLED')),
  notes text NOT NULL DEFAULT '',
  published_at timestamptz,
  published_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expiry_date > harvest_date)
);
CREATE INDEX batches_product_idx ON batches (product_id);
CREATE INDEX batches_sellable_idx ON batches (product_id, expiry_date)
  WHERE quality_status='PASS' AND publication_status='PUBLISHED' AND safety_status='NORMAL';

CREATE TABLE batch_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES users(id),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX batch_events_batch_idx ON batch_events (batch_id, occurred_at);

CREATE TABLE lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id),
  laboratory text NOT NULL,
  sampled_at date NOT NULL,
  resulted_at date NOT NULL,
  overall_result text NOT NULL CHECK (overall_result IN ('PASS','FAIL')),
  attachment_url text,
  notes text NOT NULL DEFAULT '',
  is_effective boolean NOT NULL DEFAULT false,
  confirmed_by uuid REFERENCES users(id),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lab_tests_batch_idx ON lab_tests (batch_id, created_at DESC);
CREATE UNIQUE INDEX lab_tests_one_effective ON lab_tests (batch_id) WHERE is_effective;

CREATE TABLE lab_test_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_test_id uuid NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  metric text NOT NULL,
  measured_value text NOT NULL,
  unit text NOT NULL DEFAULT '',
  reference_limit text NOT NULL DEFAULT '',
  result text NOT NULL CHECK (result IN ('PASS','FAIL'))
);

CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid REFERENCES farms(id),
  batch_id uuid REFERENCES batches(id),
  type text NOT NULL,
  number text NOT NULL,
  issuer text NOT NULL,
  valid_from date NOT NULL,
  valid_until date,
  scope text NOT NULL DEFAULT '',
  attachment_url text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (farm_id IS NOT NULL OR batch_id IS NOT NULL)
);

CREATE TABLE evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  owner_id uuid NOT NULL,
  url text NOT NULL,
  mime text NOT NULL,
  size_bytes int NOT NULL,
  original_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_public boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX evidence_owner_idx ON evidence_files (owner_type, owner_id);

-- ---------- QR ----------
CREATE TABLE qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL UNIQUE REFERENCES batches(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE qr_scans (
  id bigserial PRIMARY KEY,
  qr_id uuid NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'WEB'
);
CREATE INDEX qr_scans_qr_idx ON qr_scans (qr_id, scanned_at);

-- ---------- inventory ----------
CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE inventory (
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  on_hand_qty numeric(12,3) NOT NULL DEFAULT 0,
  reserved_qty numeric(12,3) NOT NULL DEFAULT 0,
  received_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (warehouse_id, batch_id),
  CONSTRAINT inventory_nonneg CHECK (on_hand_qty >= 0 AND reserved_qty >= 0),
  CONSTRAINT inventory_reserved_le_onhand CHECK (on_hand_qty >= reserved_qty)
);

CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  type text NOT NULL CHECK (type IN ('IN','OUT','ADJUST','RETURN')),
  quantity numeric(12,3) NOT NULL,
  on_hand_after numeric(12,3) NOT NULL,
  reason text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'MANUAL',
  source_id uuid,
  actor_id uuid REFERENCES users(id),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_batch_idx ON stock_movements (batch_id, occurred_at);

-- ---------- cart ----------
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version int NOT NULL DEFAULT 0
);

CREATE TABLE cart_items (
  cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, product_id)
);

-- ---------- promotions ----------
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('PERCENT','AMOUNT')),
  value int NOT NULL CHECK (value > 0),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  usage_limit int,
  used_count int NOT NULL DEFAULT 0,
  min_subtotal_vnd int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- ---------- orders ----------
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','PREPARING','SHIPPING','DELIVERED','COMPLETED','CANCELLED','DELIVERY_FAILED')),
  payment_method text NOT NULL CHECK (payment_method IN ('COD','BANK_TRANSFER')),
  payment_status text NOT NULL DEFAULT 'UNPAID'
    CHECK (payment_status IN ('UNPAID','PAID','PARTIALLY_REFUNDED','REFUNDED')),
  address_snapshot jsonb NOT NULL,
  subtotal_vnd int NOT NULL CHECK (subtotal_vnd >= 0),
  discount_vnd int NOT NULL DEFAULT 0 CHECK (discount_vnd >= 0),
  ship_fee_vnd int NOT NULL DEFAULT 0 CHECK (ship_fee_vnd >= 0),
  total_vnd int NOT NULL CHECK (total_vnd >= 0),
  promotion_id uuid REFERENCES promotions(id),
  promotion_snapshot jsonb,
  needs_reallocation boolean NOT NULL DEFAULT false,
  cancel_reason text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_idx ON orders (customer_id, placed_at DESC);
CREATE INDEX orders_status_idx ON orders (status, placed_at DESC);

CREATE TABLE order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  sku text NOT NULL,
  unit text NOT NULL,
  unit_price_vnd int NOT NULL CHECK (unit_price_vnd >= 0),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  total_vnd int NOT NULL CHECK (total_vnd >= 0)
);
CREATE INDEX order_lines_order_idx ON order_lines (order_id);

CREATE TABLE order_line_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id uuid NOT NULL REFERENCES order_lines(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id),
  batch_id uuid NOT NULL REFERENCES batches(id),
  reserved_qty numeric(12,3) NOT NULL CHECK (reserved_qty >= 0),
  shipped_qty numeric(12,3) NOT NULL DEFAULT 0 CHECK (shipped_qty >= 0),
  unit_price_vnd int NOT NULL CHECK (unit_price_vnd >= 0),
  discount_vnd int NOT NULL DEFAULT 0 CHECK (discount_vnd >= 0),
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','REPLACED','RELEASED','CANCELLED','NEEDS_REALLOCATION'))
);
CREATE INDEX allocations_line_idx ON order_line_allocations (order_line_id);
CREATE INDEX allocations_batch_idx ON order_line_allocations (batch_id);
CREATE INDEX allocations_shipped_idx ON order_line_allocations (batch_id) WHERE shipped_qty > 0;

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('COD','BANK_TRANSFER')),
  amount_vnd int NOT NULL CHECK (amount_vnd > 0),
  status text NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID')),
  paid_at timestamptz,
  reference text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payments_order_paid ON payments (order_id) WHERE status='PAID';

CREATE TABLE refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  amount_vnd int NOT NULL CHECK (amount_vnd > 0),
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','COMPLETED','REJECTED')),
  completed_at timestamptz,
  handled_by uuid REFERENCES users(id),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refunds_order_idx ON refund_requests (order_id);

CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  carrier text NOT NULL DEFAULT '',
  tracking_code text NOT NULL DEFAULT '',
  courier_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','SHIPPING','DELIVERED','FAILED')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  note text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX shipments_order_uniq ON shipments (order_id);

-- ---------- reviews & complaints ----------
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  order_line_id uuid NOT NULL REFERENCES order_lines(id),
  product_id uuid NOT NULL REFERENCES products(id),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'VISIBLE' CHECK (status IN ('VISIBLE','HIDDEN')),
  hidden_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, order_line_id)
);
CREATE INDEX reviews_product_idx ON reviews (product_id, created_at DESC);

CREATE TABLE complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  order_line_id uuid REFERENCES order_lines(id),
  batch_id uuid REFERENCES batches(id),
  type text NOT NULL CHECK (type IN ('QUALITY','DAMAGED','WRONG_ITEM','SUSPECTED_FAKE','OTHER')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','PROCESSING','RESOLVED','CLOSED')),
  resolution text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_customer_idx ON complaints (customer_id, created_at DESC);
CREATE INDEX complaints_batch_idx ON complaints (batch_id);

CREATE TABLE complaint_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  url text NOT NULL,
  mime text NOT NULL
);

CREATE TABLE complaint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id),
  actor_role user_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- recall ----------
CREATE TABLE recalls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id),
  reason text NOT NULL,
  severity text NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW','MEDIUM','HIGH')),
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED')),
  started_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  summary text NOT NULL DEFAULT '',
  created_by uuid REFERENCES users(id)
);
CREATE INDEX recalls_batch_idx ON recalls (batch_id);

CREATE TABLE recall_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recall_id uuid NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  stage text NOT NULL CHECK (stage IN ('PRE_SHIP','SHIPPING','DELIVERED')),
  affected_qty numeric(12,3) NOT NULL,
  contact_status text NOT NULL DEFAULT 'PENDING' CHECK (contact_status IN ('PENDING','CONTACTED','RESOLVED','REFUNDED')),
  handled_at timestamptz,
  note text NOT NULL DEFAULT '',
  UNIQUE (recall_id, order_id)
);

-- ---------- audit ----------
CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  before jsonb,
  after jsonb,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE TABLE idempotency_records (
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  request_hash text NOT NULL,
  order_id uuid REFERENCES orders(id),
  quote_version text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, key)
);

-- ---------- P2: FEFO flag + batch promotion ----------
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE batch_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id),
  discount_percent int NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX batch_promotions_active_uniq ON batch_promotions (batch_id) WHERE status='ACTIVE';
