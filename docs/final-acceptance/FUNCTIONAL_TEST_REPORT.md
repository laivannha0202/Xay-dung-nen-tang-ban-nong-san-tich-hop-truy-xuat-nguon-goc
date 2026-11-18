# Báo cáo kiểm thử chức năng

Ngày 2026-11-18. Mọi số liệu dưới đây là kết quả chạy thật trên máy này.

## 1. Cổng kiểm tra tự động

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Kiểu dữ liệu toàn repo | `pnpm -r typecheck` | **PASS** — 6/6 package, 0 lỗi |
| Bộ kiểm tra cục bộ | `pnpm verify:local` | **PASS** — 10/10 bước |
| Đầu-cuối trình duyệt | `pnpm e2e:local` | **PASS** — 10/10 bước |
| Chuỗi nghiệp vụ thật | `node scripts/acceptance-walk.mjs` | **PASS** — 38/38 bước |
| Test API | `cd apps/api && npx vitest run` | **PASS** — 12 file / 62 test |

`verify:local` gồm: cấu hình môi trường, PostgreSQL sống, migrate DB test, `typecheck`, test API,
build admin, build customer, typecheck Expo, export Expo, quét bí mật (1044 tệp, 0 phát hiện).

`e2e:local` gồm: trang chủ cửa hàng 200, đăng nhập khách, thêm giỏ, chọn địa chỉ, **đặt đơn thật** (lần chạy cuối: `AGM-2026-0142`),
trang xác nhận, chặn checkout khi thiếu đăng nhập, đăng nhập Admin, bảng 104 phường/xã, biểu đồ
dashboard 14 cột.

## 2. Kịch bản nghiệm thu `scripts/acceptance-walk.mjs` (38 bước)

Chạy trên API thật; tự tạo nhà cung cấp → nông trại → mùa vụ → nhật ký → lô → kiểm nghiệm → công
khai → đặt đơn → xuất kho → thu hồi, rồi dọn dữ liệu.

| # | Bước | Bằng chứng |
|---|---|---|
| 1 | Đăng nhập Admin + khách | 200/200 |
| 2 | Tạo nhà cung cấp | 201 |
| 3 | Tạo nông trại thuộc nhà cung cấp | 201 |
| 4 | Chọn sản phẩm từ danh mục | có dữ liệu |
| 5 | Tạo mùa vụ (mã tự cấp, không trùng) | 201 — hồi quy lỗi S-01 |
| 6 | Nhật ký phun thuốc bắt buộc thời gian cách ly 14 ngày | 201 |
| 7 | Thu hoạch trong thời gian cách ly | **422** "cách ly" |
| 8 | Tạo lô từ mùa vụ | 201 |
| 9 | Công khai khi chưa có kiểm nghiệm | **422** |
| 10 | Tạo phiếu kiểm nghiệm Đạt | 201 |
| 11 | Admin xác nhận phiếu | 200 |
| 12 | Công khai lô + cấp token QR | 200, có `token` |
| 13 | Mở trang truy xuất công khai (không đăng nhập) | 200 |
| 14 | Trang truy xuất đúng lô vừa tạo | đúng mã lô |
| 15 | Trang truy xuất hiện tên nông trại | có |
| 16 | Trang truy xuất hiện chỉ tiêu kiểm nghiệm | "Dư lượng thuốc BVTV" |
| 17 | Trang truy xuất **không** lộ SĐT người phụ trách | không có |
| 18 | Quét QR ghi nhận lượt | `scan_count ≥ 1` |
| 19 | Kho chính tồn tại | có |
| 20 | Nhập kho 10 đơn vị theo lô | 201/200 |
| 21 | `on_hand` = 10 | 10 |
| 22 | Tạo địa chỉ giao hàng | 201 |
| 23 | Preview tính giá ở server | 200 |
| 24 | Lô vừa công khai bán được, available = 10 | 10 |
| 25 | Phân bổ theo chiến lược cấu hình (FIFO) | đúng lô đầu |
| 26 | Đặt đơn | 201 |
| 27 | Gửi lại cùng `Idempotency-Key` | cùng `order_id` |
| 28 | Đặt đơn giữ chỗ trên lô đã phân bổ | reserved tăng |
| 29 | Đặt đơn **không** đụng `on_hand` | không đổi |
| 30 | Client gửi `total_vnd` giả | bị bỏ qua, dùng giá server |
| 31 | Xuất kho | 200/201, `on_hand` −2, reserved −2 |
| 32 | Khách thấy đúng lô đã xuất | có trong allocation |
| 33 | PDF truy xuất | `%PDF` |
| 34 | Tạo thu hồi lô | 201/200 |
| 35 | Trang truy xuất hiện cảnh báo thu hồi | có chữ "thu hồi" |
| 36 | Lô thu hồi không còn được phân bổ | không có |
| 37 | Dọn địa chỉ nghiệm thu | 200/204 |
| 38 | (đếm tổng) 38 assert đều qua | — |

## 3. Quét giao diện bằng trình duyệt thật

| Lần quét | Số tuyến | Kết quả |
|---|---|---|
| Admin (32 tuyến + 6 trang chi tiết) | 32 | 200 toàn bộ, **0 lỗi console, 0 4xx/5xx** |
| Cửa hàng (trang chủ, danh mục, tìm kiếm, sản phẩm, giỏ, thanh toán, tài khoản, đơn, khiếu nại, đánh giá, chính sách) | 18 | 200 toàn bộ |
| Expo web (trang chủ, giỏ, đơn, tài khoản) | 4 | render OK; `/me` khi chưa đăng nhập → 401 đúng thiết kế |

Ảnh chụp: `docs/screenshots/final/f1…f16-*.png` (Admin dashboard/lô/tồn/thu hồi/báo cáo/thanh
toán/khiếu nại/cài đặt/chi tiết lô; cửa hàng danh mục/truy xuất/đơn/chi tiết đơn/thanh toán; Expo).

## 4. Các nhánh đã kiểm thủ công ngoài kịch bản

- Đăng nhập sâu: `/thanh-toan` → `/dang-nhap?next=/thanh-toan` → quay lại `/thanh-toan`.
- Giỏ khách chưa đăng nhập tồn tại ở `localStorage["agri.guest-cart.v1"]`, gộp sau khi đăng nhập.
- Chi tiết đơn: mã lô đã xuất là link `/t/<qr_token>` (mở được trang truy xuất đúng lô).
- `/admin/thu-hoi/[id]` 200 với 4 biên bản thu hồi thật; `/admin/thanh-toan` có 1 yêu cầu hoàn
  55.000₫ đang chờ.
- Tải tem PDF: `GET /admin/batches/:id/label.pdf` → 200 `application/pdf`.

## 5. Không kiểm được

- App Android/iOS native (camera, secure store, deep link, thông báo) — thiếu thiết bị. Xem
  `NATIVE_TESTING_GUIDE.md`.
- GitHub Actions — không chạy theo yêu cầu; toàn bộ cổng chạy cục bộ.
