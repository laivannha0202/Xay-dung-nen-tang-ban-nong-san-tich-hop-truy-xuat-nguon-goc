-- AGRIMARKET V8A - Settlement escrow.
-- Settlement lịch sử đã credit available: backfill chúng thành KHA_DUNG.
ALTER TABLE `settlement`
    ADD COLUMN `status` ENUM('DANG_CHO', 'KHA_DUNG') NOT NULL DEFAULT 'KHA_DUNG' AFTER `payable`,
    ADD COLUMN `eligible_at` DATETIME(3) NULL AFTER `status`,
    ADD COLUMN `released_at` DATETIME(3) NULL AFTER `eligible_at`;

UPDATE `settlement`
SET `status` = 'KHA_DUNG',
    `eligible_at` = COALESCE(`eligible_at`, `created_at`),
    `released_at` = COALESCE(`released_at`, `created_at`);

ALTER TABLE `settlement`
    MODIFY COLUMN `status` ENUM('DANG_CHO', 'KHA_DUNG') NOT NULL DEFAULT 'DANG_CHO',
    MODIFY COLUMN `eligible_at` DATETIME(3) NOT NULL;

CREATE INDEX `idx_settlement_status_eligible`
    ON `settlement`(`status`, `eligible_at`);

ALTER TABLE `supplier_order`
    ADD COLUMN `settlement_id` CHAR(36) NULL;

CREATE INDEX `idx_supplier_order_settlement`
    ON `supplier_order`(`settlement_id`);

ALTER TABLE `supplier_order`
    ADD CONSTRAINT `fk_supplier_order_settlement`
    FOREIGN KEY (`settlement_id`) REFERENCES `settlement`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
