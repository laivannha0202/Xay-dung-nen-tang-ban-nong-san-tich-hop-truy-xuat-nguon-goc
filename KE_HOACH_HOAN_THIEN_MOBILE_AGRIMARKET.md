# KẾ HOẠCH HOÀN THIỆN TOÀN BỘ MOBILE AGRIMARKET

> **Mục tiêu:** Biến Mobile AgriMarket hiện tại từ trạng thái demo/tương đối hoàn chỉnh thành một ứng dụng khách hàng có luồng nghiệp vụ đầy đủ, đồng bộ Backend, chạy ổn trên Android/Linux, có UI production, test được end-to-end và đủ ổn định để demo/bảo vệ đồ án.
>
> **Phạm vi:** Chỉ tập trung Mobile khách hàng (`apps/mobile`) và các Backend/API contract bắt buộc để Mobile hoạt động đúng.
>
> **Nguyên tắc:** Không viết lại Mobile từ đầu. Giữ nguyên kiến trúc tốt đang có, sửa lần lượt các khoảng trống và sai lệch contract.
>
> **Thứ tự bắt buộc:** Làm từng phiên từ trên xuống. Không chuyển phiên nếu tiêu chí hoàn thành của phiên hiện tại chưa đạt.

---

# 0. TRẠNG THÁI HIỆN TẠI

## 0.1. Đánh giá tổng quan

| Phần | Mức hiện tại | Trạng thái |
|---|---:|---|
| React Native / Expo foundation | 8.5/10 | Tốt |
| Expo Router | 7.5/10 | Cần hoàn thiện protected flow |
| API architecture | 8.5/10 | Tốt |
| Auth/token | 8/10 | Tốt, còn edge case |
| Product/Search | 8/10 | Khá hoàn chỉnh |
| QR/Traceability | 9/10 | Rất tốt |
| Cart | 8.5/10 | Gần hoàn chỉnh |
| Checkout | 5/10 | Chưa end-to-end |
| Order/Payment/Shipping | 6.5/10 | Mobile tụt sau Backend |
| Account | 7/10 | Thiếu một số nghiệp vụ |
| Push Notification | 6/10 | Foundation có, production chưa xong |
| UI/UX production | 6/10 | Còn nhiều chữ dev/AI |
| Test/CI Mobile | 4.5/10 | Cần bổ sung mạnh |

## 0.2. Điểm mạnh phải giữ nguyên

- Expo SDK 57.
- React Native + TypeScript.
- Expo Router.
- Orval generated API client.
- TanStack Query.
- Zustand.
- Expo SecureStore cho refresh token.
- Backend là nguồn sự thật của giá, tồn kho, checkout, payment.
- Design System Mobile hiện có.
- QR Scanner + Trace Detail hiện tại.
- Cart lưu Backend và đồng bộ theo tài khoản.
- Naming convention tiếng Việt hiện tại.

## 0.3. Các vấn đề chính phải xử lý

### P0 — bắt buộc trước khi coi Mobile hoàn chỉnh

- Checkout chưa tạo Order thật.
- Nút xác nhận đặt hàng đang disabled.
- Checkout Mobile dùng contract cũ, chưa dùng Address Book thật.
- Shipping/voucher/points/payment chưa hoàn chỉnh.
- Order/Payment/Shipment Mobile chưa bắt kịp Backend.
- Chưa có luồng end-to-end:
  `Product → Cart → Checkout → Order → Payment → Shipment`.

### P1 — cần sửa trước demo chính thức

- Login không quay về màn hình/hành động trước đó.
- Protected route chưa được tổ chức thống nhất.
- Chưa có logout rõ ràng trong Account.
- UI còn hiển thị `PHIEN-*`, `Backend`, `API`, `Expo Camera`, `Preview`, `Boundary`.
- Header/navigation bị lặp lại ở nhiều màn.
- Push chưa có production device-token flow.
- API base URL chưa thuận tiện cho Android physical device.

### P2 — hoàn thiện chất lượng

- Home còn suy diễn nghiệp vụ từ 24 sản phẩm đầu tiên.
- Search facets lấy từ tối đa 100 sản phẩm.
- Register chưa khớp hoàn toàn đặc tả OTP/terms/phone.
- Thiếu test Mobile đầy đủ.
- Tài liệu trạng thái dự án còn mâu thuẫn.

---

# 1. LUỒNG MOBILE CUỐI CÙNG PHẢI ĐẠT

```text
                         APP START
                             │
                     Restore Session
                             │
              ┌──────────────┴──────────────┐
              │                             │
            GUEST                         LOGGED
              │                             │
      ┌───────┼─────────┐                   │
      │       │         │                   │
     Home   Search      QR                  │
      │       │         │                   │
      └── Product       └── Trace           │
            │                               │
           Farm                             │
            │                               │
       Add to Cart                          │
            │                               │
      chưa đăng nhập?                       │
            │ YES                           │
            ▼                               │
          Login                             │
            │                               │
   returnTo / pendingAction                 │
            │                               │
            └──────────────► Cart ◄─────────┘
                               │
                           Checkout
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
          Address           Shipping          Voucher
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                        Backend Preview
                               │
                         Create Order
                               │
                     Reserve Inventory
                               │
                    ┌──────────┴──────────┐
                    │                     │
                   COD                 Gateway
                    │                     │
                    │               Deep-link Return
                    └──────────┬──────────┘
                               │
                          Order Detail
                               │
                  ┌────────────┼────────────┐
                  │            │            │
               Payment      Shipment     Timeline
                                             │
                                         Delivered
                                             │
                                     ┌───────┴───────┐
                                     │               │
                                   Review        Complaint
```

---

# 2. QUY TẮC LÀM TỪNG PHIÊN

Mỗi phiên phải thực hiện theo đúng thứ tự:

```text
1. Đọc docs/TRANG_THAI_DU_AN.md
2. Đọc docs/QUYET_DINH_KIEN_TRUC.md
3. Đọc file kế hoạch Mobile này
4. Kiểm tra code hiện tại
5. Chỉ sửa đúng phạm vi phiên
6. Chạy lint
7. Chạy typecheck
8. Chạy test liên quan
9. Chạy build nếu phù hợp
10. Chạy git diff --check
11. Test runtime Android nếu phiên liên quan UI/native
12. Cập nhật docs/TRANG_THAI_DU_AN.md
13. Ghi lỗi còn tồn tại
14. Chỉ chuyển phiên khi Definition of Done đạt
```

