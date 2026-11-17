# Nghiệm thu thiết kế (V4)

Thang điểm 100 dùng cho báo cáo này: **hệ thống 15 · phân cấp 20 · kiểu chữ 10 · màu sắc 15 ·
ảnh/đồ hoạ 15 · chi tiết & polish 15 · nhất quán đa nền tảng 10.**

Ảnh chụp trong `docs/screenshots/ui/`: tiền tố `v4-before-` (trước khi làm lại) và `after-` /
`final-` (sau khi làm lại). Mockup tĩnh ở `docs/design/mockups/*/**.png`.

## 1. Điểm tự đánh giá

| Hạng mục | Trước | Sau | Căn cứ |
| --- | --- | --- | --- |
| Hệ thống thiết kế | 8 | 14 | Token tập trung ở `packages/ui/src/styles.css` + `theme.ts`; đã xoá bảng alias `leaf-*`/`clay-*` vì không còn tệp nào dùng |
| Phân cấp thị giác | 10 | 17 | Hero → danh mục → nổi bật → truy xuất → mới về; H1 44px, H2 24–30px đo bằng computed style |
| Kiểu chữ | 6 | 9 | Be Vietnam Pro self-host, subset latin+vietnamese; fallback hệ thống ở mobile |
| Màu sắc | 8 | 13 | Đúng bảng V4; không còn `amber-*`/`emerald-*` ngoài thang; accent cam chỉ cho badge/tag/sao |
| Ảnh & đồ hoạ | 9 | 12 | Ảnh sản phẩm 4:3 đồng nhất, tỉ lệ danh mục 16:10; icon SVG `currentColor`, không emoji chức năng |
| Chi tiết & polish | 7 | 12 | Focus ring toàn cục, tabular-nums cho bảng/KPI, `prefers-reduced-motion`, badge trạng thái có nhãn chữ |
| Nhất quán đa nền tảng | 6 | 8 | Mobile dùng cùng hex; font vẫn là font hệ thống (chưa bundle BVP cho Expo) |
| **Tổng** | **54** | **85** | |

## 2. Đã kiểm chứng bằng máy

| Kiểm tra | Kết quả |
| --- | --- |
| Tràn ngang (`scrollWidth − clientWidth`) | 0px ở 360 / 390 / 768 / 1024 / 1280 / 1440 cho `/`; 0px ở 390 & 1440 cho PLP, PDP, trace, trace-thu hồi, giỏ, tìm kiếm, đăng nhập, tài khoản, đơn hàng, thanh toán, và 5 trang admin |
| Ảnh hỏng (`naturalWidth === 0`) | 0 trên toàn bộ 36 ảnh của lượt chụp cuối |
| Font đang render | `"Be Vietnam Pro", Inter, …` trên `/`, `/san-pham`, `/t/demo-cam-sanh` |
| Cỡ H1 | 44px trang chủ, 24px PLP, 26px passport |
| Lỗi runtime trang | 0 (`pageerror`) |
| `pnpm -r typecheck` | pass (xem mục 4) |
| `pnpm verify:local` | pass |
| `pnpm e2e:local` | pass |

## 3. Ảnh trước / sau theo trang

| Trang | Trước | Sau |
| --- | --- | --- |
| Trang chủ 1440 | `v4-before-home-1440.png` | `final-home-1440.png` |
| Trang chủ 360 | `v4-before-home-390.png` | `final-home-360.png` |
| Danh sách sản phẩm | `v4-before-plp-1440.png` | `final-plp-1440.png` |
| Chi tiết sản phẩm | `v4-before-pdp-1440.png` | `final-pdp-1440.png` |
| Truy xuất (passport) | `v4-before-t-1440.png` | `final-trace-1440.png` |
| Truy xuất (lô thu hồi) | `v4-before-t-1440.png` | `final-trace-recall-1440.png` |
| Giỏ hàng | `v4-before-cart-1440.png` | `final-cart-1440.png` |
| Thanh toán | `v4-before-checkout-1440.png` | `final-checkout-1440.png` |
| Tài khoản / đơn hàng | `v4-before-account-1440.png` | `final-account-1440.png`, `final-orders-1440.png` |
| Admin dashboard | `v4-before-admin-dashboard-390.png` | `final-admin-dashboard-1440.png` |
| Admin đơn hàng | `v4-before-admin-orders.png` | `final-admin-orders-1440.png` |
| Admin lô hàng | `v4-before-admin-batches.png` | `final-admin-batches-1440.png` |
| Mobile Expo web | `v4-before-expo-home.png` | `after-expo-home.png` (chụp trước khi thêm màn hình shop mới) |

Mockup thiết kế: `docs/design/mockups/customer-web/home.png`,
`docs/design/mockups/traceability/passport.png`,
`docs/design/mockups/admin-web/dashboard.png`,
`docs/design/mockups/mobile-app/shop.png`.

## 4. Ba khoảng trống lớn nhất còn lại

1. **Chưa review thị giác bằng người/mô hình.** API thị giác trả 402 (hết credit) suốt phiên, nên
   mọi kết luận "trông cao cấp" ở trên dựa trên số đo DOM + ảnh chụp, không dựa trên đánh giá
   thẩm mỹ độc lập. ➜ **NOT REVIEWED — cần người soát ảnh `final-*` và mockup.**
2. **Mobile chưa bundle Be Vietnam Pro.** Expo dùng font hệ thống; nếu muốn đồng nhất tuyệt đối
   phải thêm `expo-font` + 4 tệp woff2 vào `app.json` (tăng ~170KB bundle).
3. **Ảnh minh hoạ vẫn là ảnh Wikimedia** (xem `docs/IMAGE_SOURCES.md`). Bố cục đã ổn nhưng ảnh
   thật của nông trại/lô hàng sẽ nâng cảm giác "thật" hơn nữa.
4. **Admin mới polish tới mức token + bảng + KPI**; 25 route admin còn lại dùng chung
   `card-pad`/`table-base` nên đồng bộ màu và nhịp, nhưng chưa có thiết kế riêng cho từng màn.

## 5. Việc không làm (có lý do)

- Không thêm thư viện chart: biểu đồ cột ở dashboard vẽ bằng `div` + chiều cao %, đủ cho 4–7 điểm
  dữ liệu và không kéo thêm dependency.
- Không thêm thư viện gesture/animations cho mobile: bottom sheet dùng `Modal` + `Animated` có sẵn.
- Không đổi tên hàng loạt class `leaf-*`: giữ alias tới khi hết dùng, rồi xoá (đã xoá trong V4).
