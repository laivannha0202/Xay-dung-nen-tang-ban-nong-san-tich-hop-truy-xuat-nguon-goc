# FINAL_WEB_MOBILE_PARITY_MATRIX — Đối chiếu Customer Web ↔ Customer Mobile

Ngày: 2026-11-25 · Nhánh `feat/premium-visual-redesign-v5` · Mốc so sánh `8da6b41`

Quy ước trạng thái:

- **IMPLEMENTED** — có trong mã, chưa chạy bằng tay trên màn hình đó trong đợt này.
- **PASS** — đã chạy thật và quan sát kết quả (tự động hoặc bằng mắt).
- **PARTIAL** — có nhưng thiếu một phần so với bên kia; phần thiếu ghi ở cột Ghi chú.
- **FAIL** — có nhưng cho kết quả sai.
- **BLOCKED** — không chạy được trong môi trường hiện tại (thiết bị thật, dịch vụ ngoài).
- **NOT TESTED** — chưa kiểm tra.

## 1. Nguồn dữ liệu (một nguồn, hai vỏ)

| Dữ liệu | Web | Mobile | Nguồn | Trạng thái |
|---|---|---|---|---|
| Hồ sơ khách | `/tai-khoan/ho-so` → `GET/PATCH /me` | Hồ sơ cá nhân → cùng endpoint | `users` | PASS |
| Sổ địa chỉ | `/tai-khoan/dia-chi` → `/me/addresses` | Địa chỉ giao hàng → cùng | `addresses` | PASS |
| Đổi mật khẩu | `/tai-khoan/bao-mat` → `POST /me/password` | Đăng nhập & bảo mật → cùng | `users.token_version` | PASS |
| Giỏ hàng | `/gio-hang` → `/me/cart` | Giỏ → cùng | `carts`, `cart_items` | PASS |
| Báo giá | `POST /checkout/preview` | cùng | `buildQuote` | PASS |
| Đặt hàng | `POST /orders` + header chống trùng | cùng | `idempotency_records` | PASS |
| Tra cứu đơn theo khoá | `GET /orders/by-request/:key` | cùng | `idempotency_records` ⋈ `orders` | PASS |
| Ví voucher | `/tai-khoan/voucher` | Ví voucher | `customer_saved_promotions` | PASS |
| Đơn hàng | `/tai-khoan/don-hang` | Đơn hàng của tôi | `orders` | PASS |
| Khiếu nại | `/tai-khoan/khieu-nai` | Khiếu nại & hỗ trợ | `complaints`, `complaint_messages` | PASS |
| Đánh giá | `/tai-khoan/danh-gia` | Đánh giá của tôi | `reviews` | PASS |
| Truy xuất nguồn gốc | `/t/:token` | Quét QR | `batches` | PASS |

Không có `AsyncStorage`/`localStorage` nào giữ danh sách nghiệp vụ làm nguồn chính thức; bộ nhớ máy chỉ giữ token đăng nhập và bản sao để hiển thị.

## 2. Ma trận tính năng

| Hạng mục | Web | Mobile | Khớp | Ghi chú |
|---|---|---|---|---|
| Đăng ký / đăng nhập | Có | Có | PASS | Cùng `/auth/*` |
| Đăng xuất thu hồi phiên | Có | Có | PASS | Mobile báo rõ khi mất mạng không thu hồi được |
| Trang chủ (danh mục, nổi bật, cận hạn) | Có | Có | PASS | |
| Tìm kiếm / lọc danh mục | Có | Có | PASS | |
| Lọc theo giá, còn hàng, sắp xếp | Có | Có | IMPLEMENTED | Mobile có bottom-sheet: chip danh mục, giá tối thiểu/tối đa, chỉ còn hàng, 5 kiểu sắp xếp, chip bộ lọc đang áp dụng; dùng chung tham số `/products` như web |
| Chi tiết sản phẩm + lô cận hạn | Có | Có | PASS | |
| Giỏ: sửa số lượng, xóa, tiến trình freeship | Có | Có | PASS | |
| Thanh toán: chọn địa chỉ, chọn voucher | Có | Có | PASS | |
| Thanh toán: lỗi giá/hết hàng/voucher hết lượt | Có | Có | PASS | Cùng 4 mã lỗi, cùng cách xử lý |
| Thanh toán: kết quả không rõ (mất mạng, 5xx) | Tra cứu theo khoá | Tra cứu theo khoá | PASS | Không bao giờ đặt lại mù |
| Trang đặt hàng thành công | Có, có mã đơn | Có, có mã đơn | PASS | |
| Đơn hàng: lọc trạng thái | Có | Có | PASS | |
| Đơn hàng: lọc khoảng ngày | Có | Có | PASS | Mobile nhập dạng `YYYY-MM-DD` |
| Chi tiết đơn: tiền hàng/giảm lô/voucher/ship/tổng | Có | Có | PASS | Cùng `discountSplit`, cùng `codDue` |
| Chi tiết đơn: đã trả, còn phải trả | Có | Có | PASS | |
| Chi tiết đơn: hoàn tiền | Có | Có | PASS | Chỉ hiện *Đã hoàn* khi trạng thái `COMPLETED` |
| Chi tiết đơn: vận chuyển | Có | Có | PASS | |
| Hủy đơn | Có | Có | PASS | Chỉ khi `PENDING/CONFIRMED/PREPARING` |
| Mua lại theo giá hiện tại | Có | Có | PASS | `/me/orders/:id/reorder` |
| Đánh giá sản phẩm | Có | Có | PASS | |
| Khiếu nại: gửi từ dòng hàng | Có | Có | PASS | Mô tả ≥ 10 ký tự |
| Khiếu nại: danh sách + trạng thái | Có | Có | PASS | Nhãn theo `NEW/PROCESSING/RESOLVED/CLOSED` |
| Khiếu nại: chi tiết + trả lời | Có | Có | PASS | |
| Hồ sơ: sửa tên/điện thoại | Có | Có | PASS | Mobile làm mới ngữ cảnh sau khi lưu |
| Địa chỉ: thêm/sửa/xóa/đặt mặc định | Có | Có | PASS | |
| Đổi mật khẩu (thu hồi phiên cũ) | Có | Có | PASS | Mobile nhận token mới ngay |
| Truy xuất: hồ sơ lô, kiểm nghiệm | Có | Có | PASS | |
| Truy xuất: cảnh báo hết hạn / thu hồi | Có | Có | PASS | |
| Tải PDF hồ sơ lô | Có | Có | IMPLEMENTED | Mobile: *Mở phiếu PDF* (`Linking`) và *Chia sẻ phiếu PDF* (`Share`); mở bằng trình xem của máy → `OWNER UAT REQUIRED` trên máy thật |
| Danh sách yêu thích | Có | Có | IMPLEMENTED | Cùng khoá lưu `agri.favourites.v1`, cùng endpoint `/products/by-ids`; **lưu theo từng máy**, không đồng bộ giữa các máy |
| Đã xem gần đây | Có | Có | IMPLEMENTED | Cùng khoá `agri.viewed.v1`, 12 sản phẩm gần nhất; **theo từng máy** |
| Thông báo đẩy | Không | Không | — | Không có trong yêu cầu |

