-- Voucher wallet: which programs a shopper kept for later. Saving is not using — it never
-- touches `promotions.used_count`; only a placed order does. The program itself stays the
-- single source of truth for value, window and remaining uses.
CREATE TABLE IF NOT EXISTS customer_saved_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promotion_id uuid NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, promotion_id)
);
CREATE INDEX IF NOT EXISTS customer_saved_promotions_customer_idx
  ON customer_saved_promotions (customer_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS customer_saved_promotions_promotion_idx
  ON customer_saved_promotions (promotion_id);
