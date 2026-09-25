-- V18: Item immutable monetary allocation, Supplier Debt, and Recall Customer Notification

-- 1. MucDonHang immutable money allocation
ALTER TABLE `order_item`
  ADD COLUMN `tien_hang_goc` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `tien_khuyen_mai_phan_bo` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `tien_diem_phan_bo` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `tien_van_chuyen_phan_bo` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `tien_thuc_tra` DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `tien_da_hoan` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- 2. NoNhaCungCap (Supplier Debt)
CREATE TABLE `supplier_debt` (
  `id` CHAR(36) NOT NULL,
  `supplier_id` CHAR(36) NOT NULL,
  `payment_id` CHAR(36) NOT NULL,
  `muc_don_hang_id` CHAR(36) NULL,
  `payout_id` CHAR(36) NULL,
  `amount` DECIMAL(18, 2) NOT NULL,
  `reason` VARCHAR(500) NOT NULL,
  `status` ENUM('OPEN', 'SETTLED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
  `settled_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `idx_supplier_debt_supplier_status` (`supplier_id`, `status`),
  INDEX `idx_supplier_debt_payment` (`payment_id`),
  INDEX `idx_supplier_debt_payout` (`payout_id`),
  CONSTRAINT `fk_supplier_debt_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `nha_cung_cap` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_supplier_debt_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_supplier_debt_order_item` FOREIGN KEY (`muc_don_hang_id`) REFERENCES `order_item` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_supplier_debt_payout` FOREIGN KEY (`payout_id`) REFERENCES `payout` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. ThongBaoThuHoi (Recall Customer Notification)
CREATE TABLE `thong_bao_thu_hoi` (
  `id` CHAR(36) NOT NULL,
  `recall_id` CHAR(36) NOT NULL,
  `batch_id` CHAR(36) NOT NULL,
  `order_id` CHAR(36) NOT NULL,
  `customer_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `idempotency_key` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_thong_bao_thu_hoi_idempotency` (`idempotency_key`),
  INDEX `idx_thong_bao_thu_hoi_customer_created` (`customer_id`, `created_at`),
  INDEX `idx_thong_bao_thu_hoi_recall` (`recall_id`),
  INDEX `idx_thong_bao_thu_hoi_batch` (`batch_id`),
  INDEX `idx_thong_bao_thu_hoi_order` (`order_id`),
  CONSTRAINT `fk_thong_bao_thu_hoi_recall` FOREIGN KEY (`recall_id`) REFERENCES `thu_hoi_lo_san_pham` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_thong_bao_thu_hoi_batch` FOREIGN KEY (`batch_id`) REFERENCES `lo_san_pham` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_thong_bao_thu_hoi_order` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_thong_bao_thu_hoi_customer` FOREIGN KEY (`customer_id`) REFERENCES `khach_hang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
