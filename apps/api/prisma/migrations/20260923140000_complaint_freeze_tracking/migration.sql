-- AGRIMARKET - Complaint freeze tracking per complaint.
ALTER TABLE `complaint`
  ADD COLUMN `so_tien_dong_bang` DECIMAL(15, 2) NOT NULL DEFAULT 0 AFTER `xu_ly_luc`;
