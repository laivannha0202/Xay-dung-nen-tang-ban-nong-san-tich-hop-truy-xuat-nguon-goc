# QUYẾT ĐỊNH KIẾN TRÚC AGRIMARKET

> Các quyết định trong file này là nguồn sự thật. AI không được tự ý thay đổi.

---

## ADR-001 – Kiến trúc Backend

**Trạng thái:** Chấp nhận

**Quyết định:**

```text
Modular Monolith
```

Backend là một ứng dụng NestJS chia theo module nghiệp vụ.

**Không dùng Microservices ở MVP.**

---

## ADR-002 – Backend Framework

**Quyết định:**

```text
Node.js + NestJS + TypeScript
```

Không tự đổi sang:

```text
Express
Fastify standalone
Spring
Django
Laravel
```

---

## ADR-003 – Database

**Quyết định:**

```text
MySQL 8.4 LTS
```

Không tự đổi PostgreSQL/MongoDB.

---

## ADR-004 – ORM

**Quyết định:**

```text
Prisma
```

Không tự đổi TypeORM/Sequelize.

SQL tay chỉ dùng ở phần cần transaction/locking/query đặc biệt.

---

## ADR-005 – API

**Quyết định:**

```text
REST API
Swagger/OpenAPI
```

Không tự thêm GraphQL.

---

## ADR-006 – API Client Frontend

**Quyết định:**

```text
Swagger/OpenAPI
→ Orval
→ Generated TypeScript Client
→ TanStack Query
```

Không duplicate DTO/type bằng tay nếu đã generate.

---

## ADR-007 – Customer Web

**Quyết định:**

```text
Next.js
React
TypeScript
Mantine
Mantine UI
```

Không tự đổi sang Ant Design/shadcn/MUI/Chakra.

---

## ADR-008 – Admin Web

**Quyết định:**

```text
Next.js
React
TypeScript
Ant Design
Ant Design ProComponents
```

Ưu tiên:

```text
ProLayout
ProTable
ProForm
ProDescriptions
ProCard
```

---

## ADR-009 – Mobile

**Quyết định:**

```text
Expo
React Native
TypeScript
Expo Router
gluestack-ui v5
UniWind
```

Không tự đổi sang Flutter/Kotlin/React Native Paper.

---

## ADR-010 – State Management

Server state:

```text
TanStack Query
```

Local/UI state:

```text
Zustand
```

Không thêm Redux nếu không có yêu cầu mới.

---

## ADR-011 – Actor

Chỉ có:

```text
Khách hàng
Nhân viên
Admin
```

Nhà cung cấp/Trang trại là đối tượng nghiệp vụ.

---

## ADR-012 – Tồn kho

Nguồn sự thật:

```text
MySQL transaction
```

Redis không phải nguồn sự thật tồn kho.

---

## ADR-013 – Product và Batch

Bắt buộc tách:

```text
Product ≠ Batch
```

Product là catalog.

Batch là lô vật lý có:

```text
farm
harvest
expiry
quality
traceability
inventory
```

---

## ADR-014 – Truy xuất nguồn gốc

Đơn vị truy xuất trung tâm:

```text
Batch
```

Luồng:

```text
OrderItem
→ OrderAllocation
→ Batch
→ Harvest
→ Crop
→ Farm
```

---

## ADR-015 – FEFO

FEFO được tính ở Backend.

Frontend không tự chọn lô.

---

## ADR-016 – Business Logic

Backend là nguồn sự thật của:

```text
Giá
Khuyến mãi
Tồn kho
Reservation
FEFO
Thanh toán
Refund
Commission
```

Frontend chỉ hiển thị/gửi request.

---

## ADR-017 – Code tiếng Việt

Nghiệp vụ:

```text
tiếng Việt không dấu
```

Ví dụ:

```text
san-pham
don-hang
lo-san-pham
ton-kho
```

Framework convention giữ tiếng Anh.

---

## ADR-018 – UI Library

Một app chỉ có một UI system chính:

```text
Customer Web → Mantine
Admin → Ant Design Pro
Mobile → gluestack-ui
```

Không trộn nhiều UI framework trong cùng app.

---

## ADR-019 – Auth

```text
JWT Access Token
Refresh Token
RBAC
Argon2
```

Web refresh token ưu tiên HttpOnly Cookie.

Mobile token nhạy cảm dùng SecureStore.

---

## ADR-020 – File Storage

Không lưu binary ảnh trong MySQL.

Dùng:

```text
MinIO local
S3-compatible production
```

---

## ADR-021 – Cache/Queue

```text
Redis
BullMQ
```

Dùng cho:

```text
OTP
cache phù hợp
notification
email
reservation timeout metadata/job
certificate alert
```

---

## ADR-022 – Scope AI

AI là module bổ sung.

Core hệ thống phải chạy đầy đủ khi AI bị tắt.

Không để:

```text
Order
Payment
Inventory
Traceability
```

phụ thuộc AI.

---

## ADR-023 – Abstraction

Không tạo abstraction sớm như:

```text
BaseCrudService
GenericRepository
MagicHandler
```

Chỉ tách khi có nhu cầu thật.

---

## ADR-024 – Test

Critical flows bắt buộc có test:

```text
Auth
RBAC
Inventory reservation
FEFO
Order
Payment callback
Refund
Traceability
```

---

## Quy trình thay đổi ADR

Nếu muốn thay quyết định:

1. Không sửa âm thầm.
2. Tạo ADR mới.
3. Ghi lý do.
4. Ghi ảnh hưởng.
5. Người dùng chấp thuận.
6. Cập nhật `TRANG_THAI_DU_AN.md`.
