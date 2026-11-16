# Trạng thái triển khai

Cập nhật: 2026-11-16.

## Đã xong

| Hạng mục | Bằng chứng |
|---|---|
| PostgreSQL nhúng 18.6 (UTF8, cổng 5544) | `scripts/db.mjs` |
| 41 bảng + seed dữ liệu thật | `apps/api/migrations/001_init.sql`, `src/scripts/seed.ts` |
| 105 route API dưới `/api/v1` | `src/routes/{auth,public,customer,admin,adminOps,uploads}.ts` |
| PDF truy xuất font tĩnh Roboto | `src/services/tracePdf.ts` |
| Website khách + quản trị (43 route) | `apps/web/app`, `pnpm --filter @agrimarket/web build` exit 0 |
| Ứng dụng Expo 5 tab + quét QR | `apps/customer-mobile`, `npx tsc --noEmit` exit 0 |
| 20/20 test tích hợp | `cd apps/api && npx vitest run` |
| Kịch bản demo 10 bước chạy thật | `docs/demo-script.md`, `docs/screenshots/` |
| Typcheck cả 3 gói | `pnpm typecheck` |

## P2 đã làm

- FEFO qua `settings.allocation_strategy`, đổi được ở `/admin/cai-dat`.
- Giảm giá theo đúng khối lượng lấy từ lô cận hạn (`batch_promotions`), hiển thị từng phần trong báo giá.
- PDF truy xuất theo lô (`GET /t/:token/pdf`).

## P2/P3 chưa làm (đúng phạm vi P1)

Blockchain, IoT, QR từng gói, 2FA, cổng thanh toán/giao vận thật, email/SMS, đa kho liên thông, gộp/tách lô, Flash Sale nhiều tầng, chatbot. Xem §11 của `docs/PROMPT_XAY_DUNG_MOI_AGRIMARKET_FULLSTACK_TU_DAU.md`.

## Việc còn hở (không chặn P1)

| Việc | Ghi chú |
|---|---|
| Upload tệp chưa có test tự động | Đã kiểm thủ công; route `POST /uploads` + `/admin/evidence` hoạt động. |
| Không có URL/deep link ở bản web của ứng dụng di động | Hệ quả ADR-07 (không dùng `expo-router`). Điều hướng bằng state. |
| Phiên bản web của ứng dụng lưu token ở `localStorage` | `expo-secure-store` không có bản web; xem `ponytail:` trong `src/storage.ts`. |
| Chưa chạy trên thiết bị thật | Kiểm qua Metro web (`expo start --web`) ở khung 390 px. |

## Lệnh kiểm tra nhanh

```bash
node scripts/db.mjs up
pnpm db:migrate && pnpm db:seed
pnpm test           # 20 passed
pnpm typecheck      # 3 gói sạch
pnpm build          # next build + tsc
```
