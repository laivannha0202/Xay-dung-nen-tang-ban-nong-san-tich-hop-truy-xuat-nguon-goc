# Báo cáo tối ưu UX thực tế — AgriMarket

Phạm vi: khách hàng (customer-web, customer-mobile) và vận hành (admin-web).
Nguyên tắc: không dữ liệu giả, không nút giả; mọi con số dưới đây đo trên dữ liệu seed thật trong DB
(`apps/api`, `pnpm migrate` đã áp dụng `011_vi_norm.sql`).

## 1. Điểm ma sát đã xác định (trước khi sửa)

| Vai trò | Việc làm hằng ngày | Ma sát trước đây |
|---|---|---|
| Khách | Tìm sản phẩm | Gõ sai dấu là 0 kết quả ("ca chua" không ra "cà chua"); không có gợi ý, không nhớ từ khoá cũ |
| Khách | Mua lại đơn cũ | Phải mở đơn → đọc tên → tìm lại từng sản phẩm → thêm vào giỏ |
| Khách | Xem lại / lưu sản phẩm | Không có nơi nào lưu; đóng tab là mất |
| Khách | Chọn voucher | Danh sách voucher không nói voucher nào dùng được, thiếu bao nhiêu tiền |
| Khách | Đạt freeship | Chỉ có một dòng chữ trong giỏ, không thấy tiến độ |
| Admin | Tìm đơn | Chỉ tìm theo mã/email; không tìm theo tên khách hay SĐT; đếm theo tab phải tự đọc |
| Admin | Xuất dữ liệu | Không có xuất CSV/Excel; phải copy tay từ bảng |
| Admin | Nhập liệu | Chọn mùa vụ/lô/nông trại từ `<select>` 100+ dòng không lọc được; phải vào trang khác để tạo mùa vụ/lô |
| Admin | Biết việc cần làm | Dashboard chỉ có KPI tổng; phải tự mở 5 trang để tìm việc đang chờ |

## 2. Thay đổi đã làm

### Khách hàng
- **Tìm không dấu**: `vi_norm()` trong DB (migration `011_vi_norm.sql`) + `normalizeVi` ở API. Áp dụng cho sản phẩm, lô, tồn kho, đơn, khách.
- **Gợi ý tức thì** (`/search/suggest`): tối đa 6 sản phẩm (còn hàng trước) + 3 danh mục, debounce 180 ms.
- **Lịch sử tìm kiếm** trên thiết bị (`agri.search-history.v1`), xoá từng từ khoá hoặc xoá hết.
- **Sản phẩm liên quan** do API chọn (`product.related`, ≤8) thay cho việc tải 24 sản phẩm rồi lọc ở client.
- **Đã xem gần đây** (`/da-xem`, dải trên trang chủ) và **Yêu thích** (`/yeu-thich`, nút tim trên trang sản phẩm). Cả hai đọc lại từ `/products/by-ids` nên giá/tồn luôn mới.
- **Mua lại** (`/me/orders/:id/reorder`): kiểm tra lại giá, tồn, trạng thái từng dòng; hiện lý do dòng bị bỏ ("ngừng kinh doanh", "chỉ còn 3/5 kg").
- **Voucher**: mỗi voucher hiện số tiền giảm thực tế, voucher chưa đủ điều kiện bị làm mờ kèm "cần đơn từ X — thêm Y".
- **Tiến độ freeship**: thanh % trong giỏ và trong bước thanh toán.

### Admin
- **Đơn hàng**: đếm theo tab (`/admin/orders/counts`), lọc khoảng ngày, tìm theo tên khách/SĐT, xuất CSV đúng bộ lọc đang xem, sao chép mã đơn, in phiếu giao.
- **Kho**: cờ `Tồn thấp` (ngưỡng ở Cài đặt), lọc "chỉ tồn thấp", xuất CSV tồn kho, KPI tồn thấp.
- **Giao hàng**: gợi ý đơn vị vận chuyển từ các vận đơn đã dùng (`/admin/orders/carriers`), tự điền mã vận đơn gần nhất, nút sao chép mã.
- **Dashboard**: khối "Cần xử lý hôm nay" — chỉ hiện mục khác 0, mỗi mục là link tới danh sách đã lọc sẵn (đơn chờ xác nhận, đơn chờ giao, lô chờ kiểm nghiệm, lô cận hạn ≤7 ngày, sản phẩm sắp hết, khiếu nại mới, hoàn tiền, thu hồi mở).
- **Nhập liệu**: ô chọn dài (>20 lựa chọn) có ô lọc không dấu; "Tạo lô hàng từ mùa vụ này" và "Tạo mùa vụ cho nông trại này" mở sẵn form với khoá cha đã điền; cảnh báo khi rời form đang nhập dở.

## 3. Trước / sau (đếm thao tác thật)