## 3. Đối chiếu giá trị tiền (cùng tài khoản, cùng giỏ)

Giỏ 3 dòng có lô cận hạn, mã `RAUMAU2026` (10%, đơn tối thiểu 100.000₫), địa chỉ nội tỉnh Hưng Yên:

| Chỉ tiêu | Web | Mobile | Cùng công thức |
|---|---|---|---|
| Tiền hàng | `subtotal_vnd` | `subtotal_vnd` | Có |
| Giảm lô cận hạn | `discountSplit().lot_vnd` | cùng | Có |
| Giảm voucher | `discountSplit().voucher_vnd` | cùng | Có |
| Phí ship | `ship_fee_vnd` (0 khi ≥ 500.000₫) | cùng | Có |
| Tổng | `total_vnd` từ máy chủ | cùng | Có |
| Còn phải trả khi nhận | `codDue()` | cùng | Có |

Không bên nào tự cộng/trừ tiền ở máy khách: mọi con số hiển thị đều lấy từ `POST /checkout/preview` hoặc bản ghi đơn.

## 4. Kiểm thử đã chạy

| Kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| `pnpm test` | 122/122 | 19 tệp: 7 test chống trùng đơn (`15`) + 6 test tình huống đổi lựa chọn giữa lúc thanh toán (`16`) |
| `pnpm verify:local` | 10/10 | typecheck, api test, build 2 web, expo export, quét bí mật |
| `pnpm e2e:local` | 10/10 | Chromium thật: đăng nhập, giỏ, đặt hàng, kiểm tra quyền, quản trị |
| `pnpm acceptance` | 38/38 | Chuỗi nông trại → kho → đặt → giao → thu hồi |
| `pnpm -r typecheck` | sạch | api, core, 2 web, mobile |
| Expo export (web) | thành công | `.verify/expo-web` |
| Thiết bị iOS/Android thật | `BLOCKED — DEVICE UAT REQUIRED` | Chưa chạy trên máy thật |

## 5. Kết luận

Phần khách hàng đã cùng nguồn dữ liệu, cùng quy tắc tiền, cùng mã lỗi và cùng cách xử lý tình huống không rõ kết quả ở cả web và ứng dụng.

## 6. Đợt 2026-11-26 — bốn dòng PARTIAL đã đóng

| Dòng trước đây | Nay | Bằng chứng |
|---|---|---|
| Lọc theo giá / còn hàng / sắp xếp (mobile) | IMPLEMENTED | `apps/customer-mobile/src/home.tsx` — `ProductListScreen`; đã chạy trên bản export web: `ca chua` → `1 sản phẩm`, 100.000–200.000₫ → `4 sản phẩm` |
| Tải PDF hồ sơ lô (mobile) | IMPLEMENTED | `apps/customer-mobile/src/screens.tsx` — `openPdf()` gọi `/t/:token/pdf`; mở/chia sẻ qua hệ điều hành |
| Yêu thích (mobile) | IMPLEMENTED | `apps/customer-mobile/src/memory.ts` + màn `saved`; đã kiểm tra `localStorage` ghi `agri.favourites.v1` |
| Đã xem gần đây (mobile) | IMPLEMENTED | Cùng tệp, cùng khoá với web; ghi khi mở chi tiết sản phẩm |

Phạm vi có chủ ý: yêu thích và đã xem lưu **trên máy**, giống hệt web hiện tại (cũng chỉ dùng `localStorage`). Muốn đồng bộ giữa các máy cần bảng `customer_favourites` — chưa làm vì chưa có yêu cầu.

Hai nút PDF và luồng chia sẻ hệ điều hành chỉ chứng minh được trên máy thật → `OWNER UAT REQUIRED`, không đánh dấu PASS.
Không còn khác biệt chức năng nào giữa web và ứng dụng ở phần khách hàng. Hai điểm còn phụ thuộc thiết bị: mở/chia sẻ PDF và quyền camera khi quét QR — cả hai ghi `OWNER UAT REQUIRED`.
