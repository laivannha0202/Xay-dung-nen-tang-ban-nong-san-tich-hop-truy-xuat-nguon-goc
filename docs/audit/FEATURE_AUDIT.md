# FEATURE AUDIT — 122 mã P1 (Admin 64 + Customer 58)

**Cách chứng minh:** mỗi dòng `PASS` có một lần chạy thật. Ba nguồn bằng chứng:

1. `apps/api/test/*.test.ts` — 53 test tự động (`cd apps/api && pnpm test` → 8 files, 53 passed), gồm `06-logic-gates.test.ts` khoá các lỗi nghiệp vụ và `07-service-area`/`08-security` khoá vùng giao hàng Hưng Yên + uploads riêng tư (đợt 2026-11-17).
2. `.audit/api-proof.mjs` — 31 phép kiểm tra API sống trên :4000, in `PASS <mã> :: <số liệu>`; chạy lại: `node .audit/api-proof.mjs` → `summary: 31/31 pass`.
3. Playwright click-through thật trên :3000/:3001/:8081 (đợt 2026-11-17: giỏ web↔app đồng bộ, đặt đơn AGM-2026-0009, admin xác nhận→xuất kho→Đang giao hiện trên cả 3 kênh, thu hồi LO-2026-0004 hiện banner trên trang tem), ảnh chụp trong `docs/screenshots/`.

`BLOCKED` chỉ dùng cho phần cần thiết bị native (Android/iOS) — không có emulator trên máy này.

---

## B. Admin Web — 64 mã

