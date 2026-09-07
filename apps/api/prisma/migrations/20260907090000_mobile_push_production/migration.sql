-- MOBILE-FIX-012 — persistent Expo push devices

CREATE TABLE `thiet_bi_push` (
  `id` CHAR(36) NOT NULL,
  `nguoi_dung_id` CHAR(36) NOT NULL,
  `expo_push_token` VARCHAR(255) NOT NULL,
  `project_id` VARCHAR(64) NOT NULL,
  `nen_tang` ENUM('ANDROID', 'IOS') NOT NULL,
  `hoat_dong` BOOLEAN NOT NULL DEFAULT true,
  `lan_cuoi_dang_ky` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `uk_thiet_bi_push_token`(`expo_push_token`),
  INDEX `idx_thiet_bi_push_nguoi_dung_hoat_dong`(
    `nguoi_dung_id`,
    `hoat_dong`
  ),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_thiet_bi_push_nguoi_dung`
    FOREIGN KEY (`nguoi_dung_id`)
    REFERENCES `nguoi_dung`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
