# UI AUDIT — Customer Web, Admin Web, Mobile (Expo web)

Đo bằng Playwright: bề rộng tài liệu so với viewport (`scrollWidth - clientWidth`), ảnh hỏng (`naturalWidth === 0`), `pageerror`, response ≥500.

## 1. Kết quả đo

| Phạm vi | Viewport | Route | Overflow | Ảnh hỏng | Lỗi JS |
|---|---|---|---|---|---|
| Customer | 360/390/768/1280/1440 | `/`, `/san-pham`, `/san-pham/ca-chua-bien`, `/gio-hang`, `/thanh-toan`, `/tai-khoan/don-hang` | 0 | 0 | 0 |
| Admin | 390/768/1280 | `/admin`, `/admin/don-hang`, `/admin/lo-hang`, `/admin/khieu-nai`, `/admin/danh-gia`, `/admin/khach-hang`, `/admin/bao-cao`, `/admin/cai-dat` | 0 | 0 | 0 |
| Mobile (Expo web) | 390 | home, danh mục, sản phẩm, bottom nav | 0 | 0 | 0 |

Kết luận: không có tràn ngang, không ảnh hỏng, không exception phía client ở cả ba bề mặt.

## 2. Ảnh chụp (docs/screenshots)

| Tệp | Nội dung |
|---|---|
| `audit-home-1440.png` | Trang chủ: hero + thống kê + sản phẩm nổi bật |
| `audit-plp-390.png` | Danh sách sản phẩm trên mobile |
| `audit-pdp-1440.png` | Chi tiết sản phẩm: buy box sticky + lô công khai + đánh giá |
| `audit-pdp-390.png` | Chi tiết sản phẩm trên mobile |
| `audit-trace-1440.png` | Trang truy xuất công khai của lô bị thu hồi (banner đỏ trên cùng) |
| `audit-cart-390.png` | Giỏ hàng mobile |
| `audit-account-1440.png` | Hồ sơ khách đã đăng nhập |
| `audit-orders-1440.png` | Danh sách đơn của khách |
| `audit-admin-dashboard-1425.png` | Dashboard admin |
| `audit-admin-orders-1425.png` | Hàng đợi đơn |
| `audit-admin-batch-1425.png` | Danh sách lô |
| `audit-admin-reports-1425.png` | Báo cáo doanh thu + vận hành |

## 3. Khiếm khuyết đã sửa trong phiên này

| Vấn đề | Trước | Sau |
|---|---|---|
| Trang chi tiết sản phẩm thiếu `<title>` riêng và dữ liệu có cấu trúc | dùng title mặc định của site, không có JSON-LD | `generateMetadata` + `Product` JSON-LD (`app/san-pham/[slug]/page.tsx`) |
| Nút "Tem" của lô trỏ `/tim-kiem?batch=<mã lô>` — mã lô không phải token nên 404 | link sai | trỏ `/t/<qr_token>` thật, ẩn nút khi lô chưa có QR |
| Phí giao trong trang chính sách ghi 30.000₫ | lệch hằng số | 20.000₫ khớp `BASE_SHIP_FEE` |
| Link tra cứu công khai trên admin dùng host admin | 404 | dùng `CUSTOMER_WEB` |
| Admin đăng nhập vào storefront gây trang 500 ở `/tai-khoan` | 500 | `currentCustomer()` trả null với ADMIN → render như khách |

## 4. Đánh giá chất lượng giao diện

- **Phân cấp:** mỗi trang có `PageHeader`/`SectionHeader` + breadcrumb; dashboard dùng KPI card + hàng đợi + cảnh báo có icon ngữ nghĩa.
- **Nhất quán:** một bộ component `packages/ui` (Button/Input/Badge/StatusPill/Modal/EmptyState); class tiện ích `card-pad`, `btn-primary`, `table-base` dùng lại toàn bộ.
- **Ngôn ngữ thị giác:** thương hiệu xanh lá + cát; trạng thái dùng pill màu (thành công/cảnh báo/nguy hiểm) thay vì chữ trần.
- **Trạng thái rỗng/lỗi:** `EmptyState` có icon + tiêu đề + hướng dẫn; `not-found.tsx` và `error.tsx` riêng cho storefront.
- **Khả năng truy cập:** input đều có `<label htmlFor>`, nút disabled có `aria-busy`, ảnh có `alt`, banner thu hồi dùng màu nguy hiểm + chữ (không chỉ màu).

**Hạn chế:** không chấm điểm bằng mô hình thị giác (dịch vụ mô tả ảnh trả 503 giữa phiên), nên đánh giá trên là từ DOM/CSS và ảnh chụp đã lưu, không phải điểm số cảm quan.
