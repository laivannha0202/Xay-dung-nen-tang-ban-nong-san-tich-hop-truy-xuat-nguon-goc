-- PHIEN-016 – sửa lịch sử migration RBAC/Audit.
-- PHIEN-014 tạo audit.xem trước khi PHIEN-013 seed role ADMIN.
-- PHIEN-015 backfill vẫn có timestamp trước PHIEN-013.
-- Migration này bắt buộc chạy sau PHIEN-013 và idempotent.

INSERT INTO `vai_tro_quyen`
  (`id`, `vai_tro_id`, `quyen_id`, `trang_thai`, `created_at`, `updated_at`)
SELECT
  '01a04c3d-3b8d-76c0-ab22-bf09efdefaee',
  vt.`id`,
  q.`id`,
  'HOAT_DONG',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `vai_tro` vt
JOIN `quyen` q
  ON q.`ma` = 'audit.xem'
WHERE vt.`ma` = 'ADMIN'
ON DUPLICATE KEY UPDATE
  `trang_thai` = 'HOAT_DONG',
  `updated_at` = CURRENT_TIMESTAMP(3);
