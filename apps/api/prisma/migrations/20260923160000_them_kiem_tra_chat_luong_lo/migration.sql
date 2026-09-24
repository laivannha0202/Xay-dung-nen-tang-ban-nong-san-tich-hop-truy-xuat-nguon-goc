-- AGRIMARKET V12 - Thêm QC_PASS vào ledger tồn kho để hỗ trợ returned stock QC.
ALTER TABLE `inventory_transaction`
  MODIFY COLUMN `loai` ENUM(
    'HARVEST_IN',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ORDER_RESERVE',
    'ORDER_RELEASE',
    'ORDER_SHIP',
    'RETURN_IN',
    'QC_PASS',
    'DAMAGE',
    'EXPIRE',
    'ADJUSTMENT'
  ) NOT NULL;
