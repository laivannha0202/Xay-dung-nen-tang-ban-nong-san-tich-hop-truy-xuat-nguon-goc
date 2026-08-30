/*
  Warnings:

  - A unique constraint covering the columns `[ma_truy_xuat]` on the table `lo_san_pham` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `lo_san_pham` ADD COLUMN `ma_truy_xuat` VARCHAR(40) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `uk_lo_san_pham_ma_truy_xuat` ON `lo_san_pham`(`ma_truy_xuat`);


-- PHIEN-025 – Permission QR Code.
INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01a05341-5165-7560-b9a1-2b9ed8fe31fe', 'qr_code.xem', 'Xem QR Code', 'Xem mã truy xuất và QR Code của Lô sản phẩm', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01a05341-5165-7134-ac40-94ee58dcdb3e', 'qr_code.tao', 'Tạo QR Code', 'Tạo stable trace code và QR Code cho Lô sản phẩm', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);


INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05341-5165-7b0b-b617-ab1aff66a6ba',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'qr_code.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05341-5165-769f-80ca-0052a11df3df',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'qr_code.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05341-5165-72b9-ac43-ff941bfec077',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'qr_code.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a05341-5165-7412-a032-47f2724a8a6a',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'qr_code.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
