-- CreateTable
CREATE TABLE `su_kien_truy_xuat` (
    `id` CHAR(36) NOT NULL,
    `lo_san_pham_id` CHAR(36) NOT NULL,
    `loai` ENUM('CANH_TAC', 'THU_HOACH', 'KIEM_DINH', 'DONG_GOI', 'NHAP_KHO', 'XUAT_KHO', 'GIAO_HANG') NOT NULL,
    `thoi_gian` DATETIME(3) NOT NULL,
    `dia_diem` VARCHAR(255) NOT NULL,
    `metadata` JSON NULL,
    `cong_khai` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_su_kien_truy_xuat_lo_thoi_gian`(`lo_san_pham_id`, `thoi_gian`),
    INDEX `idx_su_kien_truy_xuat_loai_thoi_gian`(`loai`, `thoi_gian`),
    INDEX `idx_su_kien_truy_xuat_cong_khai_thoi_gian`(`cong_khai`, `thoi_gian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `su_kien_truy_xuat` ADD CONSTRAINT `fk_su_kien_truy_xuat_lo` FOREIGN KEY (`lo_san_pham_id`) REFERENCES `lo_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-026 – Permission Sự kiện truy xuất.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a0538e-ad22-7e89-ba07-f9550dcd95c0', 'su_kien_truy_xuat.xem', 'Xem sự kiện truy xuất', 'Xem ledger sự kiện truy xuất của Lô sản phẩm', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a0538e-ad22-70dd-8eb0-fb001b3525f8', 'su_kien_truy_xuat.tao', 'Tạo sự kiện truy xuất', 'Ghi sự kiện mới vào ledger truy xuất của Lô sản phẩm', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a0538e-ad22-71cb-8748-d5116f01a1d4',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'su_kien_truy_xuat.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a0538e-ad22-7dfa-bceb-2d9237ccb8c1',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'su_kien_truy_xuat.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a0538e-ad22-71f5-90cd-863a599b9202',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'su_kien_truy_xuat.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a0538e-ad22-7e12-8060-0497bffd5643',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'su_kien_truy_xuat.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
