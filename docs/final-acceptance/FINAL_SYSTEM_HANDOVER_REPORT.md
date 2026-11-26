# FINAL_SYSTEM_HANDOVER_REPORT — Bàn giao hệ thống AgriMarket

Ngày: 2026-11-26 (bổ sung đợt 2) · Nhánh `feat/premium-visual-redesign-v5` · Mốc so sánh `8da6b41`, đợt trước `0db5436`
Trạng thái thiết bị thật: **OWNER UAT REQUIRED** (camera QR, trình xem/chia sẻ PDF)

## 1. Hệ thống gồm những gì

| Thành phần | Công nghệ | Cổng | Thư mục |
|---|---|---|---|
| API | Fastify + PostgreSQL | 4000 | `apps/api` |
| Website khách | Next.js 15 (App Router) | 3000 | `apps/customer-web` |
| Trang quản trị | Next.js 15 | 3001 | `apps/admin-web` |
| Ứng dụng khách (native) | Expo / React Native | Expo Go | `apps/customer-mobile` |
| Gói dùng chung | TypeScript | — | `packages/core`, `packages/ui` |
| Cơ sở dữ liệu nhúng | PostgreSQL 17 (cổng 5544) | — | `infra/pgdata` |

Dữ liệu nghiệp vụ nằm duy nhất trong PostgreSQL. Ba giao diện khách (web, mobile) và trang quản trị đọc/ghi qua cùng một API, nên số liệu không bao giờ lệch nguồn.

## 2. Đợt này đã làm gì

### 2.1 Chống trùng đơn ở API (`apps/api/src/routes/customer.ts`)

Vấn đề cũ: bấm đặt hàng hai lần, hoặc mất mạng rồi bấm thử lại, có thể sinh hai đơn và trừ tồn hai lần.

Cách làm mới: khoá chống trùng được **giữ chỗ trước**, ngay trong cùng giao dịch với việc tính giá và giữ tồn.

- Khoá trùng: `INSERT … ON CONFLICT (customer_id, key) DO NOTHING` — bên thua không làm gì được nữa.
- Nội dung đơn khác với khoá đã dùng → `409 IDEMPOTENCY_MISMATCH`.
- Khoá đang được xử lý → `409 IN_PROGRESS` (máy khách chờ rồi tra cứu lại).
- Đơn đã tạo xong → `200` kèm đúng đơn cũ (`idempotent: true`).
- Đơn tạo mới → `201` (`idempotent: false`).
- Mọi phản hồi đều trả `order_id, code, status, payment_status` — lấy lại từ bảng `orders`, không lắp từ biến trong giao dịch, nên không còn trường hợp mã đơn rỗng.
- Request bị từ chối (giá đổi, hết hàng, voucher hết lượt) **cuộn lại cả khoá**: lần thử sau dùng lại đúng khoá đó vẫn được.

Thêm `GET /orders/by-request/:key` để máy khách hỏi "đơn của tôi đã tạo chưa" khi không biết kết quả.

### 2.2 Máy khách xử lý tình huống không rõ kết quả

Cả web (`apps/customer-web/components/checkout-flow.tsx`) và mobile (`apps/customer-mobile/src/screens.tsx`):

- Mất mạng, lỗi 5xx, hoặc `IN_PROGRESS` → **không** đặt lại; gọi `GET /orders/by-request/:key` rồi mở đơn nếu đã có.
- `PRICE_CHANGED` → hiện báo giá mới, khoá nút cho tới khi xem lại.
- `PROMOTION_EXPIRED` → gỡ mã, xin khoá mới.
- `OUT_OF_STOCK` → báo rõ dòng hàng không còn.
- Nút đặt hàng bị khoá trong suốt thời gian gửi.

Mobile có thêm mã lỗi `NETWORK` (trạng thái 0) để phân biệt mất mạng với lỗi nghiệp vụ.

### 2.3 Ứng dụng khách: ba màn hình tài khoản tách riêng