Không được:

- tự đổi stack;
- bỏ Orval để tự `fetch()` tùy tiện;
- tính giá/tồn/phí vận chuyển ở client nếu Backend có contract;
- dùng dữ liệu giả để che thiếu API;
- hiển thị thông tin kỹ thuật cho khách hàng;
- đánh dấu hoàn thành chỉ vì compile được.

---

# 3. MOBILE-FIX-001 — CHUẨN HÓA MÔI TRƯỜNG LINUX + EXPO + ANDROID

## Mục tiêu

Bảo đảm mọi thành viên có thể chạy Mobile ổn định trên Linux với:

- Android physical device + Expo Go;
- Android Emulator nếu cần;
- development build cho native feature.

## Kiểm tra version

```bash
node -v
pnpm -v
java -version
adb --version
adb devices
echo $ANDROID_HOME
```

Yêu cầu dự án:

```text
Node: 24.x
pnpm: 11.x
```

## Việc phải làm

- [ ] Chạy `pnpm install`.
- [ ] Chạy `pnpm dlx expo-doctor@latest`.
- [ ] Chạy `npx expo install --check`.
- [ ] Sửa toàn bộ dependency mismatch nếu có.
- [ ] Kiểm tra `apps/mobile/app.json`.
- [ ] Kiểm tra `apps/mobile/metro.config.js`.
- [ ] Kiểm tra `expo-router`.
- [ ] Kiểm tra `expo-camera`.
- [ ] Kiểm tra `expo-secure-store`.
- [ ] Kiểm tra `expo-image-picker`.
- [ ] Kiểm tra `expo-notifications`.
- [ ] Kiểm tra `expo-image`.
- [ ] Kiểm tra UniWind/Gluestack runtime.
- [ ] Chạy app bằng Expo Go trên Android thật.
- [ ] Nếu có Android Emulator, chạy app trên Emulator.
- [ ] Ghi rõ package nào cần development build.

## Tạo file

```text
apps/mobile/.env.example
```

Nội dung mẫu:

```env
# Android physical device: thay bằng IP LAN của máy Linux
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000

# Android Emulator:
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

Không commit `.env` chứa thông tin môi trường cá nhân.

## Backend network

Backend phải bind:

```text
0.0.0.0:3000
```

Physical device phải truy cập:

```text
http://<IP-LAN-LINUX>:3000
```

Không dùng:

```text
127.0.0.1:3000
```

trên điện thoại thật.

## Test bắt buộc

```bash
pnpm lint
pnpm typecheck
pnpm --filter @agrimarket/mobile start
```

Test manual:

- [ ] Home mở được.
- [ ] API load được trên điện thoại.
- [ ] Product list có dữ liệu.
- [ ] Camera mở được.
- [ ] SecureStore không crash.
- [ ] Reload app không crash.

## Definition of Done

- [ ] `expo-doctor` không còn lỗi nghiêm trọng.
- [ ] Dependency đúng Expo SDK 57.
- [ ] Android thật gọi được Backend.
- [ ] Có `.env.example`.
- [ ] Có hướng dẫn rõ Expo Go vs Development Build.
- [ ] Không còn phụ thuộc `127.0.0.1` khi dùng physical device.

---

# 4. MOBILE-FIX-002 — CHUẨN HÓA API RUNTIME VÀ ERROR HANDLING

## Mục tiêu

Mọi API Mobile đi qua cùng architecture và xử lý lỗi nhất quán.

## Luồng chuẩn

```text
Screen
  ↓
Mobile API adapter
  ↓
@agrimarket/api-client
  ↓
Orval
  ↓
REST Backend
```

## Việc phải làm

- [ ] Kiểm tra toàn bộ `apps/mobile/src/lib/api-*.ts`.
- [ ] Không để screen tự gọi `fetch()` nếu không thật sự cần.
- [ ] Chuẩn hóa helper unwrap `{ data }`.
- [ ] Chuẩn hóa lỗi HTTP.
- [ ] Chuẩn hóa lỗi network.
- [ ] Chuẩn hóa lỗi 401.
- [ ] Chuẩn hóa lỗi 403.
- [ ] Chuẩn hóa lỗi 404.
- [ ] Chuẩn hóa lỗi 409/stock conflict.
- [ ] Chuẩn hóa lỗi validation.
- [ ] Không hiển thị raw backend stack/error cho người dùng.
- [ ] Query key phải ổn định và có namespace rõ.
- [ ] Mutation thành công phải invalidate/set cache đúng.

## Nên tạo

```text
apps/mobile/src/lib/api-response.ts
apps/mobile/src/lib/api-error.ts
```

nếu hiện tại nhiều file lặp cùng logic.

Không abstraction quá mức.

## Definition of Done

- [ ] Không có duplicate helper lớn giữa nhiều API files.
- [ ] Error UI thống nhất.
- [ ] 401 được chuyển về auth flow hợp lý.
- [ ] Không có API call bypass generated client không có lý do.

---

# 5. MOBILE-FIX-003 — AUTH SESSION SINGLE-FLIGHT

## Mục tiêu

Không xảy ra nhiều refresh token request cùng lúc khi access token hết hạn.

## Vấn đề

Hiện restore session có promise chống trùng, nhưng request runtime có thể đồng thời gọi refresh.

## Luồng cần đạt

```text
API A ─┐
API B ─┼─ access token hết hạn
API C ─┘
       │
       ▼
 refreshPromise duy nhất
       │
       ▼
 access token mới
       │
       ├── API A retry
       ├── API B retry
       └── API C retry
