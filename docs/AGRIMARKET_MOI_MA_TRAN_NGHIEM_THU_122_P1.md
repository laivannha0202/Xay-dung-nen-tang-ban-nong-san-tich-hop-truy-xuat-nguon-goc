# MA TRẬN NGHIỆM THU AGRIMARKET MỚI — 122 YÊU CẦU P1

**Trạng thái ban đầu:** `CHƯA XÁC MINH` cho tất cả yêu cầu. Đây là checklist được TRÍCH TỪ HAI FILE ĐẶC TẢ, **không phải báo cáo lỗi hoặc kết quả chạy code**.

- Dự án mục tiêu: **dự án AgriMarket mới trên máy người dùng**. Không tìm, không clone, không gọi API, không đối chiếu GitHub `laivannha0202/agrimarket-v2`.
- Phạm vi: `apps/admin-web` (Admin), `apps/customer-web` (Customer), `apps/customer-mobile` (Mobile), `apps/api` và PostgreSQL dùng chung — phải xác minh thực tế thư mục trước khi chạy.
- Tiêu chuẩn đạt: `PASS` chỉ khi thực hiện được thao tác thật, xác nhận phản hồi API và dữ liệu có thay đổi đúng, có bằng chứng test; `FAIL` khi test thất bại; `BLOCKED` khi không có môi trường/dịch vụ cần thiết; `UNTESTED` khi chưa chạy.
- Với mỗi mục, bổ sung **đường dẫn màn hình, tên file xử lý, endpoint, kịch bản kiểm thử, kết quả thực tế, bằng chứng**.

## A. Các trạng thái cần sử dụng

| Trạng thái | Ý nghĩa |
|---|---|
| `PASS` | Đã chạy thực tế và chứng minh hành vi mong đợi |
| `FAIL` | Có lỗi tái hiện, cần sửa và chạy lại |
| `BLOCKED` | Thiếu công cụ/hạ tầng/thiết bị, không thể chứng minh |
| `UNTESTED` | Chưa kiểm tra |
| `NOT_IMPLEMENTED` | Chưa có tính năng |

## B. 64 yêu cầu P1 Website Admin

