# FINAL_DEMO_WALKTHROUGH — Kịch bản trình diễn 20 phút

Ngày: 2026-11-25 · Nhánh `feat/premium-visual-redesign-v5` · Mốc so sánh `8da6b41`

Mục tiêu: chứng minh **một** chuỗi nghiệp vụ thật — từ nông trại đến tay khách và ngược lại khi có sự cố — không dùng số liệu bịa.
Mỗi bước ghi rõ màn hình, thao tác, và bằng chứng nhìn thấy được.

## Chuẩn bị (2 phút, làm trước khi khán giả vào)

1. Ba terminal đang chạy: `pnpm api`, `pnpm shop`, `pnpm admin`. Điện thoại đã mở app qua Expo.
2. Mở sẵn 3 tab trình duyệt: `http://localhost:3000`, `http://localhost:3001`, và `http://localhost:3000/t/demo-ca-chua-lo-0001`.
3. Đăng nhập sẵn ở tab khách (`khach1@example.com`); tab quản trị để trống cho khán giả thấy màn đăng nhập.
4. Xác nhận tồn kho hiện tại — sẽ đối chiếu lại ở bước 18.

## Kịch bản (23 bước)

### Phần 1 — Khách tìm và đặt hàng (bước 1–8)

| # | Màn hình | Thao tác | Bằng chứng cần thấy |
|---|---|---|---|
| 1 | **W** Trang chủ | Cuộn xuống | Danh mục, sản phẩm nổi bật, mã QR ở góc phải header |
| 2 | **W** Danh mục | Lọc *Giá thấp đến cao* | Thứ tự giá tăng dần, giữ được khi tải lại (lọc nằm trong URL, gửi được cho người khác) |
| 3 | **W** Chi tiết sản phẩm | Mở một sản phẩm có lô cận hạn | Hiện cảnh báo lô cận hạn và mức giảm tương ứng |
| 4 | **W** Chi tiết sản phẩm | Bấm *Thêm vào giỏ* | Giỏ hàng tăng, không rời trang |
| 5 | **W** Giỏ hàng | Nhập mã `RAUMAU2026` | Hiện số tiền giảm và điều kiện còn thiếu (nếu có) |
| 6 | **W** Thanh toán | Chọn địa chỉ đã lưu | Thanh tiến trình miễn phí ship hiện đúng ngưỡng 500.000₫ |
| 7 | **W** Thanh toán | Bấm *Xác nhận đặt hàng* đúng một lần | Trang thành công, mã `AGM-2026-…`, số tiền khớp bước 6 |
| 8 | **W** Trang thành công | Tải lại trang (F5) | Vẫn hiện đúng đơn đó, **không** tạo đơn mới |

### Phần 2 — Truy xuất nguồn gốc (bước 9–11)

| # | Màn hình | Thao tác | Bằng chứng cần thấy |
|---|---|---|---|
| 9 | **Tab 3** hồ sơ lô | Đọc to tên nông trại, ngày thu hoạch, kết quả kiểm nghiệm | Không có số điện thoại cá nhân nào bị lộ |
| 10 | **M** | Quét tem QR của chính lô vừa mua | Hồ sơ lô giống hệt bản web |
| 11 | **M** | Mở tab Khám phá → chọn lô hết hạn (nếu có trong dữ liệu demo) | Cảnh báo hết hạn hiện rõ, không lẫn với lô thường |

### Phần 3 — Kho và xử lý đơn (bước 12–16)

| # | Màn hình | Thao tác | Bằng chứng cần thấy |
|---|---|---|---|
| 12 | **A** Đăng nhập | Đăng nhập quản trị | Vào thẳng `/admin`, không vào được trang khách |
| 13 | **A** Đơn hàng | Mở đơn vừa đặt ở bước 7 | Đúng mã đơn; nút xác nhận đơn |
| 14 | **A** Đơn hàng | Xác nhận đơn → gán vận chuyển → đánh dấu đã giao | Đơn chuyển trạng thái theo từng bước |
| 15 | **A** Kho & tồn | Mở lô vừa bán | `reserved` tăng khi đặt; sau khi giao, `on_hand` giảm đúng số đã giao |
| 16 | **A** In phiếu | In phiếu xuất kho của đơn đó | Trang in riêng, có số phiếu, không menu/tìm kiếm |

### Phần 4 — Khách theo dõi và phản hồi (bước 17–20)

| # | Màn hình | Thao tác | Bằng chứng cần thấy |
|---|---|---|---|
| 17 | **W/M** Đơn hàng | Mở đơn ở bước 7 | Trạng thái *Đã giao*; phần tiền: tiền hàng, giảm lô, voucher, ship, tổng, đã trả |
| 18 | **A** Kho & tồn | Đối chiếu lại tồn | Khớp đúng với dự kiến ở phần chuẩn bị |
| 19 | **M** Chi tiết đơn | Bấm *Mua lại (giá hiện tại)* | Sản phẩm vào giỏ theo **giá hôm nay**, không dùng giá cũ |
| 20 | **M** Chi tiết đơn | Gửi khiếu nại (chất lượng), mô tả ≥ 10 ký tự | Khiếu nại xuất hiện trong danh sách với trạng thái *Mới gửi* |

### Phần 5 — Xử lý sự cố và thu hồi (bước 21–23)

| # | Màn hình | Thao tác | Bằng chứng cần thấy |
|---|---|---|---|
| 21 | **A** Khiếu nại | Trả lời khiếu nại ở bước 20, đặt trạng thái *Đang xử lý* | **M** thấy phản hồi ngay trong luồng trao đổi |
| 22 | **A** Thu hồi | Tạo đợt thu hồi cho lô của đơn vừa giao | Lô biến khỏi danh sách bán |
| 23 | **Tab 3** | Tải lại hồ sơ lô | Hiện cảnh báo thu hồi; **M** quét lại tem cũng thấy cảnh báo |

## Câu chốt khi kết thúc

Một đơn hàng đã đi trọn vòng: **nông trại → kho → khách → khiếu nại → thu hồi**, và mỗi bước đều để lại dấu vết đọc được ở cả ba nơi (web, ứng dụng, quản trị) từ cùng một nguồn dữ liệu.

## Điều không nên nói trong buổi demo

- Không nói "đã kiểm thử trên iPhone/Android thật" — ứng dụng mới chỉ chạy qua Expo trên máy phát triển. Trạng thái đúng: `BLOCKED — DEVICE UAT REQUIRED`.
- Không nói "sẵn sàng thanh toán online" — hệ thống chỉ ghi nhận COD và chuyển khoản xác nhận thủ công.
- Không nói "đã tích hợp đơn vị vận chuyển" — mã vận đơn do người dùng nhập tay.

## Nếu có sự cố giữa buổi

| Hiện tượng | Xử lý tại chỗ |
|---|---|
| Trang trắng, lỗi 404 tệp `_next/static/...` | Máy chủ dev đã cũ; dừng và chạy lại `pnpm shop`. Đây là lỗi của máy dev, không phải lỗi sản phẩm. |
| Bấm đặt hàng mà không phản hồi | Kiểm tra `pnpm api` còn chạy; thử lại — cùng một mã chống trùng sẽ trả lại đơn cũ nếu đơn đã tạo. |
| Ứng dụng mất kết nối | Bật lại mạng rồi bấm thử lại; màn hình báo rõ "Không kết nối được máy chủ…" chứ không treo. |
