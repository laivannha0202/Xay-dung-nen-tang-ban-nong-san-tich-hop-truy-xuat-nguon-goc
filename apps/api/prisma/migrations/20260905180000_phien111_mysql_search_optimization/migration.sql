-- PHIEN-111 – MySQL Search Optimization
-- Public product list luôn lọc trạng thái và base-order theo ten + created_at.
-- Composite B-tree này cho phép MySQL dùng cùng index cho equality prefix
-- trang_thai và thứ tự ten, created_at.
--
-- FULLTEXT chưa áp dụng ở PHIEN-111:
-- endpoint hiện giữ semantics substring Prisma contains (%keyword%);
-- chuyển sang MATCH ... AGAINST sẽ thay đổi semantics/scoring và thuộc
-- PHIEN-112 – Search Ranking.

CREATE INDEX `idx_san_pham_trang_thai_ten_created_at`
ON `san_pham`(`trang_thai`, `ten`, `created_at`);