```

## Việc phải làm

- [ ] Thêm single-flight refresh promise.
- [ ] Không gửi nhiều refresh request đồng thời.
- [ ] Nếu refresh fail:
  - [ ] xóa access token;
  - [ ] xóa refresh token;
  - [ ] Zustand về `chua-dang-nhap`;
  - [ ] protected action dừng đúng cách.
- [ ] Không tạo vòng lặp refresh vô hạn.
- [ ] Kiểm tra refresh-token rotation nếu Backend dùng.

## Test

- [ ] Simulate access token hết hạn.
- [ ] Gửi 3 API request gần như đồng thời.
- [ ] Chỉ có 1 refresh request.
- [ ] Cả 3 request tiếp tục đúng sau refresh.
- [ ] Refresh fail thì logout sạch.

## Definition of Done

- [ ] Session restore ổn.
- [ ] Refresh runtime ổn.
- [ ] Không race condition token.

---

# 6. MOBILE-FIX-004 — PROTECTED ROUTE + RETURN-TO + PENDING ACTION

## Mục tiêu

Người dùng login xong phải quay lại đúng luồng trước đó.

## Vấn đề hiện tại

```text
Product
→ Add to Cart
→ Login
→ Home
```

Không đúng UX.

## Luồng chuẩn

```text
Product A
→ Add to Cart
→ chưa login
→ Login?returnTo=/san-pham/A
→ Login thành công
→ Product A
→ tiếp tục hành động nếu cần
```

## Việc phải làm

- [ ] Xác định route public:
  - [ ] Home
  - [ ] Search
  - [ ] Product
  - [ ] Farm
  - [ ] QR
  - [ ] Trace
  - [ ] Login/Register/Forgot
- [ ] Xác định route protected:
  - [ ] Cart
  - [ ] Checkout
  - [ ] Orders
  - [ ] Account child screens
  - [ ] Complaint create
  - [ ] Review
- [ ] Tạo helper điều hướng tới login với `returnTo`.
- [ ] Login thành công ưu tiên `returnTo`.
- [ ] Nếu không có `returnTo`, mới về Home.
- [ ] Có thể thêm `pendingAction` cho Add to Cart.
- [ ] Chống open redirect: chỉ cho internal route.
- [ ] Không nhét logic auth lặp vào mọi screen.

## Nên có

```text
apps/mobile/src/lib/auth-navigation.ts
```

hoặc tương đương.

## Test bắt buộc

### Case A

```text
Guest
→ Product A
→ Add Cart
→ Login
→ Product A
```

### Case B

```text
Guest
→ Cart
→ Login
→ Cart
```

### Case C

```text
Guest
→ Account
→ Login
→ Account
```

### Case D

```text
Logged
→ Logout
→ Product public vẫn xem được
```

## Definition of Done

- [ ] Không còn login thành công luôn `router.replace('/')`.
- [ ] Mọi protected flow quay về đúng màn trước đó.
- [ ] Không open redirect.

---

# 7. MOBILE-FIX-005 — LOGOUT + SESSION EXPIRED UX

## Mục tiêu

Account phải có đăng xuất rõ ràng và session hết hạn không gây lỗi mơ hồ.

## Việc phải làm

- [ ] Thêm `Đăng xuất` trong Account.
- [ ] Hiện confirm trước khi logout nếu phù hợp.
- [ ] Gọi `dangXuatMobile()`.
- [ ] Xóa cache dữ liệu private sau logout:
  - [ ] cart;
  - [ ] orders;
  - [ ] profile;
  - [ ] address;
  - [ ] wishlist;
  - [ ] complaints;
  - [ ] notification/private query.
- [ ] Không xóa cache public không cần thiết.
- [ ] Session expired phải có message người dùng hiểu được.
- [ ] Sau logout quay về Home hoặc Login theo UX đã chốt.

## Definition of Done

- [ ] Logout hoạt động.
- [ ] Không thấy dữ liệu user cũ khi login account khác.
- [ ] Refresh token bị xóa.
- [ ] Private React Query cache được reset.

---

# 8. MOBILE-FIX-006 — CHECKOUT CONTRACT V2 [P0]

## Mục tiêu

Thay Checkout draft hiện tại bằng Checkout thật.

## Vấn đề hiện tại

- Address đang nhập local.
- Address không dùng Address Book Backend.
- Voucher disabled.
- Payment gateway disabled.
- Nút xác nhận Order disabled.
- Copy UI còn nói PHIEN/Backend/contract.

## Luồng cần đạt

```text
Cart
 ↓
Checkout
 ↓
GET Address Book
 ↓
Select address
 ↓
Checkout Preview
 ↓
Backend tính:
- current price
- stock
- shipping
- promotion
- voucher
- points
- total
 ↓
Confirm
 ↓
Create Order
 ↓
Inventory Reservation
 ↓
Payment
```

## 8.1. Address

- [ ] Dùng API Address Book thật.
- [ ] Load địa chỉ mặc định.
- [ ] Cho chọn địa chỉ.
- [ ] Cho mở màn tạo địa chỉ nếu chưa có.
- [ ] Sau khi tạo quay lại Checkout.
- [ ] Không nhập address draft riêng trong Checkout nếu không cần.
- [ ] Gửi `diaChiGiaoHangId`.

## 8.2. Checkout Preview

- [ ] Preview lấy dữ liệu thật từ Backend.
- [ ] Backend là source of truth.
- [ ] Không tự cộng phí ship ở Mobile.
- [ ] Không tự tính promotion.
- [ ] Không tự tính points.
- [ ] Không tự tính final total.

## 8.3. Shipping

- [ ] Hiển thị shipping method thật nếu Backend có.
- [ ] Nếu chỉ có standard shipping, contract phải rõ.
- [ ] Hiển thị phí từ Backend.
- [ ] Hiển thị miễn phí nếu Backend trả 0.
- [ ] Không ghi `Chưa có biểu phí từ Backend` trong production UI.

## 8.4. Voucher

- [ ] Nếu Backend có customer voucher API:
  - [ ] list voucher;
  - [ ] apply voucher;
  - [ ] remove voucher;
  - [ ] preview lại.
- [ ] Nếu chưa có API:
  - [ ] bổ sung Backend trước;
  - [ ] không tạo voucher giả.

## 8.5. Loyalty points

- [ ] Load số dư điểm.
- [ ] Cho chọn dùng điểm nếu Backend hỗ trợ.
- [ ] Preview lại sau thay đổi.
- [ ] Validate tối đa ở Backend.

## 8.6. Payment method

Ít nhất phải có:

```text
COD
```

Nếu Gateway đã đủ contract:

```text
VNPay Sandbox
```

## 8.7. Create Order

- [ ] Bật CTA `Xác nhận đặt hàng`.
- [ ] Mutation Create Order thật.
- [ ] Disable CTA khi đang submit.
- [ ] Chống double tap.
- [ ] Backend phải idempotent hoặc có idempotency strategy.
- [ ] Nếu stock changed → hiện lỗi và refresh preview.
- [ ] Nếu price changed → refresh preview.
- [ ] Nếu voucher invalid → refresh preview.
- [ ] Nếu address invalid → bắt chọn lại.

## Definition of Done

Luồng này phải chạy thật:

```text
Product
→ Cart
→ Checkout
→ Address
→ Preview
→ Confirm
→ Create Order
```

Không còn:

```text
disabled CTA
draft address
PHIEN-101
Backend boundary
Checkout Preview debug text
```

---

# 9. MOBILE-FIX-007 — COD PAYMENT END-TO-END [P0]

## Mục tiêu

Hoàn thiện ít nhất một phương thức thanh toán end-to-end.

## Luồng COD

```text
Create Order
   ↓
