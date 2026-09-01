-- CreateTable
CREATE TABLE `cart` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_cart_customer`(`khach_hang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_item` (
    `id` CHAR(36) NOT NULL,
    `gio_hang_id` CHAR(36) NOT NULL,
    `bien_the_san_pham_id` CHAR(36) NOT NULL,
    `so_luong` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_cart_item_variant`(`bien_the_san_pham_id`),
    UNIQUE INDEX `uk_cart_item_cart_variant`(`gio_hang_id`, `bien_the_san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `fk_cart_customer` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_item` ADD CONSTRAINT `fk_cart_item_cart` FOREIGN KEY (`gio_hang_id`) REFERENCES `cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_item` ADD CONSTRAINT `fk_cart_item_variant` FOREIGN KEY (`bien_the_san_pham_id`) REFERENCES `bien_the_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `cart_item`
  ADD CONSTRAINT `chk_cart_item_quantity_positive` CHECK (`so_luong` > 0);
