ALTER TABLE `order`
  ADD COLUMN `dia_chi_giao_hang_id` CHAR(36) NULL,
  ADD COLUMN `ten_nguoi_nhan_snapshot` VARCHAR(150) NULL,
  ADD COLUMN `so_dien_thoai_snapshot` VARCHAR(20) NULL,
  ADD COLUMN `dia_chi_giao_hang_snapshot` VARCHAR(500) NULL;
