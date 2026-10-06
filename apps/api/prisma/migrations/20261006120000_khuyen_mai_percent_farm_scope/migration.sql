-- Khuyen mai: loai giam %, giam toi da, gioi han moi khach, pham vi trang trai (forward-only, giu du lieu cu).
-- Tat ca cot moi co DEFAULT tuong thich: loai_giam=SO_TIEN giu nguyen y nghia gia_tri_giam hien tai.

ALTER TABLE `khuyen_mai`
  ADD COLUMN `loai_giam` ENUM('PHAN_TRAM', 'SO_TIEN') NOT NULL DEFAULT 'SO_TIEN',
  ADD COLUMN `giam_toi_da` DECIMAL(15, 2) NULL,
  ADD COLUMN `gioi_han_moi_khach` INTEGER NULL,
  ADD COLUMN `trang_trai_id` CHAR(36) NULL;

-- Mo rong pham vi: giu 3 gia tri cu, them TRANG_TRAI.
ALTER TABLE `khuyen_mai`
  MODIFY COLUMN `pham_vi` ENUM('PLATFORM', 'DANH_MUC', 'SAN_PHAM', 'TRANG_TRAI') NOT NULL;

ALTER TABLE `khuyen_mai`
  ADD CONSTRAINT `fk_khuyen_mai_trang_trai`
  FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX `idx_khuyen_mai_trang_trai` ON `khuyen_mai`(`trang_trai_id`);

-- Dieu kien bao ve, tuong thich du lieu cu (gia_tri_giam >= 0 van giu):
-- PHAN_TRAM: 0 < gia_tri_giam <= 100; SO_TIEN: khong them rang buoc moi (service giu >= 0.01).
ALTER TABLE `khuyen_mai`
  ADD CONSTRAINT `chk_khuyen_mai_loai_giam`
  CHECK (
    (`loai_giam` = 'SO_TIEN')
    OR (`loai_giam` = 'PHAN_TRAM' AND `gia_tri_giam` > 0 AND `gia_tri_giam` <= 100)
  ),
  ADD CONSTRAINT `chk_khuyen_mai_giam_toi_da`
  CHECK (`giam_toi_da` IS NULL OR `giam_toi_da` >= 0),
  ADD CONSTRAINT `chk_khuyen_mai_gioi_han_moi_khach`
  CHECK (`gioi_han_moi_khach` IS NULL OR `gioi_han_moi_khach` > 0),
  ADD CONSTRAINT `chk_khuyen_mai_moi_khach_trong_tong`
  CHECK (
    `gioi_han_moi_khach` IS NULL
    OR `gioi_han_su_dung` IS NULL
    OR `gioi_han_moi_khach` <= `gioi_han_su_dung`
  );