| Mã | Nhóm | Yêu cầu gốc | Trạng thái | Bằng chứng thực tế |
|---|---|---|---|---|
| `ADM-01-01` | 1. Tổng quan (Dashboard) | Đếm đơn mới/chờ xác nhận, số đơn đang giao và doanh thu đã thanh toán sau hoàn tiền hoàn tất. | UNTESTED | — |
| `ADM-01-02` | 1. Tổng quan (Dashboard) | Đếm số lô đã công khai, lô chờ kiểm nghiệm, lô cận hạn/hết hạn, lô bị khóa/thu hồi. | UNTESTED | — |
| `ADM-01-03` | 1. Tổng quan (Dashboard) | Hiện cảnh báo đơn chờ xử lý, phiếu kiểm nghiệm Không đạt, khiếu nại mới; mỗi cảnh báo dẫn về đúng trang chi tiết. | UNTESTED | — |
| `ADM-01-04` | 1. Tổng quan (Dashboard) | Có nút tải lại và lọc ngày cơ bản; không yêu cầu cập nhật thời gian thực. | UNTESTED | — |
| `ADM-02-01` | 2. Danh mục và sản phẩm | CRUD/ẩn danh mục; sản phẩm thuộc một danh mục. | UNTESTED | — |
| `ADM-02-02` | 2. Danh mục và sản phẩm | CRUD/ẩn sản phẩm: SKU, tên, mô tả, ảnh, đơn vị, giá, hạn dùng mặc định, điều kiện bảo quản. | UNTESTED | — |
| `ADM-02-03` | 2. Danh mục và sản phẩm | Bật cờ yêu cầu truy xuất (mặc định có với dữ liệu nông sản demo). | UNTESTED | — |
| `ADM-02-04` | 2. Danh mục và sản phẩm | Hiện tổng tồn khả dụng chỉ từ các lô đủ điều kiện bán; công khai sản phẩm nếu không còn hàng vẫn báo Hết hàng. | UNTESTED | — |
| `ADM-03-01` | 3. Nhà cung cấp và nông trại | Tạo/sửa/ngừng hoạt động nhà cung cấp: mã, tên, loại hình, liên hệ và trạng thái. | UNTESTED | — |
| `ADM-03-02` | 3. Nhà cung cấp và nông trại | Tạo/sửa nông trại thuộc nhà cung cấp đang hoạt động: địa chỉ, tọa độ, diện tích, cây trồng, người phụ trách. | UNTESTED | — |
| `ADM-03-03` | 3. Nhà cung cấp và nông trại | Đính kèm ảnh hồ sơ/giấy tờ nếu có, lưu người tải, thời điểm và mô tả nguồn. | UNTESTED | — |
| `ADM-03-04` | 3. Nhà cung cấp và nông trại | Chỉ cho công khai tên và khu vực nông trại trên QR; loại trừ thông tin nhạy cảm. | UNTESTED | — |
| `ADM-04-01` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Tạo mùa vụ gắn Farm và Product, khai báo giống, diện tích, gieo trồng, dự kiến thu hoạch, trạng thái. | UNTESTED | — |
| `ADM-04-02` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Thêm nhật ký theo ngày: loại hoạt động, người thực hiện, vật tư, ảnh/chứng từ, ghi chú. | UNTESTED | — |
| `ADM-04-03` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Khi ghi phun thuốc, bắt buộc thời gian cách ly và tính ngày thu hoạch sớm nhất từ các lần phun liên quan. | UNTESTED | — |
| `ADM-04-04` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Tạo Batch từ Season với mã duy nhất, Product, ngày thu hoạch, ngày đóng gói, sản lượng, hạn dùng, điều kiện bảo quản. | UNTESTED | — |
| `ADM-04-05` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Hiển thị timeline theo nguồn nhật ký, thu hoạch, kiểm nghiệm, nhập/xuất; phân biệt sự kiện thật và mốc dự kiến. | UNTESTED | — |
| `ADM-04-06` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Admin công khai lô chỉ sau khi điều kiện bắt buộc đạt; tạo bản điều chỉnh có lý do nếu cần sửa dữ liệu truy xuất đã công bố. | UNTESTED | — |
| `ADM-04-07` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Thu hồi: chọn lô, lý do, thời điểm, mức độ; khóa bán/xuất ngay, cập nhật QR và tách hai danh sách đơn chưa xuất / đã xuất. | UNTESTED | — |
| `ADM-04-08` | 4. Mùa vụ, nhật ký canh tác, lô hàng và thu hồi | Lưu tiến độ liên hệ khách, cách xử lý, số lượng bị ảnh hưởng và biên bản kết thúc thu hồi. | UNTESTED | — |
| `ADM-05-01` | 5. Chứng nhận và kiểm nghiệm | Lưu chứng nhận theo nông trại/lô: loại, số hiệu, đơn vị cấp, khoảng hiệu lực, phạm vi và file nguồn. | UNTESTED | — |
| `ADM-05-02` | 5. Chứng nhận và kiểm nghiệm | Tạo phiếu kiểm nghiệm gắn một Batch, đơn vị thực hiện, ngày lấy mẫu/kết quả, ảnh/PDF. | UNTESTED | — |
| `ADM-05-03` | 5. Chứng nhận và kiểm nghiệm | Thêm chỉ tiêu đo, đơn vị, ngưỡng tham chiếu, kết luận từng chỉ tiêu và tự tổng hợp kết luận chung. | UNTESTED | — |
| `ADM-05-04` | 5. Chứng nhận và kiểm nghiệm | Nếu bất kỳ chỉ tiêu Không đạt thì phiếu Không đạt; server khóa bán lô ngay. | UNTESTED | — |
| `ADM-05-05` | 5. Chứng nhận và kiểm nghiệm | Cho phép tạo phiếu kiểm nghiệm lại mới; không ghi đè phiếu cũ; khi Đạt cần Admin xác nhận mở khóa/công khai kèm lý do. | UNTESTED | — |
| `ADM-06-01` | 6. Mã QR và trang truy xuất công khai | Tạo token ngẫu nhiên, không tuần tự và độc nhất; một QR P1 liên kết một Batch. | UNTESTED | — |
| `ADM-06-02` | 6. Mã QR và trang truy xuất công khai | In tem hoặc tải ảnh QR kèm tên, mã lô, ngày thu hoạch và hạn dùng. | UNTESTED | — |
| `ADM-06-03` | 6. Mã QR và trang truy xuất công khai | Trang công khai (không đăng nhập) hiện sản phẩm, mã lô, nông trại/vùng, timeline, chứng từ hợp lệ và kết quả kiểm nghiệm. | UNTESTED | — |
| `ADM-06-04` | 6. Mã QR và trang truy xuất công khai | Lô khóa/thu hồi hiện cảnh báo ưu tiên; mã không tồn tại/vô hiệu hiện thông báo phù hợp. | UNTESTED | — |
| `ADM-06-05` | 6. Mã QR và trang truy xuất công khai | Ghi nhận số lượt truy cập QR theo thời điểm; cho phép báo cáo vấn đề kèm mã lô. | UNTESTED | — |
| `ADM-07-01` | 7. Kho hàng theo lô và giữ chỗ | Tạo ít nhất một kho chính; Inventory theo cặp (warehouse_id, batch_id). | UNTESTED | — |
| `ADM-07-02` | 7. Kho hàng theo lô và giữ chỗ | Nhập kho theo lô, số lượng thực nhận, thời điểm và chứng cứ/giá nhập nếu có. | UNTESTED | — |
| `ADM-07-03` | 7. Kho hàng theo lô và giữ chỗ | Hiển thị on_hand, reserved và available = on_hand − reserved; lọc theo lô, sản phẩm, ngày hết hạn. | UNTESTED | — |
| `ADM-07-04` | 7. Kho hàng theo lô và giữ chỗ | Giữ chỗ tự động khi checkout; xuất kho giảm on_hand và reserved tương ứng trong một transaction. | UNTESTED | — |
| `ADM-07-05` | 7. Kho hàng theo lô và giữ chỗ | Phiếu điều chỉnh có lý do (hao hụt, kiểm kê...), giữ lịch sử StockMovement; không sửa Inventory trực tiếp bằng giao diện. | UNTESTED | — |
| `ADM-07-06` | 7. Kho hàng theo lô và giữ chỗ | Chặn xuất lô chưa công khai/không đạt/hết hạn/HOLD/RECALL và chặn tồn âm. | UNTESTED | — |
| `ADM-08-01` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Nhận đơn do khách tạo; lưu customer_id, địa chỉ snapshot, tên sản phẩm, giá, số lượng, phí giao, tổng tiền. | UNTESTED | — |
| `ADM-08-02` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Ngay lúc đặt, server tìm lô hợp lệ, phân bổ từng dòng vào một hoặc nhiều lô và giữ chỗ nguyên tử. | UNTESTED | — |
| `ADM-08-03` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Admin xác nhận/chuẩn bị; được đổi sang lô khác hợp lệ trước khi xuất và lưu lịch sử phân bổ. | UNTESTED | — |
| `ADM-08-04` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Khi xuất, sinh phiếu xuất đúng lô đã phân bổ và gắn shipped_qty vào allocation. | UNTESTED | — |
| `ADM-08-05` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Theo dõi đơn: PENDING → CONFIRMED → PREPARING → SHIPPING → DELIVERED → COMPLETED; có CANCELLED/DELIVERY_FAILED. | UNTESTED | — |
| `ADM-08-06` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Hỗ trợ COD và chuyển khoản thủ công; Admin ghi nhận đã nhận tiền và mã vận đơn/tên người giao. | UNTESTED | — |
| `ADM-08-07` | 8. Đơn hàng, thanh toán tại đơn và giao hàng | Cho khách theo dõi đơn của mình; hỗ trợ hủy trước xuất theo chính sách, tạo hoàn tiền nếu đã trả. | UNTESTED | — |
| `ADM-09-01` | 9. Khuyến mãi đơn giản | Tạo chương trình giảm phần trăm hoặc số tiền cố định, ngày bắt đầu/kết thúc, hạn mức số lượt và bật/tắt. | UNTESTED | — |
| `ADM-09-02` | 9. Khuyến mãi đơn giản | Máy chủ tính ưu đãi hợp lệ và ghi giảm giá snapshot ở Order trước khi chốt. | UNTESTED | — |
| `ADM-09-03` | 9. Khuyến mãi đơn giản | Chỉ cho áp dụng một chương trình P1 cho một đơn; số lần sử dụng tăng theo đơn hợp lệ. | UNTESTED | — |
| `ADM-10-01` | 10. Thanh toán và hoàn tiền cơ bản | Lưu payment method COD hoặc chuyển khoản và trạng thái UNPAID/PAID. | UNTESTED | — |
| `ADM-10-02` | 10. Thanh toán và hoàn tiền cơ bản | Admin xác nhận đã nhận tiền thủ công, lưu thời gian, người thực hiện và tham chiếu nếu có. | UNTESTED | — |
| `ADM-10-03` | 10. Thanh toán và hoàn tiền cơ bản | Tạo RefundRequest khi hủy đơn đã thanh toán, trả hàng hoặc thu hồi; xử lý PENDING → APPROVED → COMPLETED/REJECTED. | UNTESTED | — |
| `ADM-10-04` | 10. Thanh toán và hoàn tiền cơ bản | Tính doanh thu đã nhận trừ khoản hoàn thực hiện thành công; không tính yêu cầu hoàn còn chờ. | UNTESTED | — |
| `ADM-11-01` | 11. Đánh giá và khiếu nại | Khách đã nhận hàng được đánh giá mỗi order_line theo chính sách một lần; Admin ẩn nội dung vi phạm và ghi lý do. | UNTESTED | — |
| `ADM-11-02` | 11. Đánh giá và khiếu nại | Khách gửi khiếu nại từ đơn đã mua hoặc từ trang QR; có mô tả, ảnh và batch_id khi xác định được. | UNTESTED | — |
| `ADM-11-03` | 11. Đánh giá và khiếu nại | Admin chuyển trạng thái NEW → PROCESSING → RESOLVED → CLOSED, thêm phản hồi và kết quả xử lý. | UNTESTED | — |
| `ADM-11-04` | 11. Đánh giá và khiếu nại | Chi tiết lô hiển thị các khiếu nại liên quan; từ khiếu nại có thể chuyển tới màn hình thu hồi lô. | UNTESTED | — |
| `ADM-12-01` | 12. Tài khoản và bảo mật — Hai vai trò | Đăng nhập, đăng xuất, đổi mật khẩu Admin; seed Admin ban đầu an toàn, không cho tự đăng ký Admin. | UNTESTED | — |
| `ADM-12-02` | 12. Tài khoản và bảo mật — Hai vai trò | Quản lý danh sách, tìm kiếm và xem thông tin cơ bản/lịch sử đơn của khách hàng. | UNTESTED | — |
| `ADM-12-03` | 12. Tài khoản và bảo mật — Hai vai trò | Khóa/mở khóa khách vi phạm kèm lý do; khách khóa không tạo session mới hoặc đặt hàng. | UNTESTED | — |
| `ADM-12-04` | 12. Tài khoản và bảo mật — Hai vai trò | Mọi API Admin kiểm tra role=ADMIN tại máy chủ; API đơn/địa chỉ/khiếu nại khách kiểm tra ownership. | UNTESTED | — |
| `ADM-12-05` | 12. Tài khoản và bảo mật — Hai vai trò | Mật khẩu băm bcrypt/Argon2; không lưu mật khẩu gốc; token có hạn dùng và có chống đăng nhập brute force cơ bản. | UNTESTED | — |
| `ADM-13-01` | 13. Báo cáo tổng hợp và truy xuất | Báo cáo doanh thu theo ngày/tháng dựa trên tiền đã ghi nhận và hoàn tiền hoàn tất. | UNTESTED | — |
| `ADM-13-02` | 13. Báo cáo tổng hợp và truy xuất | Thống kê đơn theo trạng thái; tồn thực/giữ chỗ/khả dụng theo lô. | UNTESTED | — |
| `ADM-13-03` | 13. Báo cáo tổng hợp và truy xuất | Thống kê lô còn hiệu lực/cận hạn/hết hạn/khóa/thu hồi và kiểm nghiệm Đạt/Không đạt. | UNTESTED | — |
| `ADM-13-04` | 13. Báo cáo tổng hợp và truy xuất | Số lần quét QR theo lô và khoảng thời gian; có lọc ngày cơ bản. | UNTESTED | — |
| `ADM-13-05` | 13. Báo cáo tổng hợp và truy xuất | Chỉ Admin xem dữ liệu thống kê có khách/đơn; không tạo endpoint báo cáo công khai. | UNTESTED | — |

