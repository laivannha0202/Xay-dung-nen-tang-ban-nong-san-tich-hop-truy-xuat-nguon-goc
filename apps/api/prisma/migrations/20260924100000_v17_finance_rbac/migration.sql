-- V17 - Seed Finance RBAC permissions for Admin & NhanVien.

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01994000-0000-7000-8000-000000000001', 'tai_chinh.xem', 'Xem tài chính', 'Xem số dư, đối soát, chi trả và lịch sử hoàn tiền', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01994000-0000-7000-8000-000000000002', 'tai_chinh.doi_soat', 'Quản lý đối soát', 'Tạo và giải phóng kỳ đối soát nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01994000-0000-7000-8000-000000000003', 'tai_chinh.chi_tra', 'Quản lý chi trả', 'Tạo và chuyển trạng thái payout cho nhà cung cấp', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01994000-0000-7000-8000-000000000004', 'tai_chinh.hoan_tien', 'Quản lý hoàn tiền', 'Hoàn tiền payment cho đơn hàng hoặc khiếu nại', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

-- Gán toàn bộ quyền tài chính cho ADMIN
INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01994000-0001-7000-8000-000000000001', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'tai_chinh.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01994000-0001-7000-8000-000000000002', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'tai_chinh.doi_soat'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01994000-0001-7000-8000-000000000003', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'tai_chinh.chi_tra'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01994000-0001-7000-8000-000000000004', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'tai_chinh.hoan_tien'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);
