# AgriMarket — Commerce Release Scope

Tài liệu này chốt phạm vi triển khai của commerce flow trong đồ án để tránh hiểu nhầm giữa **nghiệp vụ đã được mô phỏng đầy đủ** và **tích hợp dịch vụ production bên thứ ba**.

## 1. Phạm vi giao hàng

AgriMarket hiện hỗ trợ giao hàng trong **toàn tỉnh Hưng Yên theo đơn vị hành chính hiện hành**.

Trong giai đoạn chuyển tiếp dữ liệu, địa chỉ legacy có `tinhThanh = "Thái Bình"` vẫn được Backend chấp nhận để không làm hỏng sổ địa chỉ đã lưu trước khi thay đổi đơn vị hành chính. Dữ liệu địa chỉ mới nên dùng tên tỉnh Hưng Yên hiện hành.

Backend là lớp kiểm tra cuối cùng:

- Checkout Preview nhận địa chỉ đang chọn và trả trạng thái có thể giao hay không.
- Customer Web và Mobile hiển thị cùng trạng thái phạm vi giao hàng.
- Create Order kiểm tra lại địa chỉ trước khi reserve tồn kho; không thể bypass bằng gọi API trực tiếp.
- Người dùng vẫn có thể lưu địa chỉ ngoài phạm vi, nhưng không thể dùng địa chỉ đó để checkout.

Phí vận chuyển hiện dùng chính sách cấu hình nội bộ gồm phí cơ bản và ngưỡng miễn phí. Phạm vi đồ án **không tính phí theo API khoảng cách của hãng vận chuyển**.

## 2. Vận chuyển là mô phỏng có chủ đích

`MockShippingAdapter` là adapter mô phỏng deterministic được giữ lại theo phạm vi đồ án. Nó **không đại diện cho GHN, GHTK, Viettel Post hoặc một hãng vận chuyển production**.

Mục tiêu của adapter mô phỏng là kiểm thử và minh họa contract nghiệp vụ:

- tạo shipment/tracking number;
- ánh xạ trạng thái vận chuyển;
- lưu shipment và tracking event của AgriMarket;
- cho Mobile/Web/Admin đọc cùng dữ liệu giao hàng.

Adapter không bịa tracking event thực tế và không được mô tả trong báo cáo như một tích hợp hãng vận chuyển thật.

Nếu triển khai thương mại thực tế, `ShippingAdapter` là điểm mở rộng để thay hoặc bổ sung adapter cho nhà vận chuyển thật mà không thay đổi contract nghiệp vụ cốt lõi.

## 3. VNPay là Sandbox

Thanh toán VNPay trong phạm vi đồ án dùng **VNPay Sandbox**.

Luồng được mô phỏng đầy đủ ở mức hệ thống:

`Create Order → Create Payment → redirect VNPay Sandbox → callback → verify chữ ký/số tiền/gateway → cập nhật Payment + reservation → hiển thị kết quả`.

VNPay Sandbox **không phát sinh giao dịch tài chính thực tế**. Customer Web và Mobile dùng cùng backend/payment contract; Web sử dụng callback URL do Backend whitelist, client không được truyền return URL tùy ý.

Khi callback VNPay thất bại, reservation có thể tiếp tục `DANG_GIU` tới TTL để người dùng tạo một Payment mới cho cùng Order. Retry không tạo Order mới.

Nếu triển khai production, cần merchant credential production và endpoint/secret do VNPay cấp. Không commit credential thật vào source code.

## 4. Voucher, loyalty và refund

Voucher và điểm thưởng không phải dữ liệu hiển thị giả:

- Checkout Preview đánh giá điều kiện từ Backend.
- Create Order đánh giá lại trong transaction.
- Promotion usage và loyalty balance được khóa/ghi ledger.
- Order lưu persisted pricing snapshot.
- Cancel Order hoàn lượt voucher/điểm khi policy cho phép.
- Full payment refund hoàn điểm và trả lượt voucher theo cơ chế idempotent; partial refund cập nhật trạng thái tương ứng.

Chi tiết đơn trên Customer Web, Mobile và Admin cùng hiển thị persisted snapshot:

`Tạm tính hàng hóa + Phí vận chuyển - Voucher - Giá trị điểm = Tổng thanh toán`.

## 5. Điều kiện được phép gọi release-complete

Không được gọi PR/bản build là release-complete chỉ vì static review hoặc UI đã có màn hình.

Bắt buộc phải có bằng chứng:

1. `api-client:sync` regenerate OpenAPI + Orval từ Backend hiện tại.
2. OpenAPI snapshot mới được commit và không còn diff sau sync.
3. Runtime adapter tạm được loại bỏ hoặc chỉ còn wrapper mỏng trên generated contract.
4. API E2E PASS trên database test disposable sạch.
5. Mobile tests PASS.
6. Workspace lint + typecheck + build PASS.
7. `git diff --check` PASS.
8. `pnpm release:final` kết thúc với `RELEASE GATE PASS`.
9. Visual QA thật các luồng chính trên Customer Web, Admin Web và Mobile.
10. Không còn mock/placeholder quan trọng ngoài các mô phỏng được công bố rõ trong tài liệu này.

Hiện tại `MockShippingAdapter` và VNPay Sandbox là **mô phỏng được công bố**, không phải tuyên bố tích hợp production.
