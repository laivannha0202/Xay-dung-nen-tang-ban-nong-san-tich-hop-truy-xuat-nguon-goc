-- CreateTable
CREATE TABLE `payment` (
    `id` CHAR(36) NOT NULL,
    `don_hang_id` CHAR(36) NOT NULL,
    `so_tien` DECIMAL(15, 2) NOT NULL,
    `phuong_thuc` VARCHAR(50) NOT NULL,
    `trang_thai` ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED') NOT NULL DEFAULT 'CREATED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_payment_order_created_at`(`don_hang_id`, `created_at`),
    INDEX `idx_payment_status_created_at`(`trang_thai`, `created_at`),
    INDEX `idx_payment_method_status`(`phuong_thuc`, `trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_transaction` (
    `id` CHAR(36) NOT NULL,
    `thanh_toan_id` CHAR(36) NOT NULL,
    `ma_giao_dich` VARCHAR(191) NOT NULL,
    `so_tien` DECIMAL(15, 2) NOT NULL,
    `phuong_thuc` VARCHAR(50) NOT NULL,
    `trang_thai` ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED') NOT NULL,
    `thoi_gian` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uk_payment_transaction_code`(`ma_giao_dich`),
    INDEX `idx_payment_transaction_payment_time`(`thanh_toan_id`, `thoi_gian`),
    INDEX `idx_payment_transaction_status_time`(`trang_thai`, `thoi_gian`),
    INDEX `idx_payment_transaction_method_time`(`phuong_thuc`, `thoi_gian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`don_hang_id`) REFERENCES `order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_transaction` ADD CONSTRAINT `fk_payment_transaction_payment` FOREIGN KEY (`thanh_toan_id`) REFERENCES `payment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `payment`
  ADD CONSTRAINT `chk_payment_amount_positive` CHECK (`so_tien` > 0);

ALTER TABLE `payment_transaction`
  ADD CONSTRAINT `chk_payment_transaction_amount_positive` CHECK (`so_tien` > 0);