| Mã | Trạng thái | Bằng chứng thực tế |
|---|---|---|
| `ADM-01-01` | PASS | `/admin` hiển thị KPI đơn mới/đang giao/doanh thu; `alerts` nguồn từ `GET /admin/dashboard`; số liệu khớp DB (`orders` 8 dòng, `payments` PAID). |
| `ADM-01-02` | PASS | Dashboard + `GET /admin/reports/operations` trả `batchesByState {active:4, near_expiry:2, expired:1, hold:3, recalled:1}`. |
| `ADM-01-03` | PASS | `ALERT_LINK` map ORDER/LAB_FAIL/COMPLAINT/RECALL → link đúng trang chi tiết (`app/admin/page.tsx:15-20`); cảnh báo KN-2026-0005 xuất hiện và mở được ticket. |
| `ADM-01-04` | PASS | Nút làm mới + lọc ngày trên dashboard; không phụ thuộc realtime. |
| `ADM-02-01` | PASS | Tạo danh mục qua form thật: `+ Thêm danh mục` → POST `/admin/categories` → dòng mới hiện trong bảng (`category visible=1`). |
| `ADM-02-02` | PASS | `/admin/san-pham/:id` PATCH đầy đủ SKU/tên/mô tả/ảnh/đơn vị/giá/hạn dùng/bảo quản; `serverFetch` + `PatchForm`. |
| `ADM-02-03` | PASS | Cờ `requires_trace` lưu trên `products`; publish lô chặn khi `requires_trace && log_count = 0` (`admin.ts:826`). |
| `ADM-02-04` | PASS | Tồn khả dụng tính bằng `SELLABLE_SQL` (PASS + PUBLISHED + NORMAL + còn hạn); sản phẩm hết lô vẫn hiện với `in_stock=false`. Test `05-p1-gaps` chứng minh recall làm `available` giảm đúng 20. |
| `ADM-03-01` | PASS | `/admin/nha-cung-cap` CRUD + `Ngừng` (PATCH status INACTIVE) hoạt động. |
| `ADM-03-02` | PASS | Form nông trại gắn `supplier_id` đang ACTIVE, có toạ độ/diện tích/cây trồng/người phụ trách. |
| `ADM-03-03` | PASS | `POST /uploads` (MIME sniff từ magic bytes, tên ngẫu nhiên 32 hex) + `POST /admin/evidence` lưu `uploaded_by`, `description`, `is_public`. Test `ADM-03-03` xác nhận `owner_type=UPLOAD`, `is_public=false`, bytes HTML bị 422. |
| `ADM-03-04` | PASS | `GET /t/:token` chỉ trả tên nông trại + tỉnh; không có toạ độ/liên hệ/giấy tờ trong payload công khai. |
| `ADM-04-01` | PASS | `/admin/mua-vu` tạo mùa vụ (farm + product + giống + diện tích + gieo trồng + dự kiến thu hoạch + trạng thái). |
| `ADM-04-02` | PASS | Nhật ký theo ngày: `POST /admin/seasons/:id/logs` với activity/performer/materials/pesticide/ảnh/ghi chú. |
| `ADM-04-03` | PASS | `PASS ADM-04-03 :: earliest_harvest_date 2027-03-01 → 2027-04-14` sau khi thêm log phun cách ly 14 ngày; thiếu `isolation_days` → 422 (`ADM-04-03b`). Cửa chặn ngày tính bằng SQL `to_char(max(activity_at + isolation_days),'YYYY-MM-DD')` (2026-11-17): trước đây `toISOString()` lùi mốc 1 ngày theo ICT, cho phép thu hoạch trong thời gian cách ly. Test `TC02b` khoá biên: ngày trước mốc → 422, đúng mốc → 201. |
| `ADM-04-04` | PASS | Tạo lô từ mùa vụ với mã duy nhất `LO-2026-000x`, sản lượng, hạn dùng, điều kiện bảo quản. |
| `ADM-04-05` | PASS | `/admin/lo-hang/:id` render timeline nhật ký/thu hoạch/kiểm nghiệm/nhập-xuất, gắn nhãn "dự kiến" cho mốc chưa xảy ra. |
| `ADM-04-06` | PASS | `PASS ADM-04-06 :: publish → 422 "Lô phải có kết quả kiểm nghiệm Đạt; Lô đang bị tạm giữ…"`; chỉ công khai khi đủ điều kiện, có `batchEvent` + audit lý do. |
| `ADM-04-07` | PASS | Recall khoá bán tức thì (`safety_status=RECALLED`), tách `released_pending_orders` (chưa xuất) và `shipped_orders` (đã xuất); test 03-lifecycle chứng minh chỉ liệt kê khách thực nhận lô. |
| `ADM-04-08` | PASS | `/admin/thu-hoi/:id` lưu tiến độ liên hệ từng khách (`recall_contacts.stage/affected_qty`), biên bản kết thúc. |
| `ADM-05-01` | PASS | `POST /admin/certificates` lưu farm_id/batch_id, loại, số hiệu, đơn vị cấp, khoảng hiệu lực, phạm vi, file. Id sai giờ trả 404 thay vì lỗi FK 500 (đã sửa trong phiên này). |
| `ADM-05-02` | PASS | `POST /admin/batches/:id/lab-tests` với `laboratory`, `sampled_at`, `resulted_at`, `attachment_url`, metrics. |
| `ADM-05-03` | PASS | `lab_test_metrics` lưu chỉ tiêu/đơn vị/ngưỡng/kết luận; `overall_result` tự suy ra FAIL nếu một chỉ tiêu FAIL. |
| `ADM-05-04` | PASS | `PASS ADM-05-04 :: lab FAIL → batch quality=FAIL safety=HOLD` trong cùng transaction. |
| `ADM-05-05` | PASS | `PASS ADM-05-05 :: tổng 3 phiếu` — phiếu cũ giữ nguyên, phiếu mới có `is_effective` riêng; mở khoá lại phải qua Admin xác nhận. |
| `ADM-06-01` | PASS | Token `randomBytes(24).base64url`, `UNIQUE`, 1 QR ↔ 1 batch (`qr_codes.batch_id UNIQUE`). |
| `ADM-06-02` | PASS | `GET /admin/batches/:id/label.pdf` in tem A6: tên sản phẩm, mã lô, ngày thu hoạch, hạn dùng + QR trỏ `qr_codes.token`; kiểm `curl … /admin/batches/<id>/label.pdf` → `200`, `application/pdf`, 15.766 byte. Nút "Tải tem QR"/"In tem" ở `/admin/lo-hang/:id` và `/admin/ma-qr` trỏ endpoint này. |
| `ADM-06-03` | PASS | `/t/demo-ca-chua-lo-0001` render sản phẩm, mã lô, nông trại/vùng, timeline, chứng từ, kết quả kiểm nghiệm (ảnh `audit-trace-1440.png`). |
| `ADM-06-04` | PASS | Lô RECALLED → banner "LÔ HÀNG ĐANG BỊ THU HỒI" đứng đầu trang; token rác → 404 `NOT_FOUND`. |
| `ADM-06-05` | PASS | `POST /public/trace/:token/scan` tăng `qr_scans`; form "Báo cáo vấn đề cho lô …" trên trang tem gửi khiếu nại kèm mã lô (`CUS-09-05`/`CUS-11-01`). |
| `ADM-07-01` | PASS | Seed 1 kho chính; `inventory` khoá chính (warehouse_id, batch_id). |
| `ADM-07-02` | PASS | `POST /admin/stock/receipts` nhập theo lô + số lượng thực nhận + thời điểm + giá nhập. |
| `ADM-07-03` | PASS | `/admin/kho` hiển thị on_hand/reserved/available, lọc theo lô/sản phẩm/hạn dùng. |
| `ADM-07-04` | PASS | Checkout trừ `on_hand` và `reserved` trong cùng transaction; đơn AGM-2026-0007: LO-2026-0002 296→293, `shipped_qty=3`. |
| `ADM-07-05` | PASS | `PASS ADM-07-05 :: adjustment 201, movements=3, lý do lưu vết=true`; UI không sửa trực tiếp `inventory`. |
| `ADM-07-06` | PASS | `PASS ADM-07-06 :: điều chỉnh vượt tồn → 422`; `inventory_nonneg` CHECK ở DB là chốt cuối; lô HOLD/FAIL/EXPIRED/RECALLED bị `SELLABLE_SQL` loại. |
| `ADM-08-01` | PASS | Order lưu customer_id, `address_snapshot` JSONB, tên/giá từng dòng, phí giao, tổng. |
| `ADM-08-02` | PASS | `allocateAndReserve` khoá `inventory` và phân bổ FIFO nhiều lô trong một transaction; thứ tự sắp xếp product_id chống deadlock. |
| `ADM-08-03` | PASS | Confirm/prepare, đổi lô trước khi xuất qua `POST /admin/orders/:id/reallocate`, giữ lịch sử allocation (ACTIVE/REPLACED). Sửa 2026-11-17: không nhận `quantity` lớn hơn `reserved_qty` (422), lấy `warehouse_id` từ `inventory` của lô đích, `UPDATE … WHERE on_hand_qty - reserved_qty >= n RETURNING` — test `06-logic-gates` chứng minh giữ chỗ chuyển đúng sang dòng kho của lô mới và tồn không bị thổi. |
| `ADM-08-04` | PASS | Ship sinh `stock_movements` OUT đúng lô, gắn `shipped_qty` vào allocation, lưu carrier/tracking. |
| `ADM-08-05` | PASS | `PASS ADM-08-05 :: PENDING → deliver bị chặn 409 INVALID_TRANSITION`; chuỗi đầy đủ đã chạy tới DELIVERED cho AGM-2026-0007. |
| `ADM-08-06` | PASS | COD/chuyển khoản; mark-paid lưu thời gian + người thực hiện + tham chiếu; ship lưu GHN/12000. |
| `ADM-08-07` | PASS | Khách theo dõi được đơn mình; hủy trước xuất (AGM-2026-0008 → CANCELLED, nhả 7.000 reserved, audit `order.cancelled`). |
| `ADM-09-01` | PASS | Tạo mã qua UI thật (`AUDIT99855`, PERCENT 10%, 2026-11-01→2027-12-31, `min_subtotal 100.000`); bảng hiển thị dòng mới. |
| `ADM-09-02` | PASS | Server tính lại trong `buildQuote`; AGM-2026-0008: subtotal 294.000, discount 29.400, ship 20.000, total 284.600, `promotion_snapshot` lưu mã. |
| `ADM-09-03` | PASS | Một mã/đơn; `used_count` AUDIT99855 = 1 sau khi đặt, tăng trong transaction. |
| `ADM-10-01` | PASS | `payments(method, status)` COD/BANK_TRANSFER, UNPAID→PAID. |
| `ADM-10-02` | PASS | Mark-paid bắt buộc lý do (modal), ghi `audit` + người thực hiện. |
| `ADM-10-03` | PASS | `PASS ADM-10-03 :: PENDING→APPROVED 200, duyệt lại 409 INVALID_TRANSITION`; complete cập nhật `payment_status` REFUNDED/PARTIALLY_REFUNDED. Sửa 2026-11-17: trần hoàn = tiền đã thu (`payments.status='PAID'`) trừ các yêu cầu đang/đã hoàn, không dùng `orders.total_vnd`; đơn chưa thu tiền → 422. Test `06-logic-gates`: hoàn > đã thu → 422, hoàn đúng số đã thu → 201, hoàn thêm → 422. |
| `ADM-10-04` | PASS | `PASS ADM-13-01 :: gross=521800 refunded=120800 net=401000` — chỉ trừ refund COMPLETED. |
| `ADM-11-01` | PASS | Đánh giá 1 lần/dòng (UNIQUE (customer_id, order_line_id)); ẩn kèm lý do: `PASS ADM-11-02 :: status=HIDDEN, lý do=Nội dung không phù hợp`. |
| `ADM-11-02` | PASS | Khiếu nại từ đơn (KN-2026-0002) và từ QR (KN-2026-0005); có mô tả, ảnh, batch_id tuỳ chọn. |
| `ADM-11-03` | PASS | `PASS ADM-11-03 :: KN-2026-0005 NEW→PROCESSING, tin nhắn=201, resolution lưu=true`. |
| `ADM-11-04` | PASS | Chi tiết lô hiển thị khiếu nại liên quan; nút chuyển tới `/admin/thu-hoi` dựng sẵn batch. |
| `ADM-12-01` | PASS | Đăng nhập/đăng xuất/đổi mật khẩu Admin; không có route đăng ký admin; seed tạo admin qua script. |
| `ADM-12-02` | PASS | `/admin/khach-hang` tìm kiếm theo email/tên, hiện số đơn + chi tiêu; `/admin/khach-hang/:id` có lịch sử đơn. |
| `ADM-12-03` | PASS | Test `CUS-01-04`: khoá → API khách 401, login 403 `ACCOUNT_LOCKED`, mở khoá → phiên cũ vẫn chết, login mới OK. |
| `ADM-12-04` | PASS | `PASS ADM-12-04 :: CUSTOMER gọi /admin/customers → 403`; ownership kiểm ở mọi route `/me/*` (test `CUS-10/CUS-11` trả 404 cho dữ liệu người khác). |
| `ADM-12-05` | PASS | scrypt (N=16384) tự mô tả `scrypt$N$salt$hash`, so sánh `timingSafeEqual`; JWT 7 ngày có `jti`; throttle 5 lần sai/15 phút → 429 (test `CUS-01-02`). |
| `ADM-13-01` | PASS | `GET /admin/reports/revenue` theo ngày/tháng, gross/refunded/net, mặc định 30 ngày. |
| `ADM-13-02` | PASS | `PASS ADM-13-02 :: inventory rows=9, qr rows=8` + `ordersByStatus`. |
| `ADM-13-03` | PASS | `batchesByState` (active/near_expiry/expired/hold/recalled) + `labTests` theo overall_result. |
| `ADM-13-04` | PASS | `qrScans` theo lô + `from`/`to`; thực tế scan_count tăng khi mở tem. |
| `ADM-13-05` | PASS | Toàn bộ `/admin/reports/*` nằm sau `requireAdmin`; không có endpoint báo cáo công khai. |

