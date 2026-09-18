-- AgriMarket practical completion V14

ALTER TABLE `lo_san_pham`
  MODIFY COLUMN `trang_thai`
    ENUM('MOI_TAO','CHO_KIEM_DINH','CO_THE_BAN','TAM_GIU','KHONG_DAT','THU_HOI','HET_HANG','HET_HAN')
    NOT NULL DEFAULT 'MOI_TAO',
  ADD COLUMN `ngay_dong_goi` DATE NULL AFTER `ngay_het_han`,
  ADD COLUMN `loai_bao_quan`
    ENUM('NHIET_DO_THUONG','MAT','LANH','DONG_LANH')
    NOT NULL DEFAULT 'NHIET_DO_THUONG' AFTER `ngay_dong_goi`,
  ADD COLUMN `nhiet_do_min` DECIMAL(5,2) NULL AFTER `loai_bao_quan`,
  ADD COLUMN `nhiet_do_max` DECIMAL(5,2) NULL AFTER `nhiet_do_min`,
  ADD COLUMN `do_am_min` TINYINT UNSIGNED NULL AFTER `nhiet_do_max`,
  ADD COLUMN `do_am_max` TINYINT UNSIGNED NULL AFTER `do_am_min`,
  ADD COLUMN `huong_dan_bao_quan` VARCHAR(1000) NULL AFTER `do_am_max`;

ALTER TABLE `review`
  ADD COLUMN `hien_thi` BOOLEAN NOT NULL DEFAULT TRUE AFTER `comment`,
  ADD COLUMN `ly_do_an` VARCHAR(500) NULL AFTER `hien_thi`,
  ADD COLUMN `an_luc` DATETIME(3) NULL AFTER `ly_do_an`,
  ADD COLUMN `an_boi` VARCHAR(191) NULL AFTER `an_luc`,
  ADD INDEX `idx_review_hien_thi_created_at` (`hien_thi`, `created_at`);