Payment = COD
   ↓
Order accepted
   ↓
Order Detail
```

## Việc phải làm

- [ ] Xác định Backend COD contract hiện tại.
- [ ] Tạo payment record nếu nghiệp vụ yêu cầu.
- [ ] Map payment status lên UI.
- [ ] Không hiển thị Mock Payment cho customer.
- [ ] Sau Create Order COD điều hướng Order Detail.
- [ ] Xóa/refresh cart sau order thành công.
- [ ] Invalidate order list.
- [ ] Invalidate checkout preview.
- [ ] Không mất order nếu UI navigation fail.

## Test

- [ ] COD happy path.
- [ ] Double submit.
- [ ] Stock hết trong lúc confirm.
- [ ] Backend 500.
- [ ] Network timeout sau server đã tạo order.
- [ ] Reload app vẫn thấy order.

## Definition of Done

- [ ] Có thể tạo một order COD thật từ Mobile.
- [ ] Order xuất hiện ở Web Customer/Admin nếu sync architecture đúng.
- [ ] Cart được cập nhật đúng.

---

# 10. MOBILE-FIX-008 — VNPAY/ONLINE PAYMENT RETURN FLOW

> Chỉ thực hiện nếu cổng thanh toán nằm trong phạm vi đồ án. COD đã phải hoàn thiện trước.

## Luồng

```text
Checkout
 ↓
Create Order
 ↓
Create Payment
 ↓
Open Gateway
 ↓
VNPay Sandbox
 ↓
Deep Link agrimarket://...
 ↓
Payment Result
 ↓
Backend verify payment status
 ↓
