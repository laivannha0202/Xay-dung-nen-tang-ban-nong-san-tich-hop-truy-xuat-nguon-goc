-- AgriMarket: Payment success commits reservation but does not physically ship stock.
-- Physical ORDER_SHIP remains a separate shipment/warehouse event.

ALTER TABLE `inventory_reservation`
  MODIFY COLUMN `trang_thai`
    ENUM('DANG_GIU', 'DA_XAC_NHAN', 'DA_BAN', 'DA_GIAI_PHONG', 'HET_HAN')
    NOT NULL DEFAULT 'DANG_GIU',
  ADD COLUMN `xac_nhan_luc` DATETIME(3) NULL AFTER `het_han_luc`;