| Màn hình | Tệp | Việc làm được |
|---|---|---|
| Hồ sơ cá nhân | `apps/customer-mobile/src/screens3.tsx` | Sửa tên, điện thoại; email chỉ đọc; lưu xong làm mới ngữ cảnh đăng nhập để tên hiện đúng mọi nơi |
| Địa chỉ giao hàng | cùng tệp | Thêm, sửa, xóa (có hỏi lại), đặt mặc định; chọn xã/phường Hưng Yên bằng `WardPicker` |
| Đăng nhập & bảo mật | cùng tệp | Đổi mật khẩu (≥ 8 ký tự, khác mật khẩu cũ), nhận ngay token mới, đăng xuất có cảnh báo khi mất mạng |

Menu tài khoản tách thành 8 mục theo từng chức năng (`apps/customer-mobile/src/screens2.tsx`); tuyến mới khai báo ở `apps/customer-mobile/src/nav.ts` và nối ở `apps/customer-mobile/src/screens.tsx`.

### 2.4 Ứng dụng khách: chi tiết đơn và mua lại

- Bảng tiền tách rõ: tiền hàng, giảm lô cận hạn, giảm voucher, phí ship, tổng, đã trả, còn phải trả.
- Dùng chung `discountSplit()` và `codDue()` với web (`packages/core/src/format.ts`), không viết lại công thức.
- Hoàn tiền: chỉ ghi *Đã hoàn* khi trạng thái `COMPLETED`.
- Lý do hủy, thông tin vận chuyển hiện khi có.
- **Mua lại**: gọi `/me/orders/:id/reorder`, đổ vào giỏ theo **giá hiện tại**, báo rõ dòng nào bị bỏ qua và vì sao.
- Danh sách đơn có lọc theo khoảng ngày (chặn nhập sai dạng `YYYY-MM-DD`), thanh trạng thái cuộn ngang thay vì xuống dòng.

### 2.5 Khiếu nại

- Danh sách bấm được sang chi tiết.
- Màn chi tiết mới: nội dung, kết quả xử lý, toàn bộ trao đổi, ô trả lời chỉ hiện khi khiếu nại còn mở.
- Nhãn trạng thái sửa cho khớp ràng buộc CSDL: `NEW` / `PROCESSING` / `RESOLVED` / `CLOSED` (trước đó dùng `OPEN`/`IN_PROGRESS`/`REJECTED` — những giá trị không tồn tại trong CSDL).

### 2.6 Gói dùng chung

`packages/core/src/types.ts` — kiểu `Order` bổ sung các trường có thật trong phản hồi API: `promotion_snapshot`, `cancel_reason`, `payment`, `shipment`, `refunds`.

## 3. Kiểm thử đã chạy (kết quả nguyên văn)

| Lệnh | Kết quả |
|---|---|
| `pnpm test` | `Test Files 19 passed (19)`, `Tests 122 passed (122)` |
| `npx vitest run test/16-checkout-races.test.ts` | 6/6 (6 test mới) |
| `npx vitest run test/15-checkout-idempotency.test.ts` | 7/7 |
| `pnpm verify:local` | `10/10 checks passed` — env, postgresql, test database (14 migrations), typecheck, api tests, admin build, customer build, expo typecheck, expo export, secret scan (1177 tệp sạch) |
| `pnpm e2e:local` | `10/10 steps passed` — đơn `AGM-2026-0172`, 104 dòng xã/phường, biểu đồ 14 ngày |
| `pnpm acceptance` | `38/38 steps passed` |
| `pnpm -r typecheck` | sạch ở `packages/core`, `apps/api`, `apps/customer-web`, `apps/admin-web`, `apps/customer-mobile` |
| Expo export (web) | thành công, `.verify/expo-web` |

Sáu test mới trong `apps/api/test/16-checkout-races.test.ts` — mô phỏng thao tác thật của người mua khi màn hình thanh toán còn đang được sửa:

1. Chọn voucher A rồi đổi sang B, A trả lời sau B → đơn mang đúng voucher B đã chọn, đúng tổng tiền.
2. Đổi địa chỉ và đổi giá giữa lúc báo giá → `409 PRICE_CHANGED`; báo giá lại rồi đặt thì đơn lưu đúng địa chỉ mới.
3. Áp rồi bỏ voucher liên tục 5 lần → trạng thái cuối đúng, báo giá không voucher luôn có giảm giá bằng 0, cùng nội dung tiền thì cùng `version`.
4. Mất phản hồi của lần tạo đơn → tra `by-request` thấy đơn, gửi lại mù vẫn `200` và chỉ một đơn.
5. Ngoại tuyến giữa lúc tính lại giá → xác nhận bằng báo giá cũ bị từ chối kèm báo giá mới trong phản hồi.
6. Hai tab cùng một khoá → `[200, 201]`, cùng mã đơn; đổi nội dung thì `409 IDEMPOTENCY_MISMATCH` và vẫn chỉ một đơn.

