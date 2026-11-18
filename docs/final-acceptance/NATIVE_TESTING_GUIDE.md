# Hướng dẫn kiểm thử app native (Android / iOS)

Trạng thái hiện tại của phần native: **BLOCKED** — máy chạy kiểm toán không có thiết bị thật,
emulator hay Xcode. Tài liệu này là đường chạy để chuyển các mục đó sang PASS.

Bundle web (Metro) **không** tính là kiểm thử native.

## 0. Chuẩn bị

```bash
# API và DB phải sống trước
pnpm db:up
cd apps/api && npx tsx src/scripts/migrate.ts && npx tsx src/scripts/seed.ts

# IP LAN của máy chạy API (điện thoại không dùng được 127.0.0.1)
ipconfig | findstr IPv4
```

Sửa `apps/customer-mobile/app.json` → `expo.extra.apiBase` thành `http://<IP-LAN>:4000/api/v1`,
`webBase` thành `http://<IP-LAN>:3000`. Tài khoản test: `khach1@example.com / Khach@123456`.

## 1. Cài và chạy

| Nền tảng | Lệnh | Ghi chú |
|---|---|---|
| Expo Go (Android) | `cd apps/customer-mobile && npx expo start` rồi quét mã bằng Expo Go | nhanh nhất, đủ cho camera |
| Android emulator | `npx expo run:android` | cần Android Studio + AVD có camera giả lập |
| iOS simulator | `npx expo run:ios` | máy macOS; simulator **không có camera thật** |

## 2. Bảng kiểm trên thiết bị (điền kết quả vào cột cuối)

| # | Mục | Thao tác | Kỳ vọng | Mã P1 | Kết quả |
|---|---|---|---|---|---|
| 1 | Đăng ký | Tab **Tài khoản** → Đăng ký → email mới | Tạo được tài khoản, role CUSTOMER | CUS-01-01 | |
| 2 | Đăng nhập/thiết bị riêng | Đăng nhập trên máy, đồng thời trên web | Cả hai phiên cùng sống; logout máy không ảnh hưởng web | CUS-01-02 | |
| 3 | Mở trang private khi chưa đăng nhập | Giỏ → Thanh toán khi chưa login | Chuyển tới đăng nhập, sau login quay lại đúng màn | CUS-01-05 | |
| 4 | Đăng xuất | Tài khoản → Đăng xuất | Về trạng thái khách; mở lại app vẫn là khách | CUS-01-02 | |
| 5 | Hồ sơ | Sửa họ tên, số liên hệ | Lưu và hiển thị lại đúng | CUS-02-01 | |
| 6 | Địa chỉ | Thêm 2 địa chỉ, đặt 1 mặc định, xoá địa chỉ kia | Đúng một mặc định còn lại | CUS-02-02 | |
| 7 | Duyệt sản phẩm | Trang chủ → danh mục → chi tiết | Giá, đơn vị, ảnh, mô tả, hạn dùng hiển thị | CUS-04-01 | |
| 8 | Giỏ | Thêm cùng sản phẩm 2 lần | Cộng dồn theo product | CUS-05-01 | |
| 9 | Giỏ chéo web↔app | Thêm giỏ trên web, mở giỏ trên app | Nội dung giống nhau | CUS-05-02 | |
| 10 | Checkout | Chọn địa chỉ, COD, đặt | Đơn tạo, có mã `AGM-…` | CUS-06-01…04 | |
| 11 | Đổi giá giữa preview và đặt | Hai thiết bị, đổi giá ở Admin | App yêu cầu xem lại giá, không tự đặt | CUS-06-07 | |
| 12 | Danh sách đơn | Lọc theo trạng thái, khoảng ngày | Đúng tập kết quả | CUS-07-01 | |
| 13 | Chi tiết đơn | Mở đơn đã giao | Có mã lô đã xuất; nhấn mở trang truy xuất | CUS-07-04 | |
| 14 | Huỷ đơn | Huỷ đơn PENDING | Thành công, thấy lý do; tồn được nhả | CUS-08-01…03 | |
| 15 | **Quét QR (camera)** | Tab **Quét QR** → cho phép quyền camera → quét tem | Mở `/t/<token>` trong app; đúng lô | CUS-09-01…02 | |
| 16 | **Từ chối quyền camera** | Từ chối quyền → nhập mã tay `demo-cam-sanh` | Vẫn mở được trang truy xuất | **CUS-09-06** | |
| 17 | QR sai | Quét/nhập mã không tồn tại | Thông báo không tìm thấy | CUS-09-03 | |
| 18 | Lô hết hạn | Quét `demo-ca-chua-het-han` | Cảnh báo hết hạn nổi bật | CUS-09-04 | |
| 19 | Báo cáo vấn đề khi chưa login | Trang truy xuất → Báo cáo vấn đề | Chuyển đăng nhập nhưng giữ `next=/t/<token>` | CUS-09-05 | |
| 20 | Đánh giá | Đơn DELIVERED → Viết đánh giá | Lưu 1 lần; gửi lần 2 bị chặn | CUS-10-01…02 | |
| 21 | Khiếu nại từ đơn nhiều lô | Đơn có 2 lô → chọn lô | Danh sách lô cho chọn, không tự gán | CUS-11-02 | |
| 22 | Đính kèm ảnh | Chụp/tải 1 ảnh vào khiếu nại | Tải lên server thành công, hiện trong ticket | CUS-11-03 | |
| 23 | Trả lời ticket | Gửi tin nhắn trong khiếu nại | Hiện trong lịch sử, không xoá được tin cũ | CUS-11-05 | |
| 24 | Lô recall | Quét một token lô đã thu hồi | Cảnh báo + hướng dẫn liên hệ + link khiếu nại | **CUS-11-06** | |
| 25 | Loading/empty/error | Bật chế độ máy bay, mở danh sách đơn | Có thông báo lỗi và nút thử lại; tắt máy bay → tải lại được | CUS-12-01 | |
| 26 | Lỗi phiên | Vào Admin khoá tài khoản, thao tác trên app | Bị đẩy về đăng nhập, không mất dữ liệu đang nhập quá mức cần | CUS-12-05 | |
| 27 | Điều hướng ngược | Android back ở các màn | Không kẹt màn hình, không thoát đột ngột | CUS-12-05 | |

## 3. Ghi bằng chứng

Ảnh chụp màn hình cho mục 15, 16, 24 (ba mục quyết định PASS/PARTIAL → PASS). Lưu vào
`docs/screenshots/final/native-*.png` và ghi chú thiết bị (model, phiên bản Android/iOS) cạnh ảnh.

## 4. Sau khi chạy

Cập nhật 3 dòng `BLOCKED`/`PARTIAL` trong `docs/AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md`
thành `PASS` kèm ảnh chụp tương ứng, rồi cập nhật `docs/final-acceptance/ACCEPTANCE_MATRIX_122.md` §1.
