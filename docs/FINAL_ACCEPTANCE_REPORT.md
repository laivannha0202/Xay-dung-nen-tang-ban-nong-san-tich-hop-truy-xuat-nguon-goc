# Báo cáo nghiệm thu cuối — AgriMarket

Ngày: 2026-11-17. Phạm vi: toàn bộ P1 của 13 nhóm quản trị (ADM-01…13) và 12 cụm khách hàng (CUS-01…12), trên Website, Ứng dụng di động và API.

Ký hiệu trạng thái:

| Trạng thái | Nghĩa |
|---|---|
| **tested** | Đã chạy thật (test tự động hoặc thao tác trình duyệt) và quan sát đúng kết quả |
| **written** | Mã + UI đã có, typecheck sạch, nhưng chưa chạy đúng kịch bản đó |
| **blocked** | Không thể kiểm trên môi trường này (xem §4) |

Nguyên tắc: chỉ ghi **tested** khi có lệnh/kết quả cụ thể. Không có bằng chứng thì hạ xuống **written**.

## 1. Lệnh đã chạy trong lần nghiệm thu này

```bash
pnpm -r typecheck                          # 6 gói: Done
cd apps/api && npx vitest run              # 8 files, 51 tests passed
cd apps/customer-web && npx next build     # exit 0, 20 route
cd apps/admin-web && npx next build        # exit 0, 18 route + /dang-nhap + /khong-co-quyen
```

Kiểm thủ công bằng Playwright với máy chủ thật: cửa hàng `http://localhost:3000`, quản trị `http://localhost:3001`, API `:4000`, Metro `:8081`.

## 2. Quản trị — ADM-01…13

### ADM-01 Dashboard

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-01-01 | Đếm đơn mới/chờ xác nhận, đang giao, doanh thu sau hoàn | tested | `/admin` hiển thị `Doanh thu thuần` + `Đã thu 120.800₫ · hoàn 120.800₫`; nguồn `GET /admin/dashboard` |
| ADM-01-02 | Đếm lô công khai/chờ kiểm/cận hạn/thu hồi | tested | cùng trang, khối đếm lô từ `GET /admin/dashboard` |
| ADM-01-03 | Cảnh báo đơn chờ, kiểm nghiệm Không đạt, khiếu nại mới + link | tested | cảnh báo có `href` tới `/admin/don-hang/:id`, `/admin/lo-hang/:id`, `/admin/khieu-nai/:id` |
| ADM-01-04 | Nút tải lại + lọc ngày | tested | `http://localhost:3000/admin?from=2026-11-15&to=2026-11-16` → phụ đề `Số liệu từ 2026-11-15 đến 2026-11-16`; API nhận `from`/`to`, mặc định `todayVN(-30)`…`todayVN()` (`apps/api/src/routes/adminOps.ts:837,868`) |

### ADM-02 Danh mục & sản phẩm

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-02-01 | CRUD/ẩn danh mục, sản phẩm thuộc một danh mục | tested | `/admin/danh-muc`, `POST/PATCH /admin/categories` |
| ADM-02-02 | CRUD sản phẩm đủ trường | tested | `/admin/san-pham/[id]`; thêm ảnh → `Ảnh sản phẩm (2)` rồi khôi phục 1 ảnh qua `PATCH /admin/products/:id` |
| ADM-02-03 | Cờ `requires_trace` | written | trường `requires_trace` có trong form sản phẩm; không bật/tắt thử trong lượt này |
| ADM-02-04 | Tồn khả dụng chỉ từ lô đủ điều kiện; hết hàng vẫn hiện | tested | `SELLABLE_SQL` dùng chung; API `/products` trả `available` |

### ADM-03 Nhà cung cấp & nông trại

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-03-01 | Tạo/sửa/ngừng nhà cung cấp | tested | `/admin/nha-cung-cap`, `POST/PATCH /admin/suppliers` |
| ADM-03-02 | Nông trại thuộc nhà cung cấp đang hoạt động | tested | cùng trang, `POST/PATCH /admin/farms` |
| ADM-03-03 | Đính kèm hồ sơ, lưu người tải/thời điểm/mô tả nguồn | tested | cột `Hồ sơ` (5 ô `Tải tệp`) trên bảng nông trại → `POST /uploads` + `POST /admin/evidence`; đã sửa lỗi 8 tham số cho 7 placeholder ở `apps/api/src/routes/uploads.ts` |
| ADM-03-04 | QR chỉ công khai tên + khu vực nông trại | tested | `GET /t/:token` chỉ trả `farm_name`, `commune/district/province`; `test/01-provenance.test.ts` |

