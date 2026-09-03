-- PHIEN-082: Commission Rules by supplier + category + effective date.
CREATE TABLE `commission_rule` (
    `id` CHAR(36) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `supplier_id` CHAR(36) NOT NULL,
    `effective_from` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_commission_rule_supplier_category_effective`(`supplier_id`, `category_id`, `effective_from`),
    INDEX `idx_commission_rule_supplier_effective`(`supplier_id`, `effective_from`),
    INDEX `idx_commission_rule_category_effective`(`category_id`, `effective_from`),
    INDEX `idx_commission_rule_effective`(`effective_from`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `commission_rule`
    ADD CONSTRAINT `fk_commission_rule_category`
    FOREIGN KEY (`category_id`) REFERENCES `danh_muc_san_pham`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `commission_rule`
    ADD CONSTRAINT `fk_commission_rule_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `nha_cung_cap`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
