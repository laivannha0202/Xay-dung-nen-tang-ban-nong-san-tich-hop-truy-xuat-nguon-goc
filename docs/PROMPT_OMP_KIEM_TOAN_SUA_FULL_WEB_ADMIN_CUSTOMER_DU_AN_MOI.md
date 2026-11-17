# PROMPT OMP — KIỂM TOÁN CHỨC NĂNG + UI/UX + BUSINESS LOGIC TOÀN BỘ DỰ ÁN AGRIMARKET MỚI

**DÁN VÀO AGENT CÓ QUYỀN ĐỌC/GHI/CHẠY LỆNH TẠI THƯ MỤC ROOT DỰ ÁN MỚI**

## 0. XÁC NHẬN ĐÚNG DỰ ÁN — BẮT BUỘC TRƯỚC KHI LÀM

Tôi hiện xây dựng **DỰ ÁN AGRIMARKET MỚI HOÀN TOÀN**, không phải repository cũ. **TUYỆT ĐỐI KHÔNG** clone, pull, đọc, import code hoặc lấy bất cứ dữ liệu/code nào từ `https://github.com/laivannha0202/agrimarket-v2`. Chỉ làm với mã nguồn mở sẵn ở **working directory hiện tại**.

Ngay khi bắt đầu, chạy `pwd`, `git rev-parse --show-toplevel`, `git branch --show-current`, `git status --short`, thống kê thư mục `apps/*`, và đọc `package.json`, `pnpm-workspace.yaml`. Phải xác nhận đang ở dự án mới (mục tiêu `apps/admin-web`, `apps/customer-web`, `apps/customer-mobile`, `apps/api`, `packages/core`, `packages/ui` nếu cấu trúc hiện tại tương ứng). Nếu root khác hoặc thiếu mã nguồn, **báo BLOCKED và không thao tác nhầm dự án**.

Bảo vệ dữ liệu: không `git reset --hard`, không `git clean -fd`, không xóa hoặc seed lại database thật, không xóa file người dùng, không thao tác main, không push hoặc deploy, không thay secret/credentials. Dùng nhánh làm việc mới nếu cần và lưu checkpoint sau mỗi nhóm. Chỉ in cấu hình `.env.example` không in giá trị bí mật của `.env`.

## 1. MỤC TIÊU VÀ NGUỒN ĐẶC TẢ

Đọc đầy đủ:
1. `docs/Dac_ta_do_an_nong_san_truy_xuat_chi_tiet_v3.docx` (64 yêu cầu P1, 13 nhóm Admin).
2. `docs/Dac_ta_customer_web_app_nong_san_v1.docx` (58 yêu cầu P1, 12 nhóm Customer trên Web + App).
3. `docs/AGRIMARKET_MOI_MA_TRAN_NGHIEM_THU_122_P1.md` — bảng tiêu chí kiểm thử đi kèm; nếu chưa ở docs, người dùng sẽ cung cấp.
4. Các file `docs/IMPLEMENTATION_STATUS.md`, `docs/FINAL_ACCEPTANCE_REPORT.md` và tài liệu kiến trúc/API hiện có.

Đọc cả code/API/schema/test trước khi tuyên bố yêu cầu nào “đã có”. Nếu tên file đặc tả khác, tìm trong `docs/` bằng glob tương ứng và ghi chính xác đường dẫn. Đối chiếu **từng mã** `ADM-01-01`...`ADM-13-05` và `CUS-01-01`...`CUS-12-05`; không gộp nhiều yêu cầu vào một dấu check.

**Nhiệm vụ chính:** kiểm kê chức năng thực, tìm lỗ hổng, tự sửa và kiểm thử, đồng thời thiết kế lại các màn hình nghèo nàn sao cho trải nghiệm Customer Web chuyên nghiệp, đầy đủ như một **cửa hàng thương mại điện tử quốc tế** (single-vendor, không tự mở sàn multi-seller).

