# AgriMarket Mobile App

> Tài liệu kỹ thuật authoritative cho ứng dụng khách hàng Mobile.
> Nội dung này được đồng bộ theo local repository sau MOBILE-FIX-001 → 021.

## 1. Runtime và stack

| Thành phần | Giá trị hiện tại |
|---|---|
| Node | `>=24 <25` |
| pnpm | `pnpm@11.24.0` |
| Expo | `~57.0.20` |
| React Native | `0.86.3` |
| React | `19.2.3` |
| Expo Router | `~57.0.19` |
| TanStack Query | `5.102.8` |
| Zustand | `5.0.15` |
| UniWind | `^1.11.0` |
| expo-image | `~57.0.4` |
| Android package | `com.agrimarket.mobile` |
| iOS bundle id | `com.agrimarket.mobile` |
| App scheme | `agrimarket` |

Mobile không gọi Backend bằng `fetch()` trực tiếp trong screen/adapters.
Contract chuẩn là:

```text
Nest Swagger/OpenAPI
→ OpenAPI JSON
→ Orval
→ @agrimarket/api-client
→ apps/mobile/src/lib/* adapters
→ TanStack Query
→ screens
```

Backend là nguồn sự thật cho cart, checkout, order, payment, shipment, profile, address, wishlist và follow farm.

## 2. Cấu hình API runtime

`EXPO_PUBLIC_API_BASE_URL` là URL Backend Mobile sử dụng.

| Môi trường | URL thường dùng |
|---|---|
| Chạy cùng máy / web | `http://127.0.0.1:3000` |
| Android emulator | `http://10.0.2.2:3000` |
| Android máy thật cùng LAN | `http://<LAN-IP-CUA-MAY-DEV>:3000` |

Backend local phải bind `0.0.0.0` nếu điện thoại/emulator cần truy cập qua LAN.

Ví dụ:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:3000 pnpm --filter @agrimarket/mobile start
```

## 2A. Expo Go + USB — cách chạy khuyến nghị

Đây là luồng phát triển hằng ngày đơn giản nhất trên Linux khi dùng điện thoại Android thật:

```text
Điện thoại thật + Expo Go
        │ USB debugging
        ├── tcp:8081 ──adb reverse──> Metro
        └── tcp:3000 ──adb reverse──> Nest API
                                      │
                                      └── @agrimarket/api-client
                                          (OpenAPI → Orval)
