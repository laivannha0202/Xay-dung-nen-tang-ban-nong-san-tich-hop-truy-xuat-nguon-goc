-- CreateTable
CREATE TABLE `nhat_ky_canh_tac` (
    `id` CHAR(36) NOT NULL,
    `mua_vu_id` CHAR(36) NOT NULL,
    `loai_su_kien` ENUM('TUOI', 'BON_PHAN', 'SAU_BENH', 'KIEM_TRA', 'THOI_TIET', 'KHAC') NOT NULL,
    `thoi_gian` DATETIME(3) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `hien_thi_cong_khai` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_nhat_ky_canh_tac_mua_vu_thoi_gian`(`mua_vu_id`, `thoi_gian`),
    INDEX `idx_nhat_ky_canh_tac_loai_thoi_gian`(`loai_su_kien`, `thoi_gian`),
    INDEX `idx_nhat_ky_canh_tac_cong_khai_thoi_gian`(`hien_thi_cong_khai`, `thoi_gian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `nhat_ky_canh_tac` ADD CONSTRAINT `fk_nhat_ky_canh_tac_mua_vu` FOREIGN KEY (`mua_vu_id`) REFERENCES `mua_vu`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-021 – Permission Nhật ký canh tác.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a04e5d-5276-750b-a098-2153ab5a36c0', 'nhat_ky_canh_tac.xem', 'Xem nhật ký canh tác', 'Xem danh sách và chi tiết nhật ký canh tác', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e5d-5276-7c3c-aa34-3de17116b994', 'nhat_ky_canh_tac.tao', 'Tạo nhật ký canh tác', 'Ghi mới sự kiện canh tác cho mùa vụ', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a04e5d-5276-7a6a-9602-3028c5294514', 'nhat_ky_canh_tac.sua', 'Sửa nhật ký canh tác', 'Cập nhật nội dung và cờ công khai nhật ký canh tác', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-787c-bb90-bfa735a28e8c',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-72a2-be38-7bb2c68a27a3',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-7c78-a389-a4c1fd937713',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-758f-8337-105ec853c4e4',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-78ee-b38c-48f965eb4196',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04e5d-5276-71f9-9991-16993ef5eb74',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q ON q.`ma` = 'nhat_ky_canh_tac.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
