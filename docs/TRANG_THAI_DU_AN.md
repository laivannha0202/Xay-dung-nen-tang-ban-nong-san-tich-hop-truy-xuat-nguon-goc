# TRẠNG THÁI DỰ ÁN AGRIMARKET

> File này phải được cập nhật sau mỗi phiên AI.

## Cập nhật gần nhất

29/08/2026

## Trạng thái tổng thể

```text
Giai đoạn: Giai đoạn 2 – Database và nền tảng Backend
Tiến độ code thực tế: 4 ứng dụng foundation + FE client + Prisma + Auth + RBAC + Audit + File/MinIO đã sẵn sàng
Tài liệu phân tích: Đã có
Stack công nghệ: Đã chốt
Quy ước code: Đã chốt
```

## Phiên vừa hoàn thành

**PHIEN-015 – Upload file**

Đã thiết lập:

- module `tep-tin` dùng AWS S3 SDK v3;
- MinIO local private bucket;
- tương thích S3 thật qua cấu hình endpoint/credential;
- upload multipart;
- metadata MySQL `tep_tin`;
- MIME validation bằng magic bytes;
- giới hạn 5 MiB ở Multer + service;
- chỉ hỗ trợ JPEG/PNG/WebP/PDF;
- object key ngẫu nhiên, không dùng tên file người dùng;
- SHA-256 metadata;
- signed URL xem và tải xuống, TTL ngắn;
- chủ file hoặc Admin mới truy cập/xóa;
- delete soft metadata + xóa object;
- upload/delete ghi Audit;
- upload S3 nhưng DB/Audit lỗi sẽ xóa bù object;
- bucket không bật public-read;
- E2E dùng MinIO thật;
- Swagger/OpenAPI + Orval đã cập nhật file API.

## Phiên tiếp theo

**PHIEN-016 – Redis + BullMQ nền tảng**

Mục tiêu:

```text
Redis connection
BullMQ
email queue
notification queue
system-job queue
worker foundation
```

PHIEN-016 chỉ dựng queue/cache foundation, chưa chuyển toàn bộ nghiệp vụ sang job.

## Đã hoàn thành

### Phân tích

- [x] Tên đề tài
- [x] 3 Actor
- [x] Yêu cầu chức năng
- [x] Yêu cầu phi chức năng
- [x] UML
- [x] Thiết kế Android
- [x] Thiết kế Customer Web
- [x] Thiết kế Admin Web
- [x] Stack công nghệ
- [x] Quy ước code tiếng Việt

### Repository

- [x] GitHub repository
- [x] `.gitignore`
- [x] Script cập nhật GitHub
- [x] Script tạo bối cảnh cho GPT
- [x] `docs/BOI_CANH_DU_AN_CHO_GPT.md`
- [x] Bộ tài liệu điều phối AI
- [x] Skeleton Monorepo
- [x] pnpm workspace

## Chưa làm

### Foundation

- [x] Monorepo đã xác nhận bằng `pnpm install`
- [x] ESLint chung
- [x] Prettier chung
- [x] TypeScript config chung
- [x] Docker Compose

### Applications

- [x] NestJS Backend
- [x] Customer Web
- [x] Admin Web
- [x] Mobile Expo

### Backend

- [x] Prisma
- [x] MySQL schema
- [x] Swagger
- [x] Auth
- [x] RBAC
- [x] Audit
- [x] File upload
- [ ] Redis/BullMQ

### Nghiệp vụ

- [ ] Nhà cung cấp
- [ ] Trang trại
- [ ] Chứng nhận
- [ ] Mùa vụ
- [ ] Thu hoạch
- [ ] Lô
- [ ] Kiểm định
- [ ] QR
- [ ] Truy xuất
- [ ] Sản phẩm
- [ ] Kho
- [ ] Tồn kho
- [ ] FEFO
- [ ] Giỏ hàng
- [ ] Checkout
- [ ] Đơn hàng
- [ ] Thanh toán
- [ ] Giao hàng
- [ ] Đánh giá
- [ ] Khiếu nại
- [ ] Hoàn tiền

## Stack hiện tại

```text
Node.js 24 LTS
pnpm
TypeScript

Backend:
NestJS + Prisma + MySQL

Customer Web:
Next.js + Mantine

Admin:
Next.js + Ant Design ProComponents

Mobile:
Expo + React Native + gluestack-ui

API:
REST + Swagger/OpenAPI

FE API:
Orval + TanStack Query
```

## Quyết định phải giữ

- Chỉ 3 Actor.
- Modular Monolith.
- MySQL.
- Prisma.
- REST.
- Swagger/OpenAPI.
- Customer Web dùng Mantine.
- Admin dùng Ant Design ProComponents.
- Mobile dùng gluestack-ui.
- TypeScript strict.
- Code nghiệp vụ tiếng Việt không dấu.
- Backend là nguồn sự thật của giá/tồn/FEFO/thanh toán.

## Lỗi/tồn đọng hiện tại

Không có lỗi source PHIEN-015.

Bucket file mặc định private; API cấp signed URL ngắn hạn thay vì public bucket.
Public asset chỉ nên được mở khi module nghiệp vụ cụ thể có yêu cầu rõ ràng.

Delete đánh dấu metadata `NGUNG_HOAT_DONG` và ghi Audit trước, sau đó xóa object.
Nếu object cleanup thất bại tạm thời, file vẫn không còn truy cập được qua API và
có thể được worker cleanup lại ở PHIEN-016+.

PHIEN-016 tiếp theo là Redis + BullMQ nền tảng.

## Lệnh chạy hiện tại

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format
pnpm format:check

# Backend
pnpm --filter @agrimarket/api start:dev

# Refresh OpenAPI snapshot (Backend phải đang chạy ở :3000)
pnpm api-client:snapshot

# Generate/ensure FE client
pnpm api-client:generate
pnpm api-client:ensure

# Frontend
pnpm --filter @agrimarket/customer-web dev   # :3001
pnpm --filter @agrimarket/admin-web dev      # :3002
pnpm --filter @agrimarket/mobile start
```

## Test hiện tại

PHIEN-015 đã chạy thành công:

```text
MinIO health thật
migration tep_tin
upload không auth -> 401
upload PNG thật -> 201
magic MIME validation
MIME giả mạo -> 415
file > 5 MiB bị chặn
SHA-256 metadata
object key không dùng filename
chủ file đọc metadata được
user khác -> 403
signed URL xem tải object MinIO thật
signed URL download có attachment
upload ghi Audit
delete ghi Audit
delete -> metadata API 404
delete -> signed URL cũ trả 404
OpenAPI multipart contract
Orval generated file client
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
git diff --check
```

## Quy tắc cập nhật file này

Sau mỗi phiên phải sửa:

```text
Phiên vừa hoàn thành
Phiên tiếp theo
Danh sách hoàn thành
Chưa làm
Lỗi tồn đọng
Lệnh chạy
Test
```
