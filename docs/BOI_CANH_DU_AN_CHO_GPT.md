# BỐI CẢNH DỰ ÁN CHO GPT / CODING AGENT

> Tạo tự động lúc: 30/08/2026 23:55

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
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── chung-nhan
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── dang-nhap
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── kiem-dinh-chat-luong
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── lo-san-pham
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── mua-vu
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── nha-cung-cap
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── nhat-ky-canh-tac
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── su-kien-truy-xuat
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── thu-hoach
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trang-trai
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── components
│   │   │   │   ├── khung-quan-tri.tsx
│   │   │   │   └── trang-thai-api.tsx
│   │   │   └── lib
│   │   │       ├── api-chung-nhan.ts
│   │   │       ├── api-kiem-dinh-chat-luong.ts
│   │   │       ├── api-lo-san-pham.ts
│   │   │       ├── api-mua-vu.ts
│   │   │       ├── api-nha-cung-cap.ts
│   │   │       ├── api-nhat-ky-canh-tac.ts
│   │   │       ├── api-qr-code.ts
│   │   │       ├── api-su-kien-truy-xuat.ts
│   │   │       ├── api-thu-hoach.ts
│   │   │       ├── api-trang-trai.ts
│   │   │       └── phien-dang-nhap-admin.ts
│   │   ├── next-env.d.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations
│   │   │   │   ├── 20260828150750_khoi_tao
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829010242_phien011_nen_tang
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829012411_phien012_xac_thuc
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829014635_phien014_audit_log
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829051818_phien015_tep_tin
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829071554_phien017_nha_cung_cap
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829083515_phien013_seed_rbac
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829133756_phien016_sua_audit_rbac
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829150744_phien018_trang_trai
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829153349_phien019_chung_nhan
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829155236_phien020_mua_vu
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829163213_phien021_nhat_ky_canh_tac
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260829170543_phien022_thu_hoach
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260830003155_phien023_lo_san_pham
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260830005357_phien024_kiem_dinh_chat_luong
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260830151944_phien025_qr_code
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260830164414_phien026_su_kien_truy_xuat
│   │   │   │   │   └── migration.sql
│   │   │   │   └── migration_lock.toml
│   │   │   └── schema.prisma
│   │   ├── src
│   │   │   ├── database
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── generated
│   │   │   │   └── prisma
│   │   │   │       ├── internal
│   │   │   │       │   ├── class.ts
│   │   │   │       │   ├── prismaNamespace.ts
│   │   │   │       │   └── prismaNamespaceBrowser.ts
│   │   │   │       ├── models
│   │   │   │       │   ├── ChungNhan.ts
│   │   │   │       │   ├── DiaChi.ts
│   │   │   │       │   ├── KhachHang.ts
│   │   │   │       │   ├── KiemDinhChatLuong.ts
│   │   │   │       │   ├── KiemDinhChatLuongAnh.ts
│   │   │   │       │   ├── LoSanPham.ts
│   │   │   │       │   ├── MuaVu.ts
│   │   │   │       │   ├── NguoiDung.ts
│   │   │   │       │   ├── NguoiDungVaiTro.ts
│   │   │   │       │   ├── NhaCungCap.ts
│   │   │   │       │   ├── NhanVien.ts
│   │   │   │       │   ├── NhatKyCanhTac.ts
│   │   │   │       │   ├── NhatKyKiemToan.ts
│   │   │   │       │   ├── PhienDangNhap.ts
│   │   │   │       │   ├── Quyen.ts
│   │   │   │       │   ├── SuKienTruyXuat.ts
│   │   │   │       │   ├── TepTin.ts
│   │   │   │       │   ├── ThuHoach.ts
│   │   │   │       │   ├── TrangTrai.ts
│   │   │   │       │   ├── TrangTraiAnh.ts
│   │   │   │       │   ├── VaiTro.ts
│   │   │   │       │   ├── VaiTroQuyen.ts
│   │   │   │       │   └── YeuCauDatLaiMatKhau.ts
│   │   │   │       ├── browser.ts
│   │   │   │       ├── client.ts
│   │   │   │       ├── commonInputTypes.ts
│   │   │   │       ├── enums.ts
│   │   │   │       └── models.ts
│   │   │   ├── modules
│   │   │   │   ├── chung-nhan
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-chung-nhan.dto.ts
│   │   │   │   │   │   ├── phan-hoi-chung-nhan.dto.ts
│   │   │   │   │   │   ├── tao-chung-nhan.dto.ts
│   │   │   │   │   │   ├── truy-van-chung-nhan.dto.ts
│   │   │   │   │   │   └── xac-minh-chung-nhan.dto.ts
│   │   │   │   │   ├── chung-nhan.controller.ts
│   │   │   │   │   ├── chung-nhan.module.ts
│   │   │   │   │   └── chung-nhan.service.ts
│   │   │   │   ├── hang-doi
│   │   │   │   │   ├── workers
│   │   │   │   │   │   ├── email.worker.ts
│   │   │   │   │   │   ├── he-thong.worker.ts
│   │   │   │   │   │   └── thong-bao.worker.ts
│   │   │   │   │   ├── hang-doi.config.ts
│   │   │   │   │   ├── hang-doi.constants.ts
│   │   │   │   │   ├── hang-doi.module.ts
│   │   │   │   │   └── hang-doi.service.ts
│   │   │   │   ├── kiem-dinh-chat-luong
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── phan-hoi-kiem-dinh-chat-luong.dto.ts
│   │   │   │   │   │   ├── tao-kiem-dinh-chat-luong.dto.ts
│   │   │   │   │   │   └── truy-van-kiem-dinh-chat-luong.dto.ts
│   │   │   │   │   ├── kiem-dinh-chat-luong.controller.ts
│   │   │   │   │   ├── kiem-dinh-chat-luong.module.ts
│   │   │   │   │   └── kiem-dinh-chat-luong.service.ts
│   │   │   │   ├── lo-san-pham
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-lo-san-pham.dto.ts
│   │   │   │   │   │   ├── phan-hoi-lo-san-pham.dto.ts
│   │   │   │   │   │   ├── tao-lo-tu-thu-hoach.dto.ts
│   │   │   │   │   │   └── truy-van-lo-san-pham.dto.ts
│   │   │   │   │   ├── lo-san-pham.controller.ts
│   │   │   │   │   ├── lo-san-pham.module.ts
│   │   │   │   │   └── lo-san-pham.service.ts
│   │   │   │   ├── mua-vu
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-mua-vu.dto.ts
│   │   │   │   │   │   ├── phan-hoi-mua-vu.dto.ts
│   │   │   │   │   │   ├── tao-mua-vu.dto.ts
│   │   │   │   │   │   └── truy-van-mua-vu.dto.ts
│   │   │   │   │   ├── mua-vu.controller.ts
│   │   │   │   │   ├── mua-vu.module.ts
│   │   │   │   │   └── mua-vu.service.ts
│   │   │   │   ├── nha-cung-cap
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-nha-cung-cap.dto.ts
│   │   │   │   │   │   ├── doi-trang-thai-nha-cung-cap.dto.ts
│   │   │   │   │   │   ├── phan-hoi-nha-cung-cap.dto.ts
│   │   │   │   │   │   ├── tao-nha-cung-cap.dto.ts
│   │   │   │   │   │   └── truy-van-nha-cung-cap.dto.ts
│   │   │   │   │   ├── nha-cung-cap.controller.ts
│   │   │   │   │   ├── nha-cung-cap.module.ts
│   │   │   │   │   └── nha-cung-cap.service.ts
│   │   │   │   ├── nhat-ky-canh-tac
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-nhat-ky-canh-tac.dto.ts
│   │   │   │   │   │   ├── phan-hoi-nhat-ky-canh-tac.dto.ts
│   │   │   │   │   │   ├── tao-nhat-ky-canh-tac.dto.ts
│   │   │   │   │   │   └── truy-van-nhat-ky-canh-tac.dto.ts
│   │   │   │   │   ├── nhat-ky-canh-tac.controller.ts
│   │   │   │   │   ├── nhat-ky-canh-tac.module.ts
│   │   │   │   │   └── nhat-ky-canh-tac.service.ts
│   │   │   │   ├── nhat-ky-kiem-toan
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── phan-hoi-nhat-ky.dto.ts
│   │   │   │   │   │   └── truy-van-nhat-ky.dto.ts
│   │   │   │   │   ├── nhat-ky-kiem-toan.controller.ts
│   │   │   │   │   ├── nhat-ky-kiem-toan.module.ts
│   │   │   │   │   └── nhat-ky-kiem-toan.service.ts
│   │   │   │   ├── phan-quyen
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── gan-vai-tro.dto.ts
│   │   │   │   │   │   └── phan-hoi-phan-quyen.dto.ts
│   │   │   │   │   ├── ma-quyen.ts
│   │   │   │   │   ├── phan-quyen.controller.ts
│   │   │   │   │   ├── phan-quyen.module.ts
│   │   │   │   │   ├── phan-quyen.service.ts
│   │   │   │   │   ├── quyen.guard.ts
│   │   │   │   │   └── yeu-cau-quyen.decorator.ts
│   │   │   │   ├── qr-code
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── phan-hoi-qr-code.dto.ts
│   │   │   │   │   ├── qr-code.controller.ts
│   │   │   │   │   ├── qr-code.module.ts
│   │   │   │   │   └── qr-code.service.ts
│   │   │   │   ├── su-kien-truy-xuat
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── phan-hoi-su-kien-truy-xuat.dto.ts
│   │   │   │   │   │   ├── tao-su-kien-truy-xuat.dto.ts
│   │   │   │   │   │   └── truy-van-su-kien-truy-xuat.dto.ts
│   │   │   │   │   ├── su-kien-truy-xuat.controller.ts
│   │   │   │   │   ├── su-kien-truy-xuat.module.ts
│   │   │   │   │   └── su-kien-truy-xuat.service.ts
│   │   │   │   ├── suc-khoe
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── phan-hoi-suc-khoe.dto.ts
│   │   │   │   │   ├── suc-khoe.controller.ts
│   │   │   │   │   ├── suc-khoe.module.ts
│   │   │   │   │   └── suc-khoe.service.ts
│   │   │   │   ├── tep-tin
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── phan-hoi-tep-tin.dto.ts
│   │   │   │   │   ├── tep-tin.controller.ts
│   │   │   │   │   ├── tep-tin.module.ts
│   │   │   │   │   ├── tep-tin.service.ts
│   │   │   │   │   └── tep-tin.types.ts
│   │   │   │   ├── thu-hoach
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-thu-hoach.dto.ts
│   │   │   │   │   │   ├── phan-hoi-thu-hoach.dto.ts
│   │   │   │   │   │   ├── tao-thu-hoach.dto.ts
│   │   │   │   │   │   └── truy-van-thu-hoach.dto.ts
│   │   │   │   │   ├── thu-hoach.controller.ts
│   │   │   │   │   ├── thu-hoach.module.ts
│   │   │   │   │   └── thu-hoach.service.ts
│   │   │   │   ├── trang-trai
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-trang-trai.dto.ts
│   │   │   │   │   │   ├── doi-trang-thai-trang-trai.dto.ts
│   │   │   │   │   │   ├── phan-hoi-trang-trai.dto.ts
│   │   │   │   │   │   ├── tao-trang-trai.dto.ts
│   │   │   │   │   │   └── truy-van-trang-trai.dto.ts
│   │   │   │   │   ├── trang-trai-cong-khai.controller.ts
│   │   │   │   │   ├── trang-trai.controller.ts
│   │   │   │   │   ├── trang-trai.module.ts
│   │   │   │   │   └── trang-trai.service.ts
│   │   │   │   └── xac-thuc
│   │   │   │       ├── dto
│   │   │   │       │   ├── dang-ky.dto.ts
│   │   │   │       │   ├── dang-nhap.dto.ts
│   │   │   │       │   ├── dat-lai-mat-khau.dto.ts
│   │   │   │       │   ├── doi-mat-khau.dto.ts
│   │   │   │       │   ├── lam-moi-token.dto.ts
│   │   │   │       │   ├── phan-hoi-xac-thuc.dto.ts
│   │   │   │       │   └── yeu-cau-dat-lai-mat-khau.dto.ts
│   │   │   │       ├── jwt-access.guard.ts
│   │   │   │       ├── thu-dien-xac-thuc.service.ts
│   │   │   │       ├── xac-thuc.controller.ts
│   │   │   │       ├── xac-thuc.module.ts
│   │   │   │       └── xac-thuc.service.ts
│   │   │   ├── redis
│   │   │   │   ├── redis.module.ts
│   │   │   │   └── redis.service.ts
│   │   │   ├── app.module.ts
│   │   │   ├── cau-hinh-ung-dung.ts
│   │   │   └── main.ts
│   │   ├── test
│   │   │   ├── chung-nhan.e2e-spec.ts
│   │   │   ├── jest-e2e.json
│   │   │   ├── kiem-dinh-chat-luong.e2e-spec.ts
│   │   │   ├── lo-san-pham.e2e-spec.ts
│   │   │   ├── mua-vu.e2e-spec.ts
│   │   │   ├── nha-cung-cap.e2e-spec.ts
│   │   │   ├── nhat-ky-canh-tac.e2e-spec.ts
│   │   │   ├── nhat-ky-kiem-toan.e2e-spec.ts
│   │   │   ├── phan-quyen.e2e-spec.ts
│   │   │   ├── qr-code.e2e-spec.ts
│   │   │   ├── redis-bullmq.e2e-spec.ts
│   │   │   ├── schema-nen-tang.e2e-spec.ts
│   │   │   ├── su-kien-truy-xuat.e2e-spec.ts
│   │   │   ├── suc-khoe.e2e-spec.ts
│   │   │   ├── tep-tin.e2e-spec.ts
│   │   │   ├── thu-hoach.e2e-spec.ts
│   │   │   ├── trang-trai.e2e-spec.ts
│   │   │   └── xac-thuc.e2e-spec.ts
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── prisma7.config.ts
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   ├── customer-web
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── error.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── components
│   │   │   │   ├── khung-ung-dung.tsx
│   │   │   │   └── trang-thai-api.tsx
│   │   │   ├── stores
│   │   │   │   └── giao-dien.store.ts
│   │   │   └── theme.ts
│   │   ├── next-env.d.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   └── mobile
│       ├── assets
│       │   ├── expo.icon
│       │   │   ├── Assets
│       │   │   │   ├── expo-symbol 2.svg
│       │   │   │   └── grid.png
│       │   │   └── icon.json
│       │   └── images
│       │       ├── tabIcons
│       │       │   ├── explore.png
│       │       │   ├── explore@2x.png
│       │       │   ├── explore@3x.png
│       │       │   ├── home.png
│       │       │   ├── home@2x.png
│       │       │   └── home@3x.png
│       │       ├── android-icon-background.png
│       │       ├── android-icon-foreground.png
│       │       ├── android-icon-monochrome.png
│       │       ├── expo-badge-white.png
│       │       ├── expo-badge.png
│       │       ├── expo-logo.png
│       │       ├── favicon.png
│       │       ├── icon.png
│       │       ├── logo-glow.png
│       │       ├── react-logo.png
│       │       ├── react-logo@2x.png
│       │       ├── react-logo@3x.png
│       │       ├── splash-icon.png
│       │       └── tutorial-web.png
│       ├── src
│       │   ├── app
│       │   │   ├── (auth)
│       │   │   │   ├── _layout.tsx
│       │   │   │   └── dang-nhap.tsx
│       │   │   ├── (tabs)
│       │   │   │   ├── _layout.tsx
│       │   │   │   ├── don-hang.tsx
│       │   │   │   ├── index.tsx
│       │   │   │   ├── kham-pha.tsx
│       │   │   │   ├── quet-qr.tsx
│       │   │   │   └── tai-khoan.tsx
│       │   │   └── _layout.tsx
│       │   ├── components
│       │   │   ├── ui
│       │   │   │   ├── box
│       │   │   │   │   ├── index.tsx
│       │   │   │   │   ├── index.web.tsx
│       │   │   │   │   └── styles.tsx
│       │   │   │   ├── button
│       │   │   │   │   └── index.tsx
│       │   │   │   ├── card
│       │   │   │   │   ├── index.tsx
│       │   │   │   │   ├── index.web.tsx
│       │   │   │   │   └── styles.tsx
│       │   │   │   ├── gluestack-ui-provider
│       │   │   │   │   ├── index.tsx
│       │   │   │   │   ├── index.web.tsx
│       │   │   │   │   └── script.ts
│       │   │   │   ├── heading
│       │   │   │   │   ├── index.tsx
│       │   │   │   │   ├── index.web.tsx
│       │   │   │   │   └── styles.tsx
│       │   │   │   └── text
│       │   │   │       ├── index.tsx
│       │   │   │       ├── index.web.tsx
│       │   │   │       └── styles.tsx
│       │   │   ├── man-hinh-placeholder.tsx
│       │   │   └── trang-thai-api.tsx
│       │   ├── providers
│       │   │   └── app-providers.tsx
│       │   ├── stores
│       │   │   └── ung-dung.store.ts
│       │   ├── types
│       │   │   └── css.d.ts
│       │   ├── global.css
│       │   └── uniwind-types.d.ts
│       ├── app.json
│       ├── babel.config.js
│       ├── gluestack-ui.config.json
│       ├── metro.config.js
│       ├── package.json
│       └── tsconfig.json
├── docs
│   ├── 00_BAT_DAU_O_DAY.md
│   ├── BOI_CANH_DU_AN_CHO_GPT.md
│   ├── ERD_NEN_TANG.md
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
│   │   ├── generated
│   │   │   ├── model
│   │   │   │   ├── anhKiemDinhDto.ts
│   │   │   │   ├── anhTrangTraiDto.ts
│   │   │   │   ├── capNhatChungNhanDto.ts
│   │   │   │   ├── capNhatLoSanPhamDto.ts
│   │   │   │   ├── capNhatMuaVuDto.ts
│   │   │   │   ├── capNhatMuaVuDtoTrangThai.ts
│   │   │   │   ├── capNhatNhaCungCapDto.ts
│   │   │   │   ├── capNhatNhatKyCanhTacDto.ts
│   │   │   │   ├── capNhatNhatKyCanhTacDtoLoaiSuKien.ts
│   │   │   │   ├── capNhatThuHoachDto.ts
│   │   │   │   ├── capNhatTrangTraiDto.ts
│   │   │   │   ├── chungNhanChiTietDto.ts
│   │   │   │   ├── chungNhanChiTietDtoTrangThaiXacMinh.ts
│   │   │   │   ├── chungNhanTomTatDto.ts
│   │   │   │   ├── chungNhanTomTatDtoTrangThaiXacMinh.ts
│   │   │   │   ├── dangKyDto.ts
│   │   │   │   ├── dangNhapDto.ts
│   │   │   │   ├── dangNhapDtoNenTang.ts
│   │   │   │   ├── danhSachChungNhanDto.ts
│   │   │   │   ├── danhSachKiemDinhChatLuongDto.ts
│   │   │   │   ├── danhSachLoSanPhamDto.ts
│   │   │   │   ├── danhSachMuaVuDto.ts
│   │   │   │   ├── danhSachNhaCungCapDto.ts
│   │   │   │   ├── danhSachNhatKyCanhTacDto.ts
│   │   │   │   ├── danhSachSuKienTruyXuatDto.ts
│   │   │   │   ├── danhSachThuHoachDto.ts
│   │   │   │   ├── danhSachTrangTraiDto.ts
│   │   │   │   ├── datLaiMatKhauDto.ts
│   │   │   │   ├── doiMatKhauDto.ts
│   │   │   │   ├── doiTrangThaiNhaCungCapDto.ts
│   │   │   │   ├── doiTrangThaiNhaCungCapDtoTrangThai.ts
│   │   │   │   ├── doiTrangThaiTrangTraiDto.ts
│   │   │   │   ├── doiTrangThaiTrangTraiDtoTrangThai.ts
│   │   │   │   ├── ganVaiTroDto.ts
│   │   │   │   ├── ganVaiTroDtoMaVaiTro.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── kiemDinhChatLuongChiTietDto.ts
│   │   │   │   ├── kiemDinhChatLuongChiTietDtoKetQua.ts
│   │   │   │   ├── kiemDinhChatLuongTomTatDto.ts
│   │   │   │   ├── kiemDinhChatLuongTomTatDtoKetQua.ts
│   │   │   │   ├── lamMoiTokenDto.ts
│   │   │   │   ├── lamMoiTokenDtoNenTang.ts
│   │   │   │   ├── layDanhSachChungNhanParams.ts
│   │   │   │   ├── layDanhSachChungNhanTrangThaiXacMinh.ts
│   │   │   │   ├── layDanhSachKiemDinhChatLuongKetQua.ts
│   │   │   │   ├── layDanhSachKiemDinhChatLuongParams.ts
│   │   │   │   ├── layDanhSachLoSanPhamParams.ts
│   │   │   │   ├── layDanhSachLoSanPhamTrangThai.ts
│   │   │   │   ├── layDanhSachMuaVuParams.ts
│   │   │   │   ├── layDanhSachMuaVuTrangThai.ts
│   │   │   │   ├── layDanhSachNhaCungCapParams.ts
│   │   │   │   ├── layDanhSachNhaCungCapTrangThai.ts
│   │   │   │   ├── layDanhSachNhatKyCanhTacLoaiSuKien.ts
│   │   │   │   ├── layDanhSachNhatKyCanhTacParams.ts
│   │   │   │   ├── layDanhSachSuKienTruyXuatParams.ts
│   │   │   │   ├── layDanhSachThuHoachParams.ts
│   │   │   │   ├── layDanhSachTrangTraiParams.ts
│   │   │   │   ├── layDanhSachTrangTraiTrangThai.ts
│   │   │   │   ├── layNhatKyKiemToanParams.ts
│   │   │   │   ├── loaiSuKienTruyXuat.ts
│   │   │   │   ├── loKiemDinhDto.ts
│   │   │   │   ├── loKiemDinhDtoTrangThai.ts
│   │   │   │   ├── loSanPhamDto.ts
│   │   │   │   ├── loSanPhamDtoTrangThai.ts
│   │   │   │   ├── loSuKienTruyXuatDto.ts
│   │   │   │   ├── muaVuDto.ts
│   │   │   │   ├── muaVuDtoTrangThai.ts
│   │   │   │   ├── muaVuLoSanPhamDto.ts
│   │   │   │   ├── muaVuLoSanPhamDtoTrangThai.ts
│   │   │   │   ├── muaVuNhatKyCanhTacDto.ts
│   │   │   │   ├── muaVuNhatKyCanhTacDtoTrangThai.ts
│   │   │   │   ├── muaVuThuHoachDto.ts
│   │   │   │   ├── muaVuThuHoachDtoTrangThai.ts
│   │   │   │   ├── nguoiDungXacThucDto.ts
│   │   │   │   ├── nguoiKiemDinhDto.ts
│   │   │   │   ├── nhaCungCapDto.ts
│   │   │   │   ├── nhaCungCapDtoTrangThai.ts
│   │   │   │   ├── nhaCungCapTrangTraiDto.ts
│   │   │   │   ├── nhatKyCanhTacDto.ts
│   │   │   │   ├── nhatKyCanhTacDtoLoaiSuKien.ts
│   │   │   │   ├── nhatKyKiemToanDto.ts
│   │   │   │   ├── nhatKyKiemToanDtoMetadata.ts
│   │   │   │   ├── nhatKyKiemToanDtoSau.ts
│   │   │   │   ├── nhatKyKiemToanDtoTacNhanId.ts
│   │   │   │   ├── nhatKyKiemToanDtoThucTheId.ts
│   │   │   │   ├── nhatKyKiemToanDtoTruoc.ts
│   │   │   │   ├── phanHoiDangKyDto.ts
│   │   │   │   ├── phanHoiDanhSachNhatKyDto.ts
│   │   │   │   ├── phanHoiGanVaiTroDto.ts
│   │   │   │   ├── phanHoiSucKhoeDto.ts
│   │   │   │   ├── phanHoiThongBaoDto.ts
│   │   │   │   ├── phanHoiTokenDto.ts
│   │   │   │   ├── phanHoiUrlTepTinDto.ts
│   │   │   │   ├── phanHoiUrlTepTinDtoCheDo.ts
│   │   │   │   ├── phanHoiXoaTepTinDto.ts
│   │   │   │   ├── phanQuyenNguoiDungDto.ts
│   │   │   │   ├── qrCodeLoSanPhamDto.ts
│   │   │   │   ├── suKienTruyXuatDto.ts
│   │   │   │   ├── suKienTruyXuatDtoMetadata.ts
│   │   │   │   ├── taiTepTinBody.ts
│   │   │   │   ├── taoChungNhanDto.ts
│   │   │   │   ├── taoKiemDinhChatLuongDto.ts
│   │   │   │   ├── taoKiemDinhChatLuongDtoKetQua.ts
│   │   │   │   ├── taoLoTuThuHoachDto.ts
│   │   │   │   ├── taoMuaVuDto.ts
│   │   │   │   ├── taoMuaVuDtoTrangThai.ts
│   │   │   │   ├── taoNhaCungCapDto.ts
│   │   │   │   ├── taoNhatKyCanhTacDto.ts
│   │   │   │   ├── taoNhatKyCanhTacDtoLoaiSuKien.ts
│   │   │   │   ├── taoSuKienTruyXuatDto.ts
│   │   │   │   ├── taoSuKienTruyXuatDtoMetadata.ts
│   │   │   │   ├── taoThuHoachDto.ts
│   │   │   │   ├── taoTrangTraiDto.ts
│   │   │   │   ├── tepTinChungNhanDto.ts
│   │   │   │   ├── tepTinDto.ts
│   │   │   │   ├── thuHoachDto.ts
│   │   │   │   ├── thuHoachLoSanPhamDto.ts
│   │   │   │   ├── trangTraiChiTietDto.ts
│   │   │   │   ├── trangTraiChiTietDtoTrangThai.ts
│   │   │   │   ├── trangTraiChungNhanDto.ts
│   │   │   │   ├── trangTraiLoSanPhamDto.ts
│   │   │   │   ├── trangTraiMuaVuDto.ts
│   │   │   │   ├── trangTraiNhatKyCanhTacDto.ts
│   │   │   │   ├── trangTraiThuHoachDto.ts
│   │   │   │   ├── trangTraiTomTatDto.ts
│   │   │   │   ├── trangTraiTomTatDtoTrangThai.ts
│   │   │   │   ├── xacMinhChungNhanDto.ts
│   │   │   │   ├── xacMinhChungNhanDtoTrangThaiXacMinh.ts
│   │   │   │   └── yeuCauDatLaiMatKhauDto.ts
│   │   │   └── index.ts
│   │   ├── openapi
│   │   │   └── agrimarket.json
│   │   ├── src
│   │   │   ├── index.ts
│   │   │   └── runtime.ts
│   │   ├── tools
│   │   │   ├── dam-bao-generated.mjs
│   │   │   ├── kiem-tra-suc-khoe.ts
│   │   │   └── tai-openapi.mjs
│   │   ├── orval.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
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

