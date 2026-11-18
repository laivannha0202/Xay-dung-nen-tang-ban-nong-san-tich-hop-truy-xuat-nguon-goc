# Kịch bản demo bảo vệ (tuyến 1 — chạy được sau ~3 phút)

Chuẩn bị (một lần):

```bash
node scripts/db.mjs up
cd apps/api && npx tsx src/scripts/migrate.ts && npx tsx src/scripts/seed.ts
cd ../.. && pnpm api     # :4000
pnpm shop                # :3000
pnpm admin               # :3001
```

Tài khoản: Admin `admin@agrimarket.vn / Admin@123456` · Khách `khach1@example.com / Khach@123456`.
Mở **`http://localhost:3000`** (không dùng `127.0.0.1`).

Bộ dữ liệu demo đã có sẵn: 50 sản phẩm, 65 lô (4 lô thu hồi, 1 lô hết hạn, 11 lô cận hạn, 1 lô
DRAFT), 64 mã QR, 23 đơn trải đủ 7 trạng thái, 11 đánh giá, 1 khiếu nại đang xử lý, 1 yêu cầu hoàn
55.000₫ đang chờ, 104 phường/xã.

## Phần 1 — Truy xuất nguồn gốc (trọng tâm, ~90 giây)

1. **Quét tem**: mở `http://localhost:3000/t/demo-ca-chua-lo-0001` — hồ sơ lô: sản phẩm, nông trại
   (chỉ tên + khu vực, **không** số điện thoại người phụ trách), timeline mùa vụ/nhật ký/thu hoạch/
   kiểm nghiệm/nhập xuất, chỉ tiêu kiểm nghiệm, chứng nhận, nút tải PDF.
2. **Mã sai**: đổi token thành `abc` → trang "không tìm thấy".
3. **Lô hết hạn**: `/t/demo-ca-chua-het-han` → cảnh báo hết hạn đứng trên mọi thông tin khác.
4. **Lô thu hồi**: Admin → `/admin/thu-hoi` → mở biên bản → token của lô đó → cảnh báo **thu hồi** +
   hướng dẫn liên hệ + link khiếu nại. Thử mua lô đó: không còn được phân bổ.
5. **Báo cáo vấn đề khi chưa đăng nhập**: trang truy xuất → "Báo cáo vấn đề" → chuyển đăng nhập,
   sau đó quay lại đúng lô. Gửi khiếu nại có ảnh.

## Phần 2 — Khoá bán tự động (~60 giây)

6. `/admin/lo-hang` → chọn một lô đang bán → thêm **phiếu kiểm nghiệm Không đạt** → lưu.
   Lô lập tức biến khỏi cửa hàng và checkout (thử lại bước 1 với lô đó).
7. Thêm phiếu **Đạt** mới → phải bấm **xác nhận mở khoá** kèm lý do. Phiếu Không đạt cũ vẫn còn
   trong lịch sử (không ghi đè).
8. Thử **công khai** một lô chưa có phiếu Đạt → bị chặn 422.

## Phần 3 — Đơn hàng, tồn kho, hoàn tiền (~60 giây)

9. Khách: thêm 2 sản phẩm → `/thanh-toan` → đặt COD. Admin `/admin/don-hang/[id]`: xác nhận →
   chuẩn bị → xuất kho. Chỉ số tồn: `on_hand` giảm, `reserved` giảm cùng lượng.
10. `/admin/thanh-toan`: xác nhận đã thu tiền (COD), rồi mở yêu cầu hoàn **55.000₫ đang chờ** →
    Duyệt → Hoàn tất. `/admin/bao-cao` doanh thu thuần giảm đúng khoản đó.

## Phần 4 — Bảo mật (~30 giây, chứng minh bằng terminal)

```bash
# 1. Chưa đăng nhập gọi Admin → 401
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4000/api/v1/admin/orders
# 2. Khách gọi Admin → 403 (thay <TOKEN> bằng token khách)
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer <TOKEN>" http://127.0.0.1:4000/api/v1/admin/orders
```

Nếu có thời gian: đăng nhập sai 6 lần → 429; đăng ký với `role:"ADMIN"` → vẫn là CUSTOMER.

## Phần 5 — Nếu hội đồng hỏi "số liệu ở đâu ra"

Mở terminal, chạy:

```bash
node scripts/acceptance-walk.mjs
```

38 bước, tự tạo chuỗi thật (nhà cung cấp → … → thu hồi) rồi dọn. Kết quả in ra từng bước PASS —
đây là bằng chứng mạnh nhất: không phải ảnh chụp, mà là chuỗi nghiệp vụ chạy lại được.

## Câu chốt khi kết thúc

"Hệ thống khoá bán theo dữ liệu kiểm nghiệm, không theo lời khai; mọi mã lô đều dẫn ngược được tới
nông trại, nhật ký canh tác và phiếu kiểm nghiệm; và toàn bộ chuỗi đó chạy lại được bằng một lệnh."
