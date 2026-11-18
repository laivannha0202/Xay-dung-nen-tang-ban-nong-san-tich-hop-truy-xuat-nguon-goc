# Kiểm toán hệ thống cuối — AgriMarket V7.2

- Nhánh: `feat/premium-visual-redesign-v5` · mốc so sánh `854b4f3`
- Ngày: 2026-11-18 · Người chạy: kiểm toán tự động (không có kết quả mô phỏng)
- Phạm vi: `apps/api`, `apps/admin-web`, `apps/customer-web`, `apps/customer-mobile`, PostgreSQL

## 1. Phạm vi và cách chứng minh

Mỗi kết luận dưới đây gắn với một lần chạy thật. Bốn nguồn bằng chứng:

| Nguồn | Lệnh | Số liệu |
|---|---|---|
| Bộ test API | `cd apps/api && npx vitest run` | **12 file / 62 test PASS** |
| Cổng kiểm tra repo | `pnpm verify:local` | **10/10 bước PASS** |
| Kiểm thử đầu-cuối trình duyệt | `pnpm e2e:local` | **10/10 bước PASS** |
| Kịch bản nghiệm thu chuỗi thật | `node scripts/acceptance-walk.mjs` | **38/38 bước PASS** |

Bổ sung: quét 32 tuyến Admin bằng trình duyệt thật (`200` toàn bộ, 0 lỗi console), quét toàn bộ
tuyến cửa hàng, quét Expo web, 9 phép thử bảo mật thủ công, và một lượt kiểm toán trực tiếp
schema/dữ liệu trên PostgreSQL.

## 2. Trạng thái dịch vụ tại thời điểm kiểm toán

| Dịch vụ | Địa chỉ | Trạng thái |
|---|---|---|
| API | `http://127.0.0.1:4000` | 200 (`/api/v1/health`) |
| PostgreSQL | `127.0.0.1:5544/agrimarket` | kết nối OK, 45 bảng |
| customer-web | `http://localhost:3000` | 200 |
| admin-web | `http://localhost:3001` | 200 |
| Expo web | `http://localhost:8081` | bundle 200 |

## 3. Kết quả hợp nhất

| Hạng mục | PASS | FAIL | PARTIAL | BLOCKED |
|---|---|---|---|---|
| 64 yêu cầu Admin (P1) | 64 | 0 | 0 | 0 |
| 58 yêu cầu Customer (P1) | 56 | 0 | 2 | 0 |
| **Tổng 122 P1** | **120** | **0** | **2** | **0** |

Chi tiết từng mã: `docs/final-acceptance/ACCEPTANCE_MATRIX_122.md`.

- **PARTIAL** = hành vi đúng và đã chứng minh trên Web/API, nhưng một phần yêu cầu (thường là
  phía app native hoặc một nhánh UI) chưa chứng minh được trên thiết bị thật.
- **BLOCKED** = `CUS-09-06` (quyền camera trên thiết bị). Metro web không thay thế được.

## 4. Lỗi tìm thấy và đã sửa trong đợt này

| # | Lỗi | Mức | Sửa |
|---|---|---|---|
| S-01 | Tạo mùa vụ đầu tiên trên Admin trả 500 `duplicate key crop_seasons_code_key`: seed ghi mã `SS-2026-0001…` nhưng `code_sequences` không biết, bộ sinh mã lại cấp đúng số đó | P0 | `apps/api/migrations/010_document_sequence_backfill.sql` nâng `code_sequences` theo mã đã có; `seed.ts` cũng chốt lại sau khi seed |
| S-02 | Seed để lại `ACTIVE` reservation trên đơn `CANCELLED` và đơn `PAID` không có dòng `payments` — tồn giữ chỗ và doanh thu lệch so với chính các đơn demo | P1 | `seed-demo-orders.ts`: allocation huỷ đặt `CANCELLED`/`reserved 0`, thêm `payments` cho đơn đã trả, thêm bước sửa idempotent cho dữ liệu cũ |
| S-03 | Chi tiết đơn của khách không có đường dẫn tra cứu lô đã xuất (CUS-04-04, CUS-07-05) | P1 | API trả `qr_token` trong allocation (`routes/customer.ts`); trang chi tiết đơn render mã lô thành link `/t/<token>` |
| S-04 | `008_demo_lab_tests.sql` không idempotent: migration runner dừng vì cột `is_demo` đã có trên DB thật | P1 | `ADD COLUMN IF NOT EXISTS` |
| S-05 | Không có kịch bản nghiệm thu lặp lại được cho chuỗi truy xuất | P1 | `scripts/acceptance-walk.mjs` (38 bước, tự tạo và dọn dữ liệu) |

Test hồi quy cho S-01…S-03: `apps/api/test/12-audit-fixes.test.ts` (3 test).

## 5. Điểm mạnh có bằng chứng

- Truy xuất nguồn gốc đúng nghĩa: mã QR ngẫu nhiên (`base64url`), trang công khai không cần
  đăng nhập, chặn công khai khi thiếu phiếu kiểm nghiệm, cảnh báo thu hồi/hết hạn hiển thị trước
  thông tin quảng bá, có bản PDF.
- Tồn kho theo lô với bất biến kiểm chứng được: `SUM(inventory.reserved_qty) ==
  SUM(open ACTIVE allocations)` (6 = 6 tại thời điểm kiểm toán); không tồn âm, không giữ chỗ quá
  tồn, không bản ghi mồ côi.
- Bảo mật: 401/403 đúng ranh giới vai trò, chống IDOR (404), chống SQL injection, chống mass
  assignment (ép `role=CUSTOMER`), rate limit đăng nhập (429), CSRF header cho mutation bằng cookie,
  thu hồi token theo `jti`.
- Khoá bán tự động khi phiếu kiểm nghiệm Không đạt; thu hồi khoá bán ngay và tách đơn chưa/đã xuất.

## 6. Giới hạn của đợt kiểm toán

1. Không có thiết bị/emulator Android hay iOS. Toàn bộ phần native (camera, secure store, deep
   link) là **BLOCKED**, không phải PASS. Hướng dẫn chạy: `NATIVE_TESTING_GUIDE.md`.
2. Không chạy GitHub Actions (theo yêu cầu). Toàn bộ cổng kiểm tra chạy cục bộ.
3. Không reset DB thật. Các lỗi dữ liệu demo được sửa tiến (migration + seeder idempotent), không
   xoá dữ liệu.
4. Băm mật khẩu dùng **scrypt** (`scrypt$N$salt$hash`, so sánh timing-safe), không phải bcrypt/Argon2
   như câu chữ yêu cầu. Đánh giá: tương đương về mục tiêu, đã ghi rõ trong ma trận.

## 7. Kết luận

Không còn lỗi P0/P1 đã biết trong mã nguồn. 120/122 yêu cầu P1 đạt đầy đủ bằng chứng chạy thật;
2 mục đạt một phần (giới hạn ở app native). 58 mục phía app native
ghi BLOCKED vì không có thiết bị. Điều kiện còn lại để bảo vệ: chạy `NATIVE_TESTING_GUIDE.md` trên
một máy Android thật và chụp lại kết quả.
