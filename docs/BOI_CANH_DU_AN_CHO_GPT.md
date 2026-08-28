# BỐI CẢNH DỰ ÁN CHO GPT / CODING AGENT

> Tạo tự động lúc: 28/08/2026 21:46

## 1. Quy ước

- Code nghiệp vụ ưu tiên tiếng Việt không dấu.
- Nội dung UI, comment và tài liệu dùng tiếng Việt có dấu.
- Không đọc/ghi/commit `.env`, khóa riêng hoặc credential.
- Ưu tiên code ngắn gọn, rõ ràng, ít abstraction thừa.
- Frontend ưu tiên component thư viện trước khi tự dựng UI.

## 2. Cây thư mục

```text
Xay dung nen tang ban nong san tich hop truy xuat nguon goc/
├── apps
│   ├── admin-web
│   │   └── package.json
│   ├── api
│   │   ├── src
│   │   │   ├── modules
│   │   │   │   └── suc-khoe
│   │   │   │       ├── dto
│   │   │   │       │   └── phan-hoi-suc-khoe.dto.ts
│   │   │   │       ├── suc-khoe.controller.ts
│   │   │   │       ├── suc-khoe.module.ts
│   │   │   │       └── suc-khoe.service.ts
│   │   │   ├── app.module.ts
│   │   │   ├── cau-hinh-ung-dung.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   ├── jest-e2e.json
│   │   │   └── suc-khoe.e2e-spec.ts
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   ├── customer-web
│   │   └── package.json
│   └── mobile
│       └── package.json
├── docs
│   ├── 00_BAT_DAU_O_DAY.md
│   ├── BOI_CANH_DU_AN_CHO_GPT.md
│   ├── KE_HOACH_CAC_PHIEN_AI.md
│   ├── NHAT_KY_PHIEN_AI.md
│   ├── QUY_TAC_CHO_AI.md
│   ├── QUYET_DINH_KIEN_TRUC.md
│   ├── README.md
│   └── TRANG_THAI_DU_AN.md
├── infra
│   └── README.md
├── packages
│   ├── api-client
│   │   └── package.json
│   ├── eslint-config
│   │   ├── index.mjs
│   │   └── package.json
│   ├── shared-constants
│   │   └── package.json
│   └── tsconfig
│       ├── base.json
│       └── package.json
├── tools
│   └── kiem-tra-typescript.ts
├── .editorconfig
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── cai-bo-tai-lieu-ai.py
├── cap-nhat-github.py
├── Dac_ta_yeu_cau_va_UML_AgriMarket_3_Actor (1).md
├── docker-compose.yml
├── eslint.config.mjs
├── KE_HOACH_CAC_PHIEN_AI_HOAN_THIEN_AGRIMARKET.md
├── khoi-tao-va-day-github.py
├── package.json
├── Phan_tich_cong_nghe_AgriMarket_UI_hien_dai.md
├── Phan_tich_thiet_ke_giao_dien_AgriMarket.md
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── Quy_uoc_code_tieng_Viet_AgriMarket.md
├── README_TU_DONG_HOA_GITHUB.md
├── tao-boi-canh-du-an-cho-gpt.py
└── tsconfig.json
```

## 3. Module Backend phát hiện được

- `suc-khoe`

## 4. package.json trong repository

### `apps/admin-web/package.json`

- Package: `@agrimarket/admin-web`

### `apps/api/package.json`

- Package: `@agrimarket/api`
- Công nghệ phát hiện:
  - `@nestjs/core`: `11.2.3`
  - `@nestjs/swagger`: `11.4.7`
  - `prisma`: `7.10.0`
  - `@prisma/client`: `7.10.0`

### `apps/customer-web/package.json`

- Package: `@agrimarket/customer-web`

### `apps/mobile/package.json`

- Package: `@agrimarket/mobile`

### `package.json`

- Package: `agrimarket`

### `packages/api-client/package.json`

- Package: `@agrimarket/api-client`

### `packages/eslint-config/package.json`

- Package: `@agrimarket/eslint-config`

### `packages/shared-constants/package.json`

- Package: `@agrimarket/shared-constants`

### `packages/tsconfig/package.json`

- Package: `@agrimarket/tsconfig`

## 5. Hướng dẫn GPT khi làm việc với repository

1. Đọc tài liệu trong `docs/` trước khi sửa kiến trúc lớn.
2. Không tự đổi stack công nghệ nếu chưa có yêu cầu.
3. Không tạo abstraction/framework nội bộ không cần thiết.
4. Giữ tên nghiệp vụ tiếng Việt không dấu theo quy ước dự án.
5. Backend là nguồn sự thật của giá, tồn kho, voucher, FEFO và thanh toán.
6. Không đưa secret vào source code.
7. Khi thêm API, cập nhật Swagger/OpenAPI để FE generate client.
8. Khi thêm UI, ưu tiên Mantine / Ant Design Pro / gluestack-ui theo từng app.

