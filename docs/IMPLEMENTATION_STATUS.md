# Trạng thái triển khai

Cập nhật: 2026-11-17. Báo cáo nghiệm thu từng mã yêu cầu: `docs/FINAL_ACCEPTANCE_REPORT.md`.

## Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| PostgreSQL nhúng 18.6 (UTF8, cổng 5544) | `scripts/db.mjs` |
| 41 bảng + seed dữ liệu thật | `apps/api/migrations/001_init.sql`, `src/scripts/seed.ts` |
| 105 route API dưới `/api/v1` | `src/routes/{auth,public,customer,admin,adminOps,uploads}.ts` |
| PDF truy xuất font tĩnh Roboto | `src/services/tracePdf.ts` |
| Website khách + quản trị (43 route) | `apps/web/app`, `pnpm --filter @agrimarket/web build` exit 0 |
| Ứng dụng Expo 5 tab + quét QR + Đánh giá/Khiếu nại/Hồ sơ | `apps/customer-mobile`, `npx tsc --noEmit` exit 0 |
| 20/20 test tích hợp | `cd apps/api && npx vitest run` |
| Kịch bản demo 10 bước chạy thật | `docs/demo-script.md`, `docs/screenshots/` |
| Typecheck cả 3 gói | `pnpm typecheck` → Done × 3 |

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
| Huỷ đơn, chip lọc trạng thái, kéo để làm mới trong app | `apps/customer-mobile/src/screens.tsx` |
| Lọc giá ở `/san-pham`, lọc ngày ở dashboard và đơn của khách | `apps/web/app/san-pham/page.tsx`, `/admin/page.tsx`, `/tai-khoan/don-hang/page.tsx`, `GET /me/orders?from&to` |
| Upload hồ sơ nông trại + quản lý ảnh sản phẩm | `components/admin-kit.tsx` (`Uploader`), `components/product-images.tsx` |
| Sửa lỗi mốc ngày UTC→ICT và tham số `POST /admin/evidence` | `src/services/invariants.ts`, `src/routes/uploads.ts` |
| Khiếu nại hiện trên chi tiết lô, có link sang đợt thu hồi | `apps/web/app/admin/lo-hang/[id]/page.tsx`, `adminOps.ts` (`recall_id`) |

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
pnpm typecheck      # 3 gói sạch
pnpm build          # next build + tsc
```
