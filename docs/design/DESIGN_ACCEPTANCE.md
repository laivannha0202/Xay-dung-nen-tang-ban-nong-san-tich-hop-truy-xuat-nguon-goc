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

## 4. V4.1 — những gì đã đóng

| Hạng mục V4 còn thiếu | V4.1 |
| --- | --- |
| Mobile dùng font hệ thống | `expo-font` + 4 tệp `BeVietnamPro-{400,500,600,700}.ttf` trong `apps/customer-mobile/assets/fonts/`, nạp qua `useFonts` trong `App.tsx`, mọi style khai báo `fontFamily: font[w]`. Đo computed style: `BeVietnamPro-Regular`. |
| Hero mobile bị bóp chữ | Ảnh giữ `aspectRatio: 16/10`, tiêu đề + CTA chuyển xuống thẻ trắng chồng mép dưới; đo được khung 358×224 (ratio 1.60), 0 phần tử bị cắt chữ. |
| Biểu đồ dashboard không có dữ liệu thật | `GET /admin/dashboard` trả `series` (14 ngày: số đơn + doanh thu đã thu, `generate_series` + `LEFT JOIN orders`) và `top_products` (5 sản phẩm theo doanh thu, loại đơn huỷ/giao thất bại). Dashboard vẽ bằng `div` + chiều cao %, không thêm thư viện. |
| Passport DEMO không được nêu | Banner "Dữ liệu minh hoạ (DEMO)" ngay dưới cảnh báo thu hồi, chip trên bìa hồ sơ, ghi chú ở chân trang; PDF có dòng chữ tương ứng. Kiểm chứng bằng `pypdf`: chuỗi `MINH HOẠ (DEMO)` có trong PDF của `/t/demo-cam-sanh/pdf`. |
| Chỉ số kiểm nghiệm dạng bảng khô | Mỗi chỉ tiêu là một hàng có thanh tỉ lệ đo/giới hạn + badge Đạt/Không đạt; tỉ lệ tính từ chính hai số đã công bố, không thêm dữ liệu. |
| Ảnh lệch tông giữa các nguồn | Một pipeline `.audit/img/grade.py` cho toàn bộ 21 ảnh: cover-crop theo nhóm, chuẩn phơi sáng về 0.56, highlight knee 0.86 + tanh rolloff, cân trắng ấm, saturation ×1.05, JPEG q80 progressive. |
| Ảnh admin bị hỏng trong chi tiết sản phẩm | `mediaUrl()` chỉ ghép host API cho `/uploads/`, đường dẫn seed `/images/...` nay trỏ về host cửa hàng. Đo lại: `san-pham-detail` hỏng 0 ảnh (trước: 1). |
| Toolbar mỗi trang danh sách tự do kích thước | `apps/admin-web/components/toolbar.tsx` dùng chung cho `san-pham`, `don-hang`, `khach-hang`, `lo-hang`, `kho`: một form GET, khung `toolbar`, ô tìm có icon, submit cùng cỡ. Đo: cả 5 trang toolbar cao 42px, một hàng, tràn ngang 0. |
| Nhãn enum thô ở trang chi tiết | `don-hang/[id]` và `lo-hang/[id]` dùng `STATUS_LABEL`/`SAFETY`/`COMPLAINT_TYPE`/`COMPLAINT_STATUS`; quét DOM 20 trang (14 danh sách + 6 chi tiết): 0 enum thô còn hiển thị. |
| Tài khoản mobile chỉ có nhãn, không có số | Ba ô Đơn hàng / Đánh giá / Khiếu nại lấy số thật từ `/me/orders` (`total`), `/me/reviews`, `/me/complaints`; đăng nhập `khach1`: 16 · 2 · 4. |
| Dữ liệu demo không khớp | Vườn cam Khoái Châu (Hưng Yên) từng gắn nhà cung cấp Đà Lạt; seeder nay tạo `NCC-HY-001` riêng, gán lại `supplier_id`, và điền `variety` cho mùa vụ cũ. Kiểm chứng qua API: nhà cung cấp = HTX Rau an toàn Hưng Yên. |
| Số hotline không tồn tại | Bỏ `1900 0000` khỏi footer và trang chính sách; thay bằng liên kết khiếu nại theo lô. Bỏ hứa "giao trong ngày" ở hero/seasonal. |

## 5. Bằng chứng V4.1

`docs/screenshots/v4.1/` — `customer-web/` (16 ảnh), `admin-web/` (24 ảnh, gồm 7 trang chi tiết),
`traceability/` (10 ảnh: demo / thu hồi / hết hạn / tra cứu), `mobile-app/` (7 màn hình Expo web
ở 390×844), `contact-sheet.jpg` ghép toàn bộ ảnh 1440, `report.md` ghi số đo tràn ngang và ảnh
hỏng từng trang. Kết quả lượt chụp cuối: **0px tràn ngang, 0 ảnh hỏng, 0 lỗi runtime** trên toàn
bộ 60 ảnh.

## 6. Khoảng trống còn lại

1. **Chưa review thị giác bằng người/mô hình.** API thị giác trả 402 (hết credit) suốt phiên, nên
   mọi kết luận "trông cao cấp" dựa trên số đo DOM + ảnh chụp, không dựa trên đánh giá thẩm mỹ
   độc lập. ➜ **NOT REVIEWED — cần người soát `docs/screenshots/v4.1/`.**
2. **Ảnh minh hoạ vẫn là ảnh Wikimedia đã grade** (xem `docs/IMAGE_SOURCES.md`). Một buổi chụp
   thật của nông trại sẽ thay được grade bằng nội dung thật.
3. **Admin:** 17 danh sách + 7 màn chi tiết đã có `PageHeader`/`KPI`/`EmptyState`/`table-base`
   đồng bộ, nhưng mỗi màn vẫn chưa có bố cục riêng theo nghiệp vụ.

## 7. Việc không làm (có lý do)

- Không thêm thư viện chart: biểu đồ cột ở dashboard vẽ bằng `div` + chiều cao %, đủ cho 4–7 điểm
  dữ liệu và không kéo thêm dependency.
- Không thêm thư viện gesture/animations cho mobile: bottom sheet dùng `Modal` + `Animated` có sẵn.
- Không đổi tên hàng loạt class `leaf-*`: giữ alias tới khi hết dùng, rồi xoá (đã xoá trong V4).
- Không thêm thư viện biểu đồ ở V4.1 dù thêm chuỗi 14 ngày: vẫn là `div` + % chiều cao, đọc được
  bằng `title` và `aria-label`, không kéo thêm KB.
- Không thay ảnh hàng loạt bằng ảnh tải mới: không có mô hình thị giác để chọn, rủi ro đổi ảnh
  xấu hơn cao hơn lợi ích; thay vào đó siết pipeline grade.
