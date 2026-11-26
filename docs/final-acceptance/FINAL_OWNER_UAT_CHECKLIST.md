# FINAL_OWNER_UAT_CHECKLIST — Nghiệm thu cuối của chủ dự án

Ngày lập: 2026-11-25 · Nhánh `feat/premium-visual-redesign-v5` · Mốc so sánh `8da6b41`

**Trạng thái: CHƯA CHẠY.** Mọi ô `Kết quả thực tế` / `Trạng thái` để trống cho chủ dự án tự điền.
Không mục nào dưới đây được đánh dấu đạt dựa trên kiểm thử tự động; kết quả tự động chỉ ghi ở cột `Ghi chú kỹ thuật`.

## 0. Chuẩn bị

1. `node scripts/db.mjs up` (Postgres nhúng cổng 5544).
2. Ba terminal: `pnpm api`, `pnpm shop`, `pnpm admin`.
3. Điện thoại: `pnpm mobile`, quét QR Expo (xem `NATIVE_TESTING_GUIDE.md`).
4. Tài khoản: khách `khach1@example.com` / `Khach@123456`; quản trị `admin@agrimarket.vn` / `Admin@123456`.

Ký hiệu: **W** = website, **M** = ứng dụng di động, **A** = trang quản trị.

---

## 1. Đặt hàng và chống trùng đơn

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| B1 | **W**: thêm 2 sản phẩm vào giỏ, bấm đặt hàng, bấm nút xác nhận đúng **một** lần | Sang trang "Đặt hàng thành công", có mã đơn `AGM-…` | | |
| B2 | **W**: ở trang thành công, bấm nút quay lại trình duyệt rồi đặt lại y hệt | Không tạo được đơn thứ hai ngoài ý muốn; số đơn trong mục Đơn hàng tăng đúng 1 | | |
| B3 | **M**: đặt hàng, khi đang quay vòng thì **bật chế độ máy bay**, chờ 5 giây rồi bật lại, bấm thử lại | Báo "Không kết nối được máy chủ…", hoặc nhận ra đơn đã tạo và mở đúng đơn đó; **không** sinh đơn trùng | | |
| B4 | **M/W**: dùng voucher `RAUMAU2026`, sau khi đặt xong xem lại đơn | Dòng voucher hiện mã và số tiền giảm; tổng cộng khớp với số đã trừ | | |
| B5 | **W**: giữ nguyên mã đơn, xóa hết giỏ hàng rồi mở lại trang xác nhận đơn | Đơn vẫn hiển thị đầy đủ; không lỗi, không mất dòng hàng | | |
| B6 | **W**: nhờ kỹ thuật đổi giá một sản phẩm trong lúc đang ở trang thanh toán, rồi bấm xác nhận | Hiện báo giá mới, yêu cầu xem lại; không tự trừ tiền theo giá cũ | | |

## 2. Tài khoản khách (M phải giống W)

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| C1 | **M**: Hồ sơ cá nhân → sửa họ tên → Lưu | Tên đổi ngay ở đầu trang tài khoản, không cần đăng nhập lại | | |
| C2 | **M**: Địa chỉ giao hàng → Thêm địa chỉ, chọn xã/phường Hưng Yên | Địa chỉ mới hiện trong danh sách, chọn được ở bước thanh toán | | |
| C3 | **M**: sửa một địa chỉ, đặt làm mặc định | Chỉ một địa chỉ mang nhãn "Mặc định" | | |
| C4 | **M**: xóa một địa chỉ | Có hộp thoại hỏi lại; đồng ý thì địa chỉ biến mất khỏi cả W | | |
| C5 | **M**: Đăng nhập & bảo mật → đổi mật khẩu → đăng nhập lại bằng mật khẩu mới | Mật khẩu mới dùng được trên cả W và M; phiên cũ trên máy khác bị đăng xuất | | |
| C6 | **W**: kiểm tra cùng địa chỉ vừa tạo trên M | Danh sách giống hệt (cùng một nguồn dữ liệu) | | |
| C7 | **M**: nhập mật khẩu mới 5 ký tự | Bị chặn kèm lời nhắn tiếng Việt, form giữ nguyên nội dung đã gõ | | |

## 3. Đơn hàng, khiếu nại, mua lại

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| D1 | **M**: mở chi tiết một đơn đã giao | Thấy tiền hàng, giảm giá (tách lô / voucher), phí ship, tổng, đã trả, còn phải trả | | |
| D2 | **M**: mở chi tiết đơn đã hủy | Thấy lý do hủy; **không** hiện "còn phải trả khi nhận hàng" | | |
| D3 | **M**: lọc danh sách đơn theo khoảng ngày, nhập ngày sai dạng | Nút lọc bị khóa và có nhắc đúng dạng `YYYY-MM-DD` | | |
| D4 | **M/W**: gửi khiếu nại cho một dòng hàng, mô tả dưới 10 ký tự | Bị chặn kèm lời nhắn; không tạo khiếu nại rỗng | | |
| D5 | **M**: mở danh sách khiếu nại, bấm vào một khiếu nại | Mở trang chi tiết, thấy nội dung, kết quả xử lý và toàn bộ trao đổi | | |
| D6 | **M**: gửi thêm một phản hồi trong khiếu nại đang mở | Phản hồi hiện ngay trong luồng, đúng thứ tự thời gian | | |
| D7 | **M**: mở khiếu nại đã đóng | Không còn ô gửi phản hồi, chỉ có hướng dẫn liên hệ | | |
| D8 | **M**: trên đơn đã giao, bấm **Mua lại (giá hiện tại)** | Sản phẩm còn hàng vào giỏ theo **giá hôm nay**; sản phẩm hết hàng được báo rõ là đã bỏ qua | | |
| D9 | **W**: so sánh số tiền đơn đó với M | Khớp từng dòng đến đồng | | |
| D10 | **M**: đánh giá một đơn đã giao | Đánh giá hiện trong mục "Đánh giá của tôi" và trên trang sản phẩm W | | |