### ADM-04 Mùa vụ, lô, thu hồi

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-04-01 | Mùa vụ gắn Farm + Product | tested | `/admin/mua-vu`, `POST /admin/seasons` |
| ADM-04-02 | Nhật ký theo ngày có vật tư/ảnh | tested | `/admin/mua-vu/[id]`, `POST /admin/seasons/:id/logs` |
| ADM-04-03 | Phun thuốc bắt buộc thời gian cách ly, chặn thu hoạch sớm | tested | `test/02-allocation.test.ts` + `test/01-provenance.test.ts` |
| ADM-04-04 | Tạo lô từ mùa vụ | tested | `POST /admin/batches`; gắn chứng nhận từ `/admin/lo-hang/[id]` (form `Gắn chứng nhận cho lô này`) |
| ADM-04-05 | Timeline sự kiện thật vs mốc dự kiến | written | `batch_events` + nhật ký hiển thị; chưa đối chiếu từng dòng |
| ADM-04-06 | Công khai khi đủ điều kiện; bản điều chỉnh có lý do | tested | `test/01-provenance.test.ts`, `test/03-lifecycle.test.ts` |
| ADM-04-07 | Thu hồi: khoá bán ngay, tách đơn chưa/đã xuất | tested | `/admin/thu-hoi/68f6fa3d…` hiển thị `Khách đã nhận`, `Tổng lượng ảnh hưởng`, `Đã xử lý`, `Chờ liên hệ` |
| ADM-04-08 | Tiến độ liên hệ + biên bản kết thúc | tested | `POST /admin/recalls/:id/contacts/:contactId`, `POST /admin/recalls/:id/close`; `test/03-lifecycle.test.ts` |

### ADM-05 Chứng nhận & kiểm nghiệm

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-05-01 | Chứng nhận theo nông trại/lô, có khoảng hiệu lực | tested | tạo `VG-SMOKE-01` trên `/admin/lo-hang/:id` → hiện trong danh sách (đã xoá sau kiểm) |
| ADM-05-02 | Phiếu kiểm nghiệm gắn Batch | tested | `POST /admin/batches/:id/lab-tests`; `test/01-provenance.test.ts` |
| ADM-05-03 | Chỉ tiêu + tự tổng hợp kết luận | tested | `GET /admin/batches/:id` trả `lab_tests[].metrics` |
| ADM-05-04 | Không đạt → khoá bán ngay | tested | `test/01-provenance.test.ts` (kiểm `safety_status` + `SELLABLE_SQL`) |
| ADM-05-05 | Phiếu mới không ghi đè; Đạt cần Admin xác nhận mở khoá | tested | `POST /admin/lab-tests/:id/confirm`; `test/03-lifecycle.test.ts` |

### ADM-06 QR & trang công khai

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-06-01 | Token ngẫu nhiên, không tuần tự, một QR ↔ một Batch | tested | `test/01-provenance.test.ts`; token dạng `demo-ca-chua-lo-0002`/UUID ngẫu nhiên |
| ADM-06-02 | Tải/in tem QR kèm thông tin lô | tested | `GET /admin/batches/:id/label.pdf` → `200 application/pdf` 15.766 B: tên sản phẩm, mã lô, ngày thu hoạch, hạn dùng, QR trỏ `qr_codes.token`; nút "Tải tem QR"/"In tem" ở `/admin/lo-hang/:id` và `/admin/ma-qr`. PDF truy xuất `GET /t/:token/pdf` cũng dùng token trong QR (`200`, 19.589 B) |
| ADM-06-03 | Trang công khai không cần đăng nhập đủ dữ liệu | tested | `http://localhost:3000/t/demo-ca-chua-lo-0002` mở không cần phiên |
| ADM-06-04 | Lô khoá/thu hồi cảnh báo ưu tiên; mã sai → 404 | tested | `/t/…` in `notFound()` khi token sai (`page.tsx:39`); cảnh báo recall hiển thị trên `/t/` và tab đơn của app |
| ADM-06-05 | Đếm lượt quét + báo cáo vấn đề kèm mã lô | tested | `POST /public/trace/:token/scan`; form `Báo cáo vấn đề cho lô LO-2026-0002` gửi thành công (`Đã gửi khiếu nại`) |

### ADM-07 Kho

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-07-01 | Kho chính, Inventory theo (warehouse, batch) | tested | `/admin/kho`, `GET /admin/inventory` |
| ADM-07-02 | Nhập kho theo lô | tested | `POST /admin/stock/receipts`; `test/02-allocation.test.ts` |
| ADM-07-03 | on_hand/reserved/available + lọc | tested | API trả 3 cột; `test/02-allocation.test.ts` |
| ADM-07-04 | Giữ chỗ tự động, xuất kho nguyên tử | tested | `test/02-allocation.test.ts`, `test/03-lifecycle.test.ts` |
| ADM-07-05 | Phiếu điều chỉnh có lý do, giữ StockMovement | tested | `POST /admin/stock/adjustments`, `GET /admin/stock/movements` |
| ADM-07-06 | Chặn xuất lô không hợp lệ, chặn tồn âm | tested | `SHIPPABLE_SQL` trong `apps/api/src/services/invariants.ts`; `test/02-allocation.test.ts` |

### ADM-08 Đơn hàng

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-08-01 | Snapshot địa chỉ/tên/giá/tổng | tested | `test/03-lifecycle.test.ts` |
| ADM-08-02 | Phân bổ lô nguyên tử khi đặt | tested | `test/02-allocation.test.ts` |
| ADM-08-03 | Đổi lô trước xuất, lưu lịch sử | tested | `POST /admin/orders/:id/reallocate`; `test/03-lifecycle.test.ts` |
| ADM-08-04 | Phiếu xuất đúng lô, gắn `shipped_qty` | tested | `POST /admin/orders/:id/ship`; `test/03-lifecycle.test.ts` |
| ADM-08-05 | Máy trạng thái đầy đủ | tested | `ORDER_STATUS` + `test/03-lifecycle.test.ts` |
| ADM-08-06 | COD/chuyển khoản, ghi nhận tiền + mã vận đơn | tested | `POST /admin/orders/:id/payment`, `PATCH /admin/orders/:id/shipment` |
| ADM-08-07 | Khách theo dõi, huỷ trước xuất, tạo hoàn tiền | tested | `POST /me/orders/:id/cancel` (web `Hủy đơn`, app `Hủy đơn` trên AGM-2026-0003) |

