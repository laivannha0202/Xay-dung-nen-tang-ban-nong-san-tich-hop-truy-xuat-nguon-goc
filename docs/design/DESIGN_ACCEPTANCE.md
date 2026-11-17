# Nghiệm thu thiết kế (V4.2)

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

## 8. V4.2 — chốt phiên bản (baseline `79959b1`)

Phạm vi V4.2 **không** thiết kế lại: giữ nguyên hệ thống thị giác, nhận diện và kiến trúc V4/V4.1.
Chỉ sửa lỗi nghiệm thu, gỡ cam kết chưa có chính sách, và ghi lại bằng chứng.

### 8.1 Ảnh nghiệm thu giỏ hàng

| Vấn đề | Xử lý |
| --- | --- |
| `customer-web/cart-with-items-{1440,390}.png` chụp **trạng thái giỏ trống** dù tên tệp ghi "có sản phẩm": fixture bơm 4 SKU chạy trước, nhưng lần chụp sau đó gặp giỏ rỗng, và script cũ chỉ chờ 500 ms trước khi bấm máy nên ảnh trống vẫn được ghi. | `.audit/shot-cart-v42.mjs` chụp lại sau khi `fixture-v42.mjs` nạp 4 dòng (356.000₫), **assert** `Giỏ hàng đang trống` không xuất hiện và `ul.card > li` ≥ 1 — sai thì script ném lỗi, không ghi ảnh. Kết quả: 4 dòng ở cả 1440 và 390, tràn ngang 0, ảnh hỏng 0. |

### 8.2 Cam kết chưa có chính sách xác thực — đã gỡ

| Chuỗi cũ | Nơi xuất hiện | Chuỗi nay |
| --- | --- | --- |
| `giao trong ngày tại Hưng Yên` (highlight hero) | `apps/customer-web/components/home-hero.tsx` | `bán theo lô, có tem truy xuất` |
| `Hàng về kho mỗi sáng từ nông trại đối tác…` (body hero) | `apps/customer-web/components/home-hero.tsx` | `Mỗi lô từ nông trại đối tác có tem truy xuất và phiếu kiểm nghiệm đạt trước khi lên kệ.` |
| `Hàng về kho mỗi sáng…` (body hero mobile) | `apps/customer-mobile/src/home.tsx` | `Bán theo lô từ nông trại đối tác, mỗi lô có tem truy xuất.` |
| `['Thời gian', 'Trong ngày']` (ô KPI vùng giao hàng) | `apps/customer-web/app/page.tsx` | `['Thời gian', '24 giờ làm việc']` |

Căn cứ: `apps/customer-web/app/chinh-sach/[slug]/page.tsx` → chính sách giao hàng công bố
"Nội tỉnh: trong 24 giờ làm việc kể từ khi đơn được xác nhận". Không có cam kết "giao trong
ngày" hay "nhập kho mỗi sáng" nào trong tài liệu nghiệp vụ, nên các chuỗi đó bị coi là cam kết
không xác thực. Kiểm chứng bằng `.audit/shot-copy-v42.mjs`: chụp `/` ở 390/768/1440,
`/chinh-sach/giao-hang` 1440 và Expo web 390, **assert** ba chuỗi cấm không còn trong DOM.

Nhãn "Mới về kho" (tiêu đề mục sản phẩm mới) được giữ: nó đặt tên cho danh sách sắp theo
`sort=newest` từ các lô đã công bố, không hứa lịch nhập hàng.

### 8.3 Dữ liệu test/demo so với dữ liệu kinh doanh

Migration `007_demo_marker.sql` gắn cờ `is_demo` cho 7 bảng (`products`, `farms`, `suppliers`,
`batches`, `orders`, `reviews`, `complaints`); mặc định `false`. Hai seeder demo chỉ UPDATE đúng
dòng chúng tạo, không quét toàn bảng. Đo trên CSDL dev hiện tại (không reset, không xoá):

| Bảng | Tổng | `is_demo = true` | Nguồn bật cờ |
| --- | --- | --- | --- |
| `products` | 14 | 8 | `seed-demo-catalog.ts` |
| `batches` | 17 | 8 | `seed-demo-catalog.ts` |
| `orders` | 39 | 5 | `seed-demo-orders.ts` |
| `reviews` | 2 | 1 | `seed-demo-orders.ts` |
| `complaints` | 5 | 1 | `seed-demo-orders.ts` |
| `suppliers` | 3 | 0 | — |
| `farms` | 3 | 1 | `seed-demo-catalog.ts` |

Những gì **chưa** phân biệt được, ghi nhận trung thực:

1. **Đơn do kiểm thử tạo ra không có cờ.** `pnpm e2e:local` và các script `.audit/` đặt hàng qua
   API thật, nên đơn `AGM-2026-01xx` mang `is_demo = false` và trùng hình thức với đơn kinh
   doanh (34/39 đơn). Bảng `orders` không có cột nguồn (`source`), nên **không thể** tách đơn
   test khỏi đơn thật bằng truy vấn. Muốn tách: thêm cột `source` cho `orders` — ngoài phạm vi
   đóng băng này.
2. **Tài khoản kiểm thử không có cờ.** `audit9432499@example.com` (tạo 2026-11-17) nằm cùng
   `users` với `khach1`/`khach2`. Bảng `users` không có `is_demo`.
3. **Không xoá, không reset.** Toàn bộ số liệu trên là trạng thái CSDL dev hiện hữu; bản đóng
   băng này không xoá dòng nào.

### 8.4 Trạng thái nghiệm thu Native Android/iOS

**Chưa nghiệm thu trên thiết bị thật — BLOCKED.** Bằng chứng:

- `apps/customer-mobile/` không có thư mục `android/` hay `ios/` (project native chưa prebuild).
- Máy này không có `adb`, emulator Android hay Xcode/Simulator; mọi ảnh `mobile-app/` trong
  `docs/screenshots/v4.2/` đều là **Expo web** ở 390×844, không phải app native.
- `package.json` mobile: `expo ~58.0.25`, `react-native 0.88.1`, chưa cấu hình EAS build.

Vì vậy mọi tuyên bố "app chạy trên Android/iOS" trong tài liệu này **không** được đưa ra. Những
gì đã kiểm chứng: bundle Expo web export thành công (`pnpm verify:local` bước `expo export`),
typecheck mobile pass, và các màn hình chạy đúng trên web.

### 8.5 Kiểm tra lại toàn bộ chức năng

Xem `docs/screenshots/v4.2/report.md` (bằng chứng ảnh) và kết quả `pnpm verify:local` /
`pnpm e2e:local` ghi trong báo cáo commit V4.2.
