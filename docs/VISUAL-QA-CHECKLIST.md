# AgriMarket — Visual QA Release Checklist

Tài liệu này là checklist nghiệm thu giao diện thật trước khi PR commerce được phép Ready/Merge.

> `apps/mobile/test/visual-sync.test.cjs` **không phải screenshot regression**. Test đó chỉ kiểm semantic/static contract như token màu, import/style và image URL behavior. Không được dùng kết quả của test này để tuyên bố giao diện đã được visual-QA.

## Nguyên tắc PASS

Một màn chỉ được đánh dấu PASS khi đã **render thật** trên browser/device/emulator và kiểm tra tối thiểu:

- không crash hoặc blank screen;
- không overflow ngang ngoài chủ ý;
- chữ tiếng Việt không bị cắt sai;
- ảnh đúng aspect ratio, loading/fallback hợp lý;
- loading / empty / error / success state hiển thị rõ;
- nút quan trọng có disabled/loading state khi submit;
- số tiền dùng format Việt Nam và không lệch snapshot Backend;
- trạng thái đơn/thanh toán/vận chuyển dùng nhãn thống nhất;
- mobile keyboard không che input/action chính;
- focus/keyboard navigation hợp lý trên Web/Admin;
- responsive không vỡ ở viewport yêu cầu.

## Customer Web

Kiểm ở tối thiểu các viewport:

- Mobile web: `390×844`
- Tablet: `768×1024`
- Desktop: `1440×900`

| Luồng / màn | Điều kiện nghiệm thu |
|---|---|
| Trang chủ | Header/search/card sản phẩm/ảnh/fallback không vỡ; CTA rõ |
| Danh sách sản phẩm | Search, filter, empty state, pagination/list responsive |
| Chi tiết sản phẩm | Ảnh, giá, quy cách, tồn, farm/trace CTA rõ |
| Giỏ hàng | Quantity/update/remove/loading/error; tổng tiền đồng bộ Backend |
| Checkout | Chọn địa chỉ; Hưng Yên = có thể giao; ngoài vùng = bị chặn; voucher/điểm/ship/total rõ |
| COD | Submit một lần, loading state, không tạo đơn trùng khi retry |
| VNPay Sandbox | Redirect đúng; callback về Web; pending/failure/success rõ; failed có retry khi reservation còn giữ |
| Danh sách đơn | Filter đủ trạng thái gồm khiếu nại/hoàn tiền |
| Chi tiết đơn | Hiện `tạm tính + ship - voucher - điểm = tổng`; address/status/timeline/sản phẩm không vỡ |
| Truy xuất | Nhập mã, timeline nguồn gốc, empty/error state |
| Hồ sơ / địa chỉ | Form, validation, địa chỉ ngoài Hưng Yên vẫn lưu được nhưng checkout không dùng được |

## Admin Web

Kiểm desktop `1440×900` và laptop `1280×720`; kiểm thêm `768×1024` cho layout co hẹp.

| Luồng / màn | Điều kiện nghiệm thu |
|---|---|
| Dashboard | Cards/charts không overflow, loading/error state rõ |
| Sản phẩm | Table/filter/form/ảnh hoạt động, text dài không phá layout |
| Danh mục | CRUD và permission state rõ |
| Đơn hàng | Table/filter/status/payment; Drawer detail không overflow |
| Chi tiết đơn | “Cơ cấu giá đã chốt” hiện đủ tạm tính/ship/voucher/điểm/tổng |
| Đóng gói | Checklist/action loading/error rõ |
| Vận chuyển | Không mô tả MockShippingAdapter như hãng vận chuyển production |
| Khuyến mãi | List/filter/create/edit/enable-disable; scope toàn sàn/danh mục/sản phẩm dễ hiểu |
| Người dùng / RBAC | Permission denied không lộ action trái quyền |
| Refund | Partial/full refund state rõ; không cho thao tác gây double refund |
| Cấu hình | Phí ship/ngưỡng miễn phí hiển thị đúng policy Backend |

## Mobile App

Kiểm trên ít nhất một Android emulator/device thực ở kích thước phổ biến và một kích thước màn nhỏ.

| Luồng / màn | Điều kiện nghiệm thu |
|---|---|
| Onboarding / Login | Keyboard, validation, loading/error; không che CTA |
| Home / Search | Card/ảnh/list scroll mượt, safe area đúng |
| Product detail | Ảnh, giá, tồn, trace/farm CTA rõ |
| Cart | Quantity/remove/retry; total đồng bộ Web/Backend |
| Checkout | Address shipping scope, voucher/points, COD/VNPay cùng semantics Web |
| VNPay Sandbox result | Backend-verified status; failed + `DANG_GIU` có “Thử lại VNPay” |
| Orders | Filter gồm refund/dispute, list state rõ |
| Order detail | Pricing snapshot đủ 6 field; payment/reservation/shipment/timeline không vỡ |
| Trace / QR | Camera permission/error + trace result rõ |
| Profile / Address | Form/keyboard/safe area; địa chỉ ngoài vùng có cảnh báo checkout phù hợp |

## Cross-platform parity phải kiểm cùng một fixture

Dùng cùng tài khoản và cùng Order để so Web ↔ Mobile ↔ Admin:

1. Cùng sản phẩm / quantity / current price.
2. Cùng địa chỉ Hưng Yên.
3. Cùng voucher.
4. Cùng điểm sử dụng.
5. Cùng phí vận chuyển.
6. Cùng tổng thanh toán.
7. Cùng trạng thái payment/order/reservation.
8. Cùng pricing snapshot sau khi cấu hình/voucher hiện tại thay đổi.
9. Cùng semantics refund/cancel.

## Bằng chứng tối thiểu

Trước khi Ready/Merge, lưu lại kết quả QA gồm:

- commit SHA được kiểm;
- browser/device + viewport;
- danh sách màn PASS/FAIL;
- screenshot cho checkout, payment result, order detail, Admin promotion và Admin order detail;
- lỗi phát hiện và commit sửa tương ứng.

Không đánh dấu `Visual QA ✅` nếu chỉ đọc source hoặc chạy `visual-sync.test.cjs`.
