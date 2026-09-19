-- AgriMarket V15: warehouse documents + internal sales invoice

CREATE TABLE `warehouse_document` (
  `id` CHAR(36) NOT NULL,
  `ma_phieu` VARCHAR(40) NOT NULL,
  `loai` ENUM('NHAP','XUAT','CHUYEN','DIEU_CHINH') NOT NULL,
  `trang_thai` ENUM('DA_GHI_SO') NOT NULL DEFAULT 'DA_GHI_SO',
  `don_hang_id` CHAR(36) NULL,
  `kho_nguon_id` CHAR(36) NULL,
  `kho_dich_id` CHAR(36) NULL,
  `ma_tham_chieu` VARCHAR(191) NULL,
  `ly_do` VARCHAR(500) NULL,
  `ghi_chu` VARCHAR(1000) NULL,
  `nguoi_lap_id` CHAR(36) NULL,
  `nguoi_lap` VARCHAR(191) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `uk_warehouse_document_code`(`ma_phieu`),
  INDEX `idx_warehouse_document_type_created`(`loai`,`created_at`),
  INDEX `idx_warehouse_document_order_created`(`don_hang_id`,`created_at`),
  INDEX `idx_warehouse_document_reference`(`ma_tham_chieu`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `warehouse_document_line` (
  `id` CHAR(36) NOT NULL,
  `phieu_kho_id` CHAR(36) NOT NULL,
  `thu_tu` INTEGER UNSIGNED NOT NULL,
  `ton_kho_lo_id` CHAR(36) NOT NULL,
  `ton_kho_lo_dich_id` CHAR(36) NULL,
  `lo_san_pham_id` CHAR(36) NOT NULL,
  `ma_lo_snapshot` VARCHAR(100) NOT NULL,
  `bien_the_san_pham_id` CHAR(36) NOT NULL,
  `sku_snapshot` VARCHAR(100) NOT NULL,
  `ten_san_pham_snapshot` VARCHAR(200) NOT NULL,
  `so_luong` DECIMAL(14,3) NOT NULL,
  `don_vi_snapshot` VARCHAR(30) NOT NULL,
  `kho_id_snapshot` CHAR(36) NOT NULL,
  `ma_kho_snapshot` VARCHAR(50) NOT NULL,
  `kho_dich_id_snapshot` CHAR(36) NULL,
  `ma_kho_dich_snapshot` VARCHAR(50) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `uk_warehouse_document_line_order`(`phieu_kho_id`,`thu_tu`),
  INDEX `idx_warehouse_document_line_inventory`(`ton_kho_lo_id`),
  INDEX `idx_warehouse_document_line_batch`(`lo_san_pham_id`),
  INDEX `idx_warehouse_document_line_variant`(`bien_the_san_pham_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `warehouse_document_transaction` (
  `id` CHAR(36) NOT NULL,
  `phieu_kho_dong_id` CHAR(36) NOT NULL,
  `giao_dich_ton_kho_id` CHAR(36) NOT NULL,
  `vai_tro` VARCHAR(30) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `uk_warehouse_document_transaction_ledger`(`giao_dich_ton_kho_id`),
  INDEX `idx_warehouse_document_transaction_line`(`phieu_kho_dong_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `internal_sales_invoice` (
  `id` CHAR(36) NOT NULL,
  `ma_hoa_don` VARCHAR(40) NOT NULL,
  `don_hang_id` CHAR(36) NOT NULL,
  `trang_thai` ENUM('DA_PHAT_HANH') NOT NULL DEFAULT 'DA_PHAT_HANH',
  `ma_don_hang_snapshot` VARCHAR(100) NOT NULL,
  `ten_nguoi_mua_snapshot` VARCHAR(150) NOT NULL,
  `so_dien_thoai_snapshot` VARCHAR(20) NULL,
  `dia_chi_snapshot` VARCHAR(500) NULL,
  `tam_tinh_hang_hoa` DECIMAL(15,2) NOT NULL,
  `phi_van_chuyen` DECIMAL(15,2) NOT NULL,
  `giam_khuyen_mai` DECIMAL(15,2) NOT NULL,
  `diem_da_dung` INTEGER UNSIGNED NOT NULL,
  `gia_tri_diem_da_dung` DECIMAL(15,2) NOT NULL,
  `tong_thanh_toan` DECIMAL(15,2) NOT NULL,
  `phuong_thuc_thanh_toan_snapshot` VARCHAR(50) NULL,
  `trang_thai_thanh_toan_snapshot` VARCHAR(50) NULL,
  `nguoi_lap_id` CHAR(36) NULL,
  `nguoi_lap` VARCHAR(191) NOT NULL,
  `phat_hanh_luc` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `uk_internal_sales_invoice_code`(`ma_hoa_don`),
  UNIQUE INDEX `uk_internal_sales_invoice_order`(`don_hang_id`),
  INDEX `idx_internal_sales_invoice_issued`(`phat_hanh_luc`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `internal_sales_invoice_line` (
  `id` CHAR(36) NOT NULL,
  `hoa_don_id` CHAR(36) NOT NULL,
  `thu_tu` INTEGER UNSIGNED NOT NULL,
  `muc_don_hang_id` CHAR(36) NOT NULL,
  `ten_san_pham_snapshot` VARCHAR(200) NOT NULL,
  `sku_snapshot` VARCHAR(100) NOT NULL,
  `so_luong` INTEGER UNSIGNED NOT NULL,
  `don_vi_snapshot` VARCHAR(30) NOT NULL,
  `don_gia` DECIMAL(15,2) NOT NULL,
  `thanh_tien` DECIMAL(15,2) NOT NULL,
  `ten_trang_trai_snapshot` VARCHAR(200) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `uk_internal_sales_invoice_line_order`(`hoa_don_id`,`thu_tu`),
  INDEX `idx_internal_sales_invoice_line_order_item`(`muc_don_hang_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `warehouse_document` ADD CONSTRAINT `fk_warehouse_document_order`
  FOREIGN KEY (`don_hang_id`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `warehouse_document_line` ADD CONSTRAINT `fk_warehouse_document_line_header`
  FOREIGN KEY (`phieu_kho_id`) REFERENCES `warehouse_document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `warehouse_document_transaction` ADD CONSTRAINT `fk_warehouse_document_transaction_line`
  FOREIGN KEY (`phieu_kho_dong_id`) REFERENCES `warehouse_document_line`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `warehouse_document_transaction` ADD CONSTRAINT `fk_warehouse_document_transaction_ledger`
  FOREIGN KEY (`giao_dich_ton_kho_id`) REFERENCES `inventory_transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `internal_sales_invoice` ADD CONSTRAINT `fk_internal_sales_invoice_order`
  FOREIGN KEY (`don_hang_id`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `internal_sales_invoice_line` ADD CONSTRAINT `fk_internal_sales_invoice_line_header`
  FOREIGN KEY (`hoa_don_id`) REFERENCES `internal_sales_invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