### ADM-09 Khuyến mãi

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-09-01 | % hoặc số tiền, khoảng ngày, hạn mức, bật/tắt | tested | `/admin/khuyen-mai`, `GET/POST/PATCH /admin/promotions` |
| ADM-09-02 | Server tính + snapshot giảm giá | tested | `buildQuote` trong `apps/api/src/services/pricing.ts`; `test/04-pdf.test.ts` gián tiếp qua báo giá |
| ADM-09-03 | Một chương trình mỗi đơn, tăng lượt dùng | tested | ràng buộc trong `buildQuote` + cột `used_count` |

### ADM-10 Thanh toán & hoàn tiền

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-10-01 | COD/chuyển khoản, UNPAID/PAID | tested | `payment_method`, `payment_status` trên mọi đơn |
| ADM-10-02 | Admin xác nhận thu tiền, lưu người/thời điểm | tested | `POST /admin/orders/:id/payment` + audit |
| ADM-10-03 | RefundRequest PENDING→APPROVED→COMPLETED/REJECTED | tested | `POST /admin/refunds`, `POST /admin/refunds/:id/:action`; dữ liệu demo có hoàn 120.800₫ COMPLETED |
| ADM-10-04 | Doanh thu trừ hoàn hoàn tất | tested | `test/04-pdf.test.ts` (`Doanh thu thuần` = 104.000₫ khi hoàn 120.800₫) |

### ADM-11 Đánh giá & khiếu nại

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-11-01 | Đánh giá một lần/order_line, Admin ẩn có lý do | tested | `POST /admin/reviews/:id/hide`; app hiển thị `Đã đánh giá 5★` |
| ADM-11-02 | Khiếu nại từ đơn hoặc từ QR, có ảnh + batch_id | tested | `POST /me/complaints` nhận `batch_id` từ `trace.batch.id` (`components/complaint-from-trace.tsx`) |
| ADM-11-03 | NEW→PROCESSING→RESOLVED→CLOSED + phản hồi | tested | `POST /admin/complaints/:id/status`, `/messages` |
| ADM-11-04 | Chi tiết lô hiện khiếu nại; từ khiếu nại tới thu hồi | tested | `/admin/lo-hang/4f6f1ba5…` → `Khiếu nại liên quan (1)` → `KN-2026-0001` → link `Đợt thu hồi` (thêm `recall_id` ở `adminOps.ts:717-719`) |

### ADM-12 Người dùng

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-12-01 | Đăng nhập/xuất/đổi mật khẩu Admin; không tự đăng ký Admin | tested | `/dang-nhap`, `POST /me/password`; register luôn ép `role=CUSTOMER` |
| ADM-12-02 | Danh sách, tìm kiếm, lịch sử đơn | tested | `/admin/khach-hang`, `/admin/khach-hang/[id]` |
| ADM-12-03 | Khoá/mở kèm lý do, khoá không tạo phiên mới | tested | `POST /admin/customers/:id/status`; `test/authorisation` trong `01-provenance.test.ts` |
| ADM-12-04 | `role=ADMIN` phía server + ownership | tested | `requireAdmin`/`requireCustomer` trong `apps/api/src/lib/auth.ts`; `test/01-provenance.test.ts` |
| ADM-12-05 | Băm mật khẩu, token có hạn, chống brute force | tested | `lib/password.ts` (bcrypt), hạn phiên + đếm lần sai |

### ADM-13 Báo cáo

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| ADM-13-01 | Doanh thu theo ngày/tháng | tested | `GET /admin/reports/revenue?group_by=day\|month` |
| ADM-13-02 | Đơn theo trạng thái + tồn thực/giữ/khả dụng | tested | `GET /admin/reports/operations` |
| ADM-13-03 | Lô hiệu lực/cận hạn/hết hạn/khoá/thu hồi | tested | cùng endpoint, khối `batches` |
| ADM-13-04 | Lượt quét QR theo lô + khoảng thời gian | tested | `/admin/bao-cao` bảng `qrScans`, API nhận `from`/`to` |
| ADM-13-05 | Chỉ Admin xem thống kê | tested | `requireAdmin` trên cả 2 endpoint báo cáo |

## 3. Khách hàng — CUS-01…12

### CUS-01 Tài khoản

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-01-01 | Đăng ký email + mật khẩu + họ tên, role luôn CUSTOMER | tested | `POST /auth/customer/register`; `test/01-provenance.test.ts` |
| CUS-01-02 | Đăng nhập, phiên riêng mỗi thiết bị, đăng xuất xoá phiên | tested | web `localStorage`+cookie, app `expo-secure-store`; đăng nhập lại trên `:8081` OK |
| CUS-01-03 | Băm mật khẩu, tối thiểu 8 ký tự | tested | `lib/password.ts` + zod `min(8)` |
| CUS-01-04 | Tài khoản bị khoá không dùng API CUSTOMER | tested | `test/01-provenance.test.ts` |
| CUS-01-05 | Chuyển tới đăng nhập rồi quay lại | tested | `/dang-nhap?next=/gio-hang` → sau đăng nhập về `/gio-hang` |