## C. 58 yêu cầu P1 Customer Web & App

**Quy ước:** yêu cầu dùng chung API phải được kiểm tra cả Web và Mobile nếu có tương tác tương ứng; `Metro Web bundle 200` không thay thế kiểm thử Android/iOS native.

| Mã | Nhóm | Yêu cầu gốc | Trạng thái Web | Trạng thái App | Bằng chứng |
|---|---|---|---|---|---|
| `CUS-01-01` | 03. CUS-01 — ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT | Đăng ký bằng email + mật khẩu + họ tên; email không trùng; tự gán role=CUSTOMER bất kể payload client. | UNTESTED | UNTESTED | — |
| `CUS-01-02` | 03. CUS-01 — ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT | Đăng nhập; cấp phiên riêng cho mỗi thiết bị; đăng xuất xóa phiên/token tương ứng. | UNTESTED | UNTESTED | — |
| `CUS-01-03` | 03. CUS-01 — ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT | Mật khẩu băm bằng bcrypt/Argon2 trên server; mật khẩu tối thiểu 8 ký tự; không hiển thị hay log plain-text. | UNTESTED | UNTESTED | — |
| `CUS-01-04` | 03. CUS-01 — ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT | Tài khoản bị Admin khóa không được dùng API yêu cầu CUSTOMER; giữ lịch sử đơn và nội dung công khai. | UNTESTED | UNTESTED | — |
| `CUS-01-05` | 03. CUS-01 — ĐĂNG KÝ, ĐĂNG NHẬP, ĐĂNG XUẤT | Khi mở một trang private chưa có phiên, chuyển tới đăng nhập và quay lại mục tiêu sau thành công. | UNTESTED | UNTESTED | — |
| `CUS-02-01` | 04. CUS-02 — HỒ SƠ VÀ ĐỊA CHỈ GIAO HÀNG | Xem và sửa họ tên, số liên hệ của chính mình. | UNTESTED | UNTESTED | — |
| `CUS-02-02` | 04. CUS-02 — HỒ SƠ VÀ ĐỊA CHỈ GIAO HÀNG | Thêm, sửa, xóa mềm địa chỉ; một địa chỉ mặc định duy nhất. | UNTESTED | UNTESTED | — |
| `CUS-02-03` | 04. CUS-02 — HỒ SƠ VÀ ĐỊA CHỈ GIAO HÀNG | Checkout chỉ dùng address_id thuộc current_user; lưu snapshot người nhận và địa chỉ trên Order. | UNTESTED | UNTESTED | — |
| `CUS-02-04` | 04. CUS-02 — HỒ SƠ VÀ ĐỊA CHỈ GIAO HÀNG | Khi xóa/sửa địa chỉ sau đặt, đơn cũ không đổi nội dung giao hàng đã chốt. | UNTESTED | UNTESTED | — |
| `CUS-03-01` | 05. CUS-03 — TRANG CHỦ, DANH MỤC, TÌM KIẾM VÀ LỌC | Hiển thị danh mục và các sản phẩm ACTIVE/đang bán; không hiện sản phẩm nháp. | UNTESTED | UNTESTED | — |
| `CUS-03-02` | 05. CUS-03 — TRANG CHỦ, DANH MỤC, TÌM KIẾM VÀ LỌC | Tìm kiếm theo tên/từ khóa; lọc theo danh mục, khoảng giá và trạng thái còn hàng; sắp xếp theo tên hoặc giá. | UNTESTED | UNTESTED | — |
| `CUS-03-03` | 05. CUS-03 — TRANG CHỦ, DANH MỤC, TÌM KIẾM VÀ LỌC | Hiển thị nhãn “Còn hàng/Hết hàng” từ tổng available các lô PASS + PUBLISHED + NORMAL + còn hạn. | UNTESTED | UNTESTED | — |
| `CUS-03-04` | 05. CUS-03 — TRANG CHỦ, DANH MỤC, TÌM KIẾM VÀ LỌC | Đánh giá công khai chỉ gồm nội dung đã duyệt; badge chứng nhận không suy ra từ checkbox tự khai nếu chưa có chứng cứ. | UNTESTED | UNTESTED | — |
| `CUS-04-01` | 06. CUS-04 — CHI TIẾT SẢN PHẨM | Xem giá, đơn vị (kg/bó/hộp), ảnh, mô tả, điều kiện bảo quản và hạn dùng mặc định nếu phù hợp. | UNTESTED | UNTESTED | — |
| `CUS-04-02` | 06. CUS-04 — CHI TIẾT SẢN PHẨM | Cho chọn số lượng > 0 theo bước đơn vị hợp lệ; không thêm giỏ sản phẩm ngừng bán. | UNTESTED | UNTESTED | — |
| `CUS-04-03` | 06. CUS-04 — CHI TIẾT SẢN PHẨM | Hiển thị nhãn truy xuất nguồn gốc mang ý nghĩa “lô hàng có hồ sơ”; không ghi “đã kiểm chứng độc lập” nếu dữ liệu chỉ do Admin nhập. | UNTESTED | UNTESTED | — |
| `CUS-04-04` | 06. CUS-04 — CHI TIẾT SẢN PHẨM | Xem đánh giá công khai hợp lệ; có gợi ý mở QR của đúng lô thực tế sau nhận hàng. | UNTESTED | UNTESTED | — |
| `CUS-05-01` | 07. CUS-05 — GIỎ HÀNG | Thêm, sửa, xóa dòng giỏ; nếu cùng product_id thì cộng lượng theo quy định. | UNTESTED | UNTESTED | — |
| `CUS-05-02` | 07. CUS-05 — GIỎ HÀNG | Giỏ đã đăng nhập dùng chung dữ liệu khi chuyển web↔app (nếu triển khai Cart/CartItem P1). | UNTESTED | UNTESTED | — |
| `CUS-05-03` | 07. CUS-05 — GIỎ HÀNG | Giá và tồn giỏ chỉ tham khảo; không tự giữ tồn. | UNTESTED | UNTESTED | — |
| `CUS-05-04` | 07. CUS-05 — GIỎ HÀNG | Khách chưa đăng nhập có thể giữ giỏ cục bộ trên thiết bị; checkout yêu cầu login; giỏ được kiểm tra lại sau login. | UNTESTED | UNTESTED | — |
| `CUS-06-01` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Chỉ CUSTOMER đã đăng nhập và ACTIVE được đặt; address_id phải thuộc tài khoản. | UNTESTED | UNTESTED | — |
| `CUS-06-02` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Preview gọi server tính lại tên, giá, khuyến mãi một chương trình P1, phí giao và tổng tiền. | UNTESTED | UNTESTED | — |
| `CUS-06-03` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | P1 checkout chỉ hiện COD/chuyển khoản thủ công; không gắn nhãn thanh toán online hoàn tất. | UNTESTED | UNTESTED | — |
| `CUS-06-04` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Khi xác nhận, server lọc batch hợp lệ, chọn FIFO theo thời điểm nhập; phân bổ một/nhiều batch, giữ reserved nguyên tử. | UNTESTED | UNTESTED | — |
| `CUS-06-05` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Thiếu hàng ở bất kỳ dòng nào → không tạo đơn/reservation; 409 OUT_OF_STOCK. | UNTESTED | UNTESTED | — |
| `CUS-06-06` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Phải có idempotency_key tránh nhấn đôi hoặc mạng retry tạo hai đơn. | UNTESTED | UNTESTED | — |
| `CUS-06-07` | 08. CUS-06 — CHECKOUT: XEM GIÁ CUỐI VÀ ĐẶT ĐƠN | Giá/ưu đãi thay đổi từ preview tới commit → yêu cầu người dùng xem lại; không âm thầm tăng tiền. | UNTESTED | UNTESTED | — |
| `CUS-07-01` | 09. CUS-07 — ĐƠN HÀNG CỦA TÔI VÀ THEO DÕI THANH TOÁN | Danh sách đơn của chủ tài khoản có phân trang/lọc theo trạng thái và thời gian. | UNTESTED | UNTESTED | — |
| `CUS-07-02` | 09. CUS-07 — ĐƠN HÀNG CỦA TÔI VÀ THEO DÕI THANH TOÁN | Chi tiết đơn thể hiện sản phẩm, lượng, giá lúc đặt, ưu đãi, ship, tổng, COD/chuyển khoản, trạng thái tiền. | UNTESTED | UNTESTED | — |
| `CUS-07-03` | 09. CUS-07 — ĐƠN HÀNG CỦA TÔI VÀ THEO DÕI THANH TOÁN | Timeline PENDING→CONFIRMED→PREPARING→SHIPPING→DELIVERED→COMPLETED (hoặc nhánh CANCELLED/DELIVERY_FAILED). | UNTESTED | UNTESTED | — |
| `CUS-07-04` | 09. CUS-07 — ĐƠN HÀNG CỦA TÔI VÀ THEO DÕI THANH TOÁN | Sau xuất kho, hiển thị mã lô thực xuất theo từng OrderLine (có thể nhiều lô); trước đó nếu hiển thị phải ghi “dự kiến”. | UNTESTED | UNTESTED | — |
| `CUS-07-05` | 09. CUS-07 — ĐƠN HÀNG CỦA TÔI VÀ THEO DÕI THANH TOÁN | Nếu đã xuất từ batch thu hồi, thể hiện cảnh báo và đường dẫn phản ánh/tra cứu; không khẳng định đã gửi thông báo SMS nếu không tích hợp. | UNTESTED | UNTESTED | — |
| `CUS-08-01` | 10. CUS-08 — HỦY ĐƠN HỢP LỆ | Hủy được khi chưa có StockMovement OUT và chính sách/trạng thái cho phép. | UNTESTED | UNTESTED | — |
| `CUS-08-02` | 10. CUS-08 — HỦY ĐƠN HỢP LỆ | Server thực thi hủy và nhả reserved cho allocation ACTIVE cùng giao dịch; on_hand không tăng. | UNTESTED | UNTESTED | — |
| `CUS-08-03` | 10. CUS-08 — HỦY ĐƠN HỢP LỆ | Khách nhìn thấy lý do/hành động sau hủy; nếu đã thanh toán thì tạo quy trình hoàn tiền do Admin xử lý. | UNTESTED | UNTESTED | — |
| `CUS-08-04` | 10. CUS-08 — HỦY ĐƠN HỢP LỆ | Sau xuất, ẩn nút Hủy trước xuất và chuyển sang luồng Khiếu nại/Đổi trả. | UNTESTED | UNTESTED | — |
| `CUS-09-01` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Không cần login để xem /t/{token} hợp lệ. | UNTESTED | UNTESTED | — |
| `CUS-09-02` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Hiển thị đúng Batch: mã, sản phẩm, nông trại/vùng, mùa vụ/công đoạn, ngày thu hoạch, hạn dùng, kiểm nghiệm và chứng nhận đã công khai. | UNTESTED | UNTESTED | — |
| `CUS-09-03` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Mã sai/vô hiệu → không tìm thấy; lô chưa publish không lộ dữ liệu nháp. | UNTESTED | UNTESTED | — |
| `CUS-09-04` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Lô HOLD/RECALLED/hết hạn → nhãn cảnh báo nổi bật hơn mọi thông tin quảng bá và hiển thị liên hệ/hướng dẫn. | UNTESTED | UNTESTED | — |
| `CUS-09-05` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Khách có thể nhấn Báo cáo vấn đề; nếu chưa login thì lưu token và chuyển đăng nhập trước khi gửi complaint. | UNTESTED | UNTESTED | — |
| `CUS-09-06` | 11. CUS-09 — QUÉT QR VÀ TRANG TRUY XUẤT CÔNG KHAI | Có màn hình từ chối quyền camera nhưng người dùng vẫn có thể mở link quét từ camera hệ thống. | UNTESTED | UNTESTED | — |
| `CUS-10-01` | 12. CUS-10 — ĐÁNH GIÁ SẢN PHẨM ĐÃ NHẬN | Chỉ OrderLine thuộc customer và Order DELIVERED/COMPLETED mới được tạo review. | UNTESTED | UNTESTED | — |
| `CUS-10-02` | 12. CUS-10 — ĐÁNH GIÁ SẢN PHẨM ĐÃ NHẬN | Mỗi customer được tạo một review cho một order_line; không spam trùng. | UNTESTED | UNTESTED | — |
| `CUS-10-03` | 12. CUS-10 — ĐÁNH GIÁ SẢN PHẨM ĐÃ NHẬN | Khách xem đánh giá đã gửi; sản phẩm hiển thị đánh giá công khai được Admin duyệt. | UNTESTED | UNTESTED | — |
| `CUS-10-04` | 12. CUS-10 — ĐÁNH GIÁ SẢN PHẨM ĐÃ NHẬN | Admin có thể ẩn đánh giá vi phạm; thao tác phải có lý do. | UNTESTED | UNTESTED | — |
| `CUS-11-01` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Tạo complaint từ đơn của mình hoặc từ mã QR hợp lệ; cho phép chỉ có batch_id từ QR mà không có đơn. | UNTESTED | UNTESTED | — |
| `CUS-11-02` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Nếu một OrderLine đã xuất nhiều lô, không gán lô tùy tiện; để khách chọn lô nếu biết hoặc ghi “chưa xác định”. | UNTESTED | UNTESTED | — |
| `CUS-11-03` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Cho tải ảnh bằng chứng (JPG/PNG, size giới hạn) theo chính sách backend; không nhận đường dẫn tùy ý. | UNTESTED | UNTESTED | — |
| `CUS-11-04` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Khách đọc trạng thái NEW→PROCESSING→RESOLVED→CLOSED và phản hồi của Admin. | UNTESTED | UNTESTED | — |
| `CUS-11-05` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Hỗ trợ khách trả lời trong ticket của chính mình; không xóa lịch sử trao đổi. | UNTESTED | UNTESTED | — |
| `CUS-11-06` | 13. CUS-11 — KHIẾU NẠI, PHẢN ÁNH CHẤT LƯỢNG VÀ THEO DÕI XỬ LÝ | Nếu lô bị recall, hiện hướng dẫn liên hệ và đường dẫn khiếu nại; không nói đã hoàn tiền nếu Admin chưa hoàn. | UNTESTED | UNTESTED | — |
| `CUS-12-01` | 14. CUS-12 — TRẠNG THÁI GIAO DIỆN, LỖI, MẤT KẾT NỐI | Mỗi chức năng có loading, empty, error, success và retry hợp lệ. | UNTESTED | UNTESTED | — |
| `CUS-12-02` | 14. CUS-12 — TRẠNG THÁI GIAO DIỆN, LỖI, MẤT KẾT NỐI | Backend trả mã lỗi chuẩn: 401/403/404/409/422/429/500, client có thông điệp phù hợp. | UNTESTED | UNTESTED | — |
| `CUS-12-03` | 14. CUS-12 — TRẠNG THÁI GIAO DIỆN, LỖI, MẤT KẾT NỐI | Không tự phát lại lệnh tạo đơn với khóa mới khi chưa xác định trạng thái của request cũ. | UNTESTED | UNTESTED | — |
| `CUS-12-04` | 14. CUS-12 — TRẠNG THÁI GIAO DIỆN, LỖI, MẤT KẾT NỐI | Khi giá/tồn thay đổi, khách phải thấy sự khác biệt và xác nhận lại; không auto bấm đặt. | UNTESTED | UNTESTED | — |
| `CUS-12-05` | 14. CUS-12 — TRẠNG THÁI GIAO DIỆN, LỖI, MẤT KẾT NỐI | Điều hướng web/app nhất quán sau lỗi phiên; không làm mất thông tin nhập quá mức cần thiết. | UNTESTED | UNTESTED | — |

## D. Điều kiện cho phép kết luận

- Không được ghi “122/122 PASS” nếu bất cứ dòng nào còn `UNTESTED`, `BLOCKED`, `FAIL` hoặc `NOT_IMPLEMENTED`.
- Các màn hình public và private phải được test riêng khi có/chưa có session, cũng như user khách A/B/Admin.
- Với mã liên quan kho/lô/giá/đơn, phải có test state trước/sau và ít nhất một trường hợp âm (negative case).
- Kiểm thử mobile trên Metro Web **chỉ** chứng minh bundling/rendering web tương thích; quyền camera, storage/secure-store, deep link, network thực phải thử trên thiết bị hoặc emulator.
- P2 và P3 là phạm vi bổ sung theo master prompt hiện tại; lập danh sách riêng theo tài liệu hiện hành và không gộp vào chỉ số 122 yêu cầu P1.
