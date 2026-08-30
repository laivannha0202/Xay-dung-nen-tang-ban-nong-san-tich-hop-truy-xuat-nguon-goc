-- CreateTable
CREATE TABLE `lo_san_pham` (
    `id` CHAR(36) NOT NULL,
    `ma_lo` VARCHAR(100) NOT NULL,
    `thu_hoach_id` CHAR(36) NOT NULL,
    `so_luong` DECIMAL(14, 3) NOT NULL,
    `con_lai` DECIMAL(14, 3) NOT NULL,
    `phan_hang_chat_luong` VARCHAR(100) NULL,
    `ngay_het_han` DATE NOT NULL,
    `trang_thai` ENUM('MOI_TAO', 'CHO_KIEM_DINH', 'CO_THE_BAN', 'TAM_GIU', 'KHONG_DAT', 'THU_HOI', 'HET_HANG') NOT NULL DEFAULT 'MOI_TAO',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_lo_san_pham_ma_lo`(`ma_lo`),
    INDEX `idx_lo_san_pham_thu_hoach_trang_thai`(`thu_hoach_id`, `trang_thai`),
    INDEX `idx_lo_san_pham_trang_thai_het_han`(`trang_thai`, `ngay_het_han`),
    INDEX `idx_lo_san_pham_phan_hang`(`phan_hang_chat_luong`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lo_san_pham` ADD CONSTRAINT `fk_lo_san_pham_thu_hoach` FOREIGN KEY (`thu_hoach_id`) REFERENCES `thu_hoach`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


-- PHIEN-023 – Permission Lô sản phẩm.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a05014-7fcd-7846-a508-17f9327719b3', 'lo_san_pham.xem', 'Xem lô sản phẩm', 'Xem danh sách và chi tiết lô sản phẩm', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a05014-7fcd-7970-98cf-1a3cda87c12d', 'lo_san_pham.tao', 'Tạo lô sản phẩm', 'Tạo lô sản phẩm từ bản ghi thu hoạch', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a05014-7fcd-7dab-bfbd-4f3594d30231', 'lo_san_pham.sua', 'Sửa lô sản phẩm', 'Sửa lô mới tạo và gửi lô sang chờ kiểm định', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-74ca-a1ff-46567c32fffe',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-7aaf-a23b-3e8b2e7c3a66',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-7b3d-b849-d10fd924c870',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-7716-975d-b5078d858878',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-7568-8ffb-cb0cf093c5c6',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05014-7fcd-7491-8da2-918f7458d903',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'lo_san_pham.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