## 2. KIỂM TRA HIỆN TRẠNG THỰC SỰ (KHÔNG ĐƯỢC DÙNG NHẬN ĐỊNH CŨ)

Tự động trích xuất routing từ code, tạo `docs/audit/ROUTE_INVENTORY.md`:
- Mỗi route admin/customer: URL, file page/layout, trạng thái public/private, API calls, loading/error/empty states, chức năng có thể thao tác.
- Mỗi API: method/path, handler/service, auth role, ownership, schema/request/response, error code, tests liên quan.
- Database: bảng/quan hệ/migrations/index/ràng buộc/transactions. Tìm mock/static fallback còn tồn tại ở route báo đã hoàn thành.
- Lập **ma trận UI ↔ API ↔ DATABASE ↔ TEST** cho mỗi yêu cầu P1.
- Đừng đánh dấu PASS vì HTTP 200, typecheck, test count hoặc nhìn thấy giao diện. Hãy click/submit và kiểm tra mutation trên database qua API hoặc truy vấn đọc có kiểm soát.

## 3. AUDIT GIAO DIỆN CUSTOMER WEB THEO TỪNG MÀN HÌNH

**Mọi màn hình phải kiểm tra hai trạng thái: guest / logged-in nếu có ý nghĩa, và mobile width 360/390/768/1280/1440.** Với mỗi màn hình, kiểm cả hiển thị, keyboard/tab, lỗi API, dữ liệu thật, điều hướng và thao tác.

| Màn hình | Kiểm tra chức năng bắt buộc | Kiểm tra giao diện/UX |
|---|---|---|
| Trang chủ `/` | Chỉ sản phẩm ACTIVE/công khai phù hợp, danh mục từ API, điều hướng tới chi tiết đúng slug/id | Header có logo, tìm kiếm nổi bật, category nav, giỏ hàng, tài khoản, banner thật, featured/seasonal, footer; hierarchy rõ, không trống nhiều, dùng đúng ảnh sản phẩm |
| Danh mục & tìm kiếm | Từ khóa, kết quả 0, ký tự Unicode, danh mục, min/max price, sắp xếp giá/tên, còn hàng, pagination, query sync URL | Filters dễ hiểu; có chips xóa lọc, đếm kết quả, skeleton, empty state, grid responsive, hình tỉ lệ đều |
| Chi tiết sản phẩm | Tải đúng product, ảnh, đơn vị, giá từ backend, tồn khả dụng theo lô, review approved, bảo quản, số lượng hợp lệ, Add-to-cart | Gallery, title/price/CTA rõ, trạng thái tồn, thông tin truy xuất không bịa chứng nhận, sticky action trên mobile nếu phù hợp |
| Đăng ký/đăng nhập | Email unique, input validation, hash password, cấp phiên, return URL, logout, khóa khách | Form rõ lỗi, password show/hide, focus, không mất form khi server trả lỗi |
| Hồ sơ và địa chỉ | CRUD chính mình, một default duy nhất, không truy cập địa chỉ người khác, snapshot cũ không bị sửa | Danh sách thẻ địa chỉ, chọn mặc định, modal/form confirm, empty state |
| Giỏ hàng | Add/update/delete/merge, account sync API, giá/tồn tham khảo, không tự giữ hàng | Badge count đồng bộ, subtotal, update loading, cảnh báo hết hàng/giá đổi, mobile layout |
| Checkout | Preview server: giá, ship, discount, địa chỉ chính mình, COD/bank; commit idempotent, rollback hết hàng | Các bước checkout, tóm tắt đơn sticky, lỗi rõ, CTA disabled while pending, success page có mã đơn |
| Danh sách & chi tiết đơn | Chỉ đơn chính mình, paginate/filter, giá snapshot, trạng thái thanh toán, lô đã xuất, timeline | Timeline dễ đọc, giao diện trạng thái/nhận hàng, link khiếu nại/QR, empty state |
| Hủy đơn | Chỉ hủy trước xuất, nhả reserved, tạo refund nếu PAID, không tăng on_hand | Nút chỉ xuất hiện khi hợp lệ, modal lý do/xác nhận, trạng thái mới cập nhật |
| Trang QR public `/t/[token]` | Token ngẫu nhiên, không lộ nháp, timeline và test thật, QR HOLD/RECALLED/hết hạn cảnh báo, mã giả 404 | Trang tối ưu mobile, ưu tiên cảnh báo, timeline nông trại→kiểm nghiệm→kho, tài liệu thật và quyền riêng tư |
| Đánh giá | Chỉ đã DELIVERED/COMPLETED và đúng OrderLine; 1 review/orderLine; Admin duyệt/ẩn | Form số sao, preview, lịch sử review và trạng thái ẩn/chờ duyệt |
| Khiếu nại | Tạo từ đơn hoặc QR; ảnh JPG/PNG và size check; ticket đúng chủ, trả lời hai chiều, không mất lịch sử | Form phản ánh dễ hiểu, ảnh upload/preview, timeline hội thoại, loại và trạng thái ticket |
| Chính sách/giới thiệu/liên hệ (nếu đã xây dựng) | Không 404, link thật, thông tin không giả mạo | Footer đầy đủ, text có cấu trúc, không link chết |

