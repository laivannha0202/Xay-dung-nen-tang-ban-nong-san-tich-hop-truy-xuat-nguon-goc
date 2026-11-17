# Tham chiếu thị giác (V4)

Hai trang tham chiếu được chụp bằng Playwright ở 1440px (ảnh trong `docs/design/references/`).
Mục tiêu: học *cách* hai thương hiệu này tạo cảm giác cao cấp, không sao chép nội dung hay logo.

| Trang | Ảnh | Điều đáng học | Không bắt chước |
| --- | --- | --- | --- |
| genprint.vn | `genprint-1440.png`, `genprint-full.png` | Nền gần trắng (#FFF/#F6F6F6/#E4E4E4), chữ Montserrat rất lớn, khoảng trắng rộng, gần như không có chrome; một màu nhấn cam `#FF7120` duy nhất cho CTA và chi tiết | Đơn sắc tuyệt đối (AgriMarket cần nền ấm `#F7F8F2` để phân biệt vùng nội dung), hero toàn màn hình |
| freshcart.codescandy.com | `freshcart-1440.png`, `freshcart-full.png` | Nền xanh lá nhạt, banner khuyến mãi dạng dải, dải danh mục tròn, lưới sản phẩm có nút "+" ngay trên card, giá in đậm và đơn vị nhỏ | Mật độ quảng cáo dày, badge "sale" đỏ chót, lưới 6 cột chật chữ |

## Đã áp dụng vào AgriMarket

1. **Hero tối trên nền sáng.** Ảnh nông trại phủ `brand-800/900` (từ genprint: khối màu lớn, chữ
   lớn), nhưng có CTA trắng rõ ràng và pill "Tem QR từng lô" — thông điệp đặc thù truy xuất.
2. **Một màu nhấn duy nhất.** Cam `#F97316` chỉ cho badge giỏ, tag "Lô cận hạn", chấm sao.
   Mọi hành động chính dùng xanh `#166534` (genprint).
3. **Card sản phẩm có nút thêm ngay trên card** (từ FreshCart) nhưng dùng outline xanh + nhãn chữ
   "Thêm", đổi sang "Đã thêm" khi thành công; khách chưa đăng nhập được đưa tới trang sản phẩm.
4. **Dải danh mục dạng ô ảnh** thay vì icon tròn (FreshCart dùng tròn): giữ được ảnh thật, phù hợp
   nông sản.
5. **Khoảng trắng và nhịp tiêu đề** theo genprint: kicker 11px uppercase + H2 24–30px, mỗi khối
   cách nhau 48–64px trên desktop.
6. **Bảng dữ liệu sạch** (admin): header nền `#F7F8F2`, chữ 11px uppercase muted, dòng kẻ 1px
   `#EEF0E8`, badge pill — lấy tinh thần tối giản của genprint, không dùng zebra sọc.

## Bổ sung ngoài hai trang tham chiếu

- **Digital Product Passport:** bố cục hồ sơ (bìa + 8 bước hành trình + bảng kiểm nghiệm) học từ
  cấu trúc "product passport" của EU ESPR — cảnh báo đặt trên cùng, dữ liệu thiếu hiển thị
  "chưa có" thay vì ẩn, để người mua phân biệt được lô đủ hồ sơ và lô thiếu.
- **Mobile:** thanh địa chỉ kiểu app giao đồ ăn (chọn xã/phường bằng bottom sheet có tìm kiếm
  không dấu) vì địa giới Hưng Yên vừa sáp nhập — người dùng hay gõ tên cũ.

## Giới hạn

Không có công cụ so sánh ảnh bằng mô hình thị giác trong phiên này (API trả 402). Việc đánh giá
"trông có cao cấp không" dựa trên số đo DOM (tràn ngang, ảnh hỏng, font đang dùng, mật độ khối)
và ảnh chụp để người đọc tự so — xem `DESIGN_ACCEPTANCE.md`, mục "Chưa được review thị giác".