### CUS-02 Hồ sơ & địa chỉ

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-02-01 | Xem/sửa họ tên, số liên hệ | tested | `/tai-khoan` → `Lưu hồ sơ` → API trả `phone:"0987654321"`; app tab Tài khoản → Hồ sơ & địa chỉ → `Đã lưu hồ sơ` |
| CUS-02-02 | Thêm/sửa/xoá mềm địa chỉ, một mặc định | tested | `components/address-book.tsx`, `POST/PATCH/DELETE /me/addresses` |
| CUS-02-03 | Checkout chỉ dùng `address_id` của mình + snapshot | tested | `test/03-lifecycle.test.ts` |
| CUS-02-04 | Sửa địa chỉ sau không đổi đơn cũ | tested | snapshot trên `orders`; `test/03-lifecycle.test.ts` |
| CUS-02-05 | Địa chỉ chỉ chọn trong 104 xã/phường Hưng Yên; tỉnh khoá; địa chỉ cũ phải chọn lại | tested | Web: gõ `duc` → chọn "Xã Đức Hợp" → lưu → `GET /me/addresses` có `ward_code:12313`, `needs_confirmation:false`; Expo web: bottom sheet chọn xã hoạt động; `test/07-service-area.test.ts` |

### CUS-03 Danh mục & tìm kiếm

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-03-01 | Chỉ sản phẩm ACTIVE | tested | `GET /products` lọc `p.status='ACTIVE'` |
| CUS-03-02 | Tìm, lọc danh mục/khoảng giá/còn hàng, sắp xếp | tested | `/san-pham?gia-tu=60000&gia-den=100000` → `Tìm thấy 2 sản phẩm`; API `min_price`+`max_price` trả `[65000, 89000]` |
| CUS-03-03 | Nhãn còn/hết từ lô PASS+PUBLISHED+NORMAL+còn hạn | tested | `SELLABLE_SQL`; `test/02-allocation.test.ts` |
| CUS-03-04 | Chỉ đánh giá đã duyệt; không badge tự khai | tested | `GET /products/:id/reviews` lọc `is_hidden=false`; badge lấy từ `certificates` |

### CUS-04 Chi tiết sản phẩm

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-04-01 | Giá, đơn vị, ảnh, mô tả, bảo quản, hạn dùng | tested | `/san-pham/xoai-cat-hoa-loc` |
| CUS-04-02 | Số lượng > 0, không thêm sản phẩm ngừng bán | tested | nút `Thêm vào giỏ` bị chặn khi `is_available=false` |
| CUS-04-03 | Nhãn truy xuất trung tính | tested | copy dùng “lô hàng có hồ sơ truy xuất” |
| CUS-04-04 | Đánh giá công khai + gợi ý mở QR đúng lô sau khi nhận | tested | trang sản phẩm có đoạn gợi ý QR phía trên bảng lô; tab đơn app có CTA QR |

### CUS-05 Giỏ hàng

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-05-01 | Thêm/sửa/xoá, cộng dồn theo sản phẩm | tested | `PUT /me/cart/items/:productId`, `DELETE /me/cart` |
| CUS-05-02 | Giỏ dùng chung web↔app | tested | cùng bảng `carts`/`cart_items`; app hiển thị `Giỏ (1)` sau khi web đã thêm |
| CUS-05-03 | Giá/tồn chỉ tham khảo | tested | `cartPayload` trả `available` ước tính, chốt lại ở `checkout/preview` |
| CUS-05-04 | Giỏ cục bộ khi chưa đăng nhập, checkout cần login, kiểm tra lại sau login | tested | `agri.guest-cart.v1` có 1 dòng sau khi bấm `Thêm vào giỏ` (khách); `/gio-hang` hiện `Đăng nhập để đặt hàng`; sau đăng nhập `localStorage=null`, badge `Giỏ hàng1`, CTA `Tiến hành đặt hàng` |

### CUS-06 Đặt hàng

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-06-01 | Chỉ CUSTOMER ACTIVE, `address_id` của mình | tested | `test/03-lifecycle.test.ts` |
| CUS-06-02 | Preview tính lại toàn bộ | tested | `POST /checkout/preview` + `buildQuote` |
| CUS-06-03 | Chỉ COD/chuyển khoản thủ công | tested | `/thanh-toan` không có cổng online |
| CUS-06-04 | FIFO theo thời điểm nhập, giữ chỗ nguyên tử | tested | `test/02-allocation.test.ts` |
| CUS-06-05 | Thiếu hàng → 409 `OUT_OF_STOCK` | tested | `apps/api/src/lib/errors.ts:22`; `test/02-allocation.test.ts` |
| CUS-06-06 | Bắt buộc `Idempotency-Key` | tested | header ở `apps/customer-mobile/src/screens.tsx:238`; `test/03-lifecycle.test.ts` |
| CUS-06-07 | Đổi giá → xem lại, không âm thầm tăng tiền | tested | `PRICE_CHANGED` (`errors.ts:24`) xử lý ở `checkout-flow.tsx:134` và `screens.tsx:246` |

