-- AGRIMARKET - PhieuKho.maThamChieu unique constraint.
ALTER TABLE `warehouse_document`
  ADD UNIQUE INDEX `uk_warehouse_document_reference` (`ma_tham_chieu`);
