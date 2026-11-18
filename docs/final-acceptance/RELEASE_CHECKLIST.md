# Danh sách kiểm tra phát hành

Nhánh phát hành: `feat/premium-visual-redesign-v5` · Ngày 2026-11-18

## 1. Cổng bắt buộc (đã chạy)

| # | Cổng | Lệnh | Kết quả |
|---|---|---|---|
| 1 | Kiểu dữ liệu | `pnpm -r typecheck` | PASS 6/6 |
| 2 | Test API | `cd apps/api && npx vitest run` | PASS 12 file / 62 test |
| 3 | Cổng repo | `pnpm verify:local` | PASS 10/10 |
| 4 | Đầu-cuối | `pnpm e2e:local` | PASS 10/10 |
| 5 | Chuỗi nghiệp vụ | `node scripts/acceptance-walk.mjs` | PASS 38/38 |
| 6 | Migration | `cd apps/api && npx tsx src/scripts/migrate.ts` | 9/9 đã áp, không lỗi |
| 7 | Sao lưu/phục hồi | sao lưu nguội + dựng lại cổng 5545 | 45 bảng, 23 đơn, 65 lô khớp |
| 8 | Quét bí mật | trong `verify:local` | 857 tệp, 0 phát hiện |

## 2. Kiểm tra dữ liệu trước khi bàn giao

| # | Kiểm | Cách | Trạng thái |
|---|---|---|---|
| 1 | Không tồn âm / giữ chỗ quá tồn | truy vấn DB | 0 dòng |
| 2 | Giữ chỗ khớp phân bổ | `SUM(inventory.reserved_qty)` vs allocation ACTIVE | 6 = 6 |
| 3 | Đơn huỷ không giữ tồn | truy vấn | 0 dòng |
| 4 | Đơn PAID có dòng thanh toán | truy vấn | 0 dòng thiếu |
| 5 | Có dữ liệu cho mọi màn demo | 65 lô, 23 đơn (7 trạng thái), 11 đánh giá, 1 khiếu nại, 1 hoàn tiền, 4 thu hồi | đủ |
| 6 | Tài khoản demo đăng nhập được | Admin + 2 khách | OK |

## 3. Kiểm tra giao diện (ảnh chụp)

`docs/screenshots/final/` — f1 dashboard, f2 lô hàng, f3 tồn kho, f4 chi tiết lô, f5 thu hồi,
f6 báo cáo, f7 thanh toán, f8 khiếu nại, f9 cài đặt/104 phường, f10 danh mục, f11 trang truy xuất,
f12 đơn của tôi, f13 chi tiết đơn, f14 thanh toán, f15–f16 Expo, f17 ảnh sản phẩm.

## 4. Việc còn phải làm trước khi bảo vệ

| # | Việc | Chặn? |
|---|---|---|
| 1 | Chạy `NATIVE_TESTING_GUIDE.md` trên **một** máy Android thật, chụp màn hình mục 15/16/24 | Không chặn bảo vệ web; cần nếu hội đồng yêu cầu bằng chứng mobile |
| 2 | Đọc lại `docs/final-acceptance/DEMO_SCENARIO.md` và thử đúng 5 phút | Không |
| 3 | Kiểm tra máy chiếu: `localhost:3000` và `:3001` (không dùng `127.0.0.1`) | Có — CORS |

## 5. Không được làm khi phát hành

- Không `git push --force`; không merge `main` khi chưa được duyệt.
- Không reset `agrimarket`; không chạy `seed` trên DB thật khi chưa sao lưu.
- Không bật GitHub Actions cho nhánh này (theo yêu cầu).
- Không đổi `JWT_SECRET` sau khi phát hành (mọi phiên sẽ chết — chấp nhận được nhưng phải báo trước).

## 6. Lệnh phát hành

```bash
git push origin feat/premium-visual-redesign-v5
```

Sau khi push, gắn tag nếu cần mốc bảo vệ:

```bash
git tag -a v7.2-acceptance -m "Nghiệm thu 122 P1: 120 PASS / 2 PARTIAL" && git push origin v7.2-acceptance
```
