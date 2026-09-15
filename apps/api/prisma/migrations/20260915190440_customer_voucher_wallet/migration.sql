-- Customer voucher wallet
CREATE TABLE `khach_hang_khuyen_mai` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `khuyen_mai_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_khach_hang_khuyen_mai`(`khach_hang_id`, `khuyen_mai_id`),
    INDEX `idx_khach_hang_khuyen_mai_khuyen_mai`(`khuyen_mai_id`),
    INDEX `idx_khach_hang_khuyen_mai_khach_hang_created_at`(`khach_hang_id`, `created_at`),
    PRIMARY KEY (`id`),

    CONSTRAINT `fk_khach_hang_khuyen_mai_khach_hang`
      FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT `fk_khach_hang_khuyen_mai_khuyen_mai`
      FOREIGN KEY (`khuyen_mai_id`) REFERENCES `khuyen_mai`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
