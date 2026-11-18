# Vấn đề còn lại

Ghi nhận tại 2026-11-18, sau khi đã sửa 5 lỗi trong `FINAL_SYSTEM_AUDIT.md` §4. Không có mục nào ở
mức chặn bảo vệ.

## A. Chưa chứng minh được (BLOCKED)

| # | Nội dung | Mã P1 | Vì sao | Cách đóng |
|---|---|---|---|---|
| B1 | Quét QR bằng camera trên Android/iOS thật; màn hình từ chối quyền camera | `CUS-09-06`, `CUS-09-01` | Không có thiết bị/emulator | `NATIVE_TESTING_GUIDE.md` bước 15–16 |
| B2 | Secure store, deep link, mạng thật, thông báo trên thiết bị | toàn bộ `CUS-*` (cột App) | như trên | cùng tài liệu, mục 2 |

## B. Đạt một phần (PARTIAL)

| # | Nội dung | Mã P1 | Thiếu gì | Đề xuất |
|---|---|---|---|---|
| P2 | Nhánh hiển thị khiếu nại trên app native | `CUS-11-06` | chỉ kiểm trên web | `NATIVE_TESTING_GUIDE.md` bước 24 |

## C. Nợ kỹ thuật đã biết, không ảnh hưởng nghiệm thu

| # | Nội dung | Ảnh hưởng | Khi nào xử lý |
|---|---|---|---|
| T1 | 29 cột khoá ngoại chưa có chỉ mục (`audit_logs.actor_id`, `batches.season_id`, `crop_seasons.farm_id`, `complaints.order_id`, `certificates.batch_id`, …) | Chưa thấy chậm ở 12 MB; sẽ chậm khi bảng lớn | thêm `CREATE INDEX` khi bảng vượt ~100k dòng |
| T2 | `apps/api/src/routes/adminOps.ts` 1195 dòng, `admin.ts` 959 dòng | Khó điều hướng khi mở rộng | tách theo miền khi thêm tính năng |
| T3 | Rate limit lưu trong bộ nhớ tiến trình | Chỉ đúng khi chạy một tiến trình API | chuyển sang Redis khi scale ngang |
| T4 | Chưa phân vùng `audit_logs`, `qr_scans`, `stock_movements` | Bảng chỉ tăng | `PARTITION BY RANGE` khi lưu lượng thật |
| T5 | Không có 2FA cho Admin | Rủi ro thấp trong phạm vi đồ án | ngoài P1 |
| T6 | 19 đơn demo / 44 sản phẩm demo — một số slug chỉ duyệt được, chưa có đơn mẫu | Chỉ ảnh hưởng kịch bản demo | thêm spec vào `seed-demo-orders.ts` nếu cần |
| T7 | `docs/demo-script.md` mô tả 6 sản phẩm (bản seed gốc); bộ demo hiện có 50 | Tài liệu cũ | đã có `docs/final-acceptance/DEMO_SCENARIO.md` thay thế cho buổi bảo vệ |

## D. Việc không làm theo yêu cầu

| # | Nội dung |
|---|---|
| N1 | Không chạy GitHub Actions; toàn bộ cổng kiểm tra chạy cục bộ (`verify:local`, `e2e:local`, `acceptance-walk`) |
| N2 | Không reset DB thật; lỗi dữ liệu demo sửa tiến bằng migration + seeder idempotent |
| N3 | Không merge vào `main`, không force push |
| N4 | Không đổi thiết kế giao diện |