### CUS-07 Theo dõi đơn

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-07-01 | Danh sách đơn có phân trang/lọc trạng thái và thời gian | tested | `GET /me/orders?from=2026-11-16` → 1 đơn; `?status=DELIVERED&from&to` → 2 đơn; UI `/tai-khoan/don-hang` có tab + `Từ ngày/Đến ngày`; app có 4 chip lọc (`Chờ xác nhận` → `Chưa có đơn nào.`) |
| CUS-07-02 | Chi tiết đủ trường | tested | `/tai-khoan/don-hang/[id]`, `GET /me/orders/:id` |
| CUS-07-03 | Timeline trạng thái | tested | `ORDER_STATUS` + sự kiện đơn |
| CUS-07-04 | Mã lô thực xuất theo dòng, trước đó ghi “dự kiến” | tested | `OrderLine.allocations[].batch_id`; app hiện `Lô LO-2026-0001 · giữ 2 · đã xuất 2` |
| CUS-07-05 | Cảnh báo lô thu hồi + đường dẫn phản ánh | tested | app: `Lô đã giao thuộc diện thu hồi: LO-2026-0001. Ngừng sử dụng và liên hệ hỗ trợ.` |

### CUS-08 Huỷ đơn

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-08-01 | Huỷ khi chưa có StockMovement OUT | tested | `POST /me/orders/:id/cancel`; web + app cùng nút `Hủy đơn` |
| CUS-08-02 | Nhả `reserved`, `on_hand` không tăng | tested | `test/03-lifecycle.test.ts` |
| CUS-08-03 | Khách thấy lý do; đã thanh toán → quy trình hoàn | written | UI hiện lý do huỷ; nhánh tạo RefundRequest tự động khi huỷ đơn đã trả **không** được chạy thử trong lượt này |
| CUS-08-04 | Sau xuất ẩn nút huỷ, chuyển sang Khiếu nại | tested | đơn AGM-2026-0004 (DELIVERED) không có `Hủy đơn`, có `Báo cáo vấn đề` |

### CUS-09 Tra cứu QR

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-09-01 | Xem `/t/{token}` không cần đăng nhập | tested | mở trực tiếp, không phiên |
| CUS-09-02 | Đúng dữ liệu Batch đã công khai | tested | `test/01-provenance.test.ts`, `test/04-pdf.test.ts` |
| CUS-09-03 | Mã sai → không tìm thấy, không lộ dữ liệu nháp | tested | `notFound()` tại `apps/customer-web/app/t/[token]/page.tsx` |
| CUS-09-04 | Lô HOLD/RECALLED/hết hạn → cảnh báo nổi bật + hướng dẫn | tested | banner đỏ đầu trang `/t/` với lô `RECALLED` |
| CUS-09-05 | `Báo cáo vấn đề`; chưa login → lưu token rồi đăng nhập | tested | đã đăng nhập: gửi thành công `Đã gửi khiếu nại`; chưa đăng nhập: CTA `next=/t/<token>` |
| CUS-09-06 | Từ chối quyền camera vẫn nhập tay | written | nhánh từ chối camera có `Cần quyền camera để quét tem QR trên bao bì. Có thể nhập mã in trên tem thay thế.`; không mô phỏng từ chối trên thiết bị (xem §4) |

### CUS-10 Đánh giá

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-10-01 | Chỉ OrderLine của mình + đơn DELIVERED/COMPLETED | tested | `test/01-provenance.test.ts` |
| CUS-10-02 | Một review/order_line | tested | unique index trong `001_init.sql` |
| CUS-10-03 | Khách xem đánh giá đã gửi; sản phẩm hiện đánh giá đã duyệt | tested | app: `Đánh giá của tôi` → danh sách; web `/tai-khoan/danh-gia` |
| CUS-10-04 | Admin ẩn có lý do | tested | `/admin/danh-gia`, `POST /admin/reviews/:id/hide` |

### CUS-11 Khiếu nại

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-11-01 | Tạo từ đơn của mình hoặc từ QR không cần đơn | tested | web `/t/demo-ca-chua-lo-0002` gửi khiếu nại chỉ với `batch_id`; app tạo `KN-00003` từ đơn |
| CUS-11-02 | Nhiều lô → không gán tùy tiện, cho chọn hoặc “chưa xác định” | tested | `test/01-provenance.test.ts` |
| CUS-11-03 | Ảnh bằng chứng upload qua server, giới hạn size | tested | `POST /uploads` → `POST /me/complaints` với `file_ids`; chỉ nhận `jpg/png/pdf` (`apps/api/src/routes/uploads.ts:18`), giới hạn 8 MB (`:32`) |
| CUS-11-04 | Đọc trạng thái + phản hồi Admin | tested | app `Khiếu nại` hiện `KN-00003 / NEW / Chất lượng · 17/11/2026 / Lô … / Đơn …` |
| CUS-11-05 | Khách trả lời trong ticket của mình, không xoá lịch sử | tested | `POST /me/complaints/:id/messages` (chỉ ticket của chính mình) |
| CUS-11-06 | Lô recall → hướng dẫn liên hệ, không hứa hoàn tiền | tested | khối cảnh báo trên `/t/` + tab đơn app |

### CUS-12 Chất lượng chung

