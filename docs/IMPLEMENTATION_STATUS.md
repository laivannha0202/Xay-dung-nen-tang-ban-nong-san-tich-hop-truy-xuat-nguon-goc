# Trạng thái triển khai

Cập nhật: 2026-11-17. Báo cáo nghiệm thu từng mã yêu cầu: `docs/FINAL_ACCEPTANCE_REPORT.md`.

## Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| PostgreSQL nhúng 18.6 (UTF8, cổng 5544) | `scripts/db.mjs` |
| 41 bảng + seed dữ liệu thật | `apps/api/migrations/001_init.sql`, `src/scripts/seed.ts` |
| 105 route API dưới `/api/v1` | `src/routes/{auth,public,customer,admin,adminOps,uploads}.ts` |
| PDF truy xuất font tĩnh Roboto | `src/services/tracePdf.ts` |
| **Tách đôi website**: `apps/customer-web` (:3000, 20 route) và `apps/admin-web` (:3001, 18 route + `/dang-nhap`) | `npx next build` cả hai exit 0 |
| **Gói dùng chung** `@agrimarket/core` (types/format/client) và `@agrimarket/ui` (token/primitives) | `packages/core`, `packages/ui` |
| Ứng dụng Expo 5 tab + quét QR, dùng chung `@agrimarket/core` | `apps/customer-mobile`, `src/format.ts`/`src/types.ts` chỉ re-export |
| 20/20 test tích hợp | `cd apps/api && npx vitest run` |
| Typecheck cả 6 gói | `pnpm -r typecheck` → Done × 6 |
| Kịch bản demo 10 bước chạy thật | `docs/demo-script.md`, `docs/screenshots/` |

## P2 đã làm

- FEFO qua `settings.allocation_strategy`, đổi được ở `/admin/cai-dat`.
- Giảm giá theo đúng khối lượng lấy từ lô cận hạn (`batch_promotions`), hiển thị từng phần trong báo giá.
- PDF truy xuất theo lô (`GET /t/:token/pdf`).

## P2/P3 chưa làm (đúng phạm vi P1)

Blockchain, IoT, QR từng gói, 2FA, cổng thanh toán/giao vận thật, email/SMS, đa kho liên thông, gộp/tách lô, Flash Sale nhiều tầng, chatbot. Xem §11 của `docs/PROMPT_XAY_DUNG_MOI_AGRIMARKET_FULLSTACK_TU_DAU.md`.

## Đợt nghiệm thu cuối (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Giỏ khách chưa đăng nhập, gộp vào giỏ server sau login | `components/cart-provider.tsx` (`agri.guest-cart.v1`), kiểm bằng trình duyệt |
| Hồ sơ khách sửa được (web + app) | `components/profile-form.tsx`, `ProfileScreen` trong `screens3.tsx` |
| Khiếu nại từ trang tem QR và từ chi tiết đơn (app) | `components/complaint-from-trace.tsx`, `screens.tsx` |
| Đánh giá + khiếu nại + hồ sơ trong app | `apps/customer-mobile/src/screens3.tsx` |
| Lọc giá ở `/san-pham`, lọc ngày ở dashboard và đơn của khách | `apps/customer-web/app/san-pham/page.tsx`, `apps/admin-web/app/admin/page.tsx`, `/tai-khoan/don-hang/page.tsx` |
| Upload hồ sơ nông trại + quản lý ảnh sản phẩm | `apps/admin-web/components/admin-kit.tsx` (`Uploader`), `components/product-images.tsx` |
| Sửa lỗi mốc ngày UTC→ICT và tham số `POST /admin/evidence` | `src/services/invariants.ts`, `src/routes/uploads.ts` |
| Khiếu nại hiện trên chi tiết lô, có link sang đợt thu hồi | `apps/admin-web/app/admin/lo-hang/[id]/page.tsx`, `adminOps.ts` (`recall_id`) |

