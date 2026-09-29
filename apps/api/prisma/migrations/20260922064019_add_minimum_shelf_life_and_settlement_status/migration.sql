-- AlterTable
ALTER TABLE `settlement` ADD COLUMN `trangThai` ENUM('PENDING', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
    ALTER COLUMN `refunds` DROP DEFAULT,
    ALTER COLUMN `adjustments` DROP DEFAULT;

-- AlterTable
ALTER TABLE `system_settings` ADD COLUMN `minimum_shelf_life_days` INTEGER UNSIGNED NOT NULL DEFAULT 2,
    ADD COLUMN `seller_escrow_hours` INTEGER UNSIGNED NOT NULL DEFAULT 24;
