# Ảnh chụp giao diện

Bộ **hiện hành** chụp trên bản tách đôi (2026-11-17), bằng Playwright với máy chủ thật (`next start`, cổng 3000/3001), không dùng dữ liệu giả.

## Cửa hàng — `apps/customer-web` (:3000)

| Tệp | Bề mặt | Kích thước |
|---|---|---|
| `c1-home-1440.png`, `c1-home-768.png`, `c1-home-390.png`, `c1-home-360.png` | Trang chủ: hero + lô nổi bật | 1440 / 768 / 390 / 360 |
| `c2-list-1440.png`, `c2-list-768.png` | Danh sách sản phẩm: bộ lọc, sắp xếp, phân trang | 1440 / 768 |
| `c3-detail-1440.png`, `c3-detail-390.png` | Chi tiết sản phẩm + hộp mua | 1440 / 390 |
| `c4-trace-1440.png`, `c4-trace-390.png` | Tra cứu tem `/t/demo-ca-chua-lo-0001` | 1440 / 390 |
| `c5-checkout-1440.png` | Thanh toán 3 bước, bảng phân bổ lô, mã giảm giá | 1440 |
| `c6-success-1440.png` | Đặt hàng thành công (đơn thật `AGM-2026-0006`) | 1440 |
| `c7-order-1440.png` | Theo dõi đơn của khách | 1440 |

## Quản trị — `apps/admin-web` (:3001)

| Tệp | Bề mặt | Kích thước |
|---|---|---|
| `a1-dashboard-1440.png`, `a1-dashboard-390.png` | Bảng điều khiển: KPI, dòng đơn, cảnh báo, đơn gần đây | 1440 / 390 |
| `a2-orders-1440.png` | Danh sách đơn | 1440 |
| `a3-order-detail-1440.png` | Chi tiết đơn `AGM-2026-0005` | 1440 |
| `a4-batches-1440.png` | Lô hàng | 1440 |
| `a5-login-1440.png` | Đăng nhập quản trị | 1440 |
| `a6-reports-1440.png` | Báo cáo doanh thu + vận hành | 1440 |
| `a7-warehouse-1440.png` | Kho & tồn, phiếu nhập/xuất | 1440 |
| `a8-recalls-1440.png` | Thu hồi lô | 1440 |

## Ghi chú

- Ảnh `01-…20-*.png`, `admin-dashboard-1440.png`, `c-web-0*.png` là bản một-website **trước khi tách** (`apps/web` đã xoá) — đã được dọn khỏi thư mục.
- Không có ảnh Android/iOS: máy chưa có Android SDK nên `apps/customer-mobile` được kiểm bằng `tsc --noEmit` + bundle Metro (`HTTP 200`, ~1,98 MB), không chụp được màn hình thật.
