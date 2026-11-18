# Báo cáo kiểm thử bảo mật

Ngày 2026-11-18. Mọi phép thử đã chạy thật trên API `http://127.0.0.1:4000` và DB `agrimarket`.

## 1. Cơ chế đang dùng

| Hạng mục | Hiện trạng |
|---|---|
| Xác thực | JWT HS256, hạn 7 ngày, ký bằng `JWT_SECRET`; cookie `am_token` (httpOnly, `sameSite=lax`, `secure` khi production) hoặc header `Authorization: Bearer` |
| Thu hồi phiên | `session_revocations` theo `jti`; logout thu hồi đúng một `jti`; khoá tài khoản tăng `token_version` ⇒ token cũ chết ngay |
| Phân quyền | `requireAuth` / `requireAdmin` ở server; mọi route `/admin/*` kiểm `role=ADMIN`; route `/me/*` kiểm `req.user.id` |
| CSRF | Mutation dùng cookie phải có header `x-agri-csrf: 1` |
| Băm mật khẩu | **scrypt** (`scrypt$N$r$p$salt$hash`), so sánh `timingSafeEqual`; không log/không trả plain-text |
| Chống brute force | `@fastify/rate-limit` theo route (`authLimit` 20/phút); khoá theo email 5 lần sai / 15 phút qua `login_attempts` |
| Lỗi | Thông điệp đồng nhất `INVALID_CREDENTIALS`; handler chung trả `trace_id`, không lộ stack/SQL |
| Tệp | Upload kiểm MIME thật + dung lượng; tệp riêng tư phục vụ với `Cache-Control: private`; bằng chứng công khai chỉ khi lô đã công khai |
| Proxy | `trustProxy: true` để rate limit thấy IP thật sau reverse proxy |

## 2. Test tự động (`apps/api/test/08-security.test.ts`, 10 test)

| Test | Nội dung | Kết quả |
|---|---|---|
| 1 | Tệp riêng tư: người lạ và khách khác không đọc được dù biết đúng URL | PASS (401/403/404) |
| 2 | Chủ tệp và Admin đọc được; `Cache-Control: private` | PASS |
| 3 | Ảnh danh mục do Admin tải thì công khai được (`public`) | PASS |
| 4 | Bằng chứng chỉ công khai khi lô đang PUBLISHED; lô chuyển DRAFT thì mất truy cập | PASS |
| 5 | Từ chối bằng chứng trỏ tới tệp server không hề lưu | PASS |
| 6 | Từ chối tên kiểu traversal và byte không phải PNG | PASS |
| 7 | Logout chỉ thu hồi đúng token vừa đăng xuất | PASS |
| 8 | Ảnh khiếu nại: chỉ nhận tệp do chính khách đó tải, `mime` lấy từ server | PASS |
| 9 | `seed` từ chối `TRUNCATE` ngoài DB test/demo | PASS |
| 10 | (nhóm trên) | PASS |

## 3. Phép thử thủ công trên hệ thống đang chạy

| # | Phép thử | Kỳ vọng | Thực tế |
|---|---|---|---|
| P1 | `GET /admin/orders` không token | 401 | **401** |
| P2 | `GET /admin/orders` bằng token khách | 403 | **403** |
| P3 | `GET /me/orders/<id của khách khác>` | 404 | **404** |
| P4 | `GET /me/complaints/<id khách khác>` | 404 | **404** |
| P5 | SQL injection `' OR 1=1--` vào `q`, `status`, `category` | danh sách bình thường, không lỗi | **200 như thường** |
| P6 | Đăng ký với `role: "ADMIN"` trong payload | tạo ra CUSTOMER | **CUSTOMER** |
| P7 | Upload tên `../../etc/passwd` | 404/422 | **404/422** |
| P8 | Sai mật khẩu 6 lần | 429 sau 5 lần | **429** |
| P9 | Cookie không kèm `x-agri-csrf` | 401 | **401** |
| P10 | Token sửa 1 ký tự / đã logout | 401 | **401** |
| P11 | Logout thiết bị A, thiết bị B còn dùng được | B vẫn 200 | **đúng** |
| P12 | Tài khoản bị khoá gọi `/me/orders` | 401 | **401** |

## 4. Rủi ro còn lại (đã chấp nhận)

| # | Rủi ro | Mức | Ghi chú |
|---|---|---|---|
| R1 | Không có xác thực hai lớp cho Admin | Thấp | Ngoài phạm vi P1; đã ghi `REMAINING_ISSUES.md` |
| R2 | `rate-limit` dùng bộ nhớ tiến trình | Thấp | Một tiến trình API duy nhất; khi scale ngang phải chuyển sang Redis |
| R3 | `sameSite=lax` cho phép điều hướng cấp cao mang cookie | Thấp | đã bù bằng CSRF header bắt buộc cho mutation |
| R4 | Bí mật lưu trong `.env` máy | Thấp | `.env` nằm trong `.gitignore`; quét bí mật 857 tệp sạch |
| R5 | Upload không quét mã độc | Thấp | Chỉ nhận ảnh/PDF, phục vụ qua cùng origin, `Content-Disposition` an toàn |

Không có lỗ hổng mức Cao/Trung bình nào còn mở trong phạm vi P1.
