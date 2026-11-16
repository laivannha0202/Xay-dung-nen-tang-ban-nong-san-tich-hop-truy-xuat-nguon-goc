# ADR — nhật ký quyết định kiến trúc

## ADR-01: SQL thuần với `pg`, không ORM

**Bối cảnh.** Cần giao dịch nguyên tử cho việc giữ chỗ tồn kho và phân bổ lô nhiều dòng.

**Quyết định.** Truy vấn viết tay trong `apps/api/src/db.ts` (`q`, `tx`, `txq`), migration SQL thuần.

**Lý do.** Bất biến chống bán quá tồn là một câu `UPDATE … WHERE on_hand_qty - reserved_qty >= $n RETURNING`, không biểu diễn tự nhiên qua ORM. Prisma codegen cũng hay hỏng trên Windows ở dự án này.

**Hệ quả.** Phải tự viết kiểu trả về; bù lại không có magic, dễ soi `EXPLAIN`, và migration là một tệp đọc được.

## ADR-02: scrypt của `node:crypto` thay vì argon2

**Bối cảnh.** Đặc tả yêu cầu bcrypt/Argon2. Cả hai đều là gói native.

**Quyết định.** `scrypt` dựng sẵn, định dạng `scrypt$N$salt$hash`, N = 16384.

**Lý do.** Không thêm dependency biên dịch; scrypt là KDF có kiểm soát bộ nhớ, phù hợp thay thế bcrypt.

**Hệ quả.** Định dạng băm riêng; nếu cần chuyển sang Argon2 thì đọc `$` đầu để nhận diện phiên bản và nâng cấp dần khi người dùng đăng nhập.

## ADR-03: PostgreSQL nhúng, không Docker

**Bối cảnh.** Máy phát triển Windows không có Docker ổn định, không có PostgreSQL hệ thống.

**Quyết định.** `embedded-postgres` 18.6, dữ liệu ở `infra/pgdata`, cổng 5544, `initdbFlags: ['--encoding=UTF8','--locale=C']`.

**Lý do.** `pnpm install` là đủ để có cơ sở dữ liệu thật; không cần quyền quản trị.

**Hệ quả.** `postgres.exe` giữ DLL trong `node_modules` — không `rm -rf node_modules` khi tiến trình còn chạy. Dữ liệu nằm trong repo (đã gitignore).

## ADR-04: Tồn khả dụng là biểu thức, không phải cột

**Quyết định.** Không có cột `available`. Mọi nơi dùng `on_hand_qty - reserved_qty` của các lô thoả `SELLABLE_SQL`.

**Lý do.** Cột dẫn xuất sẽ lệch khỏi sự thật ngay lần đầu ai đó quên cập nhật. Biểu thức thì không thể sai.

**Hệ quả.** Đọc catalog tốn một phép `LEFT JOIN LATERAL`; chấp nhận được ở quy mô đồ án (41 bảng, vài nghìn dòng).

## ADR-05: CSRF bằng header tĩnh, không kho token

**Quyết định.** Mutation dùng cookie phải kèm `x-agri-csrf: 1`; client Bearer được miễn.

**Lý do.** Cookie `SameSite=Lax` đã chặn phần lớn CSRF; header tuỳ biến buộc preflight, và một form cross-site không đặt được header này. Kho token song song là thừa.

**Hệ quả.** Không bảo vệ được trình duyệt bị XSS (XSS đọc được mọi thứ); chấp nhận trong phạm vi đồ án.

## ADR-06: `Idempotency-Key` lưu trong DB, không trong bộ nhớ

**Quyết định.** Bảng `idempotency_records (customer_id, key)` ghi trong cùng transaction với đơn.

**Lý do.** Ghi cùng transaction thì replay hoặc trùng khoá đều nhất quán kể cả khi tiến trình chết giữa đường. Bộ nhớ trong tiến trình mất khi restart.

## ADR-07: Ứng dụng di động không dùng `expo-router`

**Quyết định.** Một `App.tsx` giữ tab + stack bằng `useState`; điều hướng là `nav.push`/`nav.pop` trong `src/nav.ts`.

**Lý do.** Peer graph của `expo-router` 58 kéo theo `@expo/ui`, `react-native-reanimated`, `react-native-worklets`, `react-server-dom-webpack`, `expo-symbols` — hơn chục gói native chỉ để có 5 tab.

**Hệ quả.** Không có deep-link tự động, không có URL trên bản web. Với 5 tab và ba màn con thì đánh đổi này rẻ hơn nhiều.

## ADR-08: Ứng dụng di động dùng Bearer, không cookie

**Quyết định.** `POST /auth/login` trả `{token, user}`; ứng dụng lưu bằng `expo-secure-store` (bản web: `localStorage` qua `src/storage.ts`).

**Lý do.** Cookie trong React Native không đáng tin cậy trên Android; Bearer hoạt động đồng nhất mọi nền tảng và miễn CSRF.

**Hệ quả.** Token nằm trên thiết bị; rò rỉ là mất phiên cho tới khi hết hạn (7 ngày) hoặc `token_version` đổi.

## ADR-09: PDF nhúng font tĩnh Roboto-Regular

**Quyết định.** Dùng `apps/api/assets/Roboto-Regular.ttf` (tĩnh), không dùng Noto biến thiên.

**Lý do.** Font biến thiên không có bảng `glyf` đầy đủ khiến PDFKit render sai dấu tiếng Việt; Roboto tĩnh dựng đúng mọi glyph cần.

**Hệ quả.** Không có chữ đậm trong PDF; chấp nhận được vì tiêu đề đã phân cấp bằng cỡ chữ.

## ADR-10: FIFO mặc định, FEFO là cấu hình

**Quyết định.** `buildQuote` sắp lô theo `inventory.received_at` (FIFO), phá hoà bằng `batch.code`. FEFO chỉ khi `settings.allocation_strategy = 'FEFO'`.

**Lý do.** P1 yêu cầu FIFO theo thời điểm nhập; FEFO là P2 nhưng cùng một tham số sắp xếp nên rẻ.

**Hệ quả.** Đổi chiến lược chỉ cần `PATCH /admin/settings`, không cần deploy.