**Ưu tiên Customer Web:** đây là nơi khách thấy chất lượng sàn. Nâng cấp giao diện theo mức hoàn thiện e-commerce chứ không chỉ gắn màu CSS. Không copy thương hiệu Amazon/Shopee; phải giữ bản sắc AgriMarket.

## 4. AUDIT ADMIN — 13 NHÓM NGHIỆP VỤ + GIAO DIỆN

Kiểm lần lượt: (1) Dashboard doanh thu thuần/cảnh báo; (2) danh mục & sản phẩm CRUD/giá/ảnh; (3) nhà cung cấp/nông trại GPS; (4) mùa vụ, nhật ký, phun thuốc, lô, điều chỉnh, thu hồi; (5) chứng nhận/kiểm nghiệm PASS/FAIL; (6) QR token/tem/scan/công khai; (7) kho nhập/xuất/điều chỉnh và reserved; (8) đơn gán lô, chuyển trạng thái/giao hàng; (9) voucher; (10) ghi nhận tiền, hoàn tiền; (11) đánh giá, khiếu nại; (12) khách hàng, khóa tài khoản, bảo mật; (13) báo cáo.

**Giao diện phải kiểm từng trang:** sidebar và active state; table sort/search/filter/pagination; các trường form, validation; file upload; chi tiết/timeline; confirm dialog; toast; keyboard/tab; loading/error/empty; responsive; không còn giao diện legacy chắp vá; nội dung chính sử dụng không gian màn hình hợp lý; chữ dễ đọc, không cột bị cắt. Cảnh báo lô không đạt, recall và khiếu nại phải dẫn đúng trang.

**Admin không có quyền tuyệt đối vượt ràng buộc nghiệp vụ:** Admin không được sửa trực tiếp đã bán/đã công khai sai lịch sử; không thể đặt tồn âm hay công khai lô fail bằng cách gọi API thẳng; không được đánh dấu hoàn tiền completed mà không ghi evidence/thao tác tương ứng.

## 5. BỘ TEST LOGIC KHÔNG THỂ BỎ QUA

Phải viết và chạy **positive/negative/integration/e2e tests** cho ít nhất các tình huống sau:

