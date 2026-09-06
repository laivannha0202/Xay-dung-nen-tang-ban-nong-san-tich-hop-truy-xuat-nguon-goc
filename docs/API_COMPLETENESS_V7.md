# AgriMarket API Completeness — V7

## Baseline

V7 tiếp tục từ commit V6 hoàn thiện Customer Web ↔ Backend.

Các luồng đã có trước V7:

- xác thực/JWT/RBAC;
- hồ sơ và sổ địa chỉ khách hàng;
- sản phẩm công khai, danh mục, trang trại, truy xuất;
- wishlist, theo dõi trang trại;
- giỏ hàng Backend;
- checkout preview;
- tạo đơn, reservation tồn kho, FEFO;
- COD/Mock payment và callback infrastructure;
- đánh giá, khiếu nại;
- các module vận hành nguồn cung, kho, tài chính và báo cáo.

## V7 hoàn thiện

### Payment read API

`GET /api/v1/thanh-toan/don-hang/:donHangId`

- bắt buộc JWT;
- chỉ đọc được payment của đơn thuộc khách hiện tại;
- trả payment + giao dịch mới nhất + trạng thái reservation.

### Shipment tracking read API

`GET /api/v1/giao-hang/don-hang/:donHangId`

- bắt buộc JWT;
- kiểm tra ownership qua Order -> Customer -> User;
- trả tất cả shipment theo suborder;
- trả mã vận đơn, trạng thái và tracking events.

### API contract

Sau khi API boot thành công:

1. snapshot OpenAPI;
2. regenerate `@agrimarket/api-client`;
3. typecheck generated client;
4. typecheck/build Customer Web.

## Khoảng trống còn lại sau V7

Các mục này cần tiếp tục theo phase riêng vì liên quan quy tắc nghiệp vụ hoặc tích hợp ngoài:

1. Checkout Preview hiện chưa có công thức tiền thật cho voucher/khuyến mãi/điểm thưởng/phí giao hàng.
2. Module giao hàng cần API nhân viên tạo shipment, cập nhật trạng thái và ghi tracking event.
3. Checkout/Order cần quyết định phí vận chuyển được snapshot vào Order để tổng tiền nhất quán.
4. Loyalty cần service/API sử dụng và hoàn điểm.
5. Online payment cần hoàn thiện flow người dùng cho VNPay Sandbox; MoMo nếu nằm trong phạm vi triển khai.
6. Notification cần kênh và API/subscription rõ nếu đưa vào phạm vi đồ án.
7. Cần thêm test end-to-end xuyên suốt: cart -> checkout -> order -> payment -> shipment -> delivered -> review/complaint.

Không nên gộp các mục tiền tệ và payment gateway vào một patch không có rule được phê duyệt.
