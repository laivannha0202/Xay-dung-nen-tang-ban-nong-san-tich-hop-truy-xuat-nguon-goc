-- CreateTable
CREATE TABLE `bien_the_san_pham` (
    `id` CHAR(36) NOT NULL,
    `san_pham_id` CHAR(36) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `khoi_luong` DECIMAL(12, 3) NOT NULL,
    `gia` DECIMAL(15, 2) NOT NULL,
    `don_vi` VARCHAR(30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_bien_the_san_pham_sku`(`sku`),
    INDEX `idx_bien_the_san_pham_san_pham_gia`(`san_pham_id`, `gia`),
    UNIQUE INDEX `uk_bien_the_san_pham_quy_cach`(`san_pham_id`, `khoi_luong`, `don_vi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bien_the_san_pham` ADD CONSTRAINT `fk_bien_the_san_pham_san_pham` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
