-- AGRIMARKET V14 - Recall blocking + FEFO config.
ALTER TABLE `thu_hoi_lo_san_pham`
    ADD COLUMN `khoa_phan_bo_tuong_lai` BOOLEAN NOT NULL DEFAULT FALSE AFTER `thong_bao_khach_hang`,
    ADD COLUMN `ngay_het_han_toi_thieu_ngay` INT UNSIGNED NULL AFTER `khoa_phan_bo_tuong_lai`;

ALTER TABLE `system_settings`
    ADD COLUMN `min_remaining_shelf_life_days` INT UNSIGNED NOT NULL DEFAULT 0 AFTER `near_expiry_threshold_days`;
