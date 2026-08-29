-- CreateTable
CREATE TABLE `chung_nhan` (
    `id` CHAR(36) NOT NULL,
    `trang_trai_id` CHAR(36) NOT NULL,
    `loai` VARCHAR(100) NOT NULL,
    `ma` VARCHAR(100) NOT NULL,
    `don_vi_cap` VARCHAR(200) NOT NULL,
    `ngay_cap` DATE NOT NULL,
    `ngay_het_han` DATE NOT NULL,
    `tep_tin_id` CHAR(36) NOT NULL,
    `trang_thai_xac_minh` ENUM('CHO_XAC_MINH', 'DA_XAC_MINH', 'TU_CHOI') NOT NULL DEFAULT 'CHO_XAC_MINH',
    `ly_do_tu_choi` VARCHAR(500) NULL,
    `xac_minh_luc` DATETIME(3) NULL,
    `canh_bao_30_ngay_luc` DATETIME(3) NULL,
    `canh_bao_7_ngay_luc` DATETIME(3) NULL,
    `canh_bao_het_han_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_chung_nhan_ma`(`ma`),
    INDEX `idx_chung_nhan_trang_trai`(`trang_trai_id`, `trang_thai_xac_minh`),
    INDEX `idx_chung_nhan_xac_minh_het_han`(`trang_thai_xac_minh`, `ngay_het_han`),
    INDEX `idx_chung_nhan_ngay_het_han`(`ngay_het_han`),
    INDEX `idx_chung_nhan_tep_tin`(`tep_tin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chung_nhan` ADD CONSTRAINT `fk_chung_nhan_trang_trai` FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chung_nhan` ADD CONSTRAINT `fk_chung_nhan_tep_tin` FOREIGN KEY (`tep_tin_id`) REFERENCES `tep_tin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-019 – Permission Chứng nhận.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04e27-d909-7cd6-bfd6-08b726aa751b', 'chung_nhan.xem', 'Xem chứng nhận', 'Xem danh sách và chi tiết chứng nhận', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e27-d909-786a-9e2b-7cb04919a8fa', 'chung_nhan.tao', 'Tạo chứng nhận', 'Tạo mới chứng nhận cho trang trại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e27-d909-74fe-becb-c63d2e876f09', 'chung_nhan.sua', 'Sửa chứng nhận', 'Cập nhật thông tin chứng nhận', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e27-d909-70ac-a831-c54757562082', 'chung_nhan.xac_minh', 'Xác minh chứng nhận', 'Xác minh hoặc từ chối chứng nhận', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-75f8-a0af-8352a3a7f14a',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-7f5a-b6bd-d42f0c8cde75',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-7a33-8c64-937cb117b4ba',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-7c98-ada9-0d79a061b11e',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-72ea-a5b3-dcc6ed4a3561',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-774f-9390-446acb9b997a',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e27-d909-709c-9436-9e455730bfe0',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'chung_nhan.xac_minh'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