Không dùng `setTimeout`/chờ thật: các bước chạy song song bằng `Promise.all` hoặc chờ tuần tự, nên kết quả không phụ thuộc tốc độ máy.

## 3b. Đợt 2026-11-26 — môi trường và phần còn thiếu của ứng dụng

### 3b.1 Vì sao điện thoại không có dữ liệu (đã sửa)

`apps/customer-mobile/.env` ghim `192.168.100.226`, trong khi máy phát triển đang ở `172.30.255.71` / `10.21.164.70`. Ứng dụng gọi API tới một máy không tồn tại nên mọi danh sách rỗng.

Bỏ mọi địa chỉ ghim cứng:

- `src/api.ts`, `src/nav.ts`: địa chỉ API và website suy ra từ chính máy chủ Expo đã phục vụ gói ứng dụng (`Constants.expoConfig.hostUri`). Điện thoại tải được ứng dụng từ máy nào thì gọi được API ở máy đó.
- `app.json`: xóa khối `extra.apiBase` / `extra.webBase` (trước là `127.0.0.1`).
- `.env`: chỉ còn dòng ghi chú cho trường hợp API chạy ở máy khác.

VPN không liên quan: `vpn.nha.name.vn` phân giải DNS bình thường; lỗi `ENOTFOUND` trước đó là bản ghi cũ.

### 3b.2 Ứng dụng: bốn tính năng trước đây chỉ có trên web

| Tính năng | Tệp | Nội dung |
|---|---|---|
| Bộ lọc sản phẩm | `src/home.tsx` | Bottom-sheet: chip danh mục, giá tối thiểu/tối đa, chỉ còn hàng; 5 kiểu sắp xếp; chip điều kiện đang áp dụng bỏ được từng cái; phân trang 24 sản phẩm; dùng tham số `/products` sẵn có |
| Yêu thích | `src/memory.ts`, `src/home.tsx`, `src/screens.tsx` | Tim trên thẻ và trên thanh mua; màn *Sản phẩm yêu thích* giữ đúng thứ tự đã lưu, tự bỏ sản phẩm ngừng bán |
| Đã xem gần đây | `src/memory.ts`, `src/screens.tsx` | 12 sản phẩm gần nhất, ghi khi mở chi tiết |
| Phiếu PDF | `src/screens.tsx` | *Mở phiếu PDF* (`Linking`) và *Chia sẻ phiếu PDF* (`Share`) tới `/t/:token/pdf` |

Yêu thích và đã xem dùng **đúng khoá lưu của web** (`agri.favourites.v1`, `agri.viewed.v1`) nên hai bên cùng định dạng; dữ liệu vẫn theo từng máy, không thêm bảng, không có dữ liệu cá nhân.

### 3b.3 Nhận diện thương hiệu

`apps/customer-mobile/src/ui.tsx`: thêm `BrandLogo` dùng chính `assets/icon.png` đã phát hành. Màn khởi động và header dùng logo này thay biểu tượng lá tạm.

### 3b.4 Tệp thay đổi trong đợt

| Tệp | Nội dung |
|---|---|
| `apps/customer-mobile/src/api.ts`, `src/nav.ts` | Suy ra địa chỉ API/website theo máy chủ Expo; thêm tuyến `saved` |
| `apps/customer-mobile/src/memory.ts` | Mới: yêu thích + đã xem, dùng chung khoá với web |
| `apps/customer-mobile/src/home.tsx` | Bộ lọc, sắp xếp, phân trang, tim, màn `SavedScreen` |
| `apps/customer-mobile/src/screens.tsx` | Ghi sản phẩm đã xem, tim ở thanh mua, nút PDF |
| `apps/customer-mobile/src/ui.tsx`, `App.tsx` | `BrandLogo` |
| `apps/customer-mobile/app.json`, `.env` | Bỏ địa chỉ ghim cứng |
| `apps/api/test/16-checkout-races.test.ts` | Mới: 6 test tình huống đổi lựa chọn khi thanh toán |

