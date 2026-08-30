-- CreateTable
CREATE TABLE `kiem_dinh_chat_luong` (
    `id` CHAR(36) NOT NULL,
    `lo_san_pham_id` CHAR(36) NOT NULL,
    `ngay_kiem_dinh` DATE NOT NULL,
    `nguoi_kiem_dinh_id` CHAR(36) NOT NULL,
    `ket_qua` ENUM('PASSED', 'FAILED', 'HOLD', 'RECALLED') NOT NULL,
    `phan_hang` VARCHAR(100) NULL,
    `ghi_chu` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_kiem_dinh_chat_luong_lo_ngay`(`lo_san_pham_id`, `ngay_kiem_dinh`),
    INDEX `idx_kiem_dinh_chat_luong_ket_qua_ngay`(`ket_qua`, `ngay_kiem_dinh`),
    INDEX `idx_kiem_dinh_chat_luong_nguoi_ngay`(`nguoi_kiem_dinh_id`, `ngay_kiem_dinh`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kiem_dinh_chat_luong_anh` (
    `id` CHAR(36) NOT NULL,
    `kiem_dinh_chat_luong_id` CHAR(36) NOT NULL,
    `tep_tin_id` CHAR(36) NOT NULL,
    `thu_tu` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_kiem_dinh_chat_luong_anh_tep_tin`(`tep_tin_id`),
    INDEX `idx_kiem_dinh_chat_luong_anh_thu_tu`(`kiem_dinh_chat_luong_id`, `thu_tu`),
    UNIQUE INDEX `uk_kiem_dinh_chat_luong_anh`(`kiem_dinh_chat_luong_id`, `tep_tin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `kiem_dinh_chat_luong` ADD CONSTRAINT `fk_kiem_dinh_chat_luong_lo` FOREIGN KEY (`lo_san_pham_id`) REFERENCES `lo_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kiem_dinh_chat_luong` ADD CONSTRAINT `fk_kiem_dinh_chat_luong_nguoi_dung` FOREIGN KEY (`nguoi_kiem_dinh_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kiem_dinh_chat_luong_anh` ADD CONSTRAINT `fk_kiem_dinh_anh_kiem_dinh` FOREIGN KEY (`kiem_dinh_chat_luong_id`) REFERENCES `kiem_dinh_chat_luong`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kiem_dinh_chat_luong_anh` ADD CONSTRAINT `fk_kiem_dinh_anh_tep_tin` FOREIGN KEY (`tep_tin_id`) REFERENCES `tep_tin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-024 – Permission Kiểm định chất lượng.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a05028-ab32-7969-9263-9f8315e32551', 'kiem_dinh_chat_luong.xem', 'Xem kiểm định chất lượng', 'Xem danh sách và chi tiết kết quả kiểm định Lô', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a05028-ab32-7622-b0d2-dee2f4fdb633', 'kiem_dinh_chat_luong.tao', 'Tạo kiểm định chất lượng', 'Ghi nhận kết quả kiểm định và cập nhật trạng thái Lô', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05028-ab32-72bf-8eee-4b82140f1a70',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'kiem_dinh_chat_luong.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05028-ab32-7734-a648-f98f9afad4c8',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'kiem_dinh_chat_luong.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05028-ab32-7304-9098-7827a42eed51',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'kiem_dinh_chat_luong.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05028-ab32-73b6-a168-68eb889db9f8',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'kiem_dinh_chat_luong.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