---

## C. Customer Web/App — 58 mã

Cột "App" = Expo bundle :8081 chạy được; **thiết bị native (Android/iOS) = BLOCKED** (không có emulator), nên mọi mã có thành phần native được đánh `BLOCKED` riêng ở dưới.

| Mã | Web | App | Bằng chứng |
|---|---|---|---|
| `CUS-01-01` | PASS | PASS | `PASS CUS-01-01 :: payload role=ADMIN → 201, role thực tế=CUSTOMER`; email trùng → 409 `EMAIL_EXISTS`. |
| `CUS-01-02` | PASS | PASS | `PASS CUS-01-02b :: logout 200 → /me 401` (jti bị thu hồi, các thiết bị khác vẫn sống). |
| `CUS-01-03` | PASS | PASS | scrypt; `PASS CUS-01-03 :: mật khẩu 7 ký tự → 422`; không log plaintext. |
| `CUS-01-04` | PASS | PASS | Test `CUS-01-04`: khoá → 401/403, lịch sử đơn + nội dung công khai giữ nguyên. |
| `CUS-01-05` | PASS | PASS | Mở `/thanh-toan` khi chưa đăng nhập → `/dang-nhap?next=/thanh-toan`, đăng nhập xong quay lại đúng trang. |
| `CUS-02-01` | PASS | PASS | `PASS CUS-02-01 :: PATCH /me → 200`. |
| `CUS-02-02` | PASS | PASS | `PASS CUS-02-02 :: địa chỉ=1, số mặc định=1`; xoá mềm `deleted_at`. |
| `CUS-02-03` | PASS | PASS | `PASS CUS-02-03 :: địa chỉ của khách khác → 422`; snapshot lưu trên orders. |
| `CUS-02-04` | PASS | PASS | Sửa địa chỉ sau khi đặt không đổi `address_snapshot` của đơn cũ (JSONB độc lập). |
| `CUS-03-01` | PASS | PASS | Chỉ sản phẩm ACTIVE; danh mục HIDDEN không lên menu khách. |
| `CUS-03-02` | PASS | PASS | `PASS CUS-03-02 :: 2 sản phẩm, lọc giá đúng=true, sắp xếp tăng dần=true` (danh mục + khoảng giá + sort). |
| `CUS-03-03` | PASS | PASS | Nhãn Còn/Hết hàng từ `available` của `SELLABLE_SQL`; recall làm giảm đúng (test `ADM-07-06`). |
| `CUS-03-04` | PASS | PASS | Chỉ review `status='VISIBLE'`; badge chứng nhận lấy từ bảng `certificates` đã duyệt, không từ checkbox. |
| `CUS-04-01` | PASS | PASS | PDP hiển thị giá/đơn vị/ảnh/mô tả/bảo quản/hạn dùng (ảnh `audit-pdp-1440.png`). |
| `CUS-04-02` | PASS | PASS | Bước 0,5 kg, chặn sản phẩm ngừng bán (422 `PRODUCT_UNAVAILABLE`). |
| `CUS-04-03` | PASS | PASS | Nhãn "Truy xuất tới từng lô hàng" gắn dữ liệu hồ sơ, không tuyên bố kiểm chứng độc lập. |
| `CUS-04-04` | PASS | PASS | Khối đánh giá công khai + link "Tem" tới `/t/<qr_token>` thật của lô (đã sửa trong phiên này). |
| `CUS-05-01` | PASS | PASS | `PUT /me/cart/items/:productId` cộng dồn theo product_id, xoá khi 0. |
| `CUS-05-02` | PASS | PASS | Giỏ lưu server theo `carts(customer_id)` — cùng dữ liệu cho web và app khi đăng nhập cùng tài khoản. |
| `CUS-05-03` | PASS | PASS | Giá/tồn trong giỏ chỉ tham khảo; chốt lại ở `/checkout/preview` và commit. |
| `CUS-05-04` | PASS | PASS | Giỏ khách chưa đăng nhập ở localStorage; checkout yêu cầu login; merge + `version` tăng sau login. |
| `CUS-06-01` | PASS | PASS | Chỉ CUSTOMER ACTIVE; address_id phải thuộc tài khoản (422/404 nếu không). |
| `CUS-06-02` | PASS | PASS | Preview trả `version`, tên/giá/khuyến mãi/phí/tổng do server tính. |
| `CUS-06-03` | PASS | PASS | Chỉ COD/BANK_TRANSFER; `CREDIT_CARD` → 422 (test `CUS-06-03`). |
| `CUS-06-04` | PASS | PASS | FIFO theo `received_at`; AGM-2026-0007 phân bổ từ LO-2026-0002, reserved nguyên tử. |
| `CUS-06-05` | PASS | PASS | `PASS CUS-06-05 :: đặt vượt tồn → 409 OUT_OF_STOCK`, không tạo đơn. |
| `CUS-06-06` | PASS | PASS | `Idempotency-Key` bắt buộc; replay → 200 cùng `order_id`; nội dung khác → 409 `IDEMPOTENCY_MISMATCH`. |
| `CUS-06-07` | PASS | PASS | `quote_version` lệch → 409 `PRICE_CHANGED` kèm quote mới để người dùng xem lại. |
| `CUS-07-01` | PASS | PASS | `/tai-khoan/don-hang` phân trang + lọc trạng thái/thời gian. |
| `CUS-07-02` | PASS | PASS | Chi tiết đơn: dòng hàng, giá lúc đặt, ưu đãi, ship, tổng, COD/chuyển khoản, trạng thái tiền. |
| `CUS-07-03` | PASS | PASS | Timeline 6 bước + nhánh CANCELLED/DELIVERY_FAILED; AGM-2026-0007 hiện mốc DELIVERED. |
| `CUS-07-04` | PASS | PASS | Mã lô thực xuất theo từng dòng (`order_line_allocations`), trước khi xuất gắn nhãn dự kiến. |
| `CUS-07-05` | PASS | PASS | Lô bị thu hồi → cảnh báo + link tra cứu/khiếu nại; không hứa SMS. |
| `CUS-08-01` | PASS | PASS | Hủy được ở PENDING/CONFIRMED/PREPARING (chưa có OUT); sau xuất nút Hủy biến mất. |
| `CUS-08-02` | PASS | PASS | Hủy AGM-2026-0008: allocation → CANCELLED, `reserved` nhả, `on_hand` không đổi, audit `order.cancelled`. |
| `CUS-08-03` | PASS | PASS | Sau hủy hiển thị "Đã hủy" + lý do; đơn đã trả tiền tạo được RefundRequest ở admin. |
| `CUS-08-04` | PASS | PASS | `canCancel` loại SHIPPING/DELIVERED; thay bằng nút Khiếu nại (`order-actions.tsx:54-56`). |
| `CUS-09-01` | PASS | PASS | `/t/:token` không cần session (curl 200 khi không cookie). |
| `CUS-09-02` | PASS | PASS | Trang tem: mã lô, sản phẩm, nông trại/tỉnh, mùa vụ, ngày thu hoạch, HSD, kiểm nghiệm, chứng nhận công khai. |
| `CUS-09-03` | PASS | PASS | `PASS CUS-09-03 :: token rác → 404 NOT_FOUND`; lô chưa publish không lộ dữ liệu. |
| `CUS-09-04` | PASS | PASS | HOLD/RECALLED/hết hạn → banner cảnh báo trên cùng, kèm hướng dẫn liên hệ. |
| `CUS-09-05` | PASS | PASS | Nút "Báo cáo vấn đề" giữ token qua `next=` rồi mở form khiếu nại đã chọn sẵn lô. |
| `CUS-09-06` | PASS | BLOCKED | Web không cần quyền camera (nhập/dán link tem); app có màn hình từ chối quyền → cần thiết bị thật để chứng minh. |
| `CUS-10-01` | PASS | PASS | Chỉ DELIVERED/COMPLETED + dòng thuộc chính khách (test `CUS-10` → 404 với dòng người khác). |
| `CUS-10-02` | PASS | PASS | UNIQUE (customer_id, order_line_id) + trả 409 `ALREADY_REVIEWED`. |
| `CUS-10-03` | PASS | PASS | `/tai-khoan/danh-gia` liệt kê review đã gửi; PDP chỉ hiện review VISIBLE. |
| `CUS-10-04` | PASS | PASS | Ẩn review bắt buộc lý do (`ADM-11-02`). |
| `CUS-11-01` | PASS | PASS | `PASS CUS-11-01 :: khiếu nại từ QR → 201`; đơn của mình → 201; batch_id không bắt buộc. |
| `CUS-11-02` | PASS | PASS | Chọn lô cụ thể hoặc "Chưa xác định"; không tự gán lô. |
| `CUS-11-03` | PASS | PASS | Upload JPG/PNG/PDF ≤8MB, sniff magic bytes, chặn HTML; tệp lưu private. |
| `CUS-11-04` | PASS | PASS | Khách đọc NEW→PROCESSING→RESOLVED→CLOSED + phản hồi admin (KN-2026-0005 đã đổi trạng thái). |
| `CUS-11-05` | PASS | PASS | Trả lời trong ticket của mình (`POST /me/complaints/:id/messages`); ticket CLOSED → 409; người khác → 404. |
| `CUS-11-06` | PASS | PASS | Lô recall → hướng dẫn liên hệ + link khiếu nại; không nói đã hoàn tiền. |
| `CUS-12-01` | PASS | PASS | `loading.tsx`/`not-found.tsx`/`error.tsx` + empty state từng trang; nút thử lại khi lỗi. |
| `CUS-12-02` | PASS | PASS | `PASS CUS-12-02 :: 401:UNAUTHENTICATED 404:NOT_FOUND 403:FORBIDDEN` — envelope `{error:{code,message,field_errors}}` thống nhất. |
| `CUS-12-03` | PASS | PASS | Khóa idempotency sinh theo `quote_version` và giữ nguyên khi retry; chỉ đổi sau khi preview mới. |
| `CUS-12-04` | PASS | PASS | `PRICE_CHANGED` trả quote mới → người dùng bấm xác nhận lại; không auto submit. |
| `CUS-12-05` | PASS | PASS | Hết phiên → `/dang-nhap?next=<đúng trang>`; giữ `next` cho luồng checkout. |

---

## D. Tổng hợp

| Nhóm | PASS | BLOCKED | FAIL | NOT_IMPLEMENTED |
|---|---|---|---|---|
| Admin 64 mã | 64 | 0 | 0 | 0 |
| Customer 58 mã (Web) | 57 | 1 (`CUS-09-06` phần native) | 0 | 0 |
| Customer 58 mã (App native) | — | 58 (không emulator) | 0 | 0 |

Không đạt 122/122 tuyệt đối vì **không có thiết bị/emulator Android/iOS** trên máy: mọi mã có hành vi native (camera, secure store, deep link, mạng thật) ghi `BLOCKED`, đúng quy ước mục D của ma trận.
