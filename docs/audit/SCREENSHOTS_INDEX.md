# SCREENSHOTS INDEX

Ảnh chụp bằng Playwright trên môi trường chạy thật (`:3000` customer, `:3001` admin), lưu tại `docs/screenshots/`.

## Bộ audit (phiên 2026-11-17)

| Tệp | Viewport | Route | Trạng thái phiên | Ghi chú |
|---|---|---|---|---|
| `audit-home-1440.png` | 1440×900 | `/` | khách | hero, danh mục, sản phẩm nổi bật |
| `audit-plp-390.png` | 390×900 | `/san-pham` | khách | lưới 1 cột, chip lọc |
| `audit-pdp-1440.png` | 1440×900 | `/san-pham/ca-chua-bien` | khách | buy box sticky, lô công khai, đánh giá |
| `audit-pdp-390.png` | 390×900 | `/san-pham/ca-chua-bien` | khách | CTA dưới nội dung |
| `audit-trace-1440.png` | 1440×900 | `/t/demo-ca-chua-lo-0001` | khách | banner thu hồi + hồ sơ lô |
| `audit-cart-390.png` | 390×900 | `/gio-hang` | khách đã đăng nhập | dòng hàng + tạm tính |
| `audit-account-1440.png` | 1440×900 | `/tai-khoan` | khach1 | hồ sơ + lối tắt |
| `audit-orders-1440.png` | 1440×900 | `/tai-khoan/don-hang` | khach1 | danh sách đơn |
| `audit-admin-dashboard-1425.png` | 1425×900 | `/admin` | admin | KPI + cảnh báo + đơn gần đây |
| `audit-admin-orders-1425.png` | 1425×900 | `/admin/don-hang` | admin | hàng đợi theo trạng thái |
| `audit-admin-batch-1425.png` | 1425×900 | `/admin/lo-hang` | admin | lô + trạng thái an toàn |
| `audit-admin-reports-1425.png` | 1425×900 | `/admin/bao-cao` | admin | doanh thu + vận hành |

## Bộ cũ (giữ nguyên, vẫn đúng giao diện)

`a1-dashboard-1440.png`, `a1-dashboard-390.png`, `a2-orders-1440.png`, `a3-order-detail-1440.png`, `a4-batches-1440.png`, `a5-login-1440.png`, `a6-reports-1440.png`, `a7-warehouse-1440.png`, `a8-recalls-1440.png` và các ảnh `customer-*`, `mobile-*` có sẵn.

## Giới hạn

- Không chụp được Android/iOS native (không có emulator) → phần mobile chỉ có ảnh Expo web.
- Ảnh full-page nên chiều cao lớn hơn viewport; không dùng để đánh giá "above the fold".