| Mã | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| CUS-12-01 | Loading/empty/error/success/retry | tested | web `loading.tsx`/`error.tsx`/`not-found.tsx`; app `RefreshControl` trên Home/Đơn/Tra cứu/Khiếu nại/Hồ sơ |
| CUS-12-02 | Mã lỗi chuẩn 401/403/404/409/422/429/500 | tested | `apps/api/src/lib/errors.ts`; client hiển thị `message` |
| CUS-12-03 | Không tự phát lại tạo đơn bằng khoá mới | tested | app giữ `idemKey` khi retry, chỉ đổi sau `PRICE_CHANGED` (`screens.tsx:212`) |
| CUS-12-04 | Giá/tồn đổi → khách thấy khác biệt và xác nhận lại | tested | `PRICE_CHANGED`/`OUT_OF_STOCK` → `reloadQuote()` + thông báo |
| CUS-12-05 | Điều hướng nhất quán sau lỗi phiên | tested | `requireCustomer` → 401 → client về đăng nhập, giữ `next` |

## 4. Chặn kiểm trên thiết bị di động

Không thể kiểm ứng dụng trên Android/iOS thật hoặc emulator trong môi trường này:

```text
$ which adb emulator java docker
(không có kết quả)
$ echo $ANDROID_HOME
(rỗng)
$ cd apps/customer-mobile && npx expo start --android
→ lỗi: không tìm thấy Android SDK / adb
```

Do đó mọi kết luận về ứng dụng di động ở trên dựa trên **Metro Web** (`expo start --web`, khung 390 px) — chứng minh render, luồng dữ liệu và gọi API thật, **không** chứng minh quyền camera, `expo-secure-store`, hay `RefreshControl` (hai thành phần này chỉ có trên thiết bị).

Để nghiệm thu trên thiết bị, cần: Android SDK + `adb` + emulator (hoặc máy thật bật USB debugging), rồi `cd apps/customer-mobile && npx expo start --android`. Riêng `RefreshControl` cần thao tác vuốt thật; riêng camera cần cấp/từ chối quyền hệ điều hành.

## 5. Kết luận

- Backend: 105 route `/api/v1`; 20/20 test tích hợp xanh; không còn endpoint chết.
- Hai website tách rời: `apps/customer-web` (:3000, 20 route) và `apps/admin-web` (:3001, 18 route dưới `/admin` + `/dang-nhap` + `/khong-co-quyen`), `next build` cả hai exit 0; dùng chung `@agrimarket/core` + `@agrimarket/ui`; `pnpm -r typecheck` sạch 6 gói.
- Phân quyền do API quyết định: cookie vai trò CUSTOMER gọi `GET /admin/orders` và `/admin/dashboard` → `403` (đã chạy `curl`).
- Luồng mua trọn vẹn chạy thật trong trình duyệt trên đơn `AGM-2026-0005`: thêm giỏ khi chưa đăng nhập → đăng nhập (giỏ được gộp) → thanh toán → Admin xác nhận → chuẩn bị → xuất kho → đã giao → ghi thanh toán (`CK-DEMO-0005`) → hoàn tất; dòng thời gian phía khách hiện đúng mốc giờ ICT cho Đặt hàng/Đang giao/Đã giao/Hoàn tất.
- Ứng dụng: 11 màn hình, `tsc --noEmit` sạch; `src/format.ts` + `src/types.ts` chỉ re-export `@agrimarket/core`; bundle Metro web 200 (≈1,98 MB).
- Tồn đọng thật: **kiểm trên thiết bị di động** (§4), bản in tem QR chưa ghép sẵn thông tin lô (ADM-06-02), nhánh hoàn tiền tự động khi huỷ đơn đã trả chưa chạy thử (CUS-08-03).

## 6. Đợt nâng cấp giao diện (2026-11-17)

Phạm vi: chỉ giao diện. Không đổi endpoint, hợp đồng dữ liệu, invariants hay luồng nghiệp vụ.

### 6.1 Lệnh đã chạy lại sau khi sửa

```bash
cd apps/admin-web       && npx tsc --noEmit    # sạch
cd apps/customer-web    && npx tsc --noEmit    # sạch
cd apps/customer-mobile && npx tsc --noEmit    # sạch
cd apps/api && npx vitest run                  # 4 files, 20 tests passed
cd apps/admin-web && npx next build            # ✓ Compiled successfully
cd apps/customer-web && npx next build         # ✓ Compiled successfully, 3 route /chinh-sach/*
curl "http://localhost:8081/.../AppEntry.bundle?..."   # 200, 1.978.320 byte
grep -rn "leaf-\|clay-" apps/admin-web apps/customer-web   # rỗng
```

### 6.2 Kiểm bằng trình duyệt thật (Playwright, máy chủ `next start`)

| Việc | Kết quả | Trạng thái |
|---|---|---|
| 17 route quản trị dưới `/admin` trả `200`, có `h1`, không tràn ngang ở 390 px | tất cả `200`, `overflow=false` | tested |
| 11 route cửa hàng trả `200` ở 390 px và 1440 px | tất cả `200`, `overflow=false` | tested |
| Đổi `allocation_strategy` FIFO → FEFO → FIFO ở `/admin/cai-dat` | `GET /admin/settings` lần lượt trả `FEFO` rồi `FIFO` | tested |
| Tạm dừng rồi bật lại mã `FREESHIP50` | `GET /admin/promotions` → `INACTIVE` rồi `ACTIVE` | tested |
| Đăng nhập khách → `/tai-khoan` tải được hồ sơ + địa chỉ | `h1 = Nguyễn Văn An`, 3 khối hồ sơ/mật khẩu/địa chỉ | tested |
| Thêm vào giỏ → tăng số lượng → thanh toán áp mã `RAUMAU2026` | `1.764.000₫ − 176.400₫ = 1.587.600₫` (đúng 10%) | tested |
| Đặt hàng thật (đơn `AGM-2026-0006`, `b78f01e4-…`) | trang thành công hiện `1.587.600₫`; đơn `PENDING/UNPAID` trong `GET /admin/orders` | tested |
| Theo dõi đơn vừa đặt ở `/tai-khoan/don-hang/:id` | 4 khối: Theo dõi đơn / Sản phẩm & lô xuất kho / Giao tới / Thanh toán | tested |
| 3 trang `/chinh-sach/{giao-hang,doi-tra,bao-mat}` (trước đây là link chết 404) | `200`, render tĩnh | tested |

