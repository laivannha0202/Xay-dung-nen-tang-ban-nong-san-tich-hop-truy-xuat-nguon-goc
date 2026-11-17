# BÁO CÁO SƠ BỘ — AGRIMARKET MỚI

**Ngày lập:** 17/11/2026. **Trạng thái:** ĐÁNH GIÁ SƠ BỘ, CHƯA CÓ MÃ NGUỒN ĐỂ KIỂM THỬ ĐỘC LẬP.  
**Nguồn:** 2 bản đặc tả DOCX, ảnh giao diện ở các lượt trước, ảnh log OMP gần nhất do người dùng gửi. **Không đọc GitHub cũ.**

## Điều đã xác nhận từ đặc tả
- Có 64 mã P1 Admin trong 13 nhóm và 58 mã P1 Customer trong 12 nhóm.
- Hai website được yêu cầu tách frontend: Admin Web và Customer Web. Customer App sử dụng API/database chung.
- Chuỗi nghiệp vụ cần hoạt động: Nhà cung cấp → Nông trại → Mùa vụ & nhật ký → Lô → Kiểm nghiệm → QR → Kho → Đơn hàng → Thu hồi.

## Những gì báo cáo OMP ở ảnh mới nhất *tuyên bố đã chạy*
- Có `apps/admin-web`, `apps/customer-web`, `apps/customer-mobile`, `apps/api`, nhánh `feat/split-admin-customer-web`.
- Kiểm thử route: 17 Admin HTTP 200, 11 Customer HTTP 200; typecheck 3 app, build 2 web; API Vitest 20/20.
- Có thử mua hàng từ giỏ đến tạo đơn và sửa một số lỗi thật.
- App native Android/iOS **chưa được nghiệm thu thiết bị**; OMP chỉ có Metro web bundle.

**Quan trọng:** Những kết quả này là **lời báo cáo của OMP trong ảnh**, không phải kết quả kiểm thử độc lập ở phiên này. HTTP 200 không xác nhận nghiệp vụ hoặc UX đạt.

## Phát hiện giao diện từ các ảnh chụp cũ
- Screenshot `/san-pham` cũ: trang thiên về lọc và thẻ sản phẩm, chưa đủ để đánh giá home page, product detail, cart, checkout hay branding của bản refactor mới.
- Screenshot `/admin` cũ: sidebar hẹp, khoảng trống lớn, header/footer giống customer; OMP sau đó báo đã tách và nâng cấp UI, nhưng **chưa có screenshot giao diện mới** để xác minh sự cải thiện.
- Không thể nói những lỗi UI cũ vẫn còn trong commit mới; cần chụp lại trực tiếp tại phiên bản hiện tại.

## Cấu hình kiểm thử từ môi trường ChatGPT này
- Không có thư mục source mới `apps/admin-web`, `apps/customer-web`, `apps/api` trong các tệp đã cung cấp.
- `http://127.0.0.1:3000`, `:3001`, `:4000` không truy cập được từ môi trường này; localhost ở máy người dùng không được chia sẻ.
- Vì thế không thể khởi động app, click UI, gọi API hay kiểm database; tất cả 122 yêu cầu hiện **UNTESTED trong cuộc kiểm tra độc lập**.

## Kiến nghị theo mức độ ưu tiên
1. Thu thập mã nguồn mới (ZIP không có `.env`, token, private keys) hoặc cho agent local truy cập working directory mới.
2. Sinh route inventory và đối chiếu ma trận 122 yêu cầu P1; đánh dấu PASS chỉ với bằng chứng thao tác.
3. Thử luồng P0: auth/ownership, giá/tồn, checkout idempotency & concurrency, lô kiểm nghiệm, QR thu hồi, hoàn tiền.
4. Đánh giá từng màn hình Web Customer và Admin về UI, điều hướng, thao tác, lỗi; chụp ảnh ở 360/390/768/1280/1440px.
5. Nghiệm thu mobile native riêng; tuyệt đối không dùng Metro Web để chứng minh quyền camera/secure-store.

## Tài liệu tạo kèm
- `AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md` — đủ 122 yêu cầu P1 từ đặc tả, chưa đánh dấu đạt.
- `PROMPT_OMP_KIEM_TOAN_SUA_FULL_WEB_ADMIN_CUSTOMER_DU_AN_MOI.md` — lệnh cho OMP kiểm tra & sửa ngay ở repo mới.
