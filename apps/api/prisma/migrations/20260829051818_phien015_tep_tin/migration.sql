-- CreateTable
CREATE TABLE `tep_tin` (
    `id` CHAR(36) NOT NULL,
    `bucket` VARCHAR(63) NOT NULL,
    `object_key` VARCHAR(512) NOT NULL,
    `ten_goc` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `kich_thuoc` BIGINT UNSIGNED NOT NULL,
    `sha256` CHAR(64) NOT NULL,
    `nguoi_tai_len_id` CHAR(36) NOT NULL,
    `nguoi_tai_len` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `xoa_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_tep_tin_object_key`(`object_key`),
    INDEX `idx_tep_tin_nguoi_tai_len`(`nguoi_tai_len_id`, `created_at`),
    INDEX `idx_tep_tin_sha256`(`sha256`),
    INDEX `idx_tep_tin_trang_thai`(`trang_thai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- PHIEN-015: backfill lịch sử migration để fresh install luôn có
-- ADMIN -> audit.xem, bất kể PHIEN-014 từng chạy trước seed RBAC.
INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  UUID(),
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'audit.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
