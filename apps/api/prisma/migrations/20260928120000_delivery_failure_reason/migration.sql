-- AGRIMARKET-DELIVERY-FAILURE: lý do giao thất bại có cấu trúc.
--
-- Nullable để tracking_event lịch sử (đã ghi trước đây) vẫn hợp lệ.
-- Bắt buộc reason chỉ áp dụng ở application layer cho sự kiện FAILED MỚI.
ALTER TABLE `tracking_event`
    ADD COLUMN `ly_do_giao_that_bai` ENUM('KHONG_LIEN_LAC_DUOC', 'KHACH_HEN_LAI', 'KHACH_TU_CHOI_NHAN', 'SAI_DIA_CHI', 'LY_DO_KHAC') NULL AFTER `trang_thai`;
