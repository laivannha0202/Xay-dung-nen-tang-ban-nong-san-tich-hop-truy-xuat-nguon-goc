-- CreateTable
CREATE TABLE `trang_trai` (
    `id` CHAR(36) NOT NULL,
    `ma` VARCHAR(50) NOT NULL,
    `ten` VARCHAR(200) NOT NULL,
    `dia_chi` VARCHAR(500) NOT NULL,
    `vi_do` DECIMAL(9, 6) NULL,
    `kinh_do` DECIMAL(9, 6) NULL,
    `dien_tich_ha` DECIMAL(12, 2) NULL,
    `nha_cung_cap_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_trang_trai_ma`(`ma`),
    INDEX `idx_trang_trai_ten`(`ten`),
    INDEX `idx_trang_trai_nha_cung_cap`(`nha_cung_cap_id`, `trang_thai`),
    INDEX `idx_trang_trai_trang_thai`(`trang_thai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trang_trai_anh` (
    `id` CHAR(36) NOT NULL,
    `trang_trai_id` CHAR(36) NOT NULL,
    `tep_tin_id` CHAR(36) NOT NULL,
    `thu_tu` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_trang_trai_anh_tep_tin`(`tep_tin_id`),
    INDEX `idx_trang_trai_anh_thu_tu`(`trang_trai_id`, `thu_tu`),
    UNIQUE INDEX `uk_trang_trai_anh`(`trang_trai_id`, `tep_tin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trang_trai` ADD CONSTRAINT `fk_trang_trai_nha_cung_cap` FOREIGN KEY (`nha_cung_cap_id`) REFERENCES `nha_cung_cap`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trang_trai_anh` ADD CONSTRAINT `fk_trang_trai_anh_trang_trai` FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trang_trai_anh` ADD CONSTRAINT `fk_trang_trai_anh_tep_tin` FOREIGN KEY (`tep_tin_id`) REFERENCES `tep_tin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-018 – Permission Trang trại.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04e0f-f871-7b7e-b17b-c4ac06e0bf32', 'trang_trai.xem', 'Xem trang trại', 'Xem danh sách và chi tiết trang trại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e0f-f871-7034-97c1-5019db2fc448', 'trang_trai.tao', 'Tạo trang trại', 'Tạo mới trang trại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e0f-f871-7023-b7ca-139f46ef80bb', 'trang_trai.sua', 'Sửa trang trại', 'Cập nhật thông tin và ảnh trang trại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e0f-f871-7884-8913-b4ea9d046081', 'trang_trai.khoa', 'Khóa trang trại', 'Khóa hoặc mở hoạt động trang trại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7ddc-9f88-9672f2015823',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7f2e-8098-8b83b5acffef',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-709f-93b6-b59ce0b72743',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7255-81ad-4cd007c1d455',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7975-94c7-b0f7bedcd0b2',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-74f2-a8ab-72be028c7bf9',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7bd4-a4f2-3b61f1f83e88',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'trang_trai.khoa'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


-- PHIEN-018 compatibility repair:
-- PHIEN-017 migration có timestamp trước PHIEN-013 seed RBAC nên fresh DB
-- chưa thể tạo mapping quyền Nhà cung cấp. Backfill idempotent tại đây.

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e0f-f871-7201-9aa0-d01167104ca1',
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
  '01a04e0f-f871-7b54-a94f-21e5b6bb3096',
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
  '01a04e0f-f871-757b-a24c-08ac5da12825',
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
  '01a04e0f-f871-70dc-80b6-5ac52ae9d9a9',
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
  '01a04e0f-f871-710d-a869-5d85e9ff3af1',
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
  '01a04e0f-f871-7a23-a4af-ecb8c46c0b7f',
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
  '01a04e0f-f871-78ca-a1bf-b8dfeff26366',
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