Order Detail
```

## Việc phải làm

- [ ] Xác định API create payment.
- [ ] Không tự tin callback từ client.
- [ ] Backend xác minh callback/signature.
- [ ] Mobile chỉ đọc status từ Backend.
- [ ] Deep link scheme `agrimarket`.
- [ ] Validate return route.
- [ ] Payment result:
  - [ ] pending;
  - [ ] success;
  - [ ] failed;
  - [ ] cancelled.
- [ ] Không coi redirect success là payment success.
- [ ] Có nút `Kiểm tra lại trạng thái`.

## Definition of Done

- [ ] Gateway return mở đúng app.
- [ ] Status lấy lại từ Backend.
- [ ] Callback lặp không làm duplicate payment.

---

# 11. MOBILE-FIX-009 — ORDER LIST/DETAIL HOÀN CHỈNH [P0]

## Mục tiêu

Order Mobile phải phản ánh đúng lifecycle Backend.

## Order List

- [ ] Pagination.
- [ ] Filter trạng thái.
- [ ] Empty state.
- [ ] Pull-to-refresh hoặc refresh action.
- [ ] Hiển thị:
  - [ ] mã đơn;
  - [ ] thời gian;
  - [ ] tổng tiền;
  - [ ] trạng thái;
  - [ ] số item;
  - [ ] payment status nếu có.

## Order Detail

Phải có:

```text
Order info
Products
Supplier suborders
Payment
Shipment
Timeline
Cancel
Review
Complaint
```

## Payment section

- [ ] CREATED/PENDING.
- [ ] PAID.
- [ ] FAILED.
- [ ] CANCELLED.
- [ ] REFUNDED/PARTIALLY_REFUNDED nếu có.

## Shipment section

- [ ] CREATED.
- [ ] PICKED_UP.
- [ ] IN_TRANSIT.
- [ ] OUT_FOR_DELIVERY.
- [ ] DELIVERED.
- [ ] FAILED.
- [ ] RETURNED.

## Timeline

Timeline phải tổng hợp theo thứ tự thời gian:

```text
Order created
Payment
Order confirmed
Preparing
Packed
Shipment created
Picked up
In transit
Out for delivery
Delivered
Completed
Cancelled/Refunded nếu có
```

## Cancel Order

- [ ] Chỉ hiển thị khi `coTheHuy`.
- [ ] Backend validate state.
- [ ] Có confirm.
- [ ] Sau cancel invalidate list/detail.
- [ ] Nếu payment đã paid, không tự suy diễn refund trên client.

## Definition of Done

- [ ] Order list đúng Backend.
- [ ] Order detail có payment + shipment + timeline.
- [ ] Cancel hoạt động đúng rule.

---

# 12. MOBILE-FIX-010 — REVIEW + COMPLAINT HOÀN CHỈNH

## Review

Rule:

```text
chỉ order item đã delivered
mỗi item review tối đa theo rule Backend
```

- [ ] Hiển thị CTA Review đúng điều kiện.
- [ ] Rating.
- [ ] Comment.
- [ ] Image nếu contract hỗ trợ.
- [ ] Submit mutation thật.
- [ ] Disable duplicate review.

## Complaint

Luồng:

```text
Order Detail
→ chọn item
→ lý do
→ mô tả
→ evidence
→ confirm
→ submit
```

- [ ] Camera evidence.
- [ ] Gallery evidence.
- [ ] Permission UX.
- [ ] Upload file thật.
- [ ] Submit complaint thật.
- [ ] Complaint history.
- [ ] Complaint detail.
- [ ] Hiển thị trạng thái xử lý.

## Definition of Done

- [ ] Delivered item có Review.
- [ ] Complaint có evidence thật.
- [ ] Sau submit thấy trong Account.

---

# 13. MOBILE-FIX-011 — ACCOUNT COMPLETION

## Mục tiêu

Account không còn placeholder/backend boundary.

## Menu cuối cùng

```text
Tài khoản
├── Hồ sơ
├── Địa chỉ
├── Sản phẩm yêu thích
├── Trang trại theo dõi
├── Điểm thưởng
├── Voucher
├── Khiếu nại
├── Thông báo
└── Đăng xuất
```

## Profile

- [ ] Load.
- [ ] Edit.
- [ ] Validate.
- [ ] Update Backend.

## Address Book

- [ ] List.
- [ ] Add.
- [ ] Edit.
- [ ] Set default.
- [ ] Delete.
- [ ] Checkout reuse.

## Wishlist

- [ ] List.
- [ ] Remove.
- [ ] Product detail → add/remove favorite nếu contract có.

## Follow Farm

- [ ] List.
- [ ] Follow/unfollow.
- [ ] Farm detail sync state.

## Loyalty

- [ ] Backend customer endpoint.
- [ ] Số dư.
- [ ] Transaction history nếu scope cho phép.
- [ ] Không hiển thị fake points.

## Voucher

- [ ] Customer voucher API.
- [ ] Voucher list.
- [ ] Eligibility.
- [ ] Use in Checkout.

## Logout

- [ ] Hoàn chỉnh theo MOBILE-FIX-005.

## Definition of Done

- [ ] Không còn `Backend boundary`.
- [ ] Không còn `Chưa có customer API`.
- [ ] Không còn `PHIEN-107`.

---

# 14. MOBILE-FIX-012 — PUSH NOTIFICATION PRODUCTION FLOW

## Mục tiêu

Push không chỉ là diagnostic UI.

## Phân biệt

### Expo Go

Dùng cho:

- UI;
- API;
- QR Camera;
- SecureStore.

Không coi Expo Go là môi trường test remote push production.

### Development Build

Dùng cho:

- ExpoPushToken;
- remote push;
- native notification runtime;
- deep link từ notification.

## Việc phải làm

- [ ] Tạo EAS project nếu chưa có.
- [ ] Thêm EAS projectId vào config phù hợp.
- [ ] Không hard-code secret.
- [ ] Development build chạy trên Android.
- [ ] Xin notification permission.
- [ ] Lấy ExpoPushToken.
- [ ] Backend có endpoint đăng ký device token.
- [ ] Backend lưu:
  - [ ] user;
  - [ ] device;
  - [ ] platform;
  - [ ] token;
  - [ ] active;
  - [ ] lastSeen/update.
- [ ] Logout disable/remove token nếu policy yêu cầu.
- [ ] Push events:
  - [ ] ORDER_STATUS;
  - [ ] SHIPMENT_STATUS;
  - [ ] REFUND_STATUS;
  - [ ] NEW_HARVEST;
  - [ ] RECALL.
- [ ] Deep link whitelist.
- [ ] Cold start từ notification.
- [ ] Foreground behavior.
- [ ] Background behavior.

## Definition of Done

- [ ] Có development build chạy được.
- [ ] Device token lên Backend.
- [ ] Gửi test push tới thiết bị thật.
- [ ] Tap push mở đúng màn.
- [ ] Không crash trong Expo Go.

---

# 15. MOBILE-FIX-013 — HOME BUSINESS SEMANTICS

## Vấn đề

Home hiện suy ra:

- `Mới thu hoạch`;
- `Theo mùa`;
- `Gợi ý`;

từ tập sản phẩm public giới hạn.

## Mục tiêu

Không để UI tự định nghĩa business semantics.

## Ưu tiên API

Một trong hai hướng:

### Hướng A

```text
GET /home
```

trả:

```text
categories
newHarvests
organic
seasonal
bestSellers
featuredFarms
recommendations
```

### Hướng B

Các endpoint riêng:

```text
GET /products/new-harvest
GET /products/seasonal
GET /products/best-sellers
GET /farms/featured
GET /recommendations
```

## Việc phải làm

- [ ] Không lấy 24 sản phẩm đầu rồi suy diễn.
- [ ] `Mới thu hoạch` dựa trên dữ liệu harvest thật.
- [ ] `Theo mùa` dựa trên rule/dataset thật.
- [ ] `Gợi ý` dùng recommendation API khi PHIEN AI đã tích hợp.
- [ ] Có fallback MostPopular nếu recommendation unavailable.
- [ ] Không để AI failure làm hỏng Home.

## Definition of Done

- [ ] Mỗi section có semantics rõ.
- [ ] Backend trả dữ liệu phù hợp.
- [ ] Mobile chỉ render.

---

# 16. MOBILE-FIX-014 — SEARCH FACETS + FILTER CONTRACT

## Vấn đề

Facets hiện có thể lấy từ tối đa 100 products và `unique()` ở client.

## Mục tiêu

Facets không phụ thuộc page size của product list.

## API đề xuất

```text
GET /products/facets
```

hoặc:

```text
GET /categories/public
GET /farms/public
GET /certificates/types
```

## Việc phải làm

- [ ] Category facet đầy đủ.
- [ ] Farm facet đầy đủ.
- [ ] Certificate facet đầy đủ.
- [ ] Province facet nếu cần.
- [ ] Filter values khớp Backend enum/schema.
- [ ] Reset filter.
- [ ] Pagination reset khi đổi filter.
- [ ] Search debounce hoặc explicit submit theo UX chốt.
- [ ] Không fetch 100 products chỉ để dựng facets.

## Definition of Done

- [ ] Facets không thiếu khi catalog >100 sản phẩm.
- [ ] Filter đúng contract.

---

# 17. MOBILE-FIX-015 — REGISTER / FORGOT PASSWORD ALIGNMENT

## Mục tiêu

Đặc tả và code thống nhất.

## Quyết định cần chốt trong phạm vi đồ án

### Nếu làm tối giản

```text
Email bắt buộc
Phone optional
Password
Terms checkbox
Forgot password qua email
Không OTP
```

Phải cập nhật tài liệu tương ứng.

### Nếu làm đúng full spec

- [ ] Email hoặc Phone.
- [ ] Terms.
- [ ] OTP.
- [ ] Resend OTP.
- [ ] Rate limit.
- [ ] Verify.
- [ ] Forgot password.
- [ ] Reset password.

## Definition of Done

- [ ] Code và đặc tả không mâu thuẫn.
- [ ] Không để tài liệu nói OTP nhưng app hoàn toàn không có mà không giải thích scope.

---

# 18. MOBILE-FIX-016 — UI PRODUCTION CLEANUP

## Mục tiêu

Xóa hoàn toàn cảm giác "màn demo theo phiên AI".

## Phải xóa khỏi UI customer

```text
PHIEN-*
Backend
API
Backend Cart
Mobile Checkout
Checkout Preview
Expo Camera
Backend boundary
Draft tại Mobile
contract
diagnostic
```

trừ khi nằm trong developer-only screen được bảo vệ rõ.

## Thay bằng copy hướng người dùng

Ví dụ:

```text
Backend Cart
→ Giỏ hàng

