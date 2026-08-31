-- CreateTable
CREATE TABLE `thu_hoi_lo_san_pham` (
    `id` CHAR(36) NOT NULL,
    `lo_san_pham_id` CHAR(36) NOT NULL,
    `ly_do` TEXT NOT NULL,
    `thong_bao_khach_hang` TEXT NOT NULL,
    `thu_hoi_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_thu_hoi_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_thu_hoi_lo_san_pham_lo`(`lo_san_pham_id`),
    INDEX `idx_thu_hoi_lo_san_pham_thoi_gian`(`thu_hoi_luc`),
    INDEX `idx_thu_hoi_lo_san_pham_nguoi_thoi_gian`(`nguoi_thu_hoi_id`, `thu_hoi_luc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `thu_hoi_lo_san_pham` ADD CONSTRAINT `fk_thu_hoi_lo_san_pham_lo` FOREIGN KEY (`lo_san_pham_id`) REFERENCES `lo_san_pham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thu_hoi_lo_san_pham` ADD CONSTRAINT `fk_thu_hoi_lo_san_pham_nguoi` FOREIGN KEY (`nguoi_thu_hoi_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- PHIEN-028 – Permission Thu hồi Lô; chỉ ADMIN.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a05582-2c4f-70fc-bf92-2e12fb3976da',
   'lo_san_pham.thu_hoi',
   'Thu hồi lô sản phẩm',
   'Thu hồi Lô, chặn bán/phân bổ và phát cảnh báo truy xuất',
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
  '01a05582-2c4f-75b2-8223-17550f5266d3',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.thu_hoi'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
