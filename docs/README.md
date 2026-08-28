# AgriMarket

## Tên đề tài

**Xây dựng nền tảng bán nông sản đa nền tảng tích hợp truy xuất nguồn gốc**

Hệ thống gồm:

- Android khách hàng
- Web khách hàng
- Web quản trị
- Backend dùng chung
- MySQL
- Swagger/OpenAPI
- Hệ thống truy xuất nguồn gốc theo lô

## Actor chính

1. Khách hàng
2. Nhân viên
3. Admin

## Stack công nghệ đã chốt

### Android

- Expo
- React Native
- TypeScript
- Expo Router
- gluestack-ui v5
- UniWind
- TanStack Query
- Orval
- Zustand

### Web khách hàng

- Next.js
- React
- TypeScript
- Mantine
- Mantine UI
- TanStack Query
- Orval
- Zustand

### Web quản trị

- Next.js
- React
- TypeScript
- Ant Design
- Ant Design ProComponents
- TanStack Query
- Orval
- Zustand

### Backend

- Node.js 24 LTS
- NestJS
- TypeScript
- REST API
- Swagger/OpenAPI
- Prisma
- MySQL 8.4 LTS
- Redis
- BullMQ
- JWT
- RBAC
- MinIO/S3

## Quy ước code

- Nghiệp vụ trong code: tiếng Việt không dấu.
- UI/comment/docs: tiếng Việt có dấu.
- Tên công nghệ/framework: giữ nguyên tiếng Anh.
- Tên file nghiệp vụ: tiếng Việt không dấu.
- Không abstraction thừa.
- Không tự thay stack.
- Frontend ưu tiên UI library trước khi tự code component primitive.

## Bắt đầu ở đâu?

AI/Coding Agent phải đọc theo thứ tự:

1. `docs/00_BAT_DAU_O_DAY.md`
2. `docs/TRANG_THAI_DU_AN.md`
3. `docs/QUYET_DINH_KIEN_TRUC.md`
4. `docs/QUY_TAC_CHO_AI.md`
5. `docs/KE_HOACH_CAC_PHIEN_AI.md`
6. `docs/BOI_CANH_DU_AN_CHO_GPT.md`
7. Các tài liệu phân tích ở thư mục gốc.

Không bắt đầu code trước khi đọc các file trên.

## Phiên tiếp theo

Theo trạng thái hiện tại:

**PHIEN-002 – Chuẩn hóa cấu trúc Monorepo**

Xem chi tiết tại:

`docs/KE_HOACH_CAC_PHIEN_AI.md`

## Repository mong muốn

```text
agrimarket/
├── apps/
│   ├── api/
│   ├── customer-web/
│   ├── admin-web/
│   └── mobile/
├── packages/
│   ├── api-client/
│   ├── shared-constants/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
├── infra/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## Nguyên tắc bảo mật

Không commit:

- `.env`
- API key
- JWT secret
- mật khẩu
- private key
- token GitHub
- `node_modules`
- build artifact

Chỉ commit `.env.example`.