1. Customer không thể gọi Admin API (403); guest không vào private API (401).
2. Customer A không xem/sửa đơn, địa chỉ, ticket của Customer B (403/404), kể cả đổi ID trong URL.
3. Đăng ký payload `role=ADMIN` vẫn tạo CUSTOMER; mật khẩu được hash, rate-limit/brute force hợp lý.
4. Sản phẩm đang nháp/tắt bán không xuất hiện public; còn hàng tính từ lô PASS + PUBLISHED + NORMAL + chưa hết hạn.
5. Nhà cung cấp inactive không được tạo lô/mùa vụ trái rule.
6. Nhật ký phun thuốc có thời gian cách ly: thu hoạch trước ngày hợp lệ bị chặn.
7. Phiếu kiểm nghiệm FAIL tự khóa lô; phiếu lại PASS không tự xóa lịch sử cũ hoặc mở khóa trái quy trình.
8. Không public QR khi lô không đủ điều kiện; token sai, vô hiệu, thu hồi trả đúng trạng thái và không lộ dữ liệu nháp.
9. Nhập kho tăng on_hand; đặt hàng tăng reserved; xuất kho giảm cả on_hand và reserved; hủy trước xuất chỉ giảm reserved; không âm.
10. Một dòng đơn lấy từ **nhiều lô** vẫn liên kết đúng số lượng từng lô và truy ngược được.
11. Hai request checkout tranh một lô thiếu hàng: chỉ đủ đơn hợp lệ, không negative available, transaction rollback.
12. Hai request trùng idempotency key chỉ sinh **một** đơn, retry nhận cùng kết quả.
13. Preview giá khác commit hoặc voucher hết hạn → báo giá lại trước khi chốt; không tin giá gửi từ client.
14. Customer dùng address_id người khác → 403/422, không tạo đơn.
15. Hủy khi chưa xuất thành công; cố hủy đã có stock OUT bị từ chối, không thay đổi kho.
16. Khách bị Admin khóa → API private bị từ chối và không thể đặt thêm.
17. Admin thu hồi lô → khóa xuất/mua, cảnh báo QR, phân nhóm đơn chưa xuất và đơn đã xuất, tìm đúng khách thực nhận.
18. Thu hồi lô chỉ nằm trong một phần của OrderLine nhiều lô → đúng khối lượng và khách chịu ảnh hưởng, không thu hồi bừa sản phẩm.
19. Ghi nhận COD/chuyển khoản và hoàn tiền: revenue = paid sales – completed refunds; không trừ refund pending.
20. Review chỉ cho orderLine của khách và đơn đã giao, một review/orderLine; chưa giao bị từ chối.
21. Complaint từ QR dù không có đơn vẫn liên kết batch; từ order nhiều batch không gán batch sai khi chưa rõ.
22. Khách gửi và xem phản hồi ticket của mình; không xóa lịch sử.
23. Upload file ảnh/chứng từ: kiểm MIME thực, kích thước, quyền xem; file rác HTML giả ảnh không dùng được.
24. Giỏ hàng đồng bộ Web ↔ App cùng user; guest cart merge theo chính sách rõ.
25. Web tạo đơn, Admin xử lý, App xem trạng thái cùng mã đơn; lỗi mạng retry không nhân đôi đơn.
26. Thu hồi/sản phẩm hết hàng cùng hiện tại cả hai Website, App và QR sau refetch.
27. QR in tem hiển thị mã lô/tên/hạn dùng, tải được và đọc máy quét.
28. FEFO nếu bật: sắp xếp theo hạn dùng; fallback FIFO P1 nếu đó là chính sách đã chốt; audit kết quả đúng quy tắc cấu hình.
29. Khuyến mãi lô cận hạn nếu có: giá chi tiết đơn phản ánh lô thực xuất, không lệch batch khác.
30. Thử 409/422/429/500/timeouts/offline: UX có thông báo và retry an toàn, không mất thông tin/đặt trùng.

## 6. UI/UX, RESPONSIVE, ACCESSIBILITY, PERFORMANCE

