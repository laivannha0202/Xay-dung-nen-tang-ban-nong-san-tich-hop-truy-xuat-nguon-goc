# PROMPT FOR OPENCODE — AGriMarket homepage implementation

Bạn đang mở repo AgriMarket ở thư mục gốc. Hãy dùng bộ asset pack này như reference để dựng lại homepage đúng mẫu đã duyệt.

## Mục tiêu
- Hoàn thiện homepage customer-web theo phong cách marketplace nông sản trong ảnh mẫu.
- Dùng ảnh full + các ảnh crop trong thư mục `reference/` để hiểu bố cục.
- Dùng `data/homepage-content-seed.json` làm fallback UI khi API chưa chạy.
- Dùng dữ liệu API thật khi API sẵn sàng.
- Không làm homepage kiểu landing page thưa.
- Không commit thư mục asset pack này.

## Vị trí asset pack
Giả sử thư mục này nằm ngoài repo hoặc trong repo tạm thời. Chỉ đọc tham chiếu, không đưa vào production.

## Những gì phải làm
1. Audit source customer-web hiện tại.
2. Xác định component homepage, header, footer, product/farm/article cards.
3. Khôi phục hoặc hoàn thiện layout theo đúng thứ tự section trong `ASSET_MAP.md`.
4. Nếu API lỗi/empty:
   - dùng fallback arrays từ `homepage-content-seed.json`
   - không hiển thị khoảng trắng lớn hay alert lỗi chiếm chỗ.
5. Nếu API có dữ liệu:
   - ưu tiên dữ liệu thật cho products, farms, articles nếu có.
6. Search box phải hoạt động và chuyển đến `/san-pham?q=...`.
7. CTA truy xuất/QR phải đi `/truy-xuat`.
8. Nav không được link chết. Nếu route list farm/news/promo chưa có, dùng anchor trên homepage thay thế.
9. Responsive:
   - desktop gần ảnh full mẫu
   - mobile khoảng 390px rộng, có bottom nav nếu phù hợp.
10. Test:
   - `pnpm --filter @agrimarket/api-client ensure`
   - `pnpm --filter @agrimarket/customer-web typecheck`
   - `pnpm --filter @agrimarket/customer-web build`
   - chạy local và dùng Playwright nếu có để so sánh với `reference/approved-homepage-full.png`.

## Quy tắc giao diện
- màu chủ đạo theo `data/design-tokens.json`
- card bo góc nhẹ, shadow nhẹ, khoảng cách dày dặn như sàn TMĐT
- ưu tiên cảm giác “đầy nội dung, bán hàng rõ ràng”
- giữ tông xanh nông sản sạch

## Nội dung bắt buộc trên homepage
- utility bar: tagline, about, provenance, support, app, hotline, email
- header: logo, search, account, register, cart
- location: Giao đến Hà Nội
- category rail đủ mục
- hero lớn + 2 promo bên phải
- trust strip 4 item
- quick categories strip
- Flash Sale với 5 sản phẩm
- right-side promo/app card
- Sản phẩm nổi bật 8 sản phẩm
- Trang trại tiêu biểu 3 card
- Kiến thức nông sản 4 bài
- Mua theo nhu cầu 4 combo
- Câu chuyện từ trang trại 3 story block
- service strip 4 item
- app banner có QR và store badges hoặc placeholder hợp lý
- footer nhiều cột

## Dữ liệu seed
Đọc: `data/homepage-content-seed.json`

## Kết quả mong muốn
- Homepage nhìn gần với mẫu đã duyệt.
- Nếu API chưa chạy vẫn đầy đủ và đẹp.
- build/typecheck pass.
- commit chỉ source production liên quan.
