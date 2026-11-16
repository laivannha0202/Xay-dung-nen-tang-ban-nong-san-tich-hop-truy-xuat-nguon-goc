# Báo cáo kiểm thử

Chạy: `cd apps/api && npx vitest run` — cơ sở dữ liệu thật `agrimarket_test` (dựng lại bằng `bootstrap()` trong `test/helpers.ts`: migrate + seed trước mỗi tệp), `fileParallelism: false`.

**Kết quả lần chạy cuối: 4 tệp / 20 test đạt.**

```
✓ test/01-provenance.test.ts (4 tests)
✓ test/02-allocation.test.ts  (8 tests)
✓ test/03-lifecycle.test.ts   (6 tests)
✓ test/04-pdf.test.ts         (2 tests)

Test Files  4 passed (4)
     Tests  20 passed (20)
  Duration  ~8s
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

## Ghi chú kỹ thuật

- `04-pdf.test.ts` giải nén các luồng `FlateDecode` bằng `inflateSync` trước khi so khớp PII; quét byte thô của PDF sinh dương tính giả ngẫu nhiên trong các khối nhị phân.
- Test #13 và các tệp sau dùng chung fixture `LO-2026-0001`; tệp nào làm biến dạng thì tự phục hồi, và mỗi tệp `bootstrap()` lại nên thứ tự chạy không ảnh hưởng.
- Không test UI tự động. Bề mặt web và di động được kiểm bằng trình duyệt thật (Playwright) trong `docs/demo-script.md`.

## Chưa phủ

| Vùng | Lý do |
|---|---|
| Upload tệp (`/uploads`, `/admin/evidence`) | Cần fixture nhị phân; đã kiểm thủ công qua giao diện. |
| Gửi email/SMS | Ngoài phạm vi P1. |
| Tải đồng thời ở mức lớn (hàng trăm request) | Ngoài phạm vi đồ án; test #6 phủ đúng điểm tranh chấp quan trọng. |
