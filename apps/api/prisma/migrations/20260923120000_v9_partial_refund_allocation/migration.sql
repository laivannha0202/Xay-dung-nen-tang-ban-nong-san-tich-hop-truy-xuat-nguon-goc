-- AGRIMARKET V9 - Partial refund immutable allocation.
CREATE TABLE `refund_allocation` (
  `id` CHAR(36) NOT NULL,
  `thanh_toan_id` CHAR(36) NOT NULL,
  `don_hang_id` CHAR(36) NOT NULL,
  `muc_don_hang_id` CHAR(36) NOT NULL,
  `nha_cung_cap_id` CHAR(36) NOT NULL,
  `so_tien_phan_bo` DECIMAL(15, 2) NOT NULL,
  `tong_so_tien_hoan` DECIMAL(15, 2) NOT NULL,
  `ma_yeu_cau` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `uk_refund_allocation_payment_item_request`
    ON `refund_allocation`(`thanh_toan_id`, `muc_don_hang_id`, `ma_yeu_cau`);
CREATE INDEX `idx_refund_allocation_order`
    ON `refund_allocation`(`don_hang_id`);
CREATE INDEX `idx_refund_allocation_supplier`
    ON `refund_allocation`(`nha_cung_cap_id`);
CREATE INDEX `idx_refund_allocation_request`
    ON `refund_allocation`(`ma_yeu_cau`);
