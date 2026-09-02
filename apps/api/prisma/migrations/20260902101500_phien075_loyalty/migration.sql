-- CreateTable
CREATE TABLE `loyalty_account` (
    `id` CHAR(36) NOT NULL,
    `khach_hang_id` CHAR(36) NOT NULL,
    `diem` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_loyalty_account_khach_hang`(`khach_hang_id`),
    CONSTRAINT `chk_loyalty_account_diem_non_negative` CHECK (`diem` >= 0),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_transaction` (
    `id` CHAR(36) NOT NULL,
    `loyalty_account_id` CHAR(36) NOT NULL,
    `bien_dong_diem` INT NOT NULL,
    `so_du_sau` INT NOT NULL,
    `ly_do` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_loyalty_transaction_account_created_at`(`loyalty_account_id`, `created_at`),
    CONSTRAINT `chk_loyalty_transaction_delta_non_zero` CHECK (`bien_dong_diem` <> 0),
    CONSTRAINT `chk_loyalty_transaction_balance_non_negative` CHECK (`so_du_sau` >= 0),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `loyalty_account`
  ADD CONSTRAINT `fk_loyalty_account_khach_hang`
  FOREIGN KEY (`khach_hang_id`) REFERENCES `khach_hang`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transaction`
  ADD CONSTRAINT `fk_loyalty_transaction_account`
  FOREIGN KEY (`loyalty_account_id`) REFERENCES `loyalty_account`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