Checkout Preview
→ Xác nhận đơn hàng

Expo Camera
→ Quét mã QR

Backend boundary
→ Ẩn mục nếu chưa hỗ trợ

Đồng bộ Backend
→ Đã cập nhật
```

## Chuẩn hóa component

Nên có:

```text
components/navigation/AppHeader.tsx
components/common/AppButton.tsx
components/common/SectionCard.tsx
components/common/ConfirmDialog.tsx
components/common/ScreenState.tsx
```

chỉ tạo nếu thật sự giảm lặp.

## Chuẩn hóa

- [ ] Header.
- [ ] Back button.
- [ ] Cart button.
- [ ] Page title.
- [ ] Primary CTA.
- [ ] Secondary CTA.
- [ ] Danger CTA.
- [ ] Input.
- [ ] Card.
- [ ] Badge.
- [ ] Empty.
- [ ] Error.
- [ ] Skeleton.
- [ ] Spacing.
- [ ] Font scale.
- [ ] Border radius.
- [ ] Icons.
- [ ] Safe Area.

## Accessibility

- [ ] `accessibilityRole`.
- [ ] `accessibilityLabel` nơi cần.
- [ ] Touch target đủ lớn.
- [ ] Disabled state rõ.
- [ ] Contrast đủ đọc.
- [ ] Không chỉ dùng màu để truyền trạng thái.

## Definition of Done

- [ ] Không còn copy dev/AI trên customer UI.
- [ ] Header không lặp tùy tiện.
- [ ] Các màn có visual hierarchy đồng nhất.
- [ ] App nhìn như một sản phẩm thống nhất.

---

# 19. MOBILE-FIX-017 — NAVIGATION POLISH

## Mục tiêu

Back stack và deep link luôn hợp lý.

## Kiểm tra tất cả route

```text
/
kham-pha
quet-qr
don-hang
tai-khoan
dang-nhap
dang-ky
quen-mat-khau
san-pham/[id]
trang-trai/[id]
gio-hang
thanh-toan
thanh-toan/ket-qua
don-hang/[id]
truy-xuat/[ma]
khieu-nai/tao
tai-khoan/*
```

## Test

- [ ] Back từ Product.
- [ ] Back từ Cart.
- [ ] Back từ Checkout.
- [ ] Back từ Login returnTo.
- [ ] Deep link Product.
- [ ] Deep link Order.
- [ ] Deep link Trace.
- [ ] Deep link Notification.
- [ ] Cold start deep link.
- [ ] Invalid parameter.
- [ ] Missing entity.
- [ ] Unauthorized deep link.

## Definition of Done

- [ ] Không route loop.
- [ ] Không back về screen vô nghĩa.
- [ ] Protected deep link đi auth rồi quay lại đúng route.

---

# 20. MOBILE-FIX-018 — PERFORMANCE + QUERY BEHAVIOR

## Mục tiêu

Mobile không refetch quá mức và không giữ stale private data.

## Kiểm tra

- [ ] `staleTime`.
- [ ] `gcTime`.
- [ ] refetch on focus.
- [ ] refetch after mutation.
- [ ] pagination.
- [ ] image cache.
- [ ] list rendering.
- [ ] unnecessary `ScrollView` cho list dài.
- [ ] dùng `FlatList`/`FlashList` nếu product/order list lớn.
- [ ] tránh fetch facets nhiều lần.
- [ ] tránh duplicate API requests.
- [ ] checkout preview refetch đúng lúc.
- [ ] order status refresh strategy.

## Definition of Done

- [ ] Không thấy request lặp vô lý.
- [ ] List dài không giật rõ.
- [ ] Private data không leak giữa accounts.

---

# 21. MOBILE-FIX-019 — TEST UNIT / INTEGRATION CHO MOBILE

## Mục tiêu

Có test cho business-critical client logic.

## Unit test ưu tiên

- [ ] QR trace code parser.
- [ ] safe deep-link parser.
- [ ] auth returnTo validator.
- [ ] payment return parser.
- [ ] order status label mapping.
- [ ] complaint reason mapping.
- [ ] token/session helper nếu testable.
- [ ] checkout display helpers.
- [ ] currency/date formatting nếu có logic riêng.

## Integration/component test ưu tiên

- [ ] Login.
- [ ] Product Add Cart.
- [ ] Cart update/remove.
- [ ] Checkout states.
- [ ] Order status.
- [ ] Account logout.

## Definition of Done

- [ ] Critical pure logic có test.
- [ ] Regression dễ gặp được bao phủ.

---

# 22. MOBILE-FIX-020 — MOBILE E2E FLOW TEST

## Mục tiêu

Kiểm thử theo nghiệp vụ thực tế.

## Flow 1 — Guest browse

```text
App
→ Home
→ Search
→ Product
→ Farm
→ Trace
```

- [ ] Pass.

## Flow 2 — Login return

```text
Product
→ Add Cart
→ Login
→ quay lại Product
→ Cart
```

- [ ] Pass.

## Flow 3 — Core Commerce

```text
Login
→ Product
→ Add Cart
→ Cart
→ Checkout
→ Address
→ COD
→ Create Order
→ Order Detail
```

- [ ] Pass.

## Flow 4 — Order lifecycle

```text
Order
→ Confirmed
→ Preparing
→ Packed
→ Shipping
→ Delivered
```

- [ ] Pass.

## Flow 5 — Post-order

```text
Delivered
→ Review
```

- [ ] Pass.

```text
Delivered
→ Complaint
→ Evidence
→ Submit
```

- [ ] Pass.

## Flow 6 — Trace

```text
QR
→ Trace Detail
→ Recall warning
```

- [ ] Pass.

## Flow 7 — Account sync

```text
Edit profile
→ restart app
→ profile remains
```

- [ ] Pass.

```text
Add address Mobile
→ Web sees address
```

- [ ] Pass nếu cross-platform sync nằm trong scope.

## Flow 8 — Session

```text
Access token expire
→ API call
→ refresh
→ continue
```

- [ ] Pass.

## Flow 9 — Network error

```text
Offline
→ error state
→ online
→ retry
```

- [ ] Pass.

---

# 23. MOBILE-FIX-021 — CI CHECK CHO MOBILE

## Mục tiêu

Không merge code Mobile lỗi compile/lint/test.

## Pipeline tối thiểu

```text
install
↓
api-client ensure
↓
lint
↓
typecheck
↓
unit test
↓
build/check Expo config
```

## Việc phải làm

- [ ] GitHub Actions job cho Mobile.
- [ ] Cache pnpm.
- [ ] Dùng đúng Node 24.
- [ ] Dùng đúng pnpm 11.
- [ ] Orval/API client deterministic.
- [ ] Fail nếu generated contract stale.
- [ ] Fail nếu lint/typecheck lỗi.
- [ ] Fail nếu test lỗi.

## Definition of Done

- [ ] PR không thể coi là xanh nếu Mobile fail.

---

# 24. MOBILE-FIX-022 — ĐỒNG BỘ TÀI LIỆU NGUỒN SỰ THẬT

## Mục tiêu

Không để AI hoặc thành viên mới đọc tài liệu mâu thuẫn.

## Phải sửa

```text
docs/TRANG_THAI_DU_AN.md
docs/BOI_CANH_DU_AN_CHO_GPT.md
docs/QUYET_DINH_KIEN_TRUC.md
docs/KE_HOACH_CAC_PHIEN_AI.md
```

nếu tên thực tế khác thì dùng file tương ứng trong repo.

## Cần thống nhất rõ

Ví dụ:

```text
Backend Checkout Domain: DONE
Mobile Checkout UI draft: OLD
Mobile Checkout end-to-end: NOT DONE
```

Không được ghi chung một chữ `Checkout` khiến hiểu nhầm.

Tương tự:

```text
Order Backend: DONE
Order Customer Web: DONE
Order Mobile: PARTIAL
```

```text
Payment Backend: DONE
COD Mobile: ...
VNPay Mobile: ...
```

```text
Shipment Backend: DONE
Shipment Mobile tracking: ...
```

## Definition of Done

- [ ] Không còn checkbox mâu thuẫn.
- [ ] Mỗi platform có trạng thái riêng.
- [ ] Phiên tiếp theo đúng với code thực tế.

---

# 25. MOBILE-FIX-023 — SECURITY REVIEW MOBILE

## Auth

- [ ] Refresh token trong SecureStore.
- [ ] Access token không persist lâu dài.
- [ ] Logout revoke token nếu Backend hỗ trợ.
- [ ] Không log token.
- [ ] Không hiển thị token trên production UI.

## Deep Link

- [ ] Whitelist internal path.
- [ ] Không accept `http://`.
- [ ] Không accept `//`.
- [ ] Validate entity IDs.
- [ ] Protected deep link qua auth.

## Upload

- [ ] File type validation.
- [ ] File size validation.
- [ ] Không trust file extension.
- [ ] Backend validate lại.

## Payment

- [ ] Client không quyết định payment success.
- [ ] Callback verify ở Backend.
- [ ] Idempotency.

## API

- [ ] Không chứa secret trong `EXPO_PUBLIC_*`.
- [ ] `.env` không commit.
- [ ] Production dùng HTTPS.

## Definition of Done

- [ ] Không có token/payment/security flaw rõ ràng ở client flow.

---

# 26. MOBILE-FIX-024 — FINAL ANDROID DEVICE ACCEPTANCE

## Thiết bị cần test

Ít nhất:

- [ ] 1 Android physical device.
- [ ] 1 Android Emulator hoặc thiết bị Android thứ hai nếu có.

## Kiểm tra permission

- [ ] Camera allow.
- [ ] Camera deny.
- [ ] Camera deny permanently.
- [ ] Gallery allow.
- [ ] Notification allow.
- [ ] Notification deny.

## Kiểm tra lifecycle

- [ ] Kill app.
- [ ] Relaunch.
- [ ] Background/foreground.
- [ ] Network switch Wi-Fi → mobile.
- [ ] Token expire.
- [ ] Deep link cold start.
- [ ] Notification cold start.

## UI

- [ ] Keyboard không che nút quan trọng.
- [ ] Scroll được hết Checkout.
- [ ] Long product name không vỡ layout.
- [ ] Long address không vỡ layout.
- [ ] Empty state đẹp.
- [ ] Error state đẹp.
- [ ] Loading state đẹp.

## Definition of Done

- [ ] Không có crash blocker trên thiết bị thật.
- [ ] Core flow chạy đầy đủ.

---

# 27. MOBILE-FIX-025 — FINAL DEMO FLOW

## Demo đề xuất

### Demo 1 — Marketplace

```text
Home
→ Search
→ Product
→ Farm
```

### Demo 2 — Traceability

```text
QR
→ Scan
→ Batch
→ Farm
→ Certificate
→ Timeline
→ Recall
```

Đây nên là phần nhấn mạnh vì đúng tên đề tài.

### Demo 3 — Commerce

```text
Login
→ Product
→ Cart
→ Checkout
→ Address
→ COD
→ Order
```

### Demo 4 — Fulfillment

```text
Order
→ Payment
→ Shipment
→ Timeline
```

### Demo 5 — Customer care

```text
Delivered
→ Review
→ Complaint
```

### Demo 6 — Account

```text
Profile
→ Address
→ Wishlist
→ Farm follows
→ Loyalty
→ Voucher
→ Notification
```

---

# 28. DEFINITION OF DONE CUỐI CÙNG CHO TOÀN MOBILE

Chỉ coi **Mobile AgriMarket hoàn thiện** khi tất cả điều kiện sau đạt.

## Environment

- [ ] Node/pnpm đúng version.
- [ ] Expo Doctor pass.
- [ ] Android physical device chạy.
- [ ] API physical device gọi được.
- [ ] Development build chạy nếu cần push.

## Auth

- [ ] Login.
- [ ] Register.
- [ ] Forgot password.
- [ ] Session restore.
- [ ] Single-flight refresh.
- [ ] Return-to.
- [ ] Logout.
- [ ] Clear private cache.

## Browse

- [ ] Home.
- [ ] Search.
- [ ] Filter.
- [ ] Product.
- [ ] Farm.

## Traceability

- [ ] Camera QR.
- [ ] Trace Detail.
- [ ] Certificate.
- [ ] Cultivation.
- [ ] Harvest.
- [ ] Inspection.
- [ ] Timeline.
- [ ] Recall alert.

## Commerce

- [ ] Add Cart.
- [ ] Cart Backend sync.
- [ ] Address Book.
- [ ] Checkout Preview thật.
- [ ] Shipping thật.
- [ ] Voucher nếu scope.
- [ ] Loyalty points nếu scope.
- [ ] COD.
- [ ] Create Order thật.
- [ ] Inventory Reservation.
- [ ] Payment status.

## Order

- [ ] Order List.
- [ ] Order Detail.
- [ ] Order Timeline.
- [ ] Cancel.
- [ ] Shipment tracking.
- [ ] Payment status.

## Post-order

- [ ] Review.
- [ ] Complaint.
- [ ] Evidence.
- [ ] Complaint history.

## Account

- [ ] Profile.
- [ ] Address.
- [ ] Wishlist.
- [ ] Follow Farm.
- [ ] Loyalty.
- [ ] Voucher.
- [ ] Notification.
- [ ] Logout.

## Push

- [ ] Device token Backend.
- [ ] Order event.
- [ ] Shipment event.
- [ ] Refund event.
- [ ] New harvest event.
- [ ] Recall event.
- [ ] Deep link.

## UI

- [ ] Không còn `PHIEN-*`.
- [ ] Không còn `Backend boundary`.
- [ ] Không còn debug/developer copy.
- [ ] Navigation/header đồng nhất.
- [ ] Loading/error/empty đồng nhất.
- [ ] Không vỡ layout rõ ràng.

## Test

- [ ] Lint.
- [ ] Typecheck.
- [ ] Unit tests.
- [ ] Integration tests.
- [ ] Core E2E.
- [ ] Android device acceptance.
- [ ] CI pass.

---

# 29. THỨ TỰ ƯU TIÊN NGẮN GỌN

Nếu cần nhìn nhanh mỗi ngày, làm đúng thứ tự này:

```text
001 Environment Linux/Expo/Android
002 API Runtime/Error
003 Auth Refresh Single-Flight
004 Auth Return-To/Protected Route
005 Logout
006 Checkout Contract V2
007 COD End-to-End
008 Online Payment (nếu scope)
009 Order + Payment + Shipment
010 Review + Complaint
011 Account Completion
012 Push Production
013 Home Semantics
014 Search Facets
015 Register Alignment
016 UI Production Cleanup
017 Navigation Polish
018 Performance
019 Unit/Integration Test
020 Mobile E2E
021 CI
022 Docs Sync
023 Security Review
024 Android Acceptance
025 Final Demo
```

---

# 30. PHIÊN NÊN BẮT ĐẦU NGAY

Bắt đầu từ:

```text
MOBILE-FIX-001 — Chuẩn hóa môi trường Linux + Expo + Android
```

Không sửa Checkout ngay trước khi môi trường Android/API đã được xác nhận ổn định.

Sau khi `MOBILE-FIX-001` đạt Definition of Done, chuyển đúng sang:

```text
MOBILE-FIX-002
```

và tiếp tục lần lượt cho tới `MOBILE-FIX-025`.

---

# 31. PROMPT DÙNG CHO MỖI PHIÊN MỚI

```text
Bạn đang tiếp tục hoàn thiện Mobile AgriMarket.

Repository:
https://github.com/laivannha0202/Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc

Trước khi sửa:
1. Đọc docs/BOI_CANH_DU_AN_CHO_GPT.md
2. Đọc docs/TRANG_THAI_DU_AN.md
3. Đọc docs/QUYET_DINH_KIEN_TRUC.md
4. Đọc KE_HOACH_HOAN_THIEN_MOBILE_AGRIMARKET.md
5. Kiểm tra code thật hiện tại, không suy đoán.

Phiên cần làm:
MOBILE-FIX-XXX — <TÊN PHIÊN>

Yêu cầu:
- chỉ làm đúng phạm vi phiên;
- không tự đổi stack;
- không viết lại module đã tốt;
- ưu tiên API generated bằng Orval;
- Backend là source of truth cho giá/tồn/checkout/payment;
- không tạo dữ liệu giả để che API thiếu;
- UI không được hiển thị text dev/AI;
- giữ naming convention hiện tại.

Sau khi sửa:
1. chạy lint;
2. chạy typecheck;
3. chạy test liên quan;
4. chạy build/runtime check phù hợp;
5. chạy git diff --check;
6. test Android nếu phiên liên quan Mobile runtime;
7. cập nhật docs/TRANG_THAI_DU_AN.md;
8. ghi rõ file đã sửa;
9. ghi lỗi/tồn đọng;
10. chỉ xác nhận hoàn thành nếu Definition of Done của phiên đạt.

Cuối cùng hãy báo:
- Đã làm gì
- File nào thay đổi
- Test nào đã chạy
- Test nào pass/fail
- Còn lỗi gì
- Phiên tiếp theo chính xác là gì
```

---

# 32. KẾT LUẬN

Nền móng Mobile AgriMarket hiện tại **không cần viết lại**. Hướng đúng là giữ:

```text
Expo
React Native
Expo Router
Orval
TanStack Query
Zustand
SecureStore
Design System
QR/Trace
Backend Cart
```

và hoàn thiện theo chuỗi:

```text
Environment
→ Auth/Navigation
→ Checkout
→ Payment
→ Order
→ Shipment
→ Review/Complaint
→ Account
→ Push
→ Home/Search semantics
→ UI polish
→ Test/CI
→ Security
→ Android acceptance
→ Final demo
```

Điểm quan trọng nhất là phải biến luồng hiện tại:

```text
Product
→ Cart
→ Checkout Preview
→ STOP
```

thành luồng thật:

```text
Product
→ Cart
→ Checkout
→ Address
→ Backend Preview
→ Create Order
→ Reserve Inventory
→ Payment
→ Order Detail
→ Shipment
→ Delivered
→ Review/Complaint
```

Khi toàn bộ `MOBILE-FIX-001` đến `MOBILE-FIX-025` hoàn thành và Definition of Done cuối cùng đều đạt, Mobile mới được coi là hoàn thiện.
