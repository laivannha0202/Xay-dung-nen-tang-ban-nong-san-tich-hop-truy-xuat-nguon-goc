-- CreateTable
CREATE TABLE `theo_doi_trang_trai` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `trang_trai_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_theo_doi_trang_trai_khach_hang_trang_trai`(`khach_hang_id`, `trang_trai_id`),
    INDEX `idx_theo_doi_trang_trai_trang_trai_created_at`(`trang_trai_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thong_bao_thu_hoach` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `thu_hoach_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_thong_bao_thu_hoach_khach_hang_thu_hoach`(`khach_hang_id`, `thu_hoach_id`),
    INDEX `idx_thong_bao_thu_hoach_khach_hang_created_at`(`khach_hang_id`, `created_at`),
    INDEX `idx_thong_bao_thu_hoach_thu_hoach`(`thu_hoach_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `theo_doi_trang_trai`
  ADD CONSTRAINT `fk_theo_doi_trang_trai_khach_hang`
  FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `theo_doi_trang_trai`
  ADD CONSTRAINT `fk_theo_doi_trang_trai_trang_trai`
  FOREIGN KEY (`trang_trai_id`) REFERENCES `trang_trai`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao_thu_hoach`
  ADD CONSTRAINT `fk_thong_bao_thu_hoach_khach_hang`
  FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao_thu_hoach`
  ADD CONSTRAINT `fk_thong_bao_thu_hoach_thu_hoach`
  FOREIGN KEY (`thu_hoach_id`) REFERENCES `thu_hoach`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