- Đánh giá Customer Web ở 360, 390, 768, 1280, 1440 px, và Admin ở 390, 768, 1440 px; chụp screenshot mỗi **trạng thái chính** (không chỉ homepage). Kiểm `scrollWidth <= clientWidth`, h1, ảnh hỏng, lỗi console, links, CTA, form label, focus ring, touch targets.
- Không được coi ảnh chụp ở 503/404 là PASS; kiểm tra console/network errors và retry sau khi backend sẵn sàng.
- Lighthouse/aXe (nếu môi trường hỗ trợ); mục tiêu tham khảo LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, đồng thời chú ý WCAG 2.2 AA. Đây là **mục tiêu đo**, không tự nhận là đạt chỉ vì code đã có.
- Kiểm ảnh có license/credit rõ; không dùng ảnh stock để giả hóa đơn/chứng nhận/nhật ký canh tác.
- Luồng mua phải có tóm tắt phí, tổng, phương thức và thông báo lỗi rõ ràng; các nghiên cứu UX của Baymard coi trang sản phẩm và checkout là các khu vực ảnh hưởng lớn tới việc mua hàng.

Tài liệu tham khảo chất lượng UX:
- https://baymard.com/research-articles/current-state-ecommerce-product-page-ux
- https://baymard.com/research-articles/current-state-of-checkout-ux
- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://www.w3.org/TR/wcag/

## 7. CÁCH THỰC HIỆN / KHÔNG CẦN HỎI LẠI CHO MỌI BƯỚC NHỎ

1. Xác minh root đúng dự án MỚI, đọc code/test/doc trước khi thay đổi.
2. Tự tìm CLI/scripts thực có từ package.json (đừng áp các lệnh của repo cũ). Chạy baseline typecheck/build/tests, ghi log và thời điểm.
3. Chạy route inventory, click-sweep và checklist 122 P1; thống kê PASS/FAIL/UNTESTED/BLOCKED/NOT_IMPLEMENTED thật.
4. Ưu tiên sửa P0 logic/bảo mật/dữ liệu, sau đó P1 thiếu chức năng, sau đó UI/UX Customer và Admin, cuối cùng P2/P3 nếu phạm vi hiện tại còn yêu cầu.
5. Mỗi batch sửa code cần chạy lại relevant tests, bao gồm route E2E, typecheck và build; đừng giấu test fail.
6. Khi E2E làm thay đổi DB, dùng **database test tách biệt**; nếu không có, chỉ dùng dữ liệu demo được phép tạo, không xóa/reset database người dùng.
7. Nếu không có Android SDK/emulator/device, kiểm Metro/typecheck và đánh dấu **BLOCKED native**. Cung cấp hướng dẫn để người dùng chạy trên máy thật; không báo mobile native PASS.
8. Cập nhật `docs/audit/FEATURE_AUDIT.md`, `docs/audit/UI_AUDIT.md`, `docs/audit/BUSINESS_LOGIC_TESTS.md`, `docs/audit/SCREENSHOTS_INDEX.md`, `docs/FINAL_ACCEPTANCE_REPORT.md`, `docs/IMPLEMENTATION_STATUS.md`.
9. Commit các thay đổi an toàn vào nhánh hiện tại, không push/merge/deploy; giữ status rõ ràng.

## 8. MẪU BÁO CÁO SAU MỖI CHẶNG

```
PHẠM VI: AgriMarket MỚI; root=<absolute path>, branch=<branch>, commit=<hash>
Tiêu chí: Admin P1 xx/64 PASS, yy FAIL, zz UNTESTED, bb BLOCKED.
          Customer P1 xx/58 PASS (Web), xx/58 PASS (Mobile), ...
UI: Website Customer n/n trang đã thao tác đầy đủ; Admin n/n trang.
Tích hợp: n/n kịch bản xuyên hệ thống PASS.
LỖI ĐÃ SỬA: tên lỗi, file, commit, hành vi trước/sau, test chứng minh.
CÒN THIẾU: mã chức năng, nguyên nhân, cách xử lý và mức ưu tiên.
BẰNG CHỨNG: lệnh, exit code, test report/screenshots, API logs/DB queries đã ẩn bí mật.
```

**KHÔNG tự nói “hoàn thiện 100%” nếu còn bất kỳ yêu cầu trong phạm vi chốt chưa được kiểm thử hoặc còn FAIL/BLOCKED. KHÔNG dùng hoặc truy cập GitHub cũ. Bắt đầu kiểm toán và sửa trực tiếp trên working tree MỚI ngay.**
