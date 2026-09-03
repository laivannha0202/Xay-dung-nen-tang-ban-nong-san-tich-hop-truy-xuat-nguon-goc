-- PHIEN-085: Payout lifecycle for supplier balances.
CREATE TABLE `payout` (
    `id` CHAR(36) NOT NULL,
    `request_key` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('REQUESTED', 'PROCESSING', 'PAID', 'FAILED') NOT NULL DEFAULT 'REQUESTED',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processing_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,
    `failed_at` DATETIME(3) NULL,
    `failure_reason` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_payout_request_key`(`request_key`),
    INDEX `idx_payout_supplier_status_created`(`supplier_id`, `status`, `created_at`),
    INDEX `idx_payout_status_created`(`status`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payout`
    ADD CONSTRAINT `fk_payout_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `nha_cung_cap`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
