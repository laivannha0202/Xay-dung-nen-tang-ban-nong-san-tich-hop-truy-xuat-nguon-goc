# Ảnh chụp V7.2 — duyệt cuối

Chụp 2026-11-18 trên bản build thật (`next start` cổng 3000/3001, Expo web 8081) nối API thật
(`:4000`) và PostgreSQL nhúng. Không dữ liệu giả, không mock.

## Contact sheet sản phẩm

| Tệp | Nội dung |
| --- | --- |
| `products-contact-sheet.jpg` | **50/50 sản phẩm**, lưới 10×5, mỗi ô có SKU + tên. Ảnh lấy từ chính storefront (`http://localhost:3000/images/products/<slug>.jpg`), danh sách lấy từ `GET /api/v1/products` theo từng danh mục — không đọc từ file seed. |

Duyệt contact sheet này là đủ để bắt lỗi "ảnh sai chủ thể" cho toàn bộ catalogue.

## Customer Web — `:3000`

| Tệp | Bề mặt |
| --- | --- |
| `customer-home-1440.png` | Trang chủ |
| `customer-catalog-1440.png`, `customer-catalog-390.png` | Danh sách sản phẩm |
| `customer-product-detail-1440.png` | Chi tiết sản phẩm + hộp mua |
| `customer-product-tuong-ban-390.png` | Chi tiết **Tương bần** với ảnh mới, khổ điện thoại |
| `customer-cart-1440.png` | Giỏ hàng |
| `customer-trace-1440.png` | Hộ chiếu tem `demo-ca-chua-lo-0001` |
| `customer-trace-tuong-ban-1440.png` | Hộ chiếu lô tương bần `demo-lo-tuong-ban` |
| `customer-account-1440.png`, `customer-orders-1440.png` | Tài khoản, đơn của tôi (đã đăng nhập) |
| `customer-home-390.png` | Trang chủ khổ điện thoại |

## Admin Web — `:3001`

| Tệp | Bề mặt |
| --- | --- |
| `admin-dashboard-1440.png`, `admin-dashboard-390.png` | Bảng điều khiển (KPI, chuỗi 14 ngày) |
| `admin-orders-1440.png` | Đơn hàng (nhãn DEMO trên đơn minh hoạ) |
| `admin-batches-1440.png` | Lô hàng |
| `admin-products-1440.png` | Sản phẩm (nhãn DEMO) |
| `admin-warehouse-1440.png` | Kho & tồn |
| `admin-reports-1440.png` | Báo cáo doanh thu + vận hành |
| `admin-reviews-1440.png` | Đánh giá |
| `admin-recalls-1440.png` | Thu hồi lô |

## Expo App — `:8081` (bundle web)

| Tệp | Bề mặt |
| --- | --- |
| `mobile-home-390.png` | Trang chủ app, khổ 390×844 |

## Đo được khi chụp

Mọi ảnh: `HTTP 200`, `scrollWidth − clientWidth = 0`, `document.images` hỏng = 0, `pageerror` = 0.
Mã HTTP được ghi cùng mỗi lần chụp — một trang 404 không thể lọt qua như ảnh "đạt".

## Giới hạn

Vision API không dùng được (`402 Credits Required`), nên **không** có kết luận thẩm mỹ tự động nào
trong bộ ảnh này. Kiểm duyệt do người/ChatGPT thực hiện trực tiếp.
