# AgriMarket — Audit E-commerce Full v5

## Đã sửa tự động

- Admin complaint dùng API xử lý trạng thái/refund thật đã có ở Backend.
- Customer/Admin complaint search + sort chuyển về Backend.
- Complaint counts/stats thành aggregate endpoint, bỏ N request/load toàn bộ page.
- Public farm OpenAPI khai báo đúng number/boolean, bỏ cast `never` ở Web/Mobile.
- Admin navigation commerce-first: commerce tách khỏi supply-chain/kho/system.
- Dashboard humanize trạng thái; không dùng raw enum trong mô tả cho người dùng.
- Giảm decorative gradient ở back-office, thêm app icon và dọn source backup.
- Release gate khóa complaint customer/admin + refund operations.

## Source-of-truth đã xác nhận trong audit

- Product availability Customer lấy từ Backend/tồn lô qua `soLuongKhaDung`/`coTheDatHang`.
- Cart/Order có sync E2E giữa Mobile ↔ Customer Web ↔ Admin.
- Voucher/loyalty/pricing snapshot/refund do Backend quyết định.
- VNPay hiện là Sandbox; ShippingAdapter mock là boundary demo được tài liệu release cho phép.

## Không sửa mù trong v5

1. Dashboard cho Nhân viên theo phạm vi: endpoint hiện là KPI toàn hệ thống và yêu cầu quyền quản trị. Cần thiết kế scoped KPI/permission trước khi mở rộng.
2. Admin Product hiện tải toàn bộ public product pages để ghép ảnh/giá/tồn. Với dữ liệu lớn nên có admin projection/summary endpoint.
3. Một số option/stat helper Admin còn tải nhiều page; nên bổ sung lightweight option endpoint khi scale.
4. Hãng vận chuyển production không thuộc release scope hiện tại.
5. Visual QA phải render thật; typecheck/static test không thay thế screenshot QA.

## Gate nghiệm thu cuối

- Chạy `pnpm release:final` với `agrimarket_test` + `agrimarket_test_shadow`.
- Visual QA theo `docs/VISUAL-QA-CHECKLIST.md`.
- Cùng fixture: Customer tạo complaint → Admin xử lý/refund → Customer thấy trạng thái/phản hồi mới.
- Cùng fixture Product/Cart/Checkout/Order/Refund giữa Web ↔ Mobile ↔ Admin.