## 3b. Khám phá sản phẩm trên ứng dụng (làm trước khi đặt hàng)

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| E1 | **M**: mở tab sản phẩm, bấm *Bộ lọc* → chọn một danh mục → nhập khoảng giá → *Áp dụng bộ lọc* | Số lượng sản phẩm giảm đúng; các chip *từ …₫* / *đến …₫* hiện ở trên danh sách, bấm ✕ trên chip là bỏ riêng điều kiện đó | | |
| E2 | **M**: chọn sắp xếp *Giá thấp đến cao* | Sản phẩm rẻ nhất lên đầu; dòng tóm tắt ghi rõ kiểu sắp xếp | | |
| E3 | **M**: bấm *Xóa bộ lọc* | Trở lại đủ danh sách, không còn chip nào | | |
| E4 | **M**: bấm biểu tượng trái tim trên một thẻ sản phẩm | Tim đổi trạng thái ngay; vào *Tài khoản → Sản phẩm yêu thích* thấy đúng sản phẩm đó | | |
| E5 | **M**: mở chi tiết 3 sản phẩm khác nhau, rồi vào *Đã xem gần đây* | Đúng 3 sản phẩm, mới nhất đứng đầu | | |
| E6 | **W**: kiểm tra yêu thích trên website bằng cùng tài khoản | Danh sách yêu thích **không** chuyển từ máy sang web — đây là thiết kế đã chốt (lưu theo từng máy), không phải lỗi | | |
| E7 | **M**: mở hồ sơ một lô, bấm *Mở phiếu PDF* | Phiếu mở bằng trình xem PDF của máy, có logo, mã lô, kết quả kiểm nghiệm | | |
| E8 | **M**: bấm *Chia sẻ phiếu PDF* | Bảng chia sẻ của hệ điều hành hiện ra, chia sẻ được sang Zalo/Mail | | |

## 4. Truy xuất nguồn gốc

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| T1 | **M**: quét tem QR thật của một lô đang bán | Mở hồ sơ lô: nông trại, ngày thu hoạch, kết quả kiểm nghiệm | | |
| T2 | **M**: quét tem của lô đã hết hạn dùng | Hiện cảnh báo rõ, không hiển thị như lô bình thường | | |
| T3 | **M**: quét tem của lô đã bị thu hồi | Hiện cảnh báo thu hồi và hướng dẫn liên hệ | | |
| T4 | **M**: xem một hồ sơ lô bằng trình duyệt điện thoại (không đăng nhập) | Xem được, **không** lộ số điện thoại người phụ trách | | |

## 5. Quản trị (A)

| # | Việc cần làm | Kỳ vọng | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|
| A1 | **A**: mở bảng điều khiển | Biểu đồ 14 ngày có cột cho ngày có đơn, số đơn khớp danh sách | | |
| A2 | **A**: mở Cài đặt → Vùng giao hàng Hưng Yên | Đủ 104 xã/phường | | |
| A3 | **A**: xác nhận một đơn chuyển khoản | Trạng thái thanh toán đổi, khách thấy ngay trên M/W | | |
| A4 | **A**: tạo một đợt thu hồi cho lô đang bán | Lô biến khỏi danh sách bán; tem QR của lô hiện cảnh báo | | |

## 6. Điều kiện dừng khẩn

Dừng ngay và ghi lại mã đơn/lô nếu gặp bất kỳ điều nào:

- Số tồn kho hoặc số tiền trên chứng từ in ra sai.
- Một lần bấm đặt hàng tạo ra hai đơn.
- Đơn đã hủy vẫn hiện số tiền phải thu khi giao.
- Tem QR của lô bị thu hồi vẫn hiển thị như lô bình thường.

## 7. Ghi chú kỹ thuật (đã chạy tự động, chỉ để đối chiếu)

| Kiểm tra | Kết quả |
|---|---|
| `pnpm test` (19 tệp) | 122/122 đạt |
| `test/16-checkout-races.test.ts` (mới) | 6/6 đạt — voucher đổi giữa lúc báo giá, đổi địa chỉ đổi giá, áp/bỏ voucher liên tục, mất phản hồi khi tạo đơn, giá đổi khi ngoại tuyến, hai tab cùng lúc |
| `test/15-checkout-idempotency.test.ts` (mới) | 7/7 đạt |
| `pnpm verify:local` | 10/10 mục đạt |
| `pnpm e2e:local` (Chromium thật) | 10/10 bước đạt |
| `pnpm acceptance` | 38/38 bước đạt |
| `pnpm -r typecheck` | sạch (api, customer-web, admin-web, customer-mobile) |
| Expo export web | thành công |
| Thiết bị thật (iOS/Android) | `BLOCKED — OWNER UAT REQUIRED` (camera QR, mở/chia sẻ PDF) |
