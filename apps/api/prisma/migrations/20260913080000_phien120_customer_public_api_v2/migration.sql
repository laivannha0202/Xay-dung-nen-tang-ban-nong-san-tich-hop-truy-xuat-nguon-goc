-- PHIEN-120 Customer public API v2.
-- Backward-safe: chi ADD COLUMN nullable/default, CREATE TABLE moi, CREATE INDEX moi.
-- Khong doi ten/drop cot/bang hien tai.

ALTER TABLE `trang_trai`
  ADD COLUMN `noi_bat_trang_chu` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `thu_tu_noi_bat` INTEGER NULL;

CREATE INDEX `idx_trang_trai_noi_bat`
  ON `trang_trai`(`trang_thai`, `noi_bat_trang_chu`, `thu_tu_noi_bat`);

ALTER TABLE `san_pham`
  ADD COLUMN `noi_bat` BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN `thu_tu_noi_bat` INTEGER NULL;

CREATE INDEX `idx_san_pham_noi_bat`
  ON `san_pham`(`trang_thai`, `noi_bat`, `thu_tu_noi_bat`);

-- Noi dung trang chu (banner / kien thuc / cau chuyen trang trai).
CREATE TABLE `noi_dung_trang_chu` (
    `id` CHAR(36) NOT NULL,
    `loai` ENUM('BANNER', 'KIEN_THUC', 'CAU_CHUYEN_TRANG_TRAI') NOT NULL,
    `tieu_de` VARCHAR(200) NOT NULL,
    `nhan` VARCHAR(100) NULL,
    `mo_ta` VARCHAR(1000) NULL,
    `anh_url` VARCHAR(1000) NULL,
    `duong_dan` VARCHAR(1000) NULL,
    `vi_tri` VARCHAR(50) NULL,
    `thu_tu` INTEGER NOT NULL DEFAULT 0,
    `hien_thi` BOOLEAN NOT NULL DEFAULT TRUE,
    `bat_dau_luc` DATETIME(3) NULL,
    `ket_thuc_luc` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_ndtc_loai_hien_thi_thu_tu`(`loai`, `hien_thi`, `thu_tu`),
    INDEX `idx_ndtc_hien_thi_lich`(`hien_thi`, `bat_dau_luc`, `ket_thuc_luc`),
    CONSTRAINT `chk_ndtc_thu_tu_non_negative` CHECK (`thu_tu` >= 0),
    CONSTRAINT `chk_ndtc_lich_hop_le` CHECK (`bat_dau_luc` IS NULL OR `ket_thuc_luc` IS NULL OR `bat_dau_luc` <= `ket_thuc_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Flash sale that (chien dich + muc theo bien the, gia tinh server-side).
CREATE TABLE `chien_dich_flash_sale` (
    `id` CHAR(36) NOT NULL,
    `ten` VARCHAR(180) NOT NULL,
    `mo_ta` VARCHAR(500) NULL,
    `bat_dau_luc` DATETIME(3) NOT NULL,
    `ket_thuc_luc` DATETIME(3) NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_flash_sale_trang_thai_lich`(`trang_thai`, `bat_dau_luc`, `ket_thuc_luc`),
    CONSTRAINT `chk_flash_sale_lich_hop_le` CHECK (`ket_thuc_luc` > `bat_dau_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `muc_flash_sale` (
    `id` CHAR(36) NOT NULL,
    `chien_dich_id` CHAR(36) NOT NULL,
    `bien_the_san_pham_id` CHAR(36) NOT NULL,
    `gia_flash` DECIMAL(15, 2) NOT NULL,
    `gioi_han_tong` INTEGER NULL,
    `gioi_han_moi_khach` INTEGER NULL,
    `so_luong_da_ban` INTEGER NOT NULL DEFAULT 0,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_flash_sale_item_chien_dich_bien_the`(`chien_dich_id`, `bien_the_san_pham_id`),
    INDEX `idx_flash_sale_item_bien_the`(`bien_the_san_pham_id`),
    INDEX `idx_flash_sale_item_chien_dich_trang_thai`(`chien_dich_id`, `trang_thai`),
    CONSTRAINT `chk_flash_sale_item_gia_duong` CHECK (`gia_flash` > 0),
    CONSTRAINT `chk_flash_sale_item_gioi_han_tong_duong` CHECK (`gioi_han_tong` IS NULL OR `gioi_han_tong` > 0),
    CONSTRAINT `chk_flash_sale_item_gioi_han_khach_duong` CHECK (`gioi_han_moi_khach` IS NULL OR `gioi_han_moi_khach` > 0),
    CONSTRAINT `chk_flash_sale_item_da_ban_non_negative` CHECK (`so_luong_da_ban` >= 0),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `muc_flash_sale`
  ADD CONSTRAINT `fk_flash_sale_item_chien_dich`
  FOREIGN KEY (`chien_dich_id`) REFERENCES `chien_dich_flash_sale`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `muc_flash_sale`
  ADD CONSTRAINT `fk_flash_sale_item_bien_the`
  FOREIGN KEY (`bien_the_san_pham_id`) REFERENCES `bien_the_san_pham`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- RBAC cho quan tri noi dung trang chu (theo mau v8b khuyen_mai).
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01993d51-7a04-7c01-8c01-000000000001', 'noi_dung_trang_chu.xem', 'Xem noi dung trang chu', 'Xem danh sach va chi tiet noi dung trang chu', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a04-7c01-8c01-000000000002', 'noi_dung_trang_chu.tao', 'Tao noi dung trang chu', 'Tao noi dung trang chu (banner/kien thuc/cau chuyen)', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a04-7c01-8c01-000000000003', 'noi_dung_trang_chu.sua', 'Sua noi dung trang chu', 'Sua noi dung trang chu', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a04-7c01-8c01-000000000004', 'noi_dung_trang_chu.khoa', 'An/hien noi dung trang chu', 'An, hien hoac xoa noi dung trang chu', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a05-7c01-8c01-000000000001', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a05-7c01-8c01-000000000002', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a05-7c01-8c01-000000000003', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a06-7c01-8c01-000000000001', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a06-7c01-8c01-000000000002', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a06-7c01-8c01-000000000003', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a06-7c01-8c01-000000000004', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'noi_dung_trang_chu.khoa'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);
