# BUSINESS LOGIC & DATA VERIFICATION

Mọi số liệu dưới đây đọc trực tiếp từ PostgreSQL `agrimarket` (cổng 5544) sau thao tác thật trên UI/API.

## 1. Luồng đơn hàng đầy đủ (AGM-2026-0007)

| Bước | Thao tác | Bằng chứng |
|---|---|---|
| Đặt | khach1 thêm 3 kg cà chua, checkout COD | preview: phân bổ FIFO lô `LO-2026-0002`, tiền hàng 126.000₫ + ship 20.000₫ = 146.000₫ |
| Xác nhận | admin confirm | `orders.status = CONFIRMED` |
| Thanh toán | mark paid (modal lý do) | `payments.status = PAID`, `paid_at` có giá trị |
| Chuẩn bị | prepare | `PREPARING` |
| Xuất kho | ship GHN/12000 | `stock_movements` type OUT qty 3; `order_line_allocations.shipped_qty = 3`; `inventory.on_hand_qty` lô 0002: 296 → 293 |
| Giao | deliver | `orders.status = DELIVERED`, `payment_status = PAID` |

Kiểm tra chéo: `reserved` của lô về 0 sau khi xuất; `available = on_hand - reserved` = 293.

## 2. Khuyến mãi và tính tiền (AGM-2026-0008)

| Trường | Giá trị DB |
|---|---|
| `subtotal_vnd` | 294.000 |
| `discount_vnd` | 29.400 (mã `AUDIT99855`, 10%) |
| `ship_fee_vnd` | 20.000 |
| `total_vnd` | 284.600 |
| `promotion_snapshot` | `{"code":"AUDIT99855",...,"discount_vnd":29400}` |
| `promotions.used_count` | 1 |

Công thức kiểm: 294.000 − 29.400 + 20.000 = 284.600 ✓

## 3. Hủy đơn nhả giữ chỗ (AGM-2026-0008)

| Kiểm tra | Trước hủy | Sau hủy |
|---|---|---|
| `orders.status` | PENDING | CANCELLED |
| `order_line_allocations.status` | ACTIVE | CANCELLED |
| `inventory.reserved_qty` (lô) | 7.000 | 0 |
| `inventory.on_hand_qty` | không đổi | không đổi |
| `audit_logs` | `order.created` | `order.created`, `order.cancelled` |

## 4. Kiểm nghiệm Không đạt khoá lô

| Bước | Kết quả |
|---|---|
| `POST /admin/batches/:id/lab-tests` với 1 chỉ tiêu FAIL | 201, phiếu `overall_result=FAIL` |
| Batch sau đó | `quality_status=FAIL`, `safety_status=HOLD` |
| `POST /admin/batches/:id/publish` | 422 — "Lô phải có kết quả kiểm nghiệm Đạt; Lô đang bị tạm giữ…" |
| Tạo phiếu PASS mới | 201, phiếu cũ vẫn tồn tại (`is_effective=false`) |
| Mở khoá lại | cần Admin xác nhận, ghi `batchEvent` + audit |

## 5. Cách ly thuốc bảo vệ thực vật (ADM-04-03)

| Hành động | `earliest_harvest_date` |
|---|---|
| Trước | 2027-01-02 |
| Thêm log PESTICIDE ngày +90, `isolation_days = 14` | 2027-02-28 |
| Log PESTICIDE thiếu `isolation_days` | 422 `INVALID_DATA` với `field_errors.isolation_days` |

## 6. Điều chỉnh tồn kho

| Thao tác | Kết quả |
|---|---|
| `POST /admin/stock/adjustments` delta −1 | 201, `stock_movements` type ADJUST xuất hiện với lý do |
| delta −999999 | 422 "Tồn kho không được âm" (và DB có CHECK `inventory_nonneg`) |
| delta làm on_hand < reserved | 422 "…nhỏ hơn lượng đang giữ chỗ" |

## 7. Thu hồi lô

| Kiểm tra | Kết quả |
|---|---|
| Bán lô RECALLED | `SELLABLE_SQL` loại → preview 409 `OUT_OF_STOCK` (test `ADM-07-06`) |
| Đơn chưa xuất dùng lô | allocation → `NEEDS_REALLOCATION`, order `needs_reallocation=true` |
| Danh sách khách ảnh hưởng | chỉ đơn có `shipped_qty > 0` của đúng lô (test 03-lifecycle) |

