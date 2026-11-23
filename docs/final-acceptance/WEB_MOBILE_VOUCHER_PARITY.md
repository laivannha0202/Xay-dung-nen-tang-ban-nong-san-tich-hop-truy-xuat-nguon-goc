# Đối chiếu Web ↔ Mobile — hệ thống voucher

Ngày: 2026-11-23 · Nhánh `feat/premium-visual-redesign-v5`

## 1. Cùng nguồn dữ liệu

| Dữ liệu | Web | Mobile | Nguồn |
|---|---|---|---|
| Voucher công khai | `/uu-dai` → `GET /promotions` | màn Ưu đãi → `GET /promotions` | `promotions` |
| Ví voucher | `/tai-khoan/voucher` → `GET /me/promotions` | mục Hồ sơ → Ví voucher → `GET /me/promotions` | `customer_saved_promotions` |
| Lưu / bỏ lưu | `POST`/`DELETE /me/promotions/:id` | cùng | — |
| Báo giá | `POST /checkout/preview` (+ `promotion_code`, `address_id`) | cùng | `buildQuote` |
| Đặt hàng | `POST /orders` (+ `promotion_code`) | cùng | `buildQuote` + `consumePromotionUse` |

Không có localStorage/AsyncStorage nào giữ danh sách voucher là nguồn chính thức; state chỉ để hiển thị.

## 2. Ma trận đối chiếu tính năng

| Hạng mục | Web | Mobile | Khớp |
|---|---|---|---|
| Danh sách voucher | Có | Có | Có |
| Voucher đã lưu | Có | Có | Có |
| Điều kiện voucher (đơn tối thiểu, lượt/tháng, hạn) | Có | Có | Có |
| Nhập mã | Có | Có | Có |
| Chọn mã | Có | Có | Có |
| Gỡ mã | Có | Có | Có |
| Tiền hàng | Có | Có | Có |
| Giảm giá | Có | Có | Có |
| Phí ship | Có | Có | Có |
| Tổng thanh toán | Có | Có | Có |
| Trạng thái: đủ điều kiện / thiếu tiền / hết hạn / hết lượt | Có, kèm số tiền còn thiếu | Có, cùng chuỗi lý do | Có |
| Khoá xác nhận khi đang tính lại giá | `quoting` → nút disabled | `useFetch` reload → nút dùng quote mới | Tương đương |

## 3. Đối chiếu giá trị tiền (cùng tài khoản, cùng giỏ)

Giỏ 632.000₫ (3 dòng, có lô), mã RAUMAU2026 (10%, min 100.000₫):

| | Web (đo trên trình duyệt) | Mobile |
|---|---|---|
| Tiền hàng | 632.000₫ | 632.000₫ (cùng `/checkout/preview`) |
| Giảm voucher | −63.200₫ | −63.200₫ |
| Phí ship | 0₫ (≥500.000₫) | 0₫ |
| Tổng | **568.800₫** | **568.800₫** |

Số của Web đo trực tiếp trong browser (`layout-report.json`, mục `checkout-applied`). Số của Mobile suy ra từ **cùng endpoint và cùng đối tượng `Quote`** — chưa chạy trên emulator, xem §4.

## 4. Trạng thái kiểm chứng

| Bằng chứng | Mức |
|---|---|
| Dữ liệu & giá trị tiền dùng chung một endpoint | Đã chứng minh (API + ảnh web) |
| Ví lưu trên Web hiện trên Mobile | Đã chứng minh ở tầng API: `POST /me/promotions` rồi `GET /me/promotions` cùng tài khoản trả về danh sách đó (`test/14-vouchers.test.ts`) |
| Màn Native hiển thị đúng | **CHƯA** — chưa chạy Android/iOS, không có ảnh Native |
| Bàn phím mở không che nút áp dụng | **CHƯA** kiểm trên thiết bị |
| Android Back đóng sheet | Dùng `BottomSheet` có `onRequestClose` của repo (đã tồn tại), chưa bấm thử trên thiết bị |

Không tuyên bố PASS cho Native.

## 5. Kịch bản bắt buộc (theo yêu cầu)

1. Web lưu HUNGYEN10 → Mobile thấy trong ví: **đã chứng minh tầng dữ liệu**; UI Native chưa chạy.
2. Mobile lưu → Web thấy: cùng một bảng, cùng endpoint; UI Native chưa chạy.
3. Cùng giỏ → cùng tổng: đúng theo thiết kế (một `buildQuote`); đo thực tế mới ở web.
