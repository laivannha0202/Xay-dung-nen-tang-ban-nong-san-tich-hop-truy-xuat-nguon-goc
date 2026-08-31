-- CreateTable
CREATE TABLE `inventory_transaction` (
    `id` CHAR(36) NOT NULL,
    `ton_kho_lo_id` CHAR(36) NOT NULL,
    `loai` ENUM('HARVEST_IN', 'TRANSFER_IN', 'TRANSFER_OUT', 'ORDER_RESERVE', 'ORDER_RELEASE', 'ORDER_SHIP', 'RETURN_IN', 'DAMAGE', 'EXPIRE', 'ADJUSTMENT') NOT NULL,
    `so_luong` DECIMAL(14, 3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_inventory_transaction_lot_created_at`(`ton_kho_lo_id`, `created_at`),
    INDEX `idx_inventory_transaction_type_created_at`(`loai`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory_transaction` ADD CONSTRAINT `fk_inventory_transaction_inventory_lot` FOREIGN KEY (`ton_kho_lo_id`) REFERENCES `inventory_lot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- PHIEN-036 – Ledger quantity rule.
-- 9 type nghiệp vụ dùng quantity dương; ADJUSTMENT có thể âm/dương nhưng không được 0.
ALTER TABLE `inventory_transaction`
  ADD CONSTRAINT `chk_inventory_transaction_quantity`
  CHECK (
    (`loai` = 'ADJUSTMENT' AND `so_luong` <> 0)
    OR
    (`loai` <> 'ADJUSTMENT' AND `so_luong` > 0)
  );

-- Ledger immutable: không UPDATE/DELETE transaction cũ.
CREATE TRIGGER `trg_inventory_transaction_no_update`
BEFORE UPDATE ON `inventory_transaction`
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Inventory transaction ledger is immutable; append a new transaction';

CREATE TRIGGER `trg_inventory_transaction_no_delete`
BEFORE DELETE ON `inventory_transaction`
FOR EACH ROW
SIGNAL SQLSTATE '45000'
SET MESSAGE_TEXT = 'Inventory transaction ledger is immutable; append a new transaction';
