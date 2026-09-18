-- AGRIMARKET-BUSINESS-CODES-FINAL
-- 3.1 Ma khach hang nghiep vu (server-generated, unique, khong thay FK UUID).
-- 3.2 Ma khieu nai nghiep vu (server-generated, unique, Customer/Admin cung thay).
-- 3.3 Tach DonHang.maYeuCau (idempotency key UNIQUE) khoi DonHang.maDonHang (ma nghiep vu UNIQUE).
--     Giu format maDonHang hien tai 'ORD-'+hex(maYeuCau) de khong pha compatibility/fixtures.
--     Correctness uu tien tham my: chi tach field + enforce DB unique + graceful P2002.

-- 1) KhachHang.maKhachHang: KH-YYYYMMDD-XXXXXX
ALTER TABLE `khach_hang`
  ADD COLUMN `ma_khach_hang` VARCHAR(32) NULL;

UPDATE `khach_hang`
SET `ma_khach_hang` = CONCAT(
  'KH-',
  DATE_FORMAT(`created_at`, '%Y%m%d'),
  '-',
  UPPER(RIGHT(REPLACE(`id`, '-', ''), 6))
)
WHERE `ma_khach_hang` IS NULL;

ALTER TABLE `khach_hang`
  MODIFY COLUMN `ma_khach_hang` VARCHAR(32) NOT NULL;

CREATE UNIQUE INDEX `uk_khach_hang_ma` ON `khach_hang`(`ma_khach_hang`);

-- 2) KhieuNai.maKhieuNai: KN-YYYYMMDD-XXXXXX
ALTER TABLE `complaint`
  ADD COLUMN `ma_khieu_nai` VARCHAR(32) NULL;

UPDATE `complaint`
SET `ma_khieu_nai` = CONCAT(
  'KN-',
  DATE_FORMAT(`created_at`, '%Y%m%d'),
  '-',
  UPPER(RIGHT(REPLACE(`id`, '-', ''), 6))
)
WHERE `ma_khieu_nai` IS NULL;

ALTER TABLE `complaint`
  MODIFY COLUMN `ma_khieu_nai` VARCHAR(32) NOT NULL;

CREATE UNIQUE INDEX `uk_khieu_nai_ma` ON `complaint`(`ma_khieu_nai`);

-- 3) DonHang.maYeuCau: UUID idempotency key UNIQUE, tach khoi maDonHang.
ALTER TABLE `order`
  ADD COLUMN `ma_yeu_cau` CHAR(36) NULL;

-- Backfill hang ORD-<32hex> ve UUID chuan (gan dung tuyet doi vi maDonHang sinh tu maYeuCau).
UPDATE `order`
SET `ma_yeu_cau` = LOWER(CONCAT(
  SUBSTR(SUBSTRING(`ma_don_hang`, 5), 1, 8), '-',
  SUBSTR(SUBSTRING(`ma_don_hang`, 5), 9, 4), '-',
  SUBSTR(SUBSTRING(`ma_don_hang`, 5), 13, 4), '-',
  SUBSTR(SUBSTRING(`ma_don_hang`, 5), 17, 4), '-',
  SUBSTR(SUBSTRING(`ma_don_hang`, 5), 21, 12)
))
WHERE `ma_yeu_cau` IS NULL
  AND `ma_don_hang` LIKE 'ORD-%'
  AND CHAR_LENGTH(`ma_don_hang`) = 36
  AND SUBSTRING(`ma_don_hang`, 5) REGEXP '^[0-9A-Fa-f]{32}$';

-- Hang tao truc tiep voi ma tu do (ORDER-*, SHIP-ORDER-*, ...): cap UUID moi de dam bao NOT NULL/UNIQUE.
UPDATE `order`
SET `ma_yeu_cau` = UUID()
WHERE `ma_yeu_cau` IS NULL;

ALTER TABLE `order`
  MODIFY COLUMN `ma_yeu_cau` CHAR(36) NOT NULL;

CREATE UNIQUE INDEX `uk_order_request_key` ON `order`(`ma_yeu_cau`);
