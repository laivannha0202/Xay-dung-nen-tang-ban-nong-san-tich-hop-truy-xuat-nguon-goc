-- CreateTable
CREATE TABLE `shipment` (
    `id` CHAR(36) NOT NULL,
    `don_hang_nha_cung_cap_id` CHAR(36) NOT NULL,
    `ma_van_don` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED') NOT NULL DEFAULT 'CREATED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_shipment_tracking_number`(`ma_van_don`),
    INDEX `idx_shipment_supplier_order_created_at`(`don_hang_nha_cung_cap_id`, `created_at`),
    INDEX `idx_shipment_status_created_at`(`trang_thai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tracking_event` (
    `id` CHAR(36) NOT NULL,
    `van_chuyen_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED') NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    `vi_tri` VARCHAR(255) NULL,
    `thoi_gian` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_tracking_event_shipment_time`(`van_chuyen_id`, `thoi_gian`),
    INDEX `idx_tracking_event_status_time`(`trang_thai`, `thoi_gian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipment` ADD CONSTRAINT `fk_shipment_supplier_order` FOREIGN KEY (`don_hang_nha_cung_cap_id`) REFERENCES `supplier_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tracking_event` ADD CONSTRAINT `fk_tracking_event_shipment` FOREIGN KEY (`van_chuyen_id`) REFERENCES `shipment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
