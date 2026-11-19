-- The demo warehouse was seeded as a Ho Chi Minh City hub while the store, its farms and its
-- service area are Hưng Yên. Rename in place: the row keeps its id, so every inventory row,
-- stock movement, allocation and audit entry stays attached — no delete, no re-seed.
-- Only the demo seed code is affected; a real deployment changes its warehouse through the
-- admin API, which this migration cannot touch.
UPDATE warehouses
   SET code = 'KHO-HY',
       name = 'Kho trung tâm Hưng Yên',
       address = 'Thành phố Hưng Yên, tỉnh Hưng Yên'
 WHERE code = 'KHO-HCM'
   AND name = 'Kho trung tâm HCM';
