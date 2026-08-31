-- CreateTable
CREATE TABLE `inventory_lot` (
    `id` CHAR(36) NOT NULL,
    `kho_id` CHAR(36) NOT NULL,
    `lo_san_pham_id` CHAR(36) NOT NULL,
    `bien_the_san_pham_id` CHAR(36) NOT NULL,
    `on_hand` DECIMAL(14, 3) NOT NULL DEFAULT 0,
    `reserved` DECIMAL(14, 3) NOT NULL DEFAULT 0,
    `blocked` DECIMAL(14, 3) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_inventory_lot_warehouse`(`kho_id`),
    INDEX `idx_inventory_lot_batch`(`lo_san_pham_id`),
    INDEX `idx_inventory_lot_variant`(`bien_the_san_pham_id`),
    UNIQUE INDEX `uk_inventory_lot_warehouse_batch_variant`(`kho_id`, `lo_san_pham_id`, `bien_the_san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory_lot` ADD CONSTRAINT `fk_inventory_lot_warehouse` FOREIGN KEY (`kho_id`) REFERENCES `kho`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lot` ADD CONSTRAINT `fk_inventory_lot_batch` FOREIGN KEY (`lo_san_pham_id`) REFERENCES `lo_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_lot` ADD CONSTRAINT `fk_inventory_lot_variant` FOREIGN KEY (`bien_the_san_pham_id`) REFERENCES `bien_the_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- PHIEN-035 – CHECK constraints InventoryLot.
ALTER TABLE `inventory_lot`
  ADD CONSTRAINT `chk_inventory_lot_on_hand_non_negative` CHECK (`on_hand` >= 0),
  ADD CONSTRAINT `chk_inventory_lot_reserved_non_negative` CHECK (`reserved` >= 0),
  ADD CONSTRAINT `chk_inventory_lot_blocked_non_negative` CHECK (`blocked` >= 0),
  ADD CONSTRAINT `chk_inventory_lot_available_non_negative`
    CHECK (`reserved` + `blocked` <= `on_hand`);
