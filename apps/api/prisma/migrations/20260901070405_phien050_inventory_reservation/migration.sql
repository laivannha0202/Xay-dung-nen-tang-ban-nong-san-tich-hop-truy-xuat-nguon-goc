-- CreateTable
CREATE TABLE `inventory_reservation` (
    `id` CHAR(36) NOT NULL,
    `ma_tham_chieu` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('DANG_GIU', 'DA_BAN', 'DA_GIAI_PHONG', 'HET_HAN') NOT NULL DEFAULT 'DANG_GIU',
    `het_han_luc` DATETIME(3) NOT NULL,
    `ket_thuc_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_inventory_reservation_reference`(`ma_tham_chieu`),
    INDEX `idx_inventory_reservation_status_expiry`(`trang_thai`, `het_han_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_reservation_item` (
    `id` CHAR(36) NOT NULL,
    `dat_cho_ton_kho_id` CHAR(36) NOT NULL,
    `ton_kho_lo_id` CHAR(36) NOT NULL,
    `so_luong` DECIMAL(14, 3) NOT NULL,
    `thu_tu` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_inventory_reservation_item_inventory_lot`(`ton_kho_lo_id`),
    UNIQUE INDEX `uk_inventory_reservation_item_lot`(`dat_cho_ton_kho_id`, `ton_kho_lo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory_reservation_item` ADD CONSTRAINT `fk_inventory_reservation_item_reservation` FOREIGN KEY (`dat_cho_ton_kho_id`) REFERENCES `inventory_reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_reservation_item` ADD CONSTRAINT `fk_inventory_reservation_item_inventory_lot` FOREIGN KEY (`ton_kho_lo_id`) REFERENCES `inventory_lot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `inventory_reservation_item`
  ADD CONSTRAINT `chk_inventory_reservation_item_quantity_positive` CHECK (`so_luong` > 0);
