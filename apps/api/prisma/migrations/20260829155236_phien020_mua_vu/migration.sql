-- CreateTable
CREATE TABLE `mua_vu` (
    `id` CHAR(36) NOT NULL,
    `trang_trai_id` CHAR(36) NOT NULL,
    `cay_trong` VARCHAR(150) NOT NULL,
    `giong` VARCHAR(150) NOT NULL,
    `ngay_trong` DATE NOT NULL,
    `ngay_du_kien_thu_hoach` DATE NOT NULL,
    `san_luong_du_kien_kg` DECIMAL(14, 3) NOT NULL,
    `trang_thai` ENUM('KE_HOACH', 'DANG_CANH_TAC', 'CHO_THU_HOACH', 'DA_KET_THUC', 'HUY') NOT NULL DEFAULT 'KE_HOACH',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_mua_vu_trang_trai_trang_thai`(`trang_trai_id`, `trang_thai`),
    INDEX `idx_mua_vu_cay_trong_giong`(`cay_trong`, `giong`),
    INDEX `idx_mua_vu_trang_thai_thu_hoach`(`trang_thai`, `ngay_du_kien_thu_hoach`),
    INDEX `idx_mua_vu_ngay_trong`(`ngay_trong`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mua_vu` ADD CONSTRAINT `fk_mua_vu_trang_trai` FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-020 – Permission Mùa vụ.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04e39-0d62-73fb-9b7b-62d05919fdd8', 'mua_vu.xem', 'Xem mùa vụ', 'Xem danh sách và chi tiết mùa vụ', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e39-0d62-7f2c-ac25-ae75acf03aea', 'mua_vu.tao', 'Tạo mùa vụ', 'Tạo mới kế hoạch mùa vụ', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e39-0d62-70b8-9230-79802da257e7', 'mua_vu.sua', 'Sửa mùa vụ', 'Cập nhật kế hoạch và trạng thái mùa vụ', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7408-b463-25d419cb75fc',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7865-9b85-5c42cd3091c4',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7fa3-803e-d036e0f82e8c',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7808-b6b7-079305e04bd3',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7305-9779-25b4a8fd2161',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e39-0d62-7bf0-8123-37b00c91b6b5',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'mua_vu.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