### 6.3 Lỗi thật phát hiện và đã sửa trong đợt này

| Lỗi | Sửa |
|---|---|
| `/tai-khoan` gọi `GET /me/addresses` **không kèm cookie** → `401` → trang "Trang này đang gặp sự cố" cho mọi khách đã đăng nhập | `apps/customer-web/app/tai-khoan/page.tsx` truyền `authCookie()` |
| Footer trỏ tới 3 trang chính sách không tồn tại (404 ×3 mỗi lần tải) | thêm `app/chinh-sach/[slug]/page.tsx` |
| `CartItem` phía app thiếu `slug`/`image` dù `GET /me/cart` trả về → `tsc` báo lỗi khi hiện ảnh giỏ | `apps/customer-mobile/src/cart.tsx` |

### 6.4 Vẫn chưa kiểm được

Android/iOS thật (§4) — không có `adb`/`emulator`/`ANDROID_HOME`; ứng dụng chỉ được chứng minh qua `tsc` + bundle Metro.

## 7. Đợt kiểm toán toàn diện 122 mã P1 (2026-11-17, phiên hiện tại)

Chi tiết đầy đủ từng mã: `docs/audit/FEATURE_AUDIT.md`. Trạng thái dùng đúng quy ước ma trận (`PASS`/`FAIL`/`BLOCKED`/`NOT_IMPLEMENTED`).

### 7.1 Lệnh đã chạy lại

```bash
pnpm typecheck                                # 6 gói Done (api, customer-web, admin-web, mobile, core, ui)
cd apps/api && pnpm test                      # 6 files, 32 tests passed
node .audit/api-proof.mjs                     # 31 phép kiểm API sống, summary 31/31 pass
pnpm build                                    # customer-web + admin-web ✓ Compiled successfully
```

### 7.2 Kết quả tổng hợp

| Nhóm | PASS | BLOCKED | FAIL |
|---|---|---|---|
| Admin 64 mã | 64 | 0 | 0 |
| Customer 58 mã (Web) | 57 | 1 | 0 |
| Customer 58 mã (App native) | 0 | 58 | 0 |

Không có dòng nào `UNTESTED` hay `NOT_IMPLEMENTED`.

### 7.3 Lỗi thật phát hiện và đã sửa trong phiên này

| # | Lỗi | Tác động | Sửa |
|---|---|---|---|
| 1 | `POST /admin/certificates` với `batch_id`/`farm_id` không tồn tại | vi phạm FK → HTTP 500 | kiểm tra chủ sở hữu trước khi insert → 404 (`routes/admin.ts`) |
| 2 | `releaseAllocations` trừ `reserved_qty` không chặn âm | thu hồi/huỷ trên dữ liệu lệch → 500 `inventory_nonneg` | `GREATEST(0, reserved_qty - delta)` (`services/pricing.ts:315`) |
| 3 | Mã đơn/mã khiếu nại tính bằng `COUNT(*)+1` | trùng UNIQUE sau khi có đơn huỷ → 500 khi đặt hàng tiếp theo | bảng `code_sequences` + tăng nguyên tử trong transaction (`migrations/002_code_sequences.sql`, `customer.ts`, `pricing.ts`) |
| 4 | `/auth/logout` chỉ xoá cookie | token bearer vẫn dùng được 7 ngày sau khi đăng xuất | `jti` trong JWT + bảng `session_revocations` (`migrations/003_session_revocations.sql`, `lib/auth.ts`, `routes/auth.ts`) |
| 5 | Nút "Tem" của lô trên trang sản phẩm trỏ `/tim-kiem?batch=<mã lô>` | link chết, khách không mở được hồ sơ lô | trỏ `/t/<qr_token>`, thêm `qr_token` vào `ProductDetail` |
| 6 | Trang chi tiết sản phẩm không có title riêng/JSON-LD | SEO/kết quả làm giàu kém | `generateMetadata` + `Product` JSON-LD |
| 7 | Import `dateTimeVN/PUBLICATION/SAFETY` bị mất ở `admin/ma-qr` khi sửa link tra cứu | `pnpm typecheck` fail | khôi phục import |

### 7.4 Còn tồn tại có chủ đích

- **Native Android/iOS = BLOCKED**: không có `adb`/`emulator`/`ANDROID_HOME`; chỉ chứng minh được qua `tsc` + bundle Expo web :8081.
- **`/uploads/:name` phục vụ mọi tệp đã upload mà không đọc `is_public`**: tên 32 hex ngẫu nhiên nên không đoán được, và QR công khai cần đọc ảnh; đổi sang signed URL là việc P2 (ghi chú đã có trong `uploads.ts`).
- **Chưa có xuất CSV/Excel báo cáo**: đặc tả 122 mã không yêu cầu; màn hình hiển thị trực tiếp.