- `chung-nhan`
- `hang-doi`
- `kiem-dinh-chat-luong`
- `lo-san-pham`
- `mua-vu`
- `nha-cung-cap`
- `nhat-ky-canh-tac`
- `nhat-ky-kiem-toan`
- `phan-quyen`
- `qr-code`
- `su-kien-truy-xuat`
- `suc-khoe`
- `tep-tin`
- `thu-hoach`
- `trang-trai`
- `xac-thuc`

## 4. package.json trong repository

### `apps/admin-web/package.json`

- Package: `@agrimarket/admin-web`
- Công nghệ phát hiện:
  - `next`: `16.3.3`
  - `react`: `19.2.8`
  - `antd`: `5.29.3`
  - `@ant-design/pro-components`: `2.8.10`
  - `@tanstack/react-query`: `5.102.8`

### `apps/api/package.json`

- Package: `@agrimarket/api`
- Công nghệ phát hiện:
  - `@nestjs/core`: `11.2.3`
  - `@nestjs/swagger`: `11.4.7`
  - `prisma`: `7.10.0`
  - `@prisma/client`: `7.10.0`

### `apps/customer-web/package.json`

- Package: `@agrimarket/customer-web`
- Công nghệ phát hiện:
  - `next`: `16.3.3`
  - `react`: `19.2.8`
  - `@mantine/core`: `9.5.2`
  - `@tanstack/react-query`: `5.102.8`
  - `zustand`: `5.0.15`

### `apps/mobile/package.json`

- Package: `@agrimarket/mobile`
- Công nghệ phát hiện:
  - `react`: `19.2.3`
  - `react-native`: `0.86.3`
  - `expo`: `~57.0.18`
  - `@tanstack/react-query`: `5.102.8`
  - `zustand`: `5.0.15`

### `package.json`

- Package: `agrimarket`

### `packages/api-client/package.json`

- Package: `@agrimarket/api-client`
- Công nghệ phát hiện:
  - `react`: `19.2.8`
  - `@tanstack/react-query`: `5.102.8`
  - `orval`: `8.26.0`

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

