-- PHIEN-083: Seller Balance, one row per supplier.
CREATE TABLE `seller_balance` (
    `supplier_id` CHAR(36) NOT NULL,
    `pending` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `available` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `withheld` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `paid` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`supplier_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `seller_balance`
    ADD CONSTRAINT `fk_seller_balance_supplier`
    FOREIGN KEY (`supplier_id`) REFERENCES `nha_cung_cap`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
