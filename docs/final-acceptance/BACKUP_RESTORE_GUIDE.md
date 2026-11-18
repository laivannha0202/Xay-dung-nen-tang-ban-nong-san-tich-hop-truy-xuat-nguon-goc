# Sao lưu và phục hồi

Đã chạy thật ngày 2026-11-18: sao lưu nguội toàn bộ `infra/pgdata`, khởi động bản sao ở cổng 5545,
đọc lại dữ liệu, xác nhận **45 bảng / 23 đơn / 65 lô / đơn mới nhất `AGM-DEMO-YENMACH`**, rồi xoá
bản sao.

## 1. Vì sao là sao lưu nguội

Repo dùng PostgreSQL nhúng; bộ cài chỉ có `initdb.exe`, `pg_ctl.exe`, `postgres.exe` — **không có
`pg_dump`/`pg_restore`**. Cách đúng là dừng PostgreSQL rồi sao chép thư mục dữ liệu. Nếu bạn có bộ
PostgreSQL đầy đủ, phương án `pg_dump` ở §5 cho phép sao lưu nóng.

## 2. Sao lưu (đã kiểm)

```powershell
# 1. Dừng DB — bắt buộc, nếu không bản sao sẽ hỏng
pnpm db:down

# 2. Sao chép thư mục dữ liệu, đặt tên theo ngày
robocopy infra\pgdata backup\pgdata-2026-11-18 /MIR
#   Linux/macOS: rsync -a infra/pgdata backup/pgdata-2026-11-18/

# 3. Bật lại DB
pnpm db:up
```

Kèm theo bản sao hai thứ không nằm trong DB:

```powershell
robocopy apps\api\uploads backup\uploads-2026-11-18 /MIR
copy apps\api\.env backup\env-2026-11-18.txt
```

`uploads/` chứa ảnh bằng chứng, chứng nhận, ảnh khiếu nại — mất thì đường dẫn trong DB trỏ vào hư
không.

## 3. Phục hồi (đã kiểm)

```powershell
pnpm db:down
robocopy backup\pgdata-2026-11-18 infra\pgdata /MIR
del infra\pgdata\postmaster.pid      # pid của máy cũ, phải xoá trước khi khởi động
robocopy backup\uploads-2026-11-18 apps\api\uploads /MIR
pnpm db:up
```

Kiểm tra sau phục hồi:

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema='public';  -- 45
SELECT count(*) FROM orders;                                                 -- theo bản sao
SELECT code FROM orders ORDER BY code DESC LIMIT 1;
```

Hoặc chạy `node scripts/acceptance-walk.mjs` — 38/38 bước nghĩa là API, schema và dữ liệu đều sống.

## 4. Lịch đề xuất

| Tần suất | Việc |
|---|---|
| Hằng ngày (demo) | sao lưu nguội + `uploads/` |
| Trước mỗi buổi bảo vệ | một bản sao lưu đầy đủ + chạy thử phục hồi ra cổng khác (5545) |
| Hằng tháng | giữ 3 bản gần nhất, xoá bản cũ |

Quy tắc: **bản sao chưa được phục hồi thử thì chưa phải bản sao lưu.** Quy trình ở §3 mất khoảng 1
phút; chạy thử ít nhất một lần trước khi tin vào nó.

## 5. Nếu có `pg_dump` (PostgreSQL đầy đủ)

Sao lưu nóng, không cần dừng dịch vụ:

```bash
pg_dump --no-owner --format=custom \
  "postgres://agri:agri@127.0.0.1:5544/agrimarket" > backup/agrimarket-2026-11-18.dump

pg_restore --no-owner --clean --if-exists -d \
  "postgres://agri:agri@127.0.0.1:5544/agrimarket" backup/agrimarket-2026-11-18.dump
```

## 6. Điều không được làm

- Không sao chép `infra/pgdata` khi PostgreSQL đang chạy (bản sao sẽ không nhất quán).
- Không khôi phục bản sao của máy khác mà giữ `postmaster.pid` cũ.
- Không chạy `seed` trên DB thật khi chưa sao lưu — `seed` có chế độ TRUNCATE cho DB test/demo, và
  dữ liệu thật sẽ mất.
