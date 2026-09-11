ALTER TABLE `khuyen_mai`
  ADD COLUMN `gia_tri_giam` DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE `loyalty_transaction`
  ADD COLUMN `ma_tham_chieu` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `uk_loyalty_transaction_reference`
  ON `loyalty_transaction`(`ma_tham_chieu`);

ALTER TABLE `system_settings`
  ADD COLUMN `gia_tri_quy_doi_moi_diem` DECIMAL(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE `order`
  ADD COLUMN `khuyen_mai_id` CHAR(36) NULL,
  ADD COLUMN `ma_khuyen_mai_snapshot` VARCHAR(80) NULL,
  ADD COLUMN `giam_khuyen_mai` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `diem_da_dung` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN `gia_tri_diem_da_dung` DECIMAL(15, 2) NOT NULL DEFAULT 0;

CREATE INDEX `idx_order_promotion` ON `order`(`khuyen_mai_id`);

ALTER TABLE `order`
  ADD CONSTRAINT `fk_order_promotion`
  FOREIGN KEY (`khuyen_mai_id`) REFERENCES `khuyen_mai`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `khuyen_mai`
  ADD CONSTRAINT `chk_promotion_discount_non_negative`
  CHECK (`gia_tri_giam` >= 0);

ALTER TABLE `system_settings`
  ADD CONSTRAINT `chk_system_settings_loyalty_value_non_negative`
  CHECK (`gia_tri_quy_doi_moi_diem` >= 0);

ALTER TABLE `order`
  ADD CONSTRAINT `chk_order_promotion_discount_non_negative`
  CHECK (`giam_khuyen_mai` >= 0),
  ADD CONSTRAINT `chk_order_points_value_non_negative`
  CHECK (`gia_tri_diem_da_dung` >= 0);
