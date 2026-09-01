# BỐI CẢNH DỰ ÁN CHO GPT / CODING AGENT

> Tạo tự động lúc: 01/09/2026 15:11

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
│   │   │   │   ├── danh-muc-san-pham
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── giao-dich-ton-kho
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── kho
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
│   │   │   │   ├── san-pham
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── su-kien-truy-xuat
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── thu-hoach
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ton-kho
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
│   │   │       ├── api-canh-bao-ton-kho.ts
│   │   │       ├── api-chung-nhan.ts
│   │   │       ├── api-danh-muc-san-pham.ts
│   │   │       ├── api-giao-dich-ton-kho.ts
│   │   │       ├── api-kho.ts
│   │   │       ├── api-kiem-dinh-chat-luong.ts
│   │   │       ├── api-lo-san-pham.ts
│   │   │       ├── api-mua-vu.ts
│   │   │       ├── api-nha-cung-cap.ts
│   │   │       ├── api-nhat-ky-canh-tac.ts
│   │   │       ├── api-qr-code.ts
│   │   │       ├── api-san-pham.ts
│   │   │       ├── api-su-kien-truy-xuat.ts
│   │   │       ├── api-thu-hoach.ts
│   │   │       ├── api-ton-kho.ts
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
│   │   │   │   ├── 20260831014949_phien028_thu_hoi_lo
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831032638_phien029_danh_muc_san_pham
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831045536_phien030_san_pham
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831092626_phien031_bien_the_gia
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831100929_phien032_anh_san_pham
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831160736_phien034_kho
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831171642_phien035_inventory_lot
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260831185316_phien036_inventory_transaction_ledger
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260901060840_phien047_cart_backend
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260901070405_phien050_inventory_reservation
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260901072046_phien051_order_schema
│   │   │   │   │   └── migration.sql
│   │   │   │   ├── 20260901075140_phien053_payment_domain
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
│   │   │   │       │   ├── BienTheSanPham.ts
│   │   │   │       │   ├── ChungNhan.ts
│   │   │   │       │   ├── DanhMucSanPham.ts
│   │   │   │       │   ├── DatChoTonKho.ts
│   │   │   │       │   ├── DiaChi.ts
│   │   │   │       │   ├── DonHang.ts
│   │   │   │       │   ├── DonHangNhaCungCap.ts
│   │   │   │       │   ├── GiaoDichThanhToan.ts
│   │   │   │       │   ├── GiaoDichTonKho.ts
│   │   │   │       │   ├── GioHang.ts
│   │   │   │       │   ├── KhachHang.ts
│   │   │   │       │   ├── Kho.ts
│   │   │   │       │   ├── KiemDinhChatLuong.ts
│   │   │   │       │   ├── KiemDinhChatLuongAnh.ts
│   │   │   │       │   ├── LoSanPham.ts
│   │   │   │       │   ├── MuaVu.ts
│   │   │   │       │   ├── MucDatChoTonKho.ts
│   │   │   │       │   ├── MucDonHang.ts
│   │   │   │       │   ├── MucGioHang.ts
│   │   │   │       │   ├── NguoiDung.ts
│   │   │   │       │   ├── NguoiDungVaiTro.ts
│   │   │   │       │   ├── NhaCungCap.ts
│   │   │   │       │   ├── NhanVien.ts
│   │   │   │       │   ├── NhatKyCanhTac.ts
│   │   │   │       │   ├── NhatKyKiemToan.ts
│   │   │   │       │   ├── PhanBoDonHang.ts
│   │   │   │       │   ├── PhienDangNhap.ts
│   │   │   │       │   ├── Quyen.ts
│   │   │   │       │   ├── SanPham.ts
│   │   │   │       │   ├── SanPhamAnh.ts
│   │   │   │       │   ├── SuKienTruyXuat.ts
│   │   │   │       │   ├── TepTin.ts
│   │   │   │       │   ├── ThanhToan.ts
│   │   │   │       │   ├── ThuHoach.ts
│   │   │   │       │   ├── ThuHoiLoSanPham.ts
│   │   │   │       │   ├── TonKhoLo.ts
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
│   │   │   │   ├── danh-muc-san-pham
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-danh-muc-san-pham.dto.ts
│   │   │   │   │   │   ├── doi-trang-thai-danh-muc-san-pham.dto.ts
│   │   │   │   │   │   ├── phan-hoi-danh-muc-san-pham.dto.ts
│   │   │   │   │   │   ├── tao-danh-muc-san-pham.dto.ts
│   │   │   │   │   │   └── truy-van-danh-muc-san-pham.dto.ts
│   │   │   │   │   ├── danh-muc-san-pham.controller.ts
│   │   │   │   │   ├── danh-muc-san-pham.module.ts
│   │   │   │   │   └── danh-muc-san-pham.service.ts
│   │   │   │   ├── don-hang
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── phan-hoi-don-hang.dto.ts
│   │   │   │   │   │   └── tao-don-hang.dto.ts
│   │   │   │   │   ├── don-hang.controller.ts
│   │   │   │   │   ├── don-hang.module.ts
│   │   │   │   │   └── don-hang.service.ts
│   │   │   │   ├── gio-hang
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-muc-gio-hang.dto.ts
│   │   │   │   │   │   ├── checkout-preview.dto.ts
│   │   │   │   │   │   ├── phan-hoi-gio-hang.dto.ts
│   │   │   │   │   │   └── them-muc-gio-hang.dto.ts
│   │   │   │   │   ├── checkout-preview.service.ts
│   │   │   │   │   ├── gio-hang.controller.ts
│   │   │   │   │   ├── gio-hang.module.ts
│   │   │   │   │   └── gio-hang.service.ts
│   │   │   │   ├── hang-doi
│   │   │   │   │   ├── workers
│   │   │   │   │   │   ├── email.worker.ts
│   │   │   │   │   │   ├── he-thong.worker.ts
│   │   │   │   │   │   └── thong-bao.worker.ts
│   │   │   │   │   ├── canh-bao-het-han-ton-kho.service.ts
│   │   │   │   │   ├── hang-doi.config.ts
│   │   │   │   │   ├── hang-doi.constants.ts
│   │   │   │   │   ├── hang-doi.module.ts
│   │   │   │   │   └── hang-doi.service.ts
│   │   │   │   ├── kho
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-kho.dto.ts
│   │   │   │   │   │   ├── doi-trang-thai-kho.dto.ts
│   │   │   │   │   │   ├── phan-hoi-kho.dto.ts
│   │   │   │   │   │   ├── tao-kho.dto.ts
│   │   │   │   │   │   └── truy-van-kho.dto.ts
│   │   │   │   │   ├── kho.controller.ts
│   │   │   │   │   ├── kho.module.ts
│   │   │   │   │   └── kho.service.ts
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
│   │   │   │   │   │   ├── thu-hoi-lo-san-pham.dto.ts
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
│   │   │   │   ├── san-pham
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-bien-the-san-pham.dto.ts
│   │   │   │   │   │   ├── cap-nhat-san-pham.dto.ts
│   │   │   │   │   │   ├── doi-trang-thai-san-pham.dto.ts
│   │   │   │   │   │   ├── gan-anh-san-pham.dto.ts
│   │   │   │   │   │   ├── phan-hoi-anh-san-pham.dto.ts
│   │   │   │   │   │   ├── phan-hoi-bien-the-san-pham.dto.ts
│   │   │   │   │   │   ├── phan-hoi-san-pham-cong-khai.dto.ts
│   │   │   │   │   │   ├── phan-hoi-san-pham.dto.ts
│   │   │   │   │   │   ├── sap-xep-anh-san-pham.dto.ts
│   │   │   │   │   │   ├── tao-bien-the-san-pham.dto.ts
│   │   │   │   │   │   ├── tao-san-pham.dto.ts
│   │   │   │   │   │   ├── truy-van-san-pham-cong-khai.dto.ts
│   │   │   │   │   │   └── truy-van-san-pham.dto.ts
│   │   │   │   │   ├── anh-san-pham.controller.ts
│   │   │   │   │   ├── anh-san-pham.service.ts
│   │   │   │   │   ├── bien-the-san-pham.controller.ts
│   │   │   │   │   ├── bien-the-san-pham.service.ts
│   │   │   │   │   ├── san-pham-cong-khai.controller.ts
│   │   │   │   │   ├── san-pham-cong-khai.service.ts
│   │   │   │   │   ├── san-pham.controller.ts
│   │   │   │   │   ├── san-pham.module.ts
│   │   │   │   │   └── san-pham.service.ts
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
│   │   │   │   ├── thanh-toan
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── phan-hoi-thanh-toan.dto.ts
│   │   │   │   │   │   └── tao-thanh-toan.dto.ts
│   │   │   │   │   ├── thanh-toan.controller.ts
│   │   │   │   │   ├── thanh-toan.module.ts
│   │   │   │   │   └── thanh-toan.service.ts
│   │   │   │   ├── thu-hoach
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── cap-nhat-thu-hoach.dto.ts
│   │   │   │   │   │   ├── phan-hoi-thu-hoach.dto.ts
│   │   │   │   │   │   ├── tao-thu-hoach.dto.ts
│   │   │   │   │   │   └── truy-van-thu-hoach.dto.ts
│   │   │   │   │   ├── thu-hoach.controller.ts
│   │   │   │   │   ├── thu-hoach.module.ts
│   │   │   │   │   └── thu-hoach.service.ts
│   │   │   │   ├── ton-kho
│   │   │   │   │   ├── dto
│   │   │   │   │   │   ├── chuyen-kho.dto.ts
│   │   │   │   │   │   ├── dieu-chinh-ton-kho.dto.ts
│   │   │   │   │   │   ├── nhap-kho.dto.ts
│   │   │   │   │   │   ├── phan-hoi-bien-dong-ton-kho.dto.ts
│   │   │   │   │   │   ├── phan-hoi-canh-bao-het-han.dto.ts
│   │   │   │   │   │   ├── phan-hoi-dieu-chinh-ton-kho.dto.ts
│   │   │   │   │   │   ├── phan-hoi-giao-dich-ton-kho.dto.ts
│   │   │   │   │   │   ├── phan-hoi-ton-kho.dto.ts
│   │   │   │   │   │   ├── truy-van-canh-bao-het-han.dto.ts
│   │   │   │   │   │   ├── truy-van-giao-dich-ton-kho.dto.ts
│   │   │   │   │   │   ├── truy-van-ton-kho.dto.ts
│   │   │   │   │   │   └── xuat-kho.dto.ts
│   │   │   │   │   ├── dat-cho-ton-kho.constants.ts
│   │   │   │   │   ├── dat-cho-ton-kho.service.ts
│   │   │   │   │   ├── dat-cho-ton-kho.worker.ts
│   │   │   │   │   ├── fefo.service.ts
│   │   │   │   │   ├── giao-dich-ton-kho.controller.ts
│   │   │   │   │   ├── giao-dich-ton-kho.service.ts
│   │   │   │   │   ├── ton-kho.controller.ts
│   │   │   │   │   ├── ton-kho.module.ts
│   │   │   │   │   └── ton-kho.service.ts
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
│   │   │   │   ├── truy-xuat-cong-khai
│   │   │   │   │   ├── dto
│   │   │   │   │   │   └── phan-hoi-truy-xuat-cong-khai.dto.ts
│   │   │   │   │   ├── truy-xuat-cong-khai.controller.ts
│   │   │   │   │   ├── truy-xuat-cong-khai.module.ts
│   │   │   │   │   └── truy-xuat-cong-khai.service.ts
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
│   │   │   ├── anh-san-pham.e2e-spec.ts
│   │   │   ├── bien-dong-ton-kho.e2e-spec.ts
│   │   │   ├── bien-the-san-pham.e2e-spec.ts
│   │   │   ├── canh-bao-het-han-ton-kho.e2e-spec.ts
│   │   │   ├── checkout-preview.e2e-spec.ts
│   │   │   ├── chung-nhan.e2e-spec.ts
│   │   │   ├── cod-mock-payment.e2e-spec.ts
│   │   │   ├── create-order.e2e-spec.ts
│   │   │   ├── danh-muc-san-pham.e2e-spec.ts
│   │   │   ├── dat-cho-ton-kho.e2e-spec.ts
│   │   │   ├── fefo.e2e-spec.ts
│   │   │   ├── giao-dich-ton-kho.e2e-spec.ts
│   │   │   ├── gio-hang.e2e-spec.ts
│   │   │   ├── jest-e2e.json
│   │   │   ├── kho.e2e-spec.ts
│   │   │   ├── kiem-dinh-chat-luong.e2e-spec.ts
│   │   │   ├── lo-san-pham.e2e-spec.ts
│   │   │   ├── mua-vu.e2e-spec.ts
│   │   │   ├── nha-cung-cap.e2e-spec.ts
│   │   │   ├── nhat-ky-canh-tac.e2e-spec.ts
│   │   │   ├── nhat-ky-kiem-toan.e2e-spec.ts
│   │   │   ├── order-schema.e2e-spec.ts
│   │   │   ├── payment-domain.e2e-spec.ts
│   │   │   ├── phan-quyen.e2e-spec.ts
│   │   │   ├── qr-code.e2e-spec.ts
│   │   │   ├── redis-bullmq.e2e-spec.ts
│   │   │   ├── san-pham-cong-khai.e2e-spec.ts
│   │   │   ├── san-pham-search-filter.e2e-spec.ts
│   │   │   ├── san-pham.e2e-spec.ts
│   │   │   ├── schema-nen-tang.e2e-spec.ts
│   │   │   ├── su-kien-truy-xuat.e2e-spec.ts
│   │   │   ├── suc-khoe.e2e-spec.ts
│   │   │   ├── tep-tin.e2e-spec.ts
│   │   │   ├── thu-hoach.e2e-spec.ts
│   │   │   ├── thu-hoi-lo-san-pham.e2e-spec.ts
│   │   │   ├── ton-kho.e2e-spec.ts
│   │   │   ├── trang-trai-cong-khai-detail.e2e-spec.ts
│   │   │   ├── trang-trai.e2e-spec.ts
│   │   │   ├── truy-xuat-cong-khai.e2e-spec.ts
│   │   │   └── xac-thuc.e2e-spec.ts
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── prisma7.config.ts
│   │   ├── tsconfig.build.json
│   │   └── tsconfig.json
│   ├── customer-web
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── dang-nhap
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── gio-hang
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── san-pham
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── trang-trai
│   │   │   │   │   └── [id]
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── truy-xuat
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── providers.tsx
│   │   │   ├── components
│   │   │   │   ├── agri-badge.tsx
│   │   │   │   ├── agri-container.tsx
│   │   │   │   ├── agri-footer.tsx
│   │   │   │   ├── agri-header.tsx
│   │   │   │   ├── agri-skeleton.tsx
│   │   │   │   ├── chi-tiet-san-pham-content.tsx
│   │   │   │   ├── chi-tiet-trang-trai-content.tsx
│   │   │   │   ├── danh-sach-san-pham-content.tsx
│   │   │   │   ├── empty-state.tsx
│   │   │   │   ├── error-state.tsx
│   │   │   │   ├── farm-card.tsx
│   │   │   │   ├── gio-hang-content.tsx
│   │   │   │   ├── khung-ung-dung.tsx
│   │   │   │   ├── product-card.tsx
│   │   │   │   ├── trang-chu-content.tsx
│   │   │   │   ├── trang-thai-api.tsx
│   │   │   │   └── truy-xuat-content.tsx
│   │   │   ├── lib
│   │   │   │   ├── api-gio-hang.ts
│   │   │   │   └── phien-khach-hang.ts
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
│   │   │   │   ├── anhDanhMucSanPhamDto.ts
│   │   │   │   ├── anhKiemDinhDto.ts
│   │   │   │   ├── anhSanPhamCongKhaiDto.ts
│   │   │   │   ├── anhSanPhamDto.ts
│   │   │   │   ├── anhTrangTraiDto.ts
│   │   │   │   ├── bienTheGioHangDto.ts
│   │   │   │   ├── bienTheLedgerDto.ts
│   │   │   │   ├── bienTheSanPhamCongKhaiDto.ts
│   │   │   │   ├── bienTheSanPhamDto.ts
│   │   │   │   ├── bienTheTonKhoDto.ts
│   │   │   │   ├── canhBaoHetHanTonKhoItemDto.ts
│   │   │   │   ├── canhBaoHetHanTonKhoItemDtoTrangThai.ts
│   │   │   │   ├── capNhatBienTheSanPhamDto.ts
│   │   │   │   ├── capNhatChungNhanDto.ts
│   │   │   │   ├── capNhatDanhMucSanPhamDto.ts
│   │   │   │   ├── capNhatKhoDto.ts
│   │   │   │   ├── capNhatLoSanPhamDto.ts
│   │   │   │   ├── capNhatMuaVuDto.ts
│   │   │   │   ├── capNhatMuaVuDtoTrangThai.ts
│   │   │   │   ├── capNhatMucGioHangDto.ts
│   │   │   │   ├── capNhatNhaCungCapDto.ts
│   │   │   │   ├── capNhatNhatKyCanhTacDto.ts
│   │   │   │   ├── capNhatNhatKyCanhTacDtoLoaiSuKien.ts
│   │   │   │   ├── capNhatSanPhamDto.ts
│   │   │   │   ├── capNhatThuHoachDto.ts
│   │   │   │   ├── capNhatTrangTraiDto.ts
│   │   │   │   ├── checkoutPreviewDto.ts
│   │   │   │   ├── chungNhanBadgeSanPhamCongKhaiDto.ts
│   │   │   │   ├── chungNhanChiTietDto.ts
│   │   │   │   ├── chungNhanChiTietDtoTrangThaiXacMinh.ts
│   │   │   │   ├── chungNhanCongKhaiTrangTraiDto.ts
│   │   │   │   ├── chungNhanTomTatDto.ts
│   │   │   │   ├── chungNhanTomTatDtoTrangThaiXacMinh.ts
│   │   │   │   ├── chungNhanTruyXuatCongKhaiDto.ts
│   │   │   │   ├── chuyenKhoDto.ts
│   │   │   │   ├── dangKyDto.ts
│   │   │   │   ├── dangNhapDto.ts
│   │   │   │   ├── dangNhapDtoNenTang.ts
│   │   │   │   ├── danhMucChaRutGonDto.ts
│   │   │   │   ├── danhMucSanPhamCongKhaiDto.ts
│   │   │   │   ├── danhMucSanPhamDto.ts
│   │   │   │   ├── danhMucSanPhamRutGonDto.ts
│   │   │   │   ├── danhSachAnhSanPhamDto.ts
│   │   │   │   ├── danhSachBienTheSanPhamDto.ts
│   │   │   │   ├── danhSachChungNhanDto.ts
│   │   │   │   ├── danhSachDanhMucSanPhamDto.ts
│   │   │   │   ├── danhSachGiaoDichTonKhoDto.ts
│   │   │   │   ├── danhSachKhoDto.ts
│   │   │   │   ├── danhSachKiemDinhChatLuongDto.ts
│   │   │   │   ├── danhSachLoSanPhamDto.ts
│   │   │   │   ├── danhSachMuaVuDto.ts
│   │   │   │   ├── danhSachNhaCungCapDto.ts
│   │   │   │   ├── danhSachNhatKyCanhTacDto.ts
│   │   │   │   ├── danhSachSanPhamCongKhaiDto.ts
│   │   │   │   ├── danhSachSanPhamDto.ts
│   │   │   │   ├── danhSachSuKienTruyXuatDto.ts
│   │   │   │   ├── danhSachThuHoachDto.ts
│   │   │   │   ├── danhSachTonKhoLoDto.ts
│   │   │   │   ├── danhSachTrangTraiDto.ts
│   │   │   │   ├── datChoDonHangPhanHoiDto.ts
│   │   │   │   ├── datChoThanhToanPhanHoiDto.ts
│   │   │   │   ├── datLaiMatKhauDto.ts
│   │   │   │   ├── dieuChinhTonKhoDto.ts
│   │   │   │   ├── doiMatKhauDto.ts
│   │   │   │   ├── doiTrangThaiDanhMucSanPhamDto.ts
│   │   │   │   ├── doiTrangThaiKhoDto.ts
│   │   │   │   ├── doiTrangThaiNhaCungCapDto.ts
│   │   │   │   ├── doiTrangThaiNhaCungCapDtoTrangThai.ts
│   │   │   │   ├── doiTrangThaiSanPhamDto.ts
│   │   │   │   ├── doiTrangThaiTrangTraiDto.ts
│   │   │   │   ├── doiTrangThaiTrangTraiDtoTrangThai.ts
│   │   │   │   ├── donHangNhaCungCapPhanHoiDto.ts
│   │   │   │   ├── donHangPhanHoiDto.ts
│   │   │   │   ├── ganAnhSanPhamDto.ts
│   │   │   │   ├── ganVaiTroDto.ts
│   │   │   │   ├── ganVaiTroDtoMaVaiTro.ts
│   │   │   │   ├── giaoDichThanhToanPhanHoiDto.ts
│   │   │   │   ├── giaoDichTonKhoDto.ts
│   │   │   │   ├── giaoDichTonKhoDtoLoai.ts
│   │   │   │   ├── giaSanPhamCongKhaiDto.ts
│   │   │   │   ├── gioHangDto.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── itemCheckoutPreviewDto.ts
│   │   │   │   ├── ketQuaBienDongTonKhoDto.ts
│   │   │   │   ├── ketQuaCanhBaoHetHanTonKhoDto.ts
│   │   │   │   ├── ketQuaChuyenKhoDto.ts
│   │   │   │   ├── ketQuaDieuChinhTonKhoDto.ts
│   │   │   │   ├── ketQuaKiemDinhChatLuong.ts
│   │   │   │   ├── khaDungSanPhamCongKhaiDto.ts
│   │   │   │   ├── khoDto.ts
│   │   │   │   ├── khoLedgerDto.ts
│   │   │   │   ├── khoTonKhoDto.ts
│   │   │   │   ├── khoTonKhoDtoTrangThai.ts
│   │   │   │   ├── kiemDinhChatLuongChiTietDto.ts
│   │   │   │   ├── kiemDinhChatLuongChiTietDtoKetQua.ts
│   │   │   │   ├── kiemDinhChatLuongTomTatDto.ts
│   │   │   │   ├── kiemDinhChatLuongTomTatDtoKetQua.ts
│   │   │   │   ├── kiemDinhTruyXuatCongKhaiDto.ts
│   │   │   │   ├── lamMoiTokenDto.ts
│   │   │   │   ├── lamMoiTokenDtoNenTang.ts
│   │   │   │   ├── layCanhBaoHetHanTonKhoParams.ts
│   │   │   │   ├── layDanhSachChungNhanParams.ts
│   │   │   │   ├── layDanhSachChungNhanTrangThaiXacMinh.ts
│   │   │   │   ├── layDanhSachDanhMucSanPhamParams.ts
│   │   │   │   ├── layDanhSachGiaoDichTonKhoLoai.ts
│   │   │   │   ├── layDanhSachGiaoDichTonKhoParams.ts
│   │   │   │   ├── layDanhSachKhoParams.ts
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
│   │   │   │   ├── layDanhSachSanPhamCongKhaiKhaDung.ts
│   │   │   │   ├── layDanhSachSanPhamCongKhaiParams.ts
│   │   │   │   ├── layDanhSachSanPhamCongKhaiSapXep.ts
│   │   │   │   ├── layDanhSachSanPhamParams.ts
│   │   │   │   ├── layDanhSachSuKienTruyXuatParams.ts
│   │   │   │   ├── layDanhSachThuHoachParams.ts
│   │   │   │   ├── layDanhSachTonKhoParams.ts
│   │   │   │   ├── layDanhSachTrangTraiParams.ts
│   │   │   │   ├── layDanhSachTrangTraiTrangThai.ts
│   │   │   │   ├── layNhatKyKiemToanParams.ts
│   │   │   │   ├── laySanPhamTheoDanhMucCongKhaiKhaDung.ts
│   │   │   │   ├── laySanPhamTheoDanhMucCongKhaiParams.ts
│   │   │   │   ├── laySanPhamTheoDanhMucCongKhaiSapXep.ts
│   │   │   │   ├── laySanPhamTheoTrangTraiCongKhaiKhaDung.ts
│   │   │   │   ├── laySanPhamTheoTrangTraiCongKhaiParams.ts
│   │   │   │   ├── laySanPhamTheoTrangTraiCongKhaiSapXep.ts
│   │   │   │   ├── loaiSuKienCanhTac.ts
│   │   │   │   ├── loaiSuKienTruyXuat.ts
│   │   │   │   ├── loKiemDinhDto.ts
│   │   │   │   ├── loKiemDinhDtoTrangThai.ts
│   │   │   │   ├── loSanPhamDto.ts
│   │   │   │   ├── loSanPhamDtoTrangThai.ts
│   │   │   │   ├── loSanPhamLedgerDto.ts
│   │   │   │   ├── loSanPhamTonKhoDto.ts
│   │   │   │   ├── loSanPhamTonKhoDtoTrangThai.ts
│   │   │   │   ├── loSuKienTruyXuatDto.ts
│   │   │   │   ├── loTruyXuatCongKhaiDto.ts
│   │   │   │   ├── muaVuCongKhaiTrangTraiDto.ts
│   │   │   │   ├── muaVuCongKhaiTrangTraiDtoTrangThai.ts
│   │   │   │   ├── muaVuDto.ts
│   │   │   │   ├── muaVuDtoTrangThai.ts
│   │   │   │   ├── muaVuLoSanPhamDto.ts
│   │   │   │   ├── muaVuLoSanPhamDtoTrangThai.ts
│   │   │   │   ├── muaVuNhatKyCanhTacDto.ts
│   │   │   │   ├── muaVuNhatKyCanhTacDtoTrangThai.ts
│   │   │   │   ├── muaVuThuHoachDto.ts
│   │   │   │   ├── muaVuThuHoachDtoTrangThai.ts
│   │   │   │   ├── muaVuTruyXuatCongKhaiDto.ts
│   │   │   │   ├── mucDonHangDuKienDto.ts
│   │   │   │   ├── mucDonHangPhanHoiDto.ts
│   │   │   │   ├── mucGioHangDto.ts
│   │   │   │   ├── nguoiDungXacThucDto.ts
│   │   │   │   ├── nguoiKiemDinhDto.ts
│   │   │   │   ├── nguoiThuHoiLoSanPhamDto.ts
│   │   │   │   ├── nhaCungCapCheckoutPreviewDto.ts
│   │   │   │   ├── nhaCungCapDto.ts
│   │   │   │   ├── nhaCungCapDtoTrangThai.ts
│   │   │   │   ├── nhaCungCapGioHangDto.ts
│   │   │   │   ├── nhaCungCapTrangTraiDto.ts
│   │   │   │   ├── nhapKhoDto.ts
│   │   │   │   ├── nhatKyCanhTacDto.ts
│   │   │   │   ├── nhatKyCanhTacDtoLoaiSuKien.ts
│   │   │   │   ├── nhatKyCanhTacTruyXuatCongKhaiDto.ts
│   │   │   │   ├── nhatKyKiemToanDto.ts
│   │   │   │   ├── nhatKyKiemToanDtoMetadata.ts
│   │   │   │   ├── nhatKyKiemToanDtoSau.ts
│   │   │   │   ├── nhatKyKiemToanDtoTacNhanId.ts
│   │   │   │   ├── nhatKyKiemToanDtoThucTheId.ts
... cây thư mục đã được rút gọn ...
```

## 3. Module Backend phát hiện được

- `chung-nhan`
- `danh-muc-san-pham`
- `don-hang`
- `gio-hang`
- `hang-doi`
- `kho`
- `kiem-dinh-chat-luong`
- `lo-san-pham`
- `mua-vu`
- `nha-cung-cap`
- `nhat-ky-canh-tac`
- `nhat-ky-kiem-toan`
- `phan-quyen`
- `qr-code`
- `san-pham`
- `su-kien-truy-xuat`
- `suc-khoe`
- `tep-tin`
- `thanh-toan`
- `thu-hoach`
- `ton-kho`
- `trang-trai`
- `truy-xuat-cong-khai`
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