```

Chỉ cần cắm điện thoại, bật **USB debugging**, mở khóa màn hình và chạy từ root repo:

```bash
pnpm dev:mobile:usb
```

Lệnh này tự:

1. kiểm tra `adb` và điện thoại thật;
2. kiểm tra Expo Go đã được cài;
3. dùng API đang chạy hoặc khởi động Docker + Nest API;
4. cấu hình `adb reverse` cho `3000` và `8081`;
5. chạy Expo ở chế độ `--go --localhost`;
6. ép Mobile dùng `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000`;
7. gửi link Metro sang Expo Go.

Với luồng USB này không cần Android Studio, Gradle, NDK, Waydroid hoặc IP LAN của Wi-Fi.

> Expo Go dùng để xem và phát triển core app: Home, Search, Auth, Cart, Checkout,
> COD, Orders, Account, QR/camera và các API thông thường. Remote push/FCM production
> và một số acceptance native cuối cùng vẫn cần development/standalone build.

## 3. Lệnh phát triển

```bash
pnpm install
pnpm api-client:ensure
pnpm --filter @agrimarket/mobile start
```

Các lệnh Mobile:

```bash
pnpm --filter @agrimarket/mobile test
pnpm --filter @agrimarket/mobile e2e:validate
pnpm --filter @agrimarket/mobile ci:validate
pnpm --filter @agrimarket/mobile typecheck
pnpm --filter @agrimarket/mobile exec expo install --check
```

## 4. Navigation contract

### 5 tab chính

| Tab | Route |
|---|---|
| Trang chủ | `/` |
| Khám phá | `/kham-pha` |
| Quét QR | `/quet-qr` |
| Đơn hàng | `/don-hang` |
| Tài khoản | `/tai-khoan` |

Tab switching dùng `router.navigate()` thay vì push lặp stack.
`backBehavior="history"` giữ lịch sử tab trên Android.
Các màn con dùng `router.canGoBack()`; nếu deep link/cold launch không có history thì `replace()` về fallback hợp lý.

### Public / protected

**Public:** Home, Search/Explore, Product Detail, Farm Detail, QR/Trace.

**Protected:** Cart, Checkout, Order, Account screens.

App không force login toàn cục khi khởi động.
Protected route dùng `returnTo` đã validate; route ngoài app, protocol-relative URL, auth-route loop, backslash và control characters bị normalize về route an toàn.

## 5. Authentication

- Access token chỉ giữ trong memory.
- Refresh token lưu bằng SecureStore.
- Refresh là single-flight để tránh nhiều request refresh song song.
- Login/register giữ `returnTo` hợp lệ.
- Session-expired và logout có UX riêng.
- Logout revoke push device trước khi clear auth khi có thể.

## 6. Commerce

### Checkout

Checkout dùng server preview; giá, shipping và tổng thanh toán không lấy final value từ tính toán client.

Create Order gửi:

- `maYeuCau` idempotency key;
- `diaChiGiaoHangId` khi có;
- variant id;
- số lượng;
- `donGiaDuKien` để Backend validate price drift.

### COD

Flow:

```text
Create Order
→ Create COD Payment
→ Payment PENDING
→ clear/invalidate cart
→ Order Detail
```

Order/payment có idempotency riêng để retry payment không tạo duplicate order.

### VNPay Sandbox

Flow:

```text
Create Order
→ POST Payment VNPAY_SANDBOX
→ signed payment URL
→ system browser
→ Backend callback verify HMAC-SHA512
→ agrimarket://thanh-toan/ket-qua
→ Mobile gọi Payment Status
```

Mobile không tin `status` từ deep-link URL; trạng thái giao dịch được đọc lại từ Backend.

## 7. Order, shipment và after-sales

- Order Detail đọc Order + Payment + Shipment.
- Payment 404 là non-fatal cho order chưa có payment record.
- Shipment chưa tồn tại hiển thị empty state, không fake tracking.
- Review chỉ gửi theo eligibility Backend.
- Complaint có thể đính tối đa 5 ảnh, JPEG/PNG/WebP, mỗi ảnh tối đa 5 MiB.
- Không invent complaint workflow/status nếu Backend contract không có.

## 8. Account

Đã nối Backend cho:

- Profile;
- Address CRUD/default/delete;
- Wishlist list/remove;
- Followed Farms list/unfollow;
- Complaint list/detail;
- Push notification diagnostics/registration.

Không có fake loyalty/voucher API.

## 9. Search và Home semantics

Home chỉ hiển thị các semantics mà Backend thật sự hỗ trợ.
Không dùng client heuristic để gắn nhãn Organic/theo mùa/xếp hạng farm.

Search facets dùng endpoint Backend riêng cho toàn public universe thay vì suy ra facet từ một page 100 sản phẩm.

## 10. Push Notification

Mobile dùng Expo Notifications với device registration ở Backend.
Backend có:

- đăng ký device token;
- unregister;
- diagnostic send;
- Expo Push sender;
- xử lý `DeviceNotRegistered`;
- `NEW_HARVEST` producer với deep link farm.

### Production prerequisites

Push thực trên Android vẫn cần:

- EAS project/projectId đã link đúng;
- `google-services.json` cho Android;
- FCM V1 credential;
- Prisma migration push-device đã apply vào DB thật;
- development build / standalone build (không dựa vào Expo Go cho custom native push setup).

## 11. Performance

- TanStack Query dùng React Native `AppState` → `focusManager`.
- Query cache có bounded GC window.
- Product/Farm images dùng `expo-image` memory+disk cache.
- `recyclingKey` tránh ảnh cũ khi list recycle view.
- Wishlist và Followed Farms dùng `FlatList` với bounded render window.
- Search/Orders giữ server pagination, không render page vô hạn.

## 12. Test

### Unit / integration — MOBILE-FIX-019

```bash
pnpm --filter @agrimarket/mobile test
```

Coverage:

- auth `returnTo` security;
- safe navigation back/fallback;
- top-level tab navigation;
- generated HTTP response unwrap;
- OpenAPI critical operations;
- generated client contract;
- register DTO contract;
- navigation/performance architecture regression.

### E2E config — MOBILE-FIX-020

```bash
pnpm --filter @agrimarket/mobile e2e:validate
```

Maestro flows:

- cold launch;
- 5 tabs;
- Android tab Back history;
- guest protected Orders;
- custom scheme deep links.

Local real-device command khi đã cài Maestro và app:

```bash
pnpm --filter @agrimarket/mobile e2e:maestro
```

EAS cloud workflow:

```text
apps/mobile/.eas/workflows/e2e-test-android.yml
```

EAS E2E là manual trigger để không tự phát sinh build/device cost.

## 13. CI

GitHub Actions:

```text
.github/workflows/mobile-ci.yml
```

Runtime:

- Node 24;
- pnpm 11.24.0;
- `pnpm install --frozen-lockfile`;
- read-only repository permission;
- concurrency cancellation;
- 25-minute timeout.

CI gates:

```text
api-client:ensure
Mobile unit/contract tests
Mobile E2E config tests
Expo install compatibility
Mobile typecheck
repo lint
full workspace typecheck
git diff --check
```

CI không tự chạy EAS build/Maestro cloud và không yêu cầu Expo/Firebase secrets.

## 14. EAS profiles

`e2e-test` build profile tồn tại: `True`.

Android E2E profile build APK installable, không cần production signing credentials cho test.

## 15. Environment variables được phát hiện

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_ACCESS_TOKEN`
- `PAYMENT_PUBLIC_BASE_URL`
- `MOBILE_PAYMENT_RETURN_URL`
- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`

Không commit secret/credential thật vào repository.

## 16. Manual acceptance còn lại

Các phần sau được để đúng sang các session tiếp theo:

- MOBILE-FIX-023: Security Review;
- MOBILE-FIX-024: Android Acceptance trên device/emulator + build thật;
- MOBILE-FIX-025: Final Demo.

Đặc biệt 024 sẽ xác nhận:

- Android SDK/JDK/device thực tế;
- development/APK build;
- Maestro runtime nếu có;
- QR camera;
- push thật;
- VNPay callback/deep link trên build cài được;
- các luồng demo end-to-end với Backend dữ liệu thật.

## 17. Definition of Done cho developer

Trước khi mở PR liên quan Mobile:

```bash
pnpm api-client:ensure
pnpm --filter @agrimarket/mobile test
pnpm --filter @agrimarket/mobile e2e:validate
pnpm --filter @agrimarket/mobile ci:validate
pnpm --filter @agrimarket/mobile exec expo install --check
pnpm --filter @agrimarket/mobile typecheck
pnpm lint
pnpm typecheck
git diff --check
```

Không regenerate Orval tùy tiện trong CI; thay đổi OpenAPI phải generate/snapshot ở workflow phát triển có chủ đích rồi commit output.
