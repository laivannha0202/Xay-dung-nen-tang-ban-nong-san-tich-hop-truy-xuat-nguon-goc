# Kịch bản demo (10 bước, đã chạy thật)

Chuẩn bị: `node scripts/db.mjs up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm api`, `pnpm web`, `pnpm mobile`.
Mở **`http://localhost:3000`** (không dùng `127.0.0.1` — CORS chỉ cho `localhost`).

Ảnh chụp trong `docs/screenshots/` ứng với từng bước.

## 1. Hai khách + quản trị + danh mục có sẵn

Seed tạo 1 ADMIN (`admin@agrimarket.vn`), 2 CUSTOMER (`khach1@`, `khach2@`), 4 danh mục, 6 sản phẩm, 2 nhà cung cấp, 2 nông trại, 1 kho `KHO-HCM`. Mở `/` → 6 sản phẩm có ảnh thật, nhãn "Lô cận hạn giảm giá" ở cà chua.
→ `01-home-1440.png`, `02-home-390.png`

## 2. Mùa vụ + nhật ký + lần phun thuốc có thời gian cách ly

`/admin/mua-vu` → `SS-2026-0001` (cà chua, nông trại Đơn Dương). Nhật ký có 6 mục, trong đó **Phun thuốc BVTV – Bacillus thuringiensis, cách ly 7 ngày**.
→ Mở `/t/demo-ca-chua-lo-0001` để thấy timeline này ở phía khách.

## 3. Cố tạo lô thu hoạch quá sớm → bị chặn

`POST /admin/batches` với `harvest_date` trước `activity_at + isolation_days` → `409 INVALID_DATA` ("Thu hoạch sớm hơn thời gian cách ly"). Test `TC02` phủ đúng nhánh này. Sửa ngày hợp lệ thì tạo được.

## 4. Phiếu kiểm nghiệm Không đạt khoá lô, phiếu Đạt mới mở lại

`/admin/lo-hang/[id]` → thêm phiếu: chọn "Không đạt" → lô chuyển `quality_status = FAIL`, biến khỏi catalog và checkout (`TC03`). Thêm phiếu mới "Đạt" → phải bấm **xác nhận mở khoá** kèm lý do; phiếu cũ vẫn còn trong lịch sử.

## 5. Công khai lô + in tem QR

Công khai bị chặn khi thiếu phiếu Đạt hiệu lực hoặc còn thời gian cách ly (`TC01`). Sau khi công khai: `/admin/ma-qr` tải ảnh PNG tem, `/admin/lo-hang/[id]` có nút tải PDF. Quét/nhập `demo-ca-chua-lo-0001` ở `/tim-kiem` → hồ sơ đầy đủ.
→ `04-trace-1440.png`, `05-trace-390.png`

## 6. Nhập kho theo thứ tự A rồi B

`/admin/kho` → nhập `LO-2026-0001` 4 kg, rồi `LO-2026-0002` 6 kg. Mỗi lần nhập ghi `received_at` và một dòng `stock_movements`.
→ Bảng tồn hiện `on_hand / reserved / available` tách cột.

## 7. Khách đặt 7 kg trên web → FIFO A4 + B3

Đăng nhập `khach1@example.com`. `/san-pham/ca-chua-bien` → thêm 7 kg → `/thanh-toan`.
Kiện hàng hiển thị **Lô LO-2026-0001 — 4 kg · Lô LO-2026-0002 — 3 kg** (FIFO theo ngày nhập, không theo hạn dùng). Xác nhận → đơn `AGM-2026-0004`.
→ `06-checkout-1440.png`, `07-order-success-1440.png`
Mở tab **Giỏ** trên ứng dụng di động: giỏ dùng chung dữ liệu với web.

## 8. Admin xác nhận → xuất kho → giao → khách xem lô thực xuất → đánh giá

`/admin/don-hang/[id]`: **Xác nhận đơn** → **Bắt đầu chuẩn bị** → **Xuất kho & giao hàng** (GHN / GHN12345 / Nguyễn Văn Giao). Xuất kho trừ `on_hand` và `reserved`, gắn `shipped_qty` vào từng phân bổ (`#9`).
**Xác nhận đã thanh toán** với mã `CK-2026-1116-01`. **Xác nhận đã giao**.
→ `08-admin-order-1440.png`, `09-admin-order-paid-1440.png`
Phía khách `/tai-khoan/don-hang/[id]`: "Lô LO-2026-0001 · giữ 3 · đã xuất 3" → bấm **Đánh giá** → 5★ kèm nhận xét.

## 9. Thu hồi lô A → QR đỏ → danh sách khách đã nhận

`/admin/lo-hang/[id]` của `LO-2026-0001` → **Thu hồi lô**, lý do "Phát hiện dư lượng thuốc BVTV vượt ngưỡng qua kiểm tra hậu kiểm", mức độ Nghiêm trọng.
Kết quả: lô `safety_status = RECALLED`, biến khỏi catalog ngay; `/t/demo-ca-chua-lo-0001` hiện banner đỏ **LÔ HÀNG ĐANG BỊ THU HỒI** trước mọi thông tin khác; `/admin/thu-hoi/[id]` liệt kê đúng 2 khách đã nhận (`AGM-2026-0001`, `AGM-2026-0004`), đơn chưa xuất cần đổi lô = 0; lô B `LO-2026-0002` **không** bị gán nhầm.
→ `12-trace-recalled-1440.png`, `10-admin-recalls-1440.png`, `11-admin-recall-detail-1440.png`
Khách vào `/tai-khoan/don-hang/[id]` thấy "Lô đã giao thuộc diện thu hồi: LO-2026-0001".

## 10. Liên hệ khách → hoàn tiền → báo cáo → PDF

`/admin/thu-hoi/[id]` → ghi nhận liên hệ từng khách ("Đã liên hệ").
`/admin/don-hang/[id]` → **Tạo yêu cầu hoàn tiền** 120.800₫ (toàn bộ đơn) → `/admin/thanh-toan` duyệt → **Đã chuyển tiền**.
`/admin/bao-cao`: doanh thu thuần = 224.800₫ đã thu − 120.800₫ hoàn tất = **104.000₫** (`#19`).
Dashboard `/admin` khớp con số đó.
→ `13-admin-refund-1440.png`, `14-admin-reports-1440.png`, `15-admin-dashboard-1440.png`

Cuối cùng: `/t/demo-xoai-lo-0005/pdf` tải phiếu truy xuất PDF (P2), không chứa email/số điện thoại khách (`#20`).

## Ứng dụng di động

Tabs: **Trang chủ** (danh mục + sản phẩm bán chạy) · **Giỏ** · **Quét QR** (camera `expo-camera`, từ chối quyền vẫn nhập mã tay) · **Đơn hàng** · **Tài khoản** (đăng nhập/đăng ký, đăng xuất). Điều hướng tab + stack bằng state cục bộ, token lưu `expo-secure-store`.
→ `16-mobile-home-390.png`, `17-mobile-scan-390.png`, `18-mobile-trace-390.png`

## Điểm responsive

`19-catalog-768.png` (tablet), `20-catalog-360.png` (điện thoại nhỏ), cùng `02-home-390.png` và `05-trace-390.png` xác nhận lưới và bảng co đúng ở 360/390/768/1280/1440 px.