## 4. Tệp đã thay đổi

| Tệp | Dòng thêm / bớt | Nội dung |
|---|---|---|
| `apps/api/src/routes/customer.ts` | +53 / −31 | Giữ chỗ khoá trước, hợp đồng phản hồi thống nhất, `by-request` một định nghĩa |
| `apps/api/test/15-checkout-idempotency.test.ts` | mới | 7 test chống trùng đơn |
| `apps/customer-web/components/checkout-flow.tsx` | +41 / −6 | Vòng đời khoá, tra cứu khi không rõ kết quả |
| `apps/customer-mobile/src/screens.tsx` | +234 / −22 | Chi tiết đơn đầy đủ, mua lại, lọc ngày, thanh toán |
| `apps/customer-mobile/src/screens3.tsx` | +360 / −75 | Hồ sơ, sổ địa chỉ, bảo mật, chi tiết khiếu nại |
| `apps/customer-mobile/src/screens2.tsx` | +5 / −3 | Menu 8 mục |
| `apps/customer-mobile/src/auth.tsx` | +16 / −1 | `refresh()`, `adoptToken()` |
| `apps/customer-mobile/src/api.ts` | +11 / −5 | Mã lỗi `NETWORK` |
| `apps/customer-mobile/src/ui.tsx` | +6 / −2 | `Field` cho phép chỉ đọc |
| `apps/customer-mobile/src/format.ts` | +4 / −1 | Xuất lại các hàm tiền dùng chung |
| `apps/customer-mobile/src/nav.ts` | +3 | Ba tuyến mới |
| `packages/core/src/types.ts` | +6 | Kiểu `Order` đầy đủ |
| `docs/final-acceptance/FINAL_*` | mới | 4 tài liệu bàn giao |

## 5. Những gì CỐ Ý không làm

- **Không** thêm cổng thanh toán trực tuyến. Hệ thống chỉ ghi nhận COD và chuyển khoản xác nhận thủ công — đúng phạm vi đã chốt.
- **Không** tích hợp đơn vị vận chuyển; mã vận đơn do người dùng nhập.
- **Không** đổi chính sách: ship 20.000₫, miễn phí từ 500.000₫; mỗi đơn một voucher; lượt dùng voucher không hoàn khi hủy đơn.
- **Không** xóa hay sửa dữ liệu tài chính lịch sử.
- **Không** chạy được kiểm thử trên máy thật iOS/Android trong môi trường này → ghi `BLOCKED — DEVICE UAT REQUIRED`, không tuyên bố đạt.

## 6. Ba việc cần làm khi nhận bàn giao

1. **Chạy `FINAL_OWNER_UAT_CHECKLIST.md`** với người thật, điền cột *Kết quả thực tế* và *Trạng thái*. Đây là điều kiện nghiệm thu duy nhất còn thiếu.
2. **Cài thử trên một máy Android và một máy iPhone thật** (`NATIVE_TESTING_GUIDE.md`), đặc biệt các luồng cần quyền: quét camera, thông báo lỗi mạng.
3. **Sao lưu cơ sở dữ liệu** theo `BACKUP_RESTORE_GUIDE.md` trước khi đưa vào dùng thật.

## 7. Cách khởi động lại toàn bộ

```bash
node scripts/db.mjs up          # PostgreSQL nhúng, cổng 5544 (nếu báo lock file: máy chủ đã chạy, kiểm tra kết nối thay vì chạy lại)
pnpm api                        # API :4000
pnpm shop                       # website khách :3000
pnpm admin                      # quản trị :3001
pnpm mobile                     # Expo, quét QR bằng điện thoại
```
**Đợt 2026-11-26:** `node scripts/db.mjs up`, `pnpm api`, `pnpm shop`, `pnpm admin`, rồi `pnpm mobile`. Điện thoại cùng mạng Wi-Fi với máy tính; không cần cấu hình địa chỉ IP ở đâu cả. Nếu API chạy ở máy khác, mở `apps/customer-mobile/.env` và bỏ ghi chú dòng `EXPO_PUBLIC_API_BASE`.

Kiểm tra API sống: `curl http://<IP-máy-tính>:4000/api/v1/health`.

Tài khoản: khách `khach1@example.com` / `Khach@123456`; quản trị `admin@agrimarket.vn` / `Admin@123456`.
