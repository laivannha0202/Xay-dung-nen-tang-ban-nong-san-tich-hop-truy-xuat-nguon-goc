-- CreateTable
CREATE TABLE `san_pham_yeu_thich` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `san_pham_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_san_pham_yeu_thich_khach_hang_san_pham`(`khach_hang_id`, `san_pham_id`),
    INDEX `idx_san_pham_yeu_thich_san_pham_created_at`(`san_pham_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `san_pham_yeu_thich`
  ADD CONSTRAINT `fk_san_pham_yeu_thich_khach_hang`
  FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `san_pham_yeu_thich`
  ADD CONSTRAINT `fk_san_pham_yeu_thich_san_pham`
  FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
