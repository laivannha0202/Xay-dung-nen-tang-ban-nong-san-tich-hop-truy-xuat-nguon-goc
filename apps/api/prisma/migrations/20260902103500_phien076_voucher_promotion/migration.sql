-- CreateTable
CREATE TABLE `khuyen_mai` (
    `id` CHAR(36) NOT NULL,
    `ma` VARCHAR(80) NOT NULL,
    `ten` VARCHAR(180) NOT NULL,
    `mo_ta` VARCHAR(500) NULL,
    `pham_vi` ENUM('PLATFORM', 'DANH_MUC', 'SAN_PHAM') NOT NULL,
    `danh_muc_san_pham_id` CHAR(36) NULL,
    `san_pham_id` CHAR(36) NULL,
    `don_hang_toi_thieu` DECIMAL(18, 2) NOT NULL DEFAULT 0,
    `bat_dau_luc` DATETIME(3) NOT NULL,
    `ket_thuc_luc` DATETIME(3) NOT NULL,
    `gioi_han_su_dung` INTEGER NULL,
    `so_lan_da_su_dung` INTEGER NOT NULL DEFAULT 0,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_khuyen_mai_ma`(`ma`),
    INDEX `idx_khuyen_mai_scope_time`(`pham_vi`, `trang_thai`, `bat_dau_luc`, `ket_thuc_luc`),
    INDEX `idx_khuyen_mai_danh_muc`(`danh_muc_san_pham_id`),
    INDEX `idx_khuyen_mai_san_pham`(`san_pham_id`),
    CONSTRAINT `chk_khuyen_mai_min_order_non_negative` CHECK (`don_hang_toi_thieu` >= 0),
    CONSTRAINT `chk_khuyen_mai_date_window` CHECK (`ket_thuc_luc` > `bat_dau_luc`),
    CONSTRAINT `chk_khuyen_mai_usage_limit_positive` CHECK (`gioi_han_su_dung` IS NULL OR `gioi_han_su_dung` > 0),
    CONSTRAINT `chk_khuyen_mai_usage_count_non_negative` CHECK (`so_lan_da_su_dung` >= 0),
    CONSTRAINT `chk_khuyen_mai_usage_within_limit` CHECK (`gioi_han_su_dung` IS NULL OR `so_lan_da_su_dung` <= `gioi_han_su_dung`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `khuyen_mai`
  ADD CONSTRAINT `fk_khuyen_mai_danh_muc`
  FOREIGN KEY (`danh_muc_san_pham_id`) REFERENCES `danh_muc_san_pham`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `khuyen_mai`
  ADD CONSTRAINT `fk_khuyen_mai_san_pham`
  FOREIGN KEY (`san_pham_id`) REFERENCES `san_pham`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
