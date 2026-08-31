-- CreateTable
CREATE TABLE `san_pham_anh` (
    `id` CHAR(36) NOT NULL,
    `san_pham_id` CHAR(36) NOT NULL,
    `tep_tin_id` CHAR(36) NOT NULL,
    `la_anh_bia` BOOLEAN NOT NULL DEFAULT false,
    `thu_tu` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_san_pham_anh_tep_tin`(`tep_tin_id`),
    INDEX `idx_san_pham_anh_hien_thi`(`san_pham_id`, `la_anh_bia`, `thu_tu`),
    UNIQUE INDEX `uk_san_pham_anh`(`san_pham_id`, `tep_tin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `san_pham_anh` ADD CONSTRAINT `fk_san_pham_anh_san_pham` FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `san_pham_anh` ADD CONSTRAINT `fk_san_pham_anh_tep_tin` FOREIGN KEY (`tep_tin_id`) REFERENCES `tep_tin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
