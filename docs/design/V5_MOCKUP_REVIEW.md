# AgriMarket V5 — Gói mockup trình duyệt

Trạng thái: **VISUAL SIGNOFF REQUIRED**. Giai đoạn A (thiết kế) đã xong; giai đoạn B (code giao diện)
chưa bắt đầu cho tới khi mockup được duyệt.

## 1. Nơi xem

| Hạng mục | Tệp |
| --- | --- |
| Moodboard (tham chiếu + bảng màu + kiểu chữ + ảnh) | `docs/design/v5/MOODBOARD.png` |
| Customer Web — trang chủ 1440 | `docs/design/mockups/v5/customer-web-home-1440.png` |
| Customer Web — trang chủ 390 | `docs/design/mockups/v5/customer-web-home-390.png` |
| Admin Web — bảng điều khiển 1440 / 390 | `docs/design/mockups/v5/admin-web-dashboard-1440.png`, `…-390.png` |
| Mobile App — trang chủ 390 / 360 | `docs/design/mockups/v5/mobile-app-home-390.png`, `…-360.png` |
| Passport — lô đạt 1440 / 390 | `docs/design/mockups/v5/traceability-passport-ok-1440.png`, `…-390.png` |
| Passport — lô bị thu hồi 1440 / 390 | `docs/design/mockups/v5/traceability-recall-1440.png`, `traceability-passport-390.png` |
| Contact sheet (ghép) | `docs/design/mockups/v5/contact-sheet-*.jpg` |
| Nguồn HTML (sửa được, render lại) | `docs/design/mockups/v5/*.html` + `mockup.css` |

Render lại: `node .audit/v5/render.mjs` (Playwright Chromium, `deviceScaleFactor: 1`).

## 2. Thay đổi cốt lõi so với V4.2

| # | V4.2 | V5 | Vì sao |
| --- | --- | --- | --- |
| 1 | Hero tối `#092e1b/95` phủ lên ảnh, chữ trắng | **Hero nền kem `#F6F2E9`**, ảnh bên phải, chữ màu tối | Đo ảnh hiện có: luminance 113–142 ⇒ buộc phải phủ tối. V5 chọn ảnh sáng (đã grade lên 159–178) nên bỏ được lớp phủ. |
| 2 | Stat chips nằm trong hero | Chuyển thành **proof row** ngay dưới CTA, cùng một hàng | Giảm rối, giữ số liệu thật |
| 3 | Thẻ sản phẩm có viền + 5 dòng metadata | **Thẻ không viền**, ảnh 1:1, 3 dòng | Ảnh gánh bố cục, lưới đọc nhanh hơn |
| 4 | `space-y-10` (40px) | **64px desktop / 48px mobile**, tiêu đề→lưới 28px | Nhịp thở kiểu genprint |
| 5 | H1 40–52px | **H1 58px desktop / 34px mobile**, tracking −0.035em | Đo genprint: H1 213px, line-height/H1 = 0.89 ⇒ dùng leading 1.04 |
| 6 | Body 14–15px | **15–16px** | V4 sát ngưỡng nhỏ nhất |
| 7 | Admin: KPI hộp + bảng phẳng | **Sidebar + KPI band + chart cột + "Cần chú ý" + bảng sticky head** | V4 đọc như danh sách form |
| 8 | Mobile: cuộn dài, ít nhịp | **Địa chỉ + search dính trên, hero card, 4 lối tắt, lưới 2 cột có nút "+", bottom nav 5 tab** | Đúng cảm giác app thương mại |
| 9 | Passport: bảng kiểm nghiệm phẳng | **Hồ sơ có bìa + timeline 8 bước + thanh tỉ lệ đo/giới hạn + khối QR** | Cảnh báo thu hồi vẫn trên cùng, `role="alert"` |

Bảng màu **giữ nguyên** nhận diện V4 (đúng brief §4); V5 chỉ đổi nền `#F7F8F2 → #FAFAF7` và
thêm `ivory #F6F2E9` cho khung ảnh.

## 3. Kiểm chứng đã chạy trên mockup

| Kiểm tra | Kết quả |
| --- | --- |
| Tràn ngang 1440 | 0 px cho cả 5 trang mockup |
| Tràn ngang 390 | 0 px cho cả 5 trang mockup |
| Ảnh hỏng (`naturalWidth === 0`) | 0 — đã sửa 14 đường dẫn sai ở lượt đầu |
| Chữ bị cắt do `overflow:hidden` | 0 |
| Chiều cao trang chủ 1440 | 4110 px (V4.2: 4730 px) — gọn hơn, ít khối hơn |

## 4. Giới hạn trung thực

1. **Chưa có review thị giác bằng mô hình.** API thị giác trả `402 Paid Model - Credits Required`
   suốt phiên (thử 3 lần, kể cả sau khi reset). Mọi kết luận về thẩm mỹ trong tài liệu này là
   **số đo + ảnh chụp để người đọc tự đánh giá**, không phải điểm do mô hình chấm.
2. **8/14 ảnh sản phẩm chưa có bản studio.** Đã thử 3 vòng truy vấn Commons + Openverse cho từng
   từ khoá; kho CC không có ảnh nền trắng cho dưa hấu, đu đủ, bí đỏ, rau muống, xà lách, gạo nếp,
   mật ong. Giữ ảnh cũ trong khung kem. Cần người chụp/tải ảnh thật để đạt 100%.
3. **Mockup chỉ phủ 4 màn hình.** Chưa có mockup cho: danh sách sản phẩm, chi tiết sản phẩm, giỏ,
   thanh toán, tài khoản, theo dõi đơn, và 17 trang admin còn lại. Nếu duyệt hướng đi, các màn
   còn lại sẽ code theo cùng hệ thống và chụp ảnh nghiệm thu riêng.
4. **Admin 390 chỉ là trạng thái thu gọn**, không phải thiết kế mobile riêng cho quản trị.

## 5. Cần người dùng quyết

- Duyệt hướng "sáng / editorial" này để code, hay giữ hero tối của V4?
- Concept hero nào làm mặc định: *Nông sản tươi mỗi ngày* / *Đặc sản Hưng Yên* / *Từ nông trại
  đến bàn ăn* (cả ba vẫn còn trong mockup để chuyển)?
- Có cần chụp/tải thêm ảnh studio cho 8 sản phẩm còn lại trước khi code không?
