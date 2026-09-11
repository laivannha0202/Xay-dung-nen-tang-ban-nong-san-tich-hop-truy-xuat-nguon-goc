-- V8B – RBAC quản trị khuyến mãi.

INSERT INTO `quyen`
  (`id`, `ma`, `ten`, `mo_ta`, `trang_thai`, `created_at`, `updated_at`)
VALUES
  ('01993d51-7a01-7b01-8b01-000000000001', 'khuyen_mai.xem', 'Xem khuyến mãi', 'Xem danh sách và chi tiết khuyến mãi', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a01-7b01-8b01-000000000002', 'khuyen_mai.tao', 'Tạo khuyến mãi', 'Tạo chương trình khuyến mãi', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a01-7b01-8b01-000000000003', 'khuyen_mai.sua', 'Sửa khuyến mãi', 'Sửa điều kiện, phạm vi và giá trị khuyến mãi', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  ('01993d51-7a01-7b01-8b01-000000000004', 'khuyen_mai.khoa', 'Khóa khuyến mãi', 'Đổi trạng thái hoạt động của khuyến mãi', 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `ten` = VALUES(`ten`),
  `mo_ta` = VALUES(`mo_ta`),
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);

-- Nhân viên được xem/tạo/sửa, nhưng chỉ ADMIN được khóa/mở chương trình.
INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a02-7b01-8b01-000000000001', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.xem'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a02-7b01-8b01-000000000002', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.tao'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a02-7b01-8b01-000000000003', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.sua'
WHERE vt.`ma` = 'NHAN_VIEN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a03-7b01-8b01-000000000001', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a03-7b01-8b01-000000000002', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.tao'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a03-7b01-8b01-000000000003', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.sua'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT '01993d51-7a03-7b01-8b01-000000000004', vt.`id`, q.`id`, 'HOAT_DONG', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt JOIN `quyen` q ON q.`ma` = 'khuyen_mai.khoa'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE `trang_thai` = 'HOAT_DONG', `updated_at` = CURRENT_TIMESTAMP(3);
