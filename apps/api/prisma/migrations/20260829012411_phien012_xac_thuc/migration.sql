-- CreateTable
CREATE TABLE `phien_dang_nhap` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `refresh_token_hash` VARCHAR(255) NOT NULL,
    `het_han_luc` DATETIME(3) NOT NULL,
    `thu_hoi_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_phien_dang_nhap_nguoi_dung`(`nguoi_dung_id`, `thu_hoi_luc`),
    INDEX `idx_phien_dang_nhap_het_han`(`het_han_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `yeu_cau_dat_lai_mat_khau` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `het_han_luc` DATETIME(3) NOT NULL,
    `da_dung_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_dat_lai_mat_khau_nguoi_dung`(`nguoi_dung_id`, `da_dung_luc`),
    INDEX `idx_dat_lai_mat_khau_het_han`(`het_han_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `phien_dang_nhap` ADD CONSTRAINT `fk_phien_dang_nhap_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `yeu_cau_dat_lai_mat_khau` ADD CONSTRAINT `fk_yeu_cau_dat_lai_mat_khau_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
