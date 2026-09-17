-- AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
-- Flash sale snapshot for exact quota accounting
ALTER TABLE `order_item`
  ADD COLUMN `muc_flash_sale_id_snapshot` CHAR(36) NULL;

CREATE INDEX `idx_order_item_flash_sale_snapshot`
  ON `order_item`(`muc_flash_sale_id_snapshot`);

-- Voucher per-customer use counter. Wallet row itself is the per-customer ledger.
ALTER TABLE `khach_hang_khuyen_mai`
  ADD COLUMN `so_lan_da_su_dung` INT UNSIGNED NOT NULL DEFAULT 0;

-- Complaint lifecycle visible to customer.
ALTER TABLE `complaint`
  ADD COLUMN `trang_thai` ENUM(
    'MOI',
    'DANG_XU_LY',
    'CHAP_NHAN',
    'TU_CHOI',
    'DA_HOAN_TIEN',
    'DONG'
  ) NOT NULL DEFAULT 'MOI',
  ADD COLUMN `phan_hoi_khach_hang` VARCHAR(2000) NULL,
  ADD COLUMN `nguoi_xu_ly_id` CHAR(36) NULL,
  ADD COLUMN `xu_ly_luc` DATETIME(3) NULL;

CREATE INDEX `idx_complaint_status_created_at`
  ON `complaint`(`trang_thai`, `created_at`);
