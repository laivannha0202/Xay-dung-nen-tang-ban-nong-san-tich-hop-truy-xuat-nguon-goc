# Ma trận nghiệm thu 122 yêu cầu P1 — kết quả thực tế

Nguồn chuẩn (giữ nguyên mã và câu chữ yêu cầu gốc):
[`docs/AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md`](../AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md)

## 1. Tổng hợp

| Nhóm | Số yêu cầu | PASS | PARTIAL | BLOCKED | FAIL |
|---|---|---|---|---|---|
| Admin Web (ADM-01…13) | 64 | 64 | 0 | 0 | 0 |
| Customer Web (CUS-01…12) | 58 | 56 | 2 | 0 | 0 |
| Customer App native (cùng 58 mã) | 58 | — | — | 58 | 0 |
| **P1 theo tầng API/Web** | **122** | **120** | **2** | **0** | **0** |

- `PASS` = hành vi đã chạy thật và có bằng chứng (test, kịch bản nghiệm thu, phép thử bảo mật hoặc
  truy vấn DB).
- `PARTIAL` = hành vi đúng ở phần đã chạy, còn một phần chưa chứng minh được (thiết bị native hoặc
  một ô nhập UI).
- `BLOCKED` = không thể chứng minh trong môi trường này (thiếu thiết bị).
- **Không có `UNTESTED`, không có `FAIL`.**

## 2. Hai mục PARTIAL và lý do

| Mã | Phần đạt | Phần chưa đạt | Cách đóng |
|---|---|---|---|
| `CUS-09-06` | Web mở `/t/<token>` trực tiếp từ camera hệ thống; mã nguồn native có màn hình từ chối quyền + ô nhập mã tay | Chưa chạy trên thiết bị Android/iOS thật | `NATIVE_TESTING_GUIDE.md` bước 16 |
| `CUS-11-06` | Lô recall: cảnh báo, hướng dẫn liên hệ, link khiếu nại; câu "đã hoàn tiền" chỉ xuất hiện khi refund `COMPLETED` | Nhánh hiển thị trên app native chưa chạy | `NATIVE_TESTING_GUIDE.md` bước 24 |

## 3. Bản đồ bằng chứng dùng chung

| Viết tắt trong ma trận | Nguồn |
|---|---|
| "walk" | `node scripts/acceptance-walk.mjs` — 38/38 bước trên dữ liệu thật, tự dọn |
| `test/NN-*` | `cd apps/api && npx vitest run` — 12 file / 62 test |
| "probe" | 9 phép thử bảo mật thủ công ở `SECURITY_TEST_REPORT.md` §3 |
| "quét 32 tuyến" | trình duyệt thật, 0 lỗi console, mọi tuyến 200 |
| ảnh | `docs/screenshots/final/f1…f16-*.png` |

## 4. Điều kiện kết luận (theo mục D của tài liệu gốc)

- Không dòng nào còn `UNTESTED`/`FAIL`/`NOT_IMPLEMENTED`. Còn 2 `PARTIAL` — đã nêu rõ và **không**
  cộng vào số PASS.
- Public/private đã thử riêng: khách chưa đăng nhập, khách A, khách B, Admin (probe IDOR 404, 403).
- Mục kho/lô/giá/đơn có kiểm trạng thái trước/sau và ca âm: reserved trước/sau khi đặt, `on_hand`
  không đổi khi đặt nhưng giảm khi xuất, `OUT_OF_STOCK` 409, thu hoạch sớm 422, công khai thiếu
  kiểm nghiệm 422, lô thu hồi không còn bán được.
- Mobile: chỉ phần web/bundle được tính; native ghi `BLOCKED`.
