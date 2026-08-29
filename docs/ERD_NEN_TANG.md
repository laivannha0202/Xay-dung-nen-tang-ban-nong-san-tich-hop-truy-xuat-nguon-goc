# ERD NỀN TẢNG – PHIEN-011

## Phạm vi

ERD này chỉ mô tả 8 bảng nền tảng của PHIEN-011. Chưa bao gồm các bảng
nghiệp vụ nhà cung cấp, trang trại, lô, sản phẩm, tồn kho, đơn hàng hay thanh toán.

```mermaid
erDiagram
    nguoi_dung ||--o| khach_hang : "co ho so"
    nguoi_dung ||--o| nhan_vien : "co ho so"
    nguoi_dung ||--o{ dia_chi : "co"
    nguoi_dung ||--o{ nguoi_dung_vai_tro : "duoc gan"
    vai_tro ||--o{ nguoi_dung_vai_tro : "gan cho"
    vai_tro ||--o{ vai_tro_quyen : "co"
    quyen ||--o{ vai_tro_quyen : "thuoc"

    nguoi_dung {
        char_36 id PK
        varchar_191 email UK
        varchar_20 so_dien_thoai UK
        varchar_255 mat_khau_hash
        varchar_150 ho_ten
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    khach_hang {
        char_36 id PK
        char_36 nguoi_dung_id FK,UK
        date ngay_sinh
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    nhan_vien {
        char_36 id PK
        char_36 nguoi_dung_id FK,UK
        varchar_50 ma_nhan_vien UK
        varchar_100 chuc_danh
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    vai_tro {
        char_36 id PK
        varchar_50 ma UK
        varchar_100 ten
        varchar_255 mo_ta
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    quyen {
        char_36 id PK
        varchar_100 ma UK
        varchar_150 ten
        varchar_255 mo_ta
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    vai_tro_quyen {
        char_36 id PK
        char_36 vai_tro_id FK
        char_36 quyen_id FK
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    nguoi_dung_vai_tro {
        char_36 id PK
        char_36 nguoi_dung_id FK
        char_36 vai_tro_id FK
        enum trang_thai
        datetime created_at
        datetime updated_at
    }

    dia_chi {
        char_36 id PK
        char_36 nguoi_dung_id FK
        varchar_150 ten_nguoi_nhan
        varchar_20 so_dien_thoai
        varchar_255 dong_dia_chi
        varchar_120 phuong_xa
        varchar_120 quan_huyen
        varchar_120 tinh_thanh
        varchar_20 ma_buu_chinh
        boolean mac_dinh
        enum trang_thai
        datetime created_at
        datetime updated_at
    }
```

## Quyết định

- ID dùng UUIDv7 do Prisma sinh, lưu `CHAR(36)` trên MySQL.
- Prisma Client dùng model/field tiếng Việt không dấu theo camelCase/PascalCase.
- Database dùng tên bảng/cột snake_case qua `@@map` và `@map`.
- `khach_hang` và `nhan_vien` là hồ sơ chuyên biệt 1-1 với `nguoi_dung`.
- `vai_tro_quyen` và `nguoi_dung_vai_tro` có UUID riêng và unique compound
  để vừa chống trùng vừa cho phép mở rộng trạng thái/audit về sau.
- `dia_chi` thuộc `nguoi_dung`; một người có thể có nhiều địa chỉ.
- PHIEN-011 chỉ tạo nền tảng dữ liệu. Logic Auth nằm ở PHIEN-012,
  PermissionGuard/RBAC nằm ở PHIEN-013.
