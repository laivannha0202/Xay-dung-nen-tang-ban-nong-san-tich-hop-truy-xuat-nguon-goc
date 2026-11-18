# Rà soát cơ sở dữ liệu

Ngày 2026-11-18. Số liệu đo trực tiếp trên DB `agrimarket` (PostgreSQL nhúng, cổng 5544).

## 1. Quy mô và cấu trúc

| Hạng mục | Số liệu |
|---|---|
| Bảng | **45** |
| Khoá ngoại | **63** |
| Ràng buộc CHECK | **63** |
| Chỉ mục | **94** |
| Bảng không có khoá chính | **0** |
| Dung lượng DB | 12 MB |
| Dữ liệu demo | 4 tài khoản, 50 sản phẩm, 65 lô, 23 đơn |

Bảng: `addresses audit_logs batch_events batch_promotions batches cart_items carts categories
certificates code_sequences complaint_files complaint_messages complaints crop_seasons
cultivation_logs customer_profiles evidence_files farms idempotency_records inventory lab_test_metrics
lab_tests login_attempts order_line_allocations order_lines orders payments product_images products
promotions qr_codes qr_scans recall_contacts recalls refund_requests reviews schema_migrations
session_revocations settings shipments stock_movements suppliers users wards warehouses`.

Tên bảng đúng như mã nguồn dùng: hoàn tiền là `refund_requests` (không phải `refunds`), địa chỉ gắn
`addresses.user_id`, thời điểm đặt đơn là `orders.placed_at`.

## 2. Bất biến đã kiểm bằng truy vấn

| Bất biến | Truy vấn | Kết quả |
|---|---|---|
| Tồn không âm | `WHERE on_hand_qty<0 OR reserved_qty<0` | **0 dòng** |
| Không giữ chỗ quá tồn | `WHERE reserved_qty>on_hand_qty` | **0 dòng** |
| Không trùng cặp kho–lô | `GROUP BY warehouse_id,batch_id HAVING count(*)>1` | **0 dòng** |
| Giữ chỗ khớp phân bổ | `SUM(inventory.reserved_qty)` vs `SUM(reserved_qty−shipped_qty)` của allocation ACTIVE trên đơn chưa xuất | **6.000 = 6.000** |
| Đơn đã huỷ không giữ tồn | allocation `ACTIVE` trên đơn `CANCELLED` | **0 dòng** |
| Đơn PAID có dòng thanh toán | `payment_status='PAID'` và không có `payments` | **0 dòng** |
| Không bản ghi mồ côi | quét 63 khoá ngoại | **0 dòng** |

Các bất biến trên được ghim bằng test: `test/03-lifecycle` (nhả/giữ chỗ), `test/06-logic-gates`
(chặn tồn âm, chặn lô không hợp lệ), `test/12-audit-fixes` (mã chứng từ, tồn/tiền của dữ liệu demo).

## 3. Thiết kế đáng chú ý

- `inventory` khoá chính `(warehouse_id, batch_id)` — mỗi lô một dòng tồn mỗi kho; không có bảng
  "tồn tổng" để lệch.
- `order_line_allocations` là nguồn sự thật của việc giữ chỗ: `reserved_qty`, `shipped_qty`,
  `status` (ACTIVE/CANCELLED/SHIPPED). Xuất kho chỉ đổi `shipped_qty` và `inventory`.
- `code_sequences(kind, year)` cấp mã chứng từ trong transaction. Migration 010 chốt lại mốc theo
  dữ liệu đã có, nên không tái diễn lỗi trùng mã.
- `stock_movements` bất biến (chỉ ghi thêm) kèm `on_hand_after` để đối soát về sau.
- `session_revocations` + `users.token_version` cho phép thu hồi phiên tức thời.
- `qr_codes.token` ngẫu nhiên `base64url`, `UNIQUE`, một token một lô; `qr_scans` ghi lượt quét.
- `idempotency_records` giữ khoá đặt đơn để phát lại trả cùng `order_id`.
- `batch_promotions`/`product_promotions` tách khỏi `promotions` để giới hạn phạm vi áp dụng.

## 4. Vấn đề còn lại

| # | Vấn đề | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| D1 | **29 cột khoá ngoại chưa có chỉ mục** (`audit_logs.actor_id`, `batches.season_id`, `crop_seasons.farm_id`, `complaints.order_id`, `certificates.batch_id`, `complaint_messages.complaint_id`, …) | Ở 12 MB chưa thấy chậm; khi dữ liệu lớn, truy vấn theo cha sẽ quét bảng | Thêm chỉ mục khi bảng vượt ~100k dòng (`CREATE INDEX ON complaints(order_id)` …) |
| D2 | Chưa có phân vùng theo thời gian cho `audit_logs`, `qr_scans`, `stock_movements` | Bảng chỉ tăng | Cân nhắc `PARTITION BY RANGE (created_at)` khi lưu lượng thật |
| D3 | `wards` là dữ liệu tham chiếu 104 dòng nạp bằng migration | Cần chạy lại khi danh mục hành chính đổi | Đã có `005_reconcile_ward_codes.sql`; thêm script đồng bộ khi cần |

Không có dữ liệu sai lệch, không có bảng thiếu khoá chính, không có khoá ngoại mồ côi.
