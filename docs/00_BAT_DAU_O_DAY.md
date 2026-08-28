# 00 – BẮT ĐẦU Ở ĐÂY

> File này là điểm vào bắt buộc cho mọi ChatGPT, Coding Agent hoặc thành viên mới của dự án.

---

## 1. Không tự suy đoán dự án

Trước khi sửa code, phải đọc:

```text
1. docs/TRANG_THAI_DU_AN.md
2. docs/QUYET_DINH_KIEN_TRUC.md
3. docs/QUY_TAC_CHO_AI.md
4. docs/KE_HOACH_CAC_PHIEN_AI.md
5. docs/BOI_CANH_DU_AN_CHO_GPT.md
6. Quy_uoc_code_tieng_Viet_AgriMarket.md
7. Phan_tich_cong_nghe_AgriMarket_UI_hien_dai.md
8. Phan_tich_thiet_ke_giao_dien_AgriMarket.md
9. Dac_ta_yeu_cau_va_UML_AgriMarket_3_Actor.md
```

Nếu tên file đặc tả hiện tại có `(1)` thì đọc đúng file hiện có trong repo, không tự tạo bản trùng.

---

## 2. Mục tiêu hệ thống

AgriMarket là nền tảng bán nông sản đa nền tảng có:

```text
Customer Mobile
Customer Web
Admin Web
Backend API
MySQL
Traceability
Inventory by Batch
FEFO
Order
Payment
Complaint
Refund
```

---

## 3. Actor

Chỉ có 3 Actor nghiệp vụ chính:

```text
Khách hàng
Nhân viên
Admin
```

Không tự thêm Actor Nhà cung cấp nếu chưa có quyết định mới.

Nhà cung cấp/Trang trại hiện là đối tượng nghiệp vụ do Nhân viên/Admin quản lý.

---

## 4. Stack không được tự đổi

```text
Mobile:
Expo + React Native + gluestack-ui

Customer Web:
Next.js + Mantine

Admin Web:
Next.js + Ant Design ProComponents

Backend:
NestJS

Database:
MySQL

ORM:
Prisma

API:
REST + Swagger/OpenAPI

API Client:
Orval + TanStack Query
```

---

## 5. Quy ước tiếng Việt

Code nghiệp vụ:

```text
san-pham
don-hang
ton-kho
lo-san-pham
truy-xuat
```

Biến/hàm:

```text
layDanhSachSanPham
taoDonHang
kiemTraTonKho
```

UI/comment/docs:

```text
Tiếng Việt có dấu
```

Framework convention giữ nguyên:

```text
Controller
Service
Module
DTO
Hook
Props
page.tsx
layout.tsx
```

---

## 6. Cách chọn phiên tiếp theo

Đọc:

`docs/TRANG_THAI_DU_AN.md`

Sau đó tìm đúng mã phiên trong:

`docs/KE_HOACH_CAC_PHIEN_AI.md`

Chỉ làm **một phiên** tại một thời điểm.

---

## 7. Không làm quá phạm vi

Ví dụ đang làm:

```text
PHIEN-023 – Lô sản phẩm
```

thì không tự làm:

```text
Payment
AI
Recommendation
Shipping
```

trừ dependency tối thiểu để phiên hiện tại chạy.

---

## 8. Trước khi tạo file/package

Phải kiểm tra repo trước:

```text
File đã tồn tại chưa?
Module đã có chưa?
Package đã cài chưa?
Có utility tương tự chưa?
```

Không tạo trùng.

---

## 9. Sau khi code

Phải chạy tối thiểu những lệnh phù hợp:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Không cần chạy lệnh không tồn tại, nhưng phải ghi rõ lệnh nào đã chạy.

---

## 10. Kết thúc phiên

Cập nhật:

```text
docs/TRANG_THAI_DU_AN.md
docs/NHAT_KY_PHIEN_AI.md
docs/BOI_CANH_DU_AN_CHO_GPT.md
```

và trả báo cáo:

```text
Phiên hoàn thành
File tạo
File sửa
API mới
DB thay đổi
Test
Lỗi tồn đọng
Phiên tiếp theo
```

---

## 11. Prompt dùng cho tab mới

```text
Hãy tiếp tục dự án AgriMarket từ repository hiện tại.

Trước khi code:
- đọc docs/00_BAT_DAU_O_DAY.md;
- đọc docs/TRANG_THAI_DU_AN.md;
- đọc docs/QUYET_DINH_KIEN_TRUC.md;
- đọc docs/QUY_TAC_CHO_AI.md;
- đọc docs/KE_HOACH_CAC_PHIEN_AI.md;
- đọc docs/BOI_CANH_DU_AN_CHO_GPT.md.

Không tự thay stack, kiến trúc hoặc naming convention.

Xác định đúng phiên tiếp theo chưa hoàn thành và chỉ làm phiên đó.

Sau khi xong:
- chạy lint/typecheck/test/build phù hợp;
- cập nhật TRANG_THAI_DU_AN.md;
- cập nhật NHAT_KY_PHIEN_AI.md;
- cập nhật BOI_CANH_DU_AN_CHO_GPT.md;
- ghi rõ phiên tiếp theo.
```