## 8. Đợt nghiệm thu trực tiếp 3 kênh (2026-11-17, phiên hiện tại)

Chạy thật trên dịch vụ đang sống: API `:4000`, cửa hàng `:3000`, quản trị `:3001`, Expo web `:8081`, DB `:5544`.

### 8.1 Lệnh và kết quả

| Lệnh | Kết quả |
|---|---|
| `pnpm -r typecheck` | 6/6 gói `Done` |
| `cd apps/api && pnpm test` | `6 passed (6)`, `32 passed (32)` — thêm `06-logic-gates` (3) và `TC02b` (1) |
| `node .audit/api-proof.mjs` | `summary: 31/31 pass` |
| `pnpm build` | customer-web + admin-web biên dịch thành công |
| `curl /admin/batches/<id>/label.pdf` | `200`, `application/pdf`, 15.766 byte |

### 8.2 Chuỗi web → app → admin đã đi hết

| Bước | Kênh | Quan sát |
|---|---|---|
| Thêm 2 kg xoài vào giỏ khi chưa đăng nhập | Web :3000 | giỏ khách lưu `agri.guest-cart.v1`, badge `Giỏ hàng, 1 sản phẩm` |
| Đăng nhập `khach1@example.com` | Web | giỏ khách gộp vào giỏ server, chuyển về `/gio-hang` |
| Mở tab Giỏ ở app | App :8081 | badge `Giỏ (2)` — cùng giỏ server |
| Bấm `+` trong app (2 → 3 kg) | App | web tải lại hiển thị `3` · `267.000₫` |
| Checkout COD | Web | `AGM-2026-0009`, lô `LO-2026-0005` giữ 3 kg, tổng 287.000₫ |
| Danh sách đơn ở app | App | `AGM-2026-0009 · Chờ xác nhận · 287.000₫` |
| Admin: Xác nhận → Bắt đầu chuẩn bị → Xuất kho & giao hàng (GHN) | Admin :3001 | `Đang giao`, shipment `GHN · SHIPPING` |
| Đơn ở app sau khi admin xuất kho | App | `AGM-2026-0009 · Đang giao` |
| Thu hồi `LO-2026-0004` (lý do dư lượng thuốc) | Admin | `/admin/thu-hoi` có 1 đợt `HIGH`; trang tem `demo-ca-chua-het-han` mở đầu bằng `LÔ HÀNG ĐANG BỊ THU HỒI` |
| Đăng ký tài khoản mới trên web | Web | tạo xong vào thẳng `/tai-khoan`, role `CUSTOMER` |
| Đổi giá `Gạo ST25` 150.000 → 151.000 ở admin | Admin → Web | PDP cửa hàng hiển thị `151.000₫` ngay; đã trả lại 150.000₫ |
| Rà 16 route quản trị | Admin | tất cả `200`, có bảng/KPI thật; console 0 error |

### 8.3 Lỗi phát hiện và đã sửa trong phiên này

| # | Lỗi | Tác động | Sửa |
|---|---|---|---|
| 1 | `reallocate` giữ chỗ theo `body.quantity` bất kỳ và dùng `warehouse_id` cũ | thổi tồn giữ chỗ, cho phép bán quá số lượng đã giữ | chặn `> reserved_qty`, lấy kho từ `inventory` của lô đích, `UPDATE … RETURNING` có điều kiện (`adminOps.ts`) |
| 2 | Trần hoàn tiền dùng `orders.total_vnd` | hoàn được tiền chưa thu | trần = tiền `PAID` − yêu cầu đang/đã hoàn (`adminOps.ts`) |
| 3 | Cửa cách ly thuốc BVTV lùi 1 ngày do `toISOString()` | cho phép thu hoạch trong thời gian cách ly | `to_char(max(activity_at + isolation_days),'YYYY-MM-DD')` ở cả cửa chặn và `earliest_harvest_date` (`admin.ts`) |
| 4 | Tem QR chỉ là ảnh QR, QR trong PDF trỏ `/t/<mã lô>` | tem dán thùng thiếu thông tin, quét ra 404 khi mã lô ≠ token | `GET /admin/batches/:id/label.pdf` (`renderLabelPdf`) có tên/mã lô/ngày thu hoạch/hạn dùng + QR token; nút admin trỏ endpoint mới |
| 5 | Mã mùa vụ `COUNT(*)+1` | trùng UNIQUE sau khi xoá mùa vụ | `code_sequences(kind='season')` |
| 6 | Trùng key React `promo-<id>` ở trang chủ | render trùng/thiếu thẻ sản phẩm | dedupe theo `id` (`app/page.tsx`) |
| 7 | App giữ badge giỏ cũ sau khi đặt đơn trên web | shop ↔ app lệch trạng thái giỏ | `reload()` khi chuyển tab (`App.tsx`) |

### 8.4 Ranh giới trung thực

- **`CUS-09-06` (camera quét QR trên app) vẫn BLOCKED**: máy không có `adb`/`emulator`/`ANDROID_HOME`, chưa chứng minh được trên thiết bị thật.
- Toàn bộ 58 mã app chỉ được chứng minh qua **Expo web :8081** với API thật; native Android/iOS chưa chạy.
- Không có mã nào ở trạng thái `FAIL` hay `NOT_IMPLEMENTED` trong đợt này.
