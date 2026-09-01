-- CreateTable
CREATE TABLE `review` (
    `id` CHAR(36) NOT NULL,
    `order_item_id` CHAR(36) NOT NULL,
    `rating` TINYINT NOT NULL,
    `comment` VARCHAR(2000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_review_order_item`(`order_item_id`),
    INDEX `idx_review_rating_created_at`(`rating`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `fk_review_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `review`
  ADD CONSTRAINT `chk_review_rating_range` CHECK (`rating` >= 1 AND `rating` <= 5);
