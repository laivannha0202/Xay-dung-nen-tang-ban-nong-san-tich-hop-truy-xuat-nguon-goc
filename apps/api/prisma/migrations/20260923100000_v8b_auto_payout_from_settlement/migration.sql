-- AGRIMARKET V8B - Auto-create payout from settlement release.
ALTER TABLE `payout`
    ADD COLUMN `settlement_id` CHAR(36) NULL AFTER `supplier_id`;

CREATE INDEX `idx_payout_settlement`
    ON `payout`(`settlement_id`);

ALTER TABLE `payout`
    ADD CONSTRAINT `fk_payout_settlement`
    FOREIGN KEY (`settlement_id`) REFERENCES `settlement`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
