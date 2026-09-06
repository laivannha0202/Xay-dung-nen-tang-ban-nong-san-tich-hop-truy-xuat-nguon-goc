ALTER TABLE `system_settings`
  ADD COLUMN `phi_van_chuyen_co_ban` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `nguong_mien_phi_van_chuyen` DECIMAL(15, 2) NULL;

ALTER TABLE `order`
  ADD COLUMN `tam_tinh_hang_hoa` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `phi_van_chuyen` DECIMAL(15, 2) NOT NULL DEFAULT 0;

UPDATE `order`
SET `tam_tinh_hang_hoa` = `tong_tien`
WHERE `tam_tinh_hang_hoa` = 0;
