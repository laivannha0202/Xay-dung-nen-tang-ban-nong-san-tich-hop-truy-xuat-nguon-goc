-- Dia ban Hanh Yen moi (snapshot 14/09/2026): 104 xa/phuong (93 xa + 11 phuong).
-- Backward-safe: chi CREATE TABLE moi + ADD COLUMN nullable + FK/index moi.
-- Khong drop/doi ten cot/bang hien tai (phuong_xa/quan_huyen/tinh_thanh/ma_buu_chinh giu lai legacy).
-- Thon/to dan pho toan tinh: NOT_COMPLETE — bang thon_to_dan_pho san sang de import sau.

CREATE TABLE `xa_phuong_hung_yen` (
    `ma` VARCHAR(32) NOT NULL,
    `ten` VARCHAR(255) NOT NULL,
    `ten_day_du` VARCHAR(255) NOT NULL,
    `ten_chuan_hoa` VARCHAR(255) NOT NULL,
    `loai` ENUM('XA', 'PHUONG') NOT NULL,
    `hoat_dong` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_xa_phuong_hung_yen_ten_loai`(`ten_day_du`, `loai`),
    INDEX `idx_xa_phuong_hung_yen_ten_chuan_hoa`(`ten_chuan_hoa`),
    INDEX `idx_xa_phuong_hung_yen_loai_hoat_dong`(`loai`, `hoat_dong`),
    PRIMARY KEY (`ma`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `thon_to_dan_pho` (
    `ma` VARCHAR(40) NOT NULL,
    `xa_phuong_ma` VARCHAR(32) NOT NULL,
    `ten` VARCHAR(255) NOT NULL,
    `ten_day_du` VARCHAR(255) NOT NULL,
    `ten_chuan_hoa` VARCHAR(255) NOT NULL,
    `loai` ENUM('THON', 'TO_DAN_PHO') NOT NULL,
    `hoat_dong` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_thon_to_dan_pho_xa_ten`(`xa_phuong_ma`, `ten_day_du`),
    INDEX `idx_thon_to_dan_pho_xa_phuong`(`xa_phuong_ma`),
    INDEX `idx_thon_to_dan_pho_ten_chuan_hoa`(`ten_chuan_hoa`),
    PRIMARY KEY (`ma`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `thon_to_dan_pho`
  ADD CONSTRAINT `fk_thon_to_dan_pho_xa_phuong`
  FOREIGN KEY (`xa_phuong_ma`) REFERENCES `xa_phuong_hung_yen`(`ma`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- DiaChi: lien ket FK toi dia ban (nullable de dia chi legacy van hop le).
ALTER TABLE `dia_chi`
  ADD COLUMN `xa_phuong_ma` VARCHAR(32) NULL,
  ADD COLUMN `thon_to_dan_pho_ma` VARCHAR(40) NULL;

CREATE INDEX `idx_dia_chi_xa_phuong_ma` ON `dia_chi`(`xa_phuong_ma`);
CREATE INDEX `idx_dia_chi_thon_to_dan_pho_ma` ON `dia_chi`(`thon_to_dan_pho_ma`);

ALTER TABLE `dia_chi`
  ADD CONSTRAINT `fk_dia_chi_xa_phuong`
  FOREIGN KEY (`xa_phuong_ma`) REFERENCES `xa_phuong_hung_yen`(`ma`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `dia_chi`
  ADD CONSTRAINT `fk_dia_chi_thon_to_dan_pho`
  FOREIGN KEY (`thon_to_dan_pho_ma`) REFERENCES `thon_to_dan_pho`(`ma`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
