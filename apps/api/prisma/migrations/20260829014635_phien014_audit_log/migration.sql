-- CreateTable
CREATE TABLE `nhat_ky_kiem_toan` (
    `id` CHAR(36) NOT NULL,
    `tac_nhan_id` CHAR(36) NULL,
    `tac_nhan` VARCHAR(191) NOT NULL,
    `hanh_dong` VARCHAR(100) NOT NULL,
    `thuc_the` VARCHAR(100) NOT NULL,
    `thuc_the_id` VARCHAR(64) NULL,
    `truoc` JSON NULL,
    `sau` JSON NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_audit_tac_nhan_thoi_gian`(`tac_nhan_id`, `created_at`),
    INDEX `idx_audit_hanh_dong_thoi_gian`(`hanh_dong`, `created_at`),
    INDEX `idx_audit_thuc_the_thoi_gian`(`thuc_the`, `thuc_the_id`, `created_at`),
    INDEX `idx_audit_thoi_gian`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- PHIEN-014: permission đọc Audit Log chỉ dành cho ADMIN.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04b32-7ffe-7d18-8a25-7acfccb8cb7e', 'audit.xem', 'Xem nhật ký kiểm toán',
   'Xem các thay đổi nhạy cảm trong hệ thống', 'HOAT_DONG',
   CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`), `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04b32-7ffe-72e8-9095-d976073877ee', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'audit.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);
