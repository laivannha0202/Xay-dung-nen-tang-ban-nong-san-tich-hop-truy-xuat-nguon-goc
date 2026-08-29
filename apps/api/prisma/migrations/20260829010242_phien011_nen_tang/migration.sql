-- CreateTable
CREATE TABLE `nguoi_dung` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `mat_khau_hash` VARCHAR(255) NOT NULL,
    `ho_ten` VARCHAR(150) NOT NULL,
    `trang_thai` ENUM('CHUA_KICH_HOAT', 'HOAT_DONG', 'TAM_KHOA') NOT NULL DEFAULT 'CHUA_KICH_HOAT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_nguoi_dung_email`(`email`),
    UNIQUE INDEX `uk_nguoi_dung_so_dien_thoai`(`so_dien_thoai`),
    INDEX `idx_nguoi_dung_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_hang` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `ngay_sinh` DATE NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_khach_hang_nguoi_dung`(`nguoi_dung_id`),
    INDEX `idx_khach_hang_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhan_vien` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `ma_nhan_vien` VARCHAR(50) NOT NULL,
    `chuc_danh` VARCHAR(100) NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_nhan_vien_nguoi_dung`(`nguoi_dung_id`),
    UNIQUE INDEX `uk_nhan_vien_ma`(`ma_nhan_vien`),
    INDEX `idx_nhan_vien_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vai_tro` (
    `id` CHAR(36) NOT NULL,
    `ma` VARCHAR(50) NOT NULL,
    `ten` VARCHAR(100) NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_vai_tro_ma`(`ma`),
    INDEX `idx_vai_tro_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quyen` (
    `id` CHAR(36) NOT NULL,
    `ma` VARCHAR(100) NOT NULL,
    `ten` VARCHAR(150) NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_quyen_ma`(`ma`),
    INDEX `idx_quyen_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vai_tro_quyen` (
    `id` CHAR(36) NOT NULL,
    `vai_tro_id` CHAR(36) NOT NULL,
    `quyen_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_vai_tro_quyen_quyen`(`quyen_id`),
    INDEX `idx_vai_tro_quyen_trang_thai`(`trang_thai`),
    UNIQUE INDEX `uk_vai_tro_quyen`(`vai_tro_id`, `quyen_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nguoi_dung_vai_tro` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `vai_tro_id` CHAR(36) NOT NULL,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_nguoi_dung_vai_tro_vai_tro`(`vai_tro_id`),
    INDEX `idx_nguoi_dung_vai_tro_trang_thai`(`trang_thai`),
    UNIQUE INDEX `uk_nguoi_dung_vai_tro`(`nguoi_dung_id`, `vai_tro_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dia_chi` (
    `id` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `ten_nguoi_nhan` VARCHAR(150) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NOT NULL,
    `dong_dia_chi` VARCHAR(255) NOT NULL,
    `phuong_xa` VARCHAR(120) NULL,
    `quan_huyen` VARCHAR(120) NULL,
    `tinh_thanh` VARCHAR(120) NOT NULL,
    `ma_buu_chinh` VARCHAR(20) NULL,
    `mac_dinh` BOOLEAN NOT NULL DEFAULT false,
    `trang_thai` ENUM('HOAT_DONG', 'NGUNG_HOAT_DONG') NOT NULL DEFAULT 'HOAT_DONG',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_dia_chi_nguoi_dung_mac_dinh`(`nguoi_dung_id`, `mac_dinh`),
    INDEX `idx_dia_chi_trang_thai`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `khach_hang` ADD CONSTRAINT `fk_khach_hang_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhan_vien` ADD CONSTRAINT `fk_nhan_vien_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vai_tro_quyen` ADD CONSTRAINT `fk_vai_tro_quyen_vai_tro` FOREIGN KEY (`vai_tro_id`) REFERENCES `vai_tro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vai_tro_quyen` ADD CONSTRAINT `fk_vai_tro_quyen_quyen` FOREIGN KEY (`quyen_id`) REFERENCES `quyen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nguoi_dung_vai_tro` ADD CONSTRAINT `fk_nguoi_dung_vai_tro_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nguoi_dung_vai_tro` ADD CONSTRAINT `fk_nguoi_dung_vai_tro_vai_tro` FOREIGN KEY (`vai_tro_id`) REFERENCES `vai_tro`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dia_chi` ADD CONSTRAINT `fk_dia_chi_nguoi_dung` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