| Tác vụ | Trước | Sau |
|---|---|---|
| Khách: tìm "cà chua" gõ không dấu | 0 kết quả → phải gõ lại có dấu (1 lần thất bại + 1 lần gõ) | 1 lần gõ, ≤6 gợi ý ngay dưới ô tìm |
| Khách: mua lại đơn 3 dòng | ~3 trang chuyển + 3 lần tìm + 3 lần thêm giỏ (≥9 thao tác) | 1 nút "Mua lại" + 1 nút "Thêm vào giỏ" (2 thao tác) |
| Khách: chọn voucher | Thử → báo lỗi → đổi voucher | Thấy ngay mức giảm và điều kiện, 1 cú bấm |
| Admin: đơn chờ xác nhận hôm nay | Mở Dashboard → mở Đơn hàng → chọn tab → tự đếm (3 trang) | 1 cú bấm từ Dashboard (số đếm có sẵn trên tab) |
| Admin: xuất đơn tháng này | Không có → copy tay từng trang 20 dòng | 1 cú bấm "CSV", đúng bộ lọc, mở được bằng Excel (UTF-8 BOM) |
| Admin: tạo lô cho 1 mùa vụ | Vào Lô hàng → mở form → tìm mùa vụ trong danh sách dài (4 bước) | Bấm "Tạo lô hàng từ mùa vụ này" → form đã chọn sẵn mùa vụ (2 bước) |
| Admin: tìm đơn khi khách gọi | Cần mã đơn hoặc email | Gõ tên hoặc SĐT, không dấu cũng khớp |

## 4. Bằng chứng kiểm thử

- `pnpm -r typecheck`: 6/6 package pass.
- `pnpm verify:local` 10/10, `pnpm e2e:local` 10/10, `pnpm acceptance` 38/38 (2026-11-19).
- Kiểm bằng trình duyệt thật (Playwright, 0 pageerror, 0 HTTP ≥500):
  - Gõ "cachua" → dropdown gợi ý hiện 2 mục.
  - Bấm tim trên trang sản phẩm → `aria-pressed=true`; `/yeu-thich` hiện sản phẩm đó; `/da-xem` ghi nhận lượt xem.
  - Khách đăng nhập → mở đơn → "Mua lại" → xem trước 1 dòng → thêm giỏ thành công.
  - Admin: Dashboard hiện khối "Cần xử lý hôm nay" (5 mục khác 0); tab "Tất cả" có số đếm; link CSV tải `don-hang-2026-11-19.csv`; `/admin/kho?low=1` lọc còn 26 dòng; trang đơn có nút "Sao chép mã đơn" / "In phiếu giao" / "Sao chép mã vận đơn".
  - "Tạo lô hàng từ mùa vụ này" mở form đã chọn sẵn mùa vụ và có ô lọc chọn.
- Endpoint mới kiểm bằng curl trên DB seed thật:
  - `GET /search/suggest?q=ca` → 5 sản phẩm + 1 danh mục; `?q=cachua` khớp "Cà chua bi Đà Lạt".
  - `GET /products?search=cà chua` và `?search=cachua` cùng trả 1 kết quả.
  - `GET /products/ca-chua-bien` → `related` 8 sản phẩm cùng danh mục.
  - `GET /me/orders/{id}/reorder` → 1 dòng khả dụng (giữ chỗ hiện tại 139 kg), 0 dòng bị bỏ.
  - `GET /admin/orders/counts` → `{ALL:25, PENDING:4, …}`.
  - `GET /admin/orders?format=csv` và `/admin/inventory?format=csv` → CSV có BOM, tiêu đề tiếng Việt.
  - `GET /admin/dashboard` → `queues` đủ 8 khoá; `low_stock` trả 0 (không NULL).
- Trang render thật (HTTP 200): `/`, `/san-pham?q=cachua`, `/san-pham/ca-chua-bi-da-lat`, `/da-xem`, `/yeu-thich`, `/admin`, `/admin/don-hang`, `/admin/kho`, `/admin/mua-vu`, `/admin/nha-cung-cap`, `/api/download/orders` (text/csv).

## 5. Giới hạn có chủ ý

- Lịch sử tìm kiếm / đã xem / yêu thích lưu trên **thiết bị** (localStorage), không phải tài khoản: chưa thêm bảng DB, nên đồng bộ giữa điện thoại và máy tính chưa có. Thêm bảng khi khách thực sự dùng nhiều thiết bị.
- Xuất **CSV** (mở được bằng Excel) chứ chưa có `.xlsx`; nhập Excel chưa làm vì phải có template + xem trước + kiểm tra an toàn lô.
- Gợi ý tìm kiếm dựa trên tên/SKU/danh mục, chưa dùng lịch sử bán để xếp hạng.
- Không có bảng "đơn đang theo dõi" mới: trạng thái giao vẫn đọc từ `shipments` hiện có.
