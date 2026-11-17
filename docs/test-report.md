# Báo cáo kiểm thử

Chạy: `cd apps/api && npx vitest run` — cơ sở dữ liệu thật `agrimarket_test` (dựng lại bằng `bootstrap()` trong `test/helpers.ts`: migrate + seed trước mỗi tệp), `fileParallelism: false`.

**Kết quả lần chạy cuối: 8 tệp / 51 test đạt.**

```
✓ test/01-provenance.test.ts   (4 tests)
✓ test/02-allocation.test.ts   (8 tests)
✓ test/03-lifecycle.test.ts    (6 tests)
✓ test/04-pdf.test.ts          (2 tests)
✓ test/05-p1-gaps.test.ts      (8 tests)
✓ test/06-logic-gates.test.ts  (4 tests)
✓ test/07-service-area.test.ts (12 tests)
✓ test/08-security.test.ts     (8 tests)  ← mới: uploads + logout + seed guard

Test Files  8 passed (8)
     Tests  51 passed (51)
  Duration  ~19s
```

## Phạm vi phủ

| Tệp | Test | Bất biến kiểm chứng |
|---|---|---|
| `01-provenance` | TC01 | API công khai từ chối lô chưa có phiếu kiểm nghiệm `PASS` hiệu lực |
| | TC02 | Thu hoạch trước ngày cách ly thuốc BVTV bị từ chối |
| | TC03 | Phiếu `FAIL` khoá lô và chặn checkout ngay |
| | TC04 | QR trả nông trại/mùa vụ/lô, ẩn bản nháp, token lạ → 404 |
| `02-allocation` | #6 | Hai khách tranh suất cuối — chỉ một đơn thắng, tồn không âm |
| | #7 | 7 kg từ A(4)+B(6) phân bổ A4+B3 theo thứ tự nhập FIFO |
| | #8 | Huỷ đơn nhả `reserved`, không tăng `on_hand` |
| | #9 | Xuất kho giảm cả `on_hand` và `reserved`, giữ nguyên dòng phân bổ |
| | #10 | Lặp cùng `Idempotency-Key` chỉ tạo một đơn |
| | #11 | Giá đổi giữa preview và xác nhận → buộc tính lại (`PRICE_CHANGED`) |
| | #12 | Lô hết hạn không xuất được; phân bổ lại sang lô hợp lệ |
| `03-lifecycle` | auth | Khách không gọi được endpoint quản trị, không đọc được đơn người khác |
| | #13 | Thu hồi chỉ nhắm khách thật sự đã nhận lô |
| | #15 | Giao thất bại không hoàn tồn khả dụng |
| | #16 | Đánh giá chỉ sau khi giao, không trùng lặp |
| | #17 | Khiếu nại từ tem QR không cần đơn, giữ lịch sử trao đổi |
| | #19 | Doanh thu = tiền đã thu − hoàn tất; bỏ qua yêu cầu hoàn đang chờ |
| | P2 | FEFO chọn lô hết hạn sớm nhất; giảm giá chỉ áp đúng khối lượng lô đó |
| `04-pdf` | #20 | PDF thật, giải nén mọi luồng Flate, không lộ email/số điện thoại |
| | — | Token lạ → 404, không trả PDF rỗng |
| `07-service-area` | dataset | Đúng 104 đơn vị (93 Xã + 11 Phường), `dataset_version`, tìm "pho hien" không dấu, tỉnh khác → rỗng |
| | address | Lưu chỉ bằng `ward_code`; mã xã lạ bị từ chối; tên xã/tỉnh do server resolve |
| | legacy | Địa chỉ cũ `ward_code IS NULL` → `needs_confirmation`; `PATCH` chọn lại thì hết cờ |
| | phí | 20.000₫ dưới 500.000₫, 0₫ từ ngưỡng, `address_status=MISSING` → `ship_fee_final=false` |
| | cổng chặn | Xã bị tắt → 409 `SERVICE_AREA_UNAVAILABLE`, không giữ kho, không tạo `idempotency_records` |
| | admin | `PATCH /admin/service-area/wards/:code` tắt/bật, xã biến mất rồi hiện lại trong picker |
| `08-security` | uploads | `/uploads/:name` 401/403/404 với người lạ; owner và admin đọc được; `cache-control` private |
| | catalogue | Ảnh `PRODUCT` public vĩnh viễn, kể cả khi chưa gắn lô |
| | evidence | File hồ sơ chỉ public khi lô đã `PUBLISHED`; lô chuyển DRAFT → 404 ngay |
| | chặn | URL không tồn tại, traversal, bytes không phải ảnh/PDF đều bị từ chối |
| | logout | Thu hồi đúng một token (`jti`), token khác vẫn dùng được |
| | seed | `seed.ts` từ chối TRUNCATE ngoài `NODE_ENV=test`/`demo` khi thiếu `ALLOW_DESTRUCTIVE_SEED=yes` |

## Ghi chú kỹ thuật

- `04-pdf.test.ts` giải nén các luồng `FlateDecode` bằng `inflateSync` trước khi so khớp PII; quét byte thô của PDF sinh dương tính giả ngẫu nhiên trong các khối nhị phân.
- Test #13 và các tệp sau dùng chung fixture `LO-2026-0001`; tệp nào làm biến dạng thì tự phục hồi, và mỗi tệp `bootstrap()` lại nên thứ tự chạy không ảnh hưởng.
- Không test UI tự động. Bề mặt web và di động được kiểm bằng trình duyệt thật (Playwright) trong `docs/demo-script.md`.

## Chưa phủ

| Vùng | Lý do |
|---|---|
| Upload qua giao diện (kéo thả nhiều tệp, tiến trình) | Đã có test API cho quyền/MIME; phần UI kiểm bằng Playwright, không tự động hoá. |
| Gửi email/SMS | Ngoài phạm vi P1. |
| Tải đồng thời ở mức lớn (hàng trăm request) | Ngoài phạm vi đồ án; test #6 phủ đúng điểm tranh chấp quan trọng. |