## Đợt tách website (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Xoá `apps/web`, chuyển toàn bộ cây quản trị sang `apps/admin-web/app/admin/*`, cửa hàng sang `apps/customer-web/app/*` | `git status` shows renames |
| Shell quản trị mới: sidebar nhóm, drawer di động, header lấy tiêu đề từ nav, đăng xuất | `apps/admin-web/components/admin-shell.tsx` |
| Trang đăng nhập/403 nằm ngoài thư mục được bảo vệ → hết vòng lặp redirect | `app/dang-nhap`, `app/khong-co-quyen` |
| Đăng nhập bằng tài khoản ADMIN ở cửa hàng chuyển sang `${ADMIN_WEB}/admin` | `apps/customer-web/app/dang-nhap/page.tsx` |
| Trang lỗi/loading/not-found + icon riêng cho từng site | `app/{error,loading,not-found}.tsx`, `app/icon.svg` |
| Hộp thoại nhập lý do thay `window.prompt` (kiểm thử tự động chạy được) | `apps/admin-web/components/admin-kit.tsx` (`Act` + `Modal`) |
| Dòng thời gian đơn của khách lấy mốc thật từ `placed_at`/`shipment.*`/`updated_at` | `apps/customer-web/app/tai-khoan/don-hang/[id]/page.tsx` |
| API từ chối khách gọi endpoint quản trị | `curl -b ck.txt /admin/orders` → `403`, `/admin/dashboard` → `403` |
| Luồng mua trọn vẹn: giỏ khách → đăng nhập → thanh toán → Admin xác nhận → xuất kho → giao → hoàn tất + ghi thanh toán | đơn `AGM-2026-0005` (`a17825b0-…`), ảnh `c*/a*` trong `docs/screenshots/` |

## Đợt nâng cấp giao diện (2026-11-17)

| Hạng mục | Bằng chứng |
|---|---|
| Bỏ hẳn `leaf-`/`clay-` khỏi hai website | `grep -rn "leaf-\|clay-" apps/admin-web apps/customer-web` → rỗng |
| `Tone` dùng chung thêm `brand` | `packages/core/src/status.ts` |
| 18 trang quản trị đồng bộ `PageHeader`/`Kpi`/`table-base`/`StatusPill`/`EmptyState` | `apps/admin-web/app/admin/**` |
| Bảng điều khiển có thêm bảng "Đơn hàng gần đây" (gọi song song `/admin/orders`) | `apps/admin-web/app/admin/page.tsx` |
| Thanh toán 3 bước có số thứ tự, bảng phân bổ lô, `Badge` mã giảm giá | `apps/customer-web/components/checkout-flow.tsx` |
| 3 trang chính sách thay cho 3 link chết ở footer | `apps/customer-web/app/chinh-sach/[slug]/page.tsx` |
| Ứng dụng di động dùng `Screen`/`SectionLabel`/`KpiTile`/`EmptyState`/`Divider` | `apps/customer-mobile/src/ui.tsx` |
| `CartItem` bổ sung `slug`/`image` đúng như `GET /me/cart` trả về | `apps/customer-mobile/src/cart.tsx` |

## Việc còn hở (không chặn P1)

| Việc | Ghi chú |
|---|---|
| Chưa kiểm trên thiết bị/emulator | Máy này không có `adb`, `emulator`, `java`, `docker`; `ANDROID_HOME` rỗng. `cd apps/customer-mobile && npx expo start --android` không chạy được. Toàn bộ kiểm thử ứng dụng dùng Metro Web. |
| Tem QR chưa ghép sẵn thông tin lô | `GET /admin/batches/:id/qr.png` chỉ trả ảnh QR; tên lô/hạn dùng nằm ở bảng cạnh nút tải (ADM-06-02). |
| Hoàn tiền tự động khi huỷ đơn đã thanh toán | Luồng Admin (`/admin/refunds`) đã kiểm; nhánh tạo RefundRequest ngay lúc khách huỷ chưa chạy thử. |
| Upload tệp chưa có test tự động | Đã kiểm thủ công: `POST /uploads` + `/admin/evidence` hoạt động sau khi sửa lỗi tham số. |
| Không có URL/deep link ở bản web của ứng dụng di động | Hệ quả ADR-07 (không dùng `expo-router`). Điều hướng bằng state. |
| Phiên bản web của ứng dụng lưu token ở `localStorage` | `expo-secure-store` không có bản web; xem `ponytail:` trong `src/storage.ts`. |

## Lệnh kiểm tra nhanh

```bash
node scripts/db.mjs up
pnpm db:migrate && pnpm db:seed
pnpm test           # 20 passed
pnpm typecheck      # 6 gói sạch
pnpm build          # next build ×2 + tsc
```
