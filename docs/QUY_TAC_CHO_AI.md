# QUY TẮC CHO AI / CODING AGENT

## 1. Trước khi làm

Bắt buộc đọc:

```text
00_BAT_DAU_O_DAY.md
TRANG_THAI_DU_AN.md
QUYET_DINH_KIEN_TRUC.md
KE_HOACH_CAC_PHIEN_AI.md
BOI_CANH_DU_AN_CHO_GPT.md
```

Sau đó kiểm tra code thật.

---

## 2. Chỉ làm đúng một phiên

Không code nhiều giai đoạn cùng lúc.

Nếu phiên hiện tại là:

```text
PHIEN-002
```

chỉ làm phạm vi PHIEN-002.

---

## 3. Không tự đổi công nghệ

Cấm tự đổi:

```text
NestJS
MySQL
Prisma
Mantine
Ant Design Pro
gluestack-ui
REST
Swagger
Orval
TanStack Query
Zustand
```

---

## 4. Không tạo trùng

Trước khi tạo:

```text
file
folder
component
hook
DTO
service
helper
enum
package
```

phải search repo.

---

## 5. Không cài package tùy tiện

Trước `pnpm add`:

```text
Kiểm tra package.json
Kiểm tra package đang có
Kiểm tra UI library hiện tại
```

Nếu thêm package mới phải ghi lý do ở báo cáo cuối phiên.

---

## 6. Code ngắn gọn

Ưu tiên:

```text
early return
hàm ngắn
tên rõ
ít nesting
ít tầng
```

Tránh:

```text
wrapper vô nghĩa
generic quá mức
design pattern không cần
```

---

## 7. Tiếng Việt

Tên nghiệp vụ:

```text
tieng Viet khong dau
```

UI/comment/docs:

```text
Tiếng Việt có dấu
```

---

## 8. Frontend

Không tự viết lại component primitive nếu library có.

Customer Web:

```text
Mantine trước
```

Admin:

```text
Ant Design Pro trước
```

Mobile:

```text
gluestack-ui trước
```

---

## 9. API

Không duplicate:

```text
response type
axios wrapper
query hook
```

nếu Orval sinh được.

---

## 10. Backend

Controller:

```text
nhận request
validate
gọi service
trả response
```

Business logic đặt ở Service/domain logic phù hợp.

---

## 11. Database

Không sửa production database thủ công.

Dùng Prisma migration.

---

## 12. Transaction

Các flow sau phải xem xét transaction:

```text
checkout
inventory reservation
order create
FEFO allocation
refund
inventory adjustment
settlement
```

---

## 13. Security

Không commit:

```text
.env
secret
password
API key
JWT secret
private key
GitHub token
```

---

## 14. Test

Không báo hoàn thành nếu chưa chạy kiểm tra phù hợp.

Ưu tiên:

```text
lint
typecheck
unit/integration test
build
```

---

## 15. Sau mỗi phiên

Cập nhật:

```text
TRANG_THAI_DU_AN.md
NHAT_KY_PHIEN_AI.md
BOI_CANH_DU_AN_CHO_GPT.md
```

---

## 16. Báo cáo chuẩn

```markdown
## Phiên hoàn thành
PHIEN-XXX

## Đã làm
...

## File tạo
...

## File sửa
...

## Dependency mới
...

## API mới
...

## Database
...

## Test
...

## Lỗi tồn đọng
...

## Phiên tiếp theo
PHIEN-YYY
```

---

## 17. Nếu phát hiện tài liệu và code mâu thuẫn

Không tự chọn một phía.

Phải:

1. Chỉ ra mâu thuẫn.
2. Ưu tiên quyết định mới nhất trong `QUYET_DINH_KIEN_TRUC.md`.
3. Nếu vẫn không rõ, hỏi người dùng trước khi thay đổi lớn.

---

## 18. Không “dọn code” ngoài scope

Không refactor module khác chỉ vì thấy style chưa đẹp.

Chỉ sửa nếu:

```text
cần cho phiên hiện tại
bug
security
build fail
```

và phải ghi rõ.

---

## 19. Không xóa tính năng âm thầm

Mọi xóa API/schema/module phải ghi rõ ảnh hưởng.

---

## 20. Definition of Done cho một phiên

Phiên chỉ hoàn thành khi:

```text
[x] Code đúng scope
[x] Không phá convention
[x] Không thêm dependency thừa
[x] Lint/typecheck phù hợp
[x] Test phù hợp
[x] Build phù hợp
[x] Docs trạng thái cập nhật
[x] Phiên tiếp theo được xác định
```
