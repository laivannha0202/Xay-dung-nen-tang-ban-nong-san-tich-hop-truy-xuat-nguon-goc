-- AgriMarket Voucher Wallet V2
-- Lưu/nhận voucher theo khách, dùng một lần, có thể khôi phục khi hủy/refund toàn bộ.

CREATE TABLE `voucher_khach_hang` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `khuyen_mai_id` CHAR(36) NOT NULL,
    `ma_don_hang_su_dung` VARCHAR(50) NULL,
    `da_su_dung_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_voucher_khach_hang_khach_km`(`khach_hang_id`, `khuyen_mai_id`),
    INDEX `idx_voucher_khach_hang_trang_thai`(`khach_hang_id`, `da_su_dung_luc`, `created_at`),
    INDEX `idx_voucher_khach_hang_khuyen_mai`(`khuyen_mai_id`, `da_su_dung_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `voucher_khach_hang`
    ADD CONSTRAINT `fk_voucher_khach_hang_khach_hang`
    FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `voucher_khach_hang`
    ADD CONSTRAINT `fk_voucher_khach_hang_khuyen_mai`
    FOREIGN KEY (`khuyen_mai_id`) REFERENCES `khuyen_mai`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
