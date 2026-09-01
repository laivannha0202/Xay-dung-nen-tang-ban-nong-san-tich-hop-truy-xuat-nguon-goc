-- CreateTable
CREATE TABLE `complaint` (
    `id` CHAR(36) NOT NULL,
    `order_item_id` CHAR(36) NOT NULL,
    `reason` ENUM('HONG', 'DAP', 'SAI', 'THIEU', 'HET_HAN', 'CHAT_LUONG', 'CHUNG_NHAN') NOT NULL,
    `description` VARCHAR(2000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_complaint_order_item_created_at`(`order_item_id`, `created_at`),
    INDEX `idx_complaint_reason_created_at`(`reason`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaint_evidence` (
    `id` CHAR(36) NOT NULL,
    `complaint_id` CHAR(36) NOT NULL,
    `file_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_complaint_evidence_complaint_file`(`complaint_id`, `file_id`),
    INDEX `idx_complaint_evidence_file`(`file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `complaint` ADD CONSTRAINT `fk_complaint_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_evidence` ADD CONSTRAINT `fk_complaint_evidence_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaint_evidence` ADD CONSTRAINT `fk_complaint_evidence_file` FOREIGN KEY (`file_id`) REFERENCES `tep_tin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