## 8. Bảo mật dữ liệu

| Kiểm tra | Bằng chứng |
|---|---|
| Đăng ký không tự gán role | payload `role=ADMIN` → user thực tế `CUSTOMER` |
| Khoá tài khoản | login 403 `ACCOUNT_LOCKED`, API `/me/*` 401, phiên cũ chết |
| Đăng xuất thu hồi đúng thiết bị | `/auth/logout` → token cũ `/me` 401, bảng `session_revocations` có `jti` |
| Brute force | 5 lần sai/15 phút → 429 |
| Ownership | dữ liệu khách khác → 404 (địa chỉ, đơn, đánh giá, khiếu nại, hội thoại) |
| Upload | HTML giả `image/png` → 422; tệp lưu tên ngẫu nhiên, `is_public=false` |

## 9. Mã chứng từ (sửa trong phiên này)

| Trước | Sau |
|---|---|
| `AGM-<năm>-<COUNT(*)+1>` — trùng UNIQUE sau khi có đơn CANCELLED hoặc bị xoá | bảng `code_sequences(kind, year, last_value)` tăng nguyên tử trong transaction |
| Khiếu nại `KN-00001` cùng công thức | `KN-<năm>-<seq>`; thực tế sinh `KN-2026-0005` liên tiếp không trùng |
| Mã mùa vụ `SS-<năm>-<COUNT(*)+1>` (đợt 2026-11-17) | `code_sequences(kind='season')` cùng `ON CONFLICT … DO UPDATE … RETURNING`; năm lấy từ `todayVN()` |

Bằng chứng backfill: `code_sequences` = `{order: 9, complaint: 5}` khớp mã lớn nhất hiện có (`AGM-2026-0009`).

## 10. Lỗi nghiệp vụ tìm và sửa trong đợt 2026-11-17

Mỗi lỗi có test hồi quy trong `apps/api/test/06-logic-gates.test.ts` (hoặc `01-provenance` cho TC02b) — `cd apps/api && pnpm test` → 6 files, 32 passed.

| # | Lỗi (trước) | Sửa | Test |
|---|---|---|---|
| 1 | `POST /admin/orders/:id/reallocate` nhả `reserved_qty` cũ nhưng giữ chỗ `body.quantity` tuỳ ý và dùng `warehouse_id` cũ → thổi tồn giữ chỗ, cho phép bán quá | Chặn `quantity > reserved_qty` (422), lấy `warehouse_id` từ `inventory` của lô đích, `UPDATE … WHERE on_hand_qty - reserved_qty >= n RETURNING reserved_qty` | `06-logic-gates` ×2 |
| 2 | `POST /admin/refunds` chặn theo `orders.total_vnd` → hoàn được tiền chưa hề thu | Trần = `SUM(payments.amount_vnd WHERE status='PAID')` − `SUM(refund_requests IN PENDING/APPROVED/COMPLETED)`; 422 khi chưa thu hoặc vượt trần | `06-logic-gates` ×1 |
| 3 | Cửa cách ly thuốc BVTV lùi 1 ngày (`new Date(x).toISOString()` trên mốc nửa đêm ICT) → thu hoạch lọt trong thời gian cách ly | `to_char(max(activity_at + isolation_days),'YYYY-MM-DD')`; `earliest_harvest_date` trả cùng định dạng | `01-provenance` TC02b |
| 4 | Mã mùa vụ `COUNT(*)+1` trùng sau khi xoá mùa vụ | `code_sequences` nguyên tử như đơn hàng/khiếu nại | typecheck + `POST /admin/seasons` |
| 5 | Tem QR in ra chỉ có ảnh QR, PDF truy xuất trỏ `/t/<mã lô>` (sai, phải là token) | `renderLabelPdf` (tên, mã lô, thu hoạch, hạn dùng + QR token) tại `GET /admin/batches/:id/label.pdf`; nút "Tải tem QR"/"In tem" trong admin trỏ endpoint này | `curl … /label.pdf` → 200 `application/pdf` 15.766 B |
| 6 | Trang chủ render trùng key React `promo-<product_id>` (featured ∩ newest) | dedupe theo `id` trước khi ghép danh sách ưu đãi; console 0 lỗi | Playwright console |
| 7 | App giữ badge giỏ cũ sau khi đặt đơn trên web | `reload()` mỗi lần chuyển tab (`App.tsx`); đặt đơn web → badge app về `Giỏ` | Playwright :8081 |

