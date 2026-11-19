# UAT_CHECKLIST — Kiểm thử chấp nhận người dùng

**Trạng thái: CHƯA CHẠY.** Toàn bộ ô `[ ]` dưới đây là việc **phải làm bởi người thật**. Không có mục nào trong tài liệu này được đánh dấu đạt dựa trên kiểm thử tự động.

Ba người tham gia đề nghị, không cần biết kỹ thuật:

| Vai | Ai | Việc |
|---|---|---|
| **A — Quản lý kho** | 1 người, đã từng ghi sổ kho giấy | Nhập, xuất, kiểm kê, in phiếu kho |
| **B — Nhân viên bán hàng** | 1 người, đã từng nhận đơn qua điện thoại | Xử lý đơn, giao hàng, hoàn tiền, thu hồi |
| **C — Khách hàng** | 1 người **chưa từng xem** hệ thống | Tự đặt hàng trên điện thoại không có hướng dẫn |

Cách chạy: đưa **thiết bị + tài khoản**, đọc to từng mục, không cầm tay chỉ. Ghi lại chỗ nào người thử dừng lại > 10 giây hoặc hỏi "cái này để làm gì".

Tài khoản dùng để thử: Admin `admin@agrimarket.vn` / `Admin@123456` → http://localhost:3001. Khách `khach1@example.com` / `Khach@123456` → http://localhost:3000.

Điều kiện dừng khẩn: nếu bất kỳ ai tạo được **số liệu tồn kho sai** hoặc **in ra chứng từ có số tiền sai**, dừng ngay và ghi lại mã đơn/lô.

---

## 1. Quản lý kho (người A, máy tính)

| # | Việc cần làm | Kỳ vọng | Kết quả |
|---|---|---|---|
| A1 | Vào **Kho & tồn**. Đọc to 5 ô số liệu đầu trang. | Hiểu mỗi ô nói gì mà không cần hỏi | [ ] đạt / [ ] lỗi: … |
| A2 | Mở **Nhập kho** cho lô `LO-DEMO-MONGTOI`, nhập 10 kg. | Báo thành công, tồn tăng đúng 10 | [ ] đạt / [ ] lỗi: … |
| A3 | In phiếu nhập vừa tạo. | Mở trang in riêng, có số `PNK-…`, **không** có menu/tìm kiếm | [ ] đạt / [ ] lỗi: … |
| A4 | Thử nhập **số âm** hoặc **chữ**. | Bị chặn kèm lời nhắn tiếng Việt, form **không** mất dữ liệu đã gõ | [ ] đạt / [ ] lỗi: … |
| A5 | Mở **Điều chỉnh tồn**, chọn lý do "Kiểm kê", nhập −2. | Bắt buộc nhập lý do ≥ 5 ký tự; phiếu in ra có dấu `−2` | [ ] đạt / [ ] lỗi: … |
| A6 | In **Báo cáo tồn kho**. | Nhiều trang, mỗi dòng không bị cắt giữa hai trang | [ ] đạt / [ ] lỗi: … |
| A7 | Tải CSV tồn kho, mở bằng Excel. | Tiếng Việt có dấu đúng, không lỗi font | [ ] đạt / [ ] lỗi: … |
| A8 | Thu nhỏ cửa sổ trình duyệt về cỡ điện thoại. | Không phải kéo ngang, không có nút bị kéo cao bất thường | [ ] đạt / [ ] lỗi: … |

## 2. Bán hàng / hậu mãi (người B, máy tính)

| # | Việc cần làm | Kỳ vọng | Kết quả |
|---|---|---|---|
| B1 | Vào **Đơn hàng**, lọc trạng thái "Chờ xác nhận". | Đếm được số đơn, biết đơn nào lâu nhất | [ ] đạt / [ ] lỗi: … |
| B2 | Mở một đơn, đổi trạng thái sang "Đang giao". | Trạng thái đổi ngay, không cần tải lại trang | [ ] đạt / [ ] lỗi: … |
| B3 | In **phiếu giao hàng** cho đơn đó. | Có danh sách hàng, số tiền COD, ô chữ ký người nhận | [ ] đạt / [ ] lỗi: … |
| B4 | Tạo **hoàn tiền** cho một đơn đã huỷ, 20.000₫. | Mã `HT-…` tự sinh, in được phiếu hoàn tiền | [ ] đạt / [ ] lỗi: … |
| B5 | Mở **Thu hồi**, lập biên bản cho một lô. | In ra danh sách khách đã nhận lô đó (hoặc ghi "chưa có khách nào") | [ ] đạt / [ ] lỗi: … |
| B6 | Thử **huỷ một đơn đã giao**. | Bị từ chối kèm lý do rõ ràng | [ ] đạt / [ ] lỗi: … |
| B7 | Đọc một phiếu bán hàng bất kỳ. | Hiểu ngay đây là phiếu nội bộ, không phải hoá đơn GTGT | [ ] đạt / [ ] lỗi: … |

## 3. Khách hàng (người C, **điện thoại**, không hướng dẫn)

| # | Việc cần làm | Kỳ vọng | Kết quả |
|---|---|---|---|
| C1 | Mở trang chủ, tìm "cà chua". | Ra kết quả trong ≤ 3 lần chạm, giá và đơn vị rõ | [ ] đạt / [ ] lỗi: … |
| C2 | Thêm 1 món vào giỏ, đặt hàng. | Không cần hỏi ai; phí giao và tổng tiền hiện trước khi xác nhận | [ ] đạt / [ ] lỗi: … |
| C3 | Theo dõi đơn vừa đặt. | Thấy trạng thái hiện tại bằng tiếng Việt | [ ] đạt / [ ] lỗi: … |
| C4 | Huỷ đơn khi còn "Chờ xác nhận". | Huỷ được, có hỏi xác nhận | [ ] đạt / [ ] lỗi: … |
| C5 | Thử huỷ đơn đã giao. | Nút huỷ không có hoặc bị từ chối kèm hướng dẫn liên hệ | [ ] đạt / [ ] lỗi: … |
| C6 | Quét tem QR trên bao bì (hoặc mở link `/t/demo-ca-chua-lo-0001`). | Ra trang truy xuất: tên nông trại, ngày thu hoạch, hạn dùng, trạng thái an toàn | [ ] đạt / [ ] lỗi: … |
| C7 | Gửi **đánh giá** và **khiếu nại** cho đơn đã nhận. | Cả hai gửi được, không cần tài khoản khác | [ ] đạt / [ ] lỗi: … |
| C8 | Đọc số tiền và ngày trên trang. | Đọc đúng `56.000₫` là năm mươi sáu nghìn; ngày hiểu là ngày/tháng/năm | [ ] đạt / [ ] lỗi: … |

---

## Tổng hợp

| Nhóm | Tổng mục | Đạt | Lỗi |
|---|---|---|---|
| A — Kho | 8 | | |
| B — Bán hàng | 7 | | |
| C — Khách | 8 | | |
| **Cộng** | **23** | **0** | — |

**Chưa có mục nào được chạy.** Bảng trên để trống cho tới khi có người thật thực hiện.
