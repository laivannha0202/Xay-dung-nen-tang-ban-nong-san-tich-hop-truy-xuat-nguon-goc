-- CreateTable
CREATE TABLE `nha_cung_cap` (
    `id` CHAR(36) NOT NULL,
    `ma` VARCHAR(50) NOT NULL,
    `ten` VARCHAR(200) NOT NULL,
    `nguoi_dai_dien` VARCHAR(150) NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `email` VARCHAR(191) NULL,
    `dia_chi` VARCHAR(500) NULL,
    `ghi_chu` TEXT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_nha_cung_cap_ma`(`ma`),
    INDEX `idx_nha_cung_cap_ten`(`ten`),
    INDEX `idx_nha_cung_cap_trang_thai`(`trang_thai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- PHIEN-017 – Permission Nhà cung cấp.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04c5f-fdfd-780d-b825-bc4cdd910188', 'nha_cung_cap.xem', 'Xem nhà cung cấp', 'Xem danh sách và chi tiết nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04c5f-fdfd-75e5-a0cb-c9a1eb49c7b2', 'nha_cung_cap.tao', 'Tạo nhà cung cấp', 'Tạo mới nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04c5f-fdfd-7913-af2f-d5577ae536b4', 'nha_cung_cap.sua', 'Sửa nhà cung cấp', 'Cập nhật thông tin nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04c5f-fdfd-7eb3-926b-b024f604d0f1', 'nha_cung_cap.khoa', 'Khóa nhà cung cấp', 'Khóa hoặc mở hoạt động nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfd-7cff-8b8b-af6ef1a854f9',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-76c9-9bd0-d43e4bc5a3ae',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-7fc8-a2a0-4d24f83feefe',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-7e34-b0c4-d306069083de',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-7d0f-9884-41313b7ae33c',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-7d85-b820-5937fb8f02cb',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c5f-fdfe-7e49-9c40-76dddd619ce4',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nha_cung_cap.khoa'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
