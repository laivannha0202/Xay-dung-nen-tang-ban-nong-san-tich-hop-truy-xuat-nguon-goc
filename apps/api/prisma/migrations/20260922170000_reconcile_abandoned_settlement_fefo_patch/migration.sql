-- Reconcile abandoned local patch 20260922064019.
-- Keep DROP DEFAULT on settlement.refunds/adjustments because current Prisma
-- schema intentionally has no @default for those fields.
-- Remove only the three columns that are not present in the current source schema.

ALTER TABLE `settlement`
  DROP COLUMN `trangThai`;

ALTER TABLE `system_settings`
  DROP COLUMN `minimum_shelf_life_days`,
  DROP COLUMN `seller_escrow_hours`;
