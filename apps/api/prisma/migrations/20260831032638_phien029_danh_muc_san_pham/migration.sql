-- CreateTable
CREATE TABLE `danh_muc_san_pham` (
    `id` CHAR(36) NOT NULL,
    `ten` VARCHAR(150) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `danh_muc_cha_id` CHAR(36) NULL,
    `anh_id` CHAR(36) NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_danh_muc_san_pham_slug`(`slug`),
    INDEX `idx_danh_muc_san_pham_cha_trang_thai`(`danh_muc_cha_id`, `trang_thai`),
    INDEX `idx_danh_muc_san_pham_trang_thai_ten`(`trang_thai`, `ten`),
    INDEX `idx_danh_muc_san_pham_anh`(`anh_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `danh_muc_san_pham` ADD CONSTRAINT `fk_danh_muc_san_pham_cha` FOREIGN KEY (`danh_muc_cha_id`) REFERENCES `danh_muc_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_muc_san_pham` ADD CONSTRAINT `fk_danh_muc_san_pham_anh` FOREIGN KEY (`anh_id`) REFERENCES `tep_tin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


-- PHIEN-029 – RBAC Danh mục sản phẩm.

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a055da-cf53-77e2-b83b-f9ad3fb55ce5',
   'danh_muc_san_pham.xem',
   'Xem danh mục sản phẩm',
   'Xem danh sách và chi tiết danh mục sản phẩm',
   'HOAT_DONG',
   CURRENT_TIMESTAMP(3),
   CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a055da-cf53-7f1f-aa82-b900237a9ceb',
   'danh_muc_san_pham.tao',
   'Tạo danh mục sản phẩm',
   'Tạo danh mục sản phẩm',
   'HOAT_DONG',
   CURRENT_TIMESTAMP(3),
   CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a055da-cf53-7227-a7a4-e95e62808431',
   'danh_muc_san_pham.sua',
   'Sửa danh mục sản phẩm',
   'Sửa tên, slug, parent và ảnh danh mục sản phẩm',
   'HOAT_DONG',
   CURRENT_TIMESTAMP(3),
   CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a055da-cf53-74f2-b0d2-6262fbbfd6a9',
   'danh_muc_san_pham.khoa',
   'Khóa danh mục sản phẩm',
   'Đổi trạng thái hoạt động của danh mục sản phẩm',
   'HOAT_DONG',
   CURRENT_TIMESTAMP(3),
   CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-75e8-8388-7c0bef57738c',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-7b1c-898e-f0ecc2e13c18',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-77b6-a5bd-917cc546124e',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-7724-8c11-ae66d740ea5a',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-73f4-a6ab-3894d4eb7131',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-7fda-9321-dea27c2f140d',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a055da-cf53-7428-8a5a-fb0898f076b9',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'danh_muc_san_pham.khoa'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
