-- PHIEN-084: stable category snapshot for settlement commission calculation.
ALTER TABLE `order_item`
    ADD COLUMN `category_id_snapshot` CHAR(36) NULL AFTER `san_pham_id`;

UPDATE `order_item` AS oi
JOIN `san_pham` AS sp ON sp.`id` = oi.`san_pham_id`
SET oi.`category_id_snapshot` = sp.`danh_muc_san_pham_id`
WHERE oi.`category_id_snapshot` IS NULL;

ALTER TABLE `order_item`
    MODIFY `category_id_snapshot` CHAR(36) NOT NULL;

CREATE INDEX `idx_order_item_category_snapshot`
    ON `order_item`(`category_id_snapshot`);

-- PHIEN-084: immutable supplier settlement period snapshot.
CREATE TABLE `settlement` (
    `id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `period_start` DATETIME(3) NOT NULL,
    `period_end` DATETIME(3) NOT NULL,
    `revenue` DECIMAL(18, 2) NOT NULL,
    `commission` DECIMAL(18, 2) NOT NULL,
    `refunds` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `adjustments` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `payable` DECIMAL(18, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_settlement_supplier_period`(`supplier_id`, `period_start`, `period_end`),
    INDEX `idx_settlement_supplier_period_end`(`supplier_id`, `period_end`),
    INDEX `idx_settlement_period`(`period_start`, `period_end`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `settlement`
    ADD CONSTRAINT `fk_settlement_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `nha_cung_cap`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
