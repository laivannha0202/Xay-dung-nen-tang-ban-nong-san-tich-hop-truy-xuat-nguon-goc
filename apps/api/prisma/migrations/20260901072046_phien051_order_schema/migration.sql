-- CreateTable
CREATE TABLE `order` (
    `id` CHAR(36) NOT NULL,
    `ma_don_hang` VARCHAR(100) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('CHO_THANH_TOAN', 'DA_XAC_NHAN', 'DANG_CHUAN_BI', 'DA_DONG_GOI', 'DANG_GIAO', 'DA_GIAO', 'HOAN_THANH', 'DA_HUY', 'KHIEU_NAI', 'HOAN_TIEN_MOT_PHAN', 'HOAN_TIEN_TOAN_BO') NOT NULL DEFAULT 'CHO_THANH_TOAN',
    `tong_tien` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_order_number`(`ma_don_hang`),
    INDEX `idx_order_customer_created_at`(`khach_hang_id`, `created_at`),
    INDEX `idx_order_status_created_at`(`trang_thai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier_order` (
    `id` CHAR(36) NOT NULL,
    `ma_don` VARCHAR(100) NOT NULL,
    `don_hang_id` CHAR(36) NOT NULL,
    `nha_cung_cap_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('CHO_THANH_TOAN', 'DA_XAC_NHAN', 'DANG_CHUAN_BI', 'DA_DONG_GOI', 'DANG_GIAO', 'DA_GIAO', 'HOAN_THANH', 'DA_HUY', 'KHIEU_NAI', 'HOAN_TIEN_MOT_PHAN', 'HOAN_TIEN_TOAN_BO') NOT NULL DEFAULT 'CHO_THANH_TOAN',
    `tam_tinh` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_supplier_order_number`(`ma_don`),
    INDEX `idx_supplier_order_supplier_status`(`nha_cung_cap_id`, `trang_thai`, `created_at`),
    INDEX `idx_supplier_order_order`(`don_hang_id`, `created_at`),
    UNIQUE INDEX `uk_supplier_order_order_supplier`(`don_hang_id`, `nha_cung_cap_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item` (
    `id` CHAR(36) NOT NULL,
    `don_hang_nha_cung_cap_id` CHAR(36) NOT NULL,
    `san_pham_id` CHAR(36) NOT NULL,
    `bien_the_san_pham_id` CHAR(36) NOT NULL,
    `trang_trai_id` CHAR(36) NOT NULL,
    `so_luong` INTEGER UNSIGNED NOT NULL,
    `don_gia_snapshot` DECIMAL(15, 2) NOT NULL,
    `ten_san_pham_snapshot` VARCHAR(200) NOT NULL,
    `sku_bien_the_snapshot` VARCHAR(100) NOT NULL,
    `khoi_luong_bien_the_snapshot` DECIMAL(12, 3) NOT NULL,
    `don_vi_bien_the_snapshot` VARCHAR(30) NOT NULL,
    `ma_trang_trai_snapshot` VARCHAR(50) NOT NULL,
    `ten_trang_trai_snapshot` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_order_item_product`(`san_pham_id`),
    INDEX `idx_order_item_variant`(`bien_the_san_pham_id`),
    INDEX `idx_order_item_farm`(`trang_trai_id`),
    UNIQUE INDEX `uk_order_item_supplier_order_variant`(`don_hang_nha_cung_cap_id`, `bien_the_san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_allocation` (
    `id` CHAR(36) NOT NULL,
    `muc_don_hang_id` CHAR(36) NOT NULL,
    `ton_kho_lo_id` CHAR(36) NOT NULL,
    `so_luong` DECIMAL(14, 3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_order_allocation_inventory_lot`(`ton_kho_lo_id`),
    UNIQUE INDEX `uk_order_allocation_item_lot`(`muc_don_hang_id`, `ton_kho_lo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `fk_order_customer` FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_order` ADD CONSTRAINT `fk_supplier_order_order` FOREIGN KEY (`don_hang_id`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_order` ADD CONSTRAINT `fk_supplier_order_supplier` FOREIGN KEY (`nha_cung_cap_id`) REFERENCES `nha_cung_cap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_supplier_order` FOREIGN KEY (`don_hang_nha_cung_cap_id`) REFERENCES `supplier_order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_product` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_variant` FOREIGN KEY (`bien_the_san_pham_id`) REFERENCES `bien_the_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `fk_order_item_farm` FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_allocation` ADD CONSTRAINT `fk_order_allocation_order_item` FOREIGN KEY (`muc_don_hang_id`) REFERENCES `order_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_allocation` ADD CONSTRAINT `fk_order_allocation_inventory_lot` FOREIGN KEY (`ton_kho_lo_id`) REFERENCES `inventory_lot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `order`
  ADD CONSTRAINT `chk_order_total_nonnegative` CHECK (`tong_tien` >= 0);

ALTER TABLE `supplier_order`
  ADD CONSTRAINT `chk_supplier_order_subtotal_nonnegative` CHECK (`tam_tinh` >= 0);

ALTER TABLE `order_item`
  ADD CONSTRAINT `chk_order_item_quantity_positive` CHECK (`so_luong` > 0);

ALTER TABLE `order_item`
  ADD CONSTRAINT `chk_order_item_unit_price_nonnegative` CHECK (`don_gia_snapshot` >= 0);

ALTER TABLE `order_allocation`
  ADD CONSTRAINT `chk_order_allocation_quantity_positive` CHECK (`so_luong` > 0);
