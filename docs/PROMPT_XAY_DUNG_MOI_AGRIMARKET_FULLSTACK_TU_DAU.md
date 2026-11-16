# MASTER PROMPT V1.1 — AGRIMARKET: MỘT WEBSITE ADMIN + CUSTOMER, MỘT APP MOBILE CUSTOMER

> Dùng nguyên văn prompt này cho AI coding agent có quyền đọc/ghi workspace và chạy terminal (OpenCode/OMP, Codex, Cursor Agent hoặc tương đương). **Đính kèm hai tệp DOCX gốc** bên dưới trong workspace. Mục tiêu là tạo phần mềm chạy thật, không phải chỉ tạo giao diện minh họa hay kế hoạch.

## 0. Vai trò, nhiệm vụ và nguồn chuẩn

Bạn là một nhóm kỹ sư phần mềm gồm Solution Architect, Backend Engineer, Web Engineer, Mobile Engineer, Database Engineer, QA Engineer và DevOps Engineer. Hãy **xây dựng mới từ đầu** nền tảng **AgriMarket — Bán nông sản tích hợp truy xuất nguồn gốc theo lô** phục vụ **đồ án tốt nghiệp**.

Hai tài liệu **bắt buộc đọc toàn bộ và dùng làm nguồn chuẩn**:

1. `Dac_ta_do_an_nong_san_truy_xuat_chi_tiet_v3.docx` — chuẩn nghiệp vụ Admin, chuỗi truy xuất, quy tắc kho/lô, mô hình dữ liệu, API và kiểm thử.
2. `Dac_ta_customer_web_app_nong_san_v1.docx` — chuẩn Customer Website & Mobile App, 12 cụm CUS-01…CUS-12, đồng bộ liên kênh và kiểm thử.

Tìm các tệp dù nằm ở gốc hoặc `docs/`. Đọc cả **đoạn văn và bảng**, không bỏ sót nội dung vì DOCX có table. Nếu không có trình đọc DOCX, dùng `python-docx` hoặc phương pháp trích xuất phù hợp. Không suy đoán nội dung tài liệu từ tên tệp.

Đây là **dự án greenfield**: tạo ứng dụng mới từ thư mục trống hoặc từ một workspace mới. **Không sao chép hay vá repository cũ `agrimarket-v2`**, trừ khi tôi chủ động cung cấp lại nó làm tài liệu tham khảo. Tạo tên dự án AgriMarket. Không tự ý ghi đè thư mục khác, xóa dữ liệu, sửa nhánh main hoặc triển khai production. Nếu thư mục hiện có dữ liệu, kiểm tra trước và tạo thư mục con riêng/nhánh làm việc an toàn.

Mục tiêu “FULL” nghĩa là: **triển khai toàn bộ P1 của cả hai tài liệu**, nối thông Admin + Website Customer + App Mobile + backend + database + QR + kho + đơn + thu hồi, kiểm chứng được bằng test và demo. Sau khi P1 ổn định, triển khai **3 P2 điểm nhấn**: (a) FEFO, (b) giảm giá lô cận hạn có giá đúng từng allocation, (c) báo cáo truy xuất một lô PDF. Những P2 khác làm sau nếu có thời gian; **P3 là ngoài phạm vi**, không lén thêm tính năng phức tạp. Đừng nhầm “đầy đủ đồ án” với “đầy đủ hệ thống thương mại thực tế”.

### Nguyên tắc xử lý khác biệt giữa hai tài liệu
- **Admin V3.0** là nguồn chuẩn cho bất biến, batch/order/inventory/recall, trạng thái và quyền truy cập.
- **Customer V1.0** là nguồn chuẩn cho UX của Web/App, luồng khách, giỏ hàng và phản hồi người dùng.
- Nếu mâu thuẫn, chọn giải pháp **an toàn hơn**, ghi vào `docs/ADR.md` và `docs/requirements-traceability.md`; tuyệt đối không âm thầm thay đổi nghiệp vụ.
- Cơ chế **P1 phân bổ batch theo FIFO thời điểm nhập hợp lệ; P2 mới là FEFO hạn dùng sớm nhất**. Dù bổ sung FEFO sau này, luôn lọc batch hợp lệ trước.
- P1 hỗ trợ **COD + chuyển khoản thủ công**; không giả giao dịch VNPay/MoMo/online thật. Giao hàng P1 cập nhật thủ công, không giả kết nối hãng vận chuyển.

## 1. Sản phẩm phải bàn giao

Một hệ thống chạy được từ source với **01 website thống nhất + 01 ứng dụng mobile Customer + 01 backend API và database chung**:

1. **AgriMarket Website (01 web app duy nhất, Next.js)**: gồm **khu vực Customer** (trang chủ `/`, danh mục, chi tiết sản phẩm, giỏ hàng, đơn hàng, tra cứu QR...) và **khu vực Admin** (prefix `/admin`, gồm đủ 13 nhóm quản trị). Hai khu vực dùng chung codebase web nhưng layout và quyền độc lập; mọi `/admin/**` phải được bảo vệ bởi backend role ADMIN.
2. **AgriMarket Customer Mobile App**: ứng dụng Android/iOS từ một codebase (ưu tiên Expo React Native), sử dụng **chung dữ liệu, tài khoản và quy tắc kinh doanh** với Website Customer. Hỗ trợ camera quét QR, deep links và chạy thực tế trên emulator/thiết bị hoặc Expo Go khi tương thích.
3. **Backend API + PostgreSQL**: 01 API và 01 database chung cho Admin Web, Customer Web và Mobile, có migrations, seed, xác thực/phân quyền, quản lý ảnh/chứng từ và business logic được kiểm thử.

**Không tạo hai website độc lập `admin-web` và `customer-web`** trong phiên bản này. Admin và Customer là hai khu vực có đường dẫn/layout/quyền riêng trong **cùng một website**. Đồng bộ giống mô hình mua sắm đa nền tảng: khách đăng nhập trên web hay app đều thấy cùng hồ sơ, địa chỉ, giỏ hàng, đơn hàng, lịch sử đánh giá và khiếu nại. Đây là **một cửa hàng nông sản (single-vendor)**, không xây marketplace đa nhà bán/ Seller Center kiểu Shopee.

Tài khoản chỉ gồm hai vai trò **ADMIN, CUSTOMER**. Nông dân, nhà cung cấp, QC, kế toán, kho, CSKH là hồ sơ hoặc công việc **do Admin nhập/thực hiện**, không có login riêng.

Tài liệu bàn giao: `README.md` (setup từ máy sạch), `.env.example`, hướng dẫn chạy web/app/API/DB, `docs/architecture.md`, ERD, use case, API OpenAPI/Swagger, sơ đồ trạng thái, sequence của checkout/recall, `docs/requirements-traceability.md`, seed demo, test report thực tế, `docs/demo-script.md`, nhật ký thay đổi.

## 2. Kiến trúc mặc định nếu đang bắt đầu mới và chưa có stack

Ưu tiên **monorepo TypeScript** để chia sẻ kiểu dữ liệu nhưng không trộn business logic client/server:

```
agrimarket/
  apps/
    web/             # Next.js: Customer ở /, Admin ở /admin
    customer-mobile/ # Expo React Native + TypeScript
    api/             # NestJS + TypeScript, REST API
  packages/
    contracts/       # types/OpenAPI-generated client/schemas an toàn
    ui-tokens/       # design tokens nếu phù hợp
  prisma/            # hoặc trong apps/api, nhất quán
  docs/
  infra/             # docker compose, cấu hình dev
  scripts/           # seed, demo, kiểm tra
  .env.example
  README.md
```

Gợi ý: `pnpm workspaces`, PostgreSQL + Prisma, Tailwind/shadcn-ui cho website, Expo Router/React Native UI cho mobile, OpenAPI/Swagger, React Query, React Hook Form + Zod, Jest/Vitest/Supertest, Playwright E2E. Docker Compose cho PostgreSQL và dịch vụ lưu file phát triển nếu cần. Dùng một timezone hiển thị `Asia/Ho_Chi_Minh`, lưu thời điểm UTC; tiền lưu **số nguyên VND**, số lượng dùng decimal an toàn phù hợp đơn vị tính.

Nếu stack trên không khả thi trong môi trường, chọn phương án đơn giản tương đương, giải thích ở `docs/ADR.md` rồi triển khai thật. **Không dựng microservices, Kubernetes, blockchain, event bus phức tạp, Redis hoặc dịch vụ cloud trả phí nếu không thực sự cần.** Chọn kiến trúc dễ chạy, dễ demo, ít phụ thuộc ngoài.

Yêu cầu giao diện: tiếng Việt, hiện đại, nhất quán, responsive; bảng quản trị có tìm kiếm/lọc/phân trang/trạng thái; biểu mẫu validate; mobile có loading/empty/error/retry; không chỉ là template tĩnh. Không sử dụng dữ liệu mock ở màn hình được tuyên bố “hoàn thành” khi backend thật chưa có.

### 2.1. BẮT BUỘC: chất lượng UI/UX sàn thương mại điện tử quốc tế

**Định hướng thẩm mỹ**: giao diện AgriMarket có độ hoàn thiện, tốc độ, cách phân cấp thông tin và trải nghiệm mua sắm chuyên nghiệp **lấy cảm hứng từ các sàn quốc tế như Amazon/Shopee**, nhưng có bản sắc **nông sản sạch – minh bạch – truy xuất theo lô**. Không sao chép logo, màu nhận diện độc quyền, layout pixel-perfect hay tài sản thương hiệu của bất kỳ sàn nào.

Thiết lập **design system dùng chung** (design tokens, font hỗ trợ tiếng Việt, màu chủ đạo xanh lá trầm + trung tính sáng, bộ icon thống nhất, khoảng cách theo hệ 8 px, border radius, shadow, thang typography, semantic colors, trạng thái thành công/lỗi/cảnh báo, skeleton/empty states). Website và App giữ **cùng thương hiệu, tên gọi, icon, hình ảnh, cách đặt nhãn và hành vi**, nhưng giao diện app phải được thiết kế native, không bê nguyên bố cục web.

- **Trang chủ Customer**: announcement bar/top navigation; logo, tìm kiếm nổi bật, đăng nhập/giỏ hàng; menu danh mục; banner/hero nông sản chất lượng; lưới danh mục; sản phẩm nổi bật, sản phẩm theo mùa và đang bán; thẻ sản phẩm có ảnh đẹp, tên, giá VND, đơn vị, tình trạng hàng và truy xuất; footer đầy đủ. Các khối chỉ lấy sản phẩm thực từ API/seed database, không hardcode giá tồn.
- **Danh mục/kết quả tìm kiếm**: breadcrumb, gợi ý tìm kiếm phù hợp, sidebar/bottom-sheet bộ lọc, sắp xếp, tổng kết quả, phân trang hoặc tải thêm, grid 2–5 cột theo viewport.
- **Chi tiết sản phẩm**: gallery nhiều ảnh, tên, giá, quy cách, tình trạng tồn hợp lệ, số lượng, Add to cart, tab/mục nguồn gốc–bảo quản–đánh giá, thông tin chứng nhận đúng dữ liệu thực; không gắn chứng nhận giả.
- **Giỏ và checkout**: thông tin đơn minh bạch, phí ship, voucher hợp lệ, thanh toán COD/chuyển khoản theo P1; loading và lỗi không tạo đơn trùng.
- **Web account/order**: trang tài khoản dễ điều hướng; bảng/stepper theo dõi đơn; hiển thị lô thực xuất khi có; cảnh báo thu hồi trực quan.
- **App Customer**: splash/onboarding ngắn gọn nếu cần; home, categories/search, product details, cart, checkout, orders, account và camera QR; bottom navigation 4–5 tab, ảnh co giãn tốt, sticky Add-to-cart hợp lý, pull-to-refresh, permission/offline/error states.
- **Admin**: dashboard KPI có ý nghĩa; sidebar gọn, các trang list/detail/forms sử dụng bảng lọc, phân trang, trạng thái rõ ràng; các thao tác nguy hiểm có xác nhận; độ tương phản, dễ đọc, responsive.
- **Truy xuất theo QR**: trang public hiển thị hình ảnh phù hợp, timeline, GPS/vùng trồng, chứng cứ và cảnh báo thu hồi; **luôn ưu tiên tính đúng nghiệp vụ hơn trang trí**.
- Hiển thị VND, kg/bó/hộp và ngày theo Việt Nam; chuẩn hóa khả năng tiếp cận (focus, keyboard, alt text, labels). Tối ưu CLS/LCP cơ bản bằng ảnh đúng kích thước, lazy loading, responsive srcsets khi có.

**Yêu cầu nghiệm thu giao diện**: không chỉ 1 trang đẹp. Kiểm tra màn 360 px, 390 px, 768 px, 1280 px và 1440 px; chụp ảnh màn hình 10 luồng quan trọng; không có nội dung tràn ngang, nút không hoạt động, hình hỏng hoặc dữ liệu giả mạo.

### 2.2. BẮT BUỘC: tự tìm và tải ảnh sản phẩm/banner hợp pháp (khi môi trường cho phép)

- Chủ động tìm **ảnh nông sản thực tế phù hợp** cho các sản phẩm demo (rau, củ, quả, nông trại, vườn trồng) qua nguồn cấp phép sử dụng phù hợp như **Unsplash/Pexels hoặc thư viện CC0**, **chỉ sau khi kiểm tra giấy phép của đúng ảnh và điều kiện tải/sử dụng**. Không lấy đại ảnh từ Amazon, Shopee, Google Images, trang báo hoặc ảnh có watermark mà không rõ bản quyền.
- Nếu được phép tải và công cụ có mạng, hãy tải asset về thư mục dự án (ví dụ `apps/web/public/images/` hoặc seed storage), đặt tên có ý nghĩa, nén/cắt kích thước hợp lý, dùng ảnh đúng chủ thể, kiểm tra không có ảnh chết. Cùng một sản phẩm phải dùng **cùng image URL/asset ID từ API** trên Website và App. Không phụ thuộc hotlink thiếu ổn định.
- Lưu bảng kê `docs/IMAGE_SOURCES.md`: filename, sản phẩm/địa điểm minh họa, URL nguồn gốc, người chụp/tác giả nếu có, loại giấy phép, yêu cầu ghi công, ngày kiểm tra và cách sử dụng. Tuân thủ attribution khi cần.
- Phân biệt rõ **ảnh minh họa sản phẩm/hero** với **ảnh bằng chứng canh tác, phiếu kiểm nghiệm và chứng nhận thật**. Không tải ảnh ngẫu nhiên để giả làm chứng cứ truy xuất, không tự chế giấy chứng nhận hoặc gán nhãn chất lượng không có căn cứ.
- Nếu không có quyền truy cập mạng, không tìm được giấy phép rõ ràng hoặc API nguồn giới hạn, **không được tuyên bố đã tự tải ảnh**: dùng ảnh mẫu có quyền rõ ràng sẵn trong repo hoặc tự tạo illustration/gradient gốc và ghi trạng thái thiếu ảnh vào backlog; hướng dẫn người dùng thêm asset sau. Ảnh AI-generated chỉ dùng khi môi trường thực sự có công cụ và phải gắn nhãn minh họa khi phù hợp.
- Ưu tiên chất lượng và sự thật: mỗi thẻ sản phẩm có ảnh phù hợp, alt text, fallback chỉ khi ảnh lỗi; tránh tất cả sản phẩm dùng một ảnh stock giống nhau.

### 2.3. BẮT BUỘC: đồng bộ Website Customer ↔ Mobile như một tài khoản mua sắm

- Sử dụng **1 backend, 1 database, 1 mã tài khoản CUSTOMER, 1 danh mục sản phẩm, 1 trạng thái tồn kho và giá**. Không lưu giỏ hàng đăng nhập hay đơn hàng vào mock/local-only.
- Web thêm giỏ hàng → App đăng nhập cùng tài khoản thấy giỏ sau refetch; App chỉnh số lượng → Web thấy số lượng mới; đặt trên một kênh → kênh còn lại thấy **cùng mã đơn**, địa chỉ, thanh toán và tiến trình; không phát sinh đơn nhân đôi.
- Admin thay đổi giá/ảnh/trạng thái sản phẩm → cả hai kênh nhận dữ liệu mới từ API theo chính sách refresh/cache invalidation rõ ràng. Khi giá đổi trước checkout phải báo lại khách.
- Khi lô bị khóa/thu hồi, mọi kênh cùng chặn mua và hiện cảnh báo. Không cho client tự quyết định tồn hợp lệ hay phân bổ batch.
- Tạo E2E hoặc integration test thực tế xuyên kênh: Web login/add-to-cart → App xem giỏ/checkout → Web xem đơn → Admin xử lý → App xem tiến độ → Admin thu hồi → Website/App/QR cùng hiện trạng thái đúng.
- **Không cam kết có toàn bộ tính năng của Shopee** (đa người bán, ví điện tử, chat seller, livestream, fulfillment tự động...). Mục tiêu giống ở **chất lượng UX và tính đồng bộ đa nền tảng**, giữ phạm vi P1/P2 đã thống nhất.

## 3. Toàn bộ nghiệp vụ P1 phía ADMIN — 13 nhóm bắt buộc

**ADM-01 Dashboard** — doanh thu đã ghi nhận trừ hoàn tiền hoàn tất; đơn mới/chờ xử lý/đang giao; lô đã công khai, chờ kiểm nghiệm, cận hạn/hết hạn, khóa/thu hồi; khiếu nại, kiểm nghiệm không đạt; bộ lọc ngày/nút làm mới; các thẻ dẫn đúng trang chi tiết.

**ADM-02 Danh mục & sản phẩm** — CRUD/ẩn danh mục; CRUD/ẩn sản phẩm, SKU duy nhất, mô tả, ảnh, đơn vị, giá, hạn dùng mặc định, bảo quản, cờ yêu cầu truy xuất; hiển thị tồn bán được **chỉ từ batch đủ điều kiện**; sản phẩm hết lô hợp lệ hiển thị hết hàng.

**ADM-03 Nhà cung cấp & nông trại** — tạo/sửa/ngừng nhà cung cấp; nông trại thuộc supplier đang hoạt động, thông tin liên hệ nội bộ, vị trí/GPS, diện tích, cây trồng, ảnh/chứng từ; website QR không công khai số điện thoại/tài khoản/địa chỉ nhạy cảm.

**ADM-04 Mùa vụ, nhật ký, lô & thu hồi** — Season gắn Farm/Product; nhật ký canh tác theo ngày với vật tư, ảnh/chứng từ; phun thuốc bắt buộc thời gian cách ly và chặn thu hoạch trước ngày đủ điều kiện; tạo Batch có mã duy nhất, ngày thu hoạch/đóng gói/hạn dùng/sản lượng; timeline thật; công khai chỉ khi đủ điều kiện; bản điều chỉnh dữ liệu công bố lưu lý do + audit; mở đợt thu hồi khóa bán/xuất, nhóm đơn chưa xuất/đã xuất, theo dõi khách và xử lý đến đóng biên bản.

**ADM-05 Chứng nhận & kiểm nghiệm** — chứng nhận gắn farm/batch có phạm vi và thời hạn; file nguồn; phiếu test gắn batch, đơn vị test, thời điểm, PDF/ảnh, danh sách chỉ tiêu + giới hạn; chỉ cần một chỉ tiêu Fail thì phiếu Fail; server tự khóa batch; kiểm nghiệm lại tạo phiếu mới, không ghi đè; việc mở khóa/công khai lại cần Admin xác nhận hợp lệ có lý do.

**ADM-06 QR & trang truy xuất** — token ngẫu nhiên khó đoán, unique, QR **theo lô P1**, tải/in tem; public `/t/{token}` không login hiển thị đúng batch: farm, season, nhật ký/timeline, thu hoạch, hạn dùng, chứng nhận/kiểm nghiệm được công khai; cảnh báo HOLD/RECALLED/hết hạn nổi bật; vô hiệu/sai token không lộ nháp; lưu lượt quét và liên kết gửi phản ánh.

**ADM-07 Kho theo lô** — một kho chính P1 là đủ; Inventory theo `(warehouse_id,batch_id)`, phiếu nhập thực, StockMovement bất biến, phiếu điều chỉnh có lý do, `on_hand`, `reserved`, `available`, phiếu xuất đúng batch; không âm kho; không xuất lô fail/khóa/chưa công khai/hết hạn; có lọc tồn và cảnh báo. P1 FIFO phân bổ, không nhầm với P2 FEFO.

**ADM-08 Đơn hàng & giao hàng** — đơn từ Customer, snapshot tên sản phẩm/giá/địa chỉ/khuyến mãi; lúc checkout phân bổ vào một hoặc nhiều Batch + giữ chỗ trong transaction; Admin xác nhận/chuẩn bị, có thể đổi batch trước xuất có audit; xuất đúng allocation, ghi `shipped_qty`; trạng thái `PENDING→CONFIRMED→PREPARING→SHIPPING→DELIVERED→COMPLETED`, nhánh CANCELLED/DELIVERY_FAILED; COD/chuyển khoản thủ công; ghi vận đơn/người giao thủ công; hủy hợp lệ trước xuất và tạo refund request khi cần.

**ADM-09 Khuyến mãi đơn giản** — giảm % hoặc số tiền, thời gian, hạn lượt/bật tắt; P1 chỉ áp dụng **một** khuyến mãi hợp lệ cho đơn; tính giá tại server, lưu snapshot; lượt sử dụng xử lý nhất quán cả khi đơn hủy theo quyết định ghi trong ADR.

**ADM-10 Thanh toán/hoàn tiền cơ bản** — trạng thái thanh toán tách khỏi đơn: COD/chuyển khoản, `UNPAID/PAID`; Admin xác nhận thủ công kèm tham chiếu/lịch sử; RefundRequest với trạng thái `PENDING→APPROVED→COMPLETED/REJECTED`; chỉ hoàn tiền COMPLETED mới trừ doanh thu thuần. Không giả API ngân hàng.

**ADM-11 Đánh giá & khiếu nại** — review từ order_line đã nhận và mỗi line tối đa một lần; Admin ẩn đánh giá có lý do; complaint từ đơn hoặc từ QR với ảnh, batch nếu biết; phản hồi/timeline trao đổi, `NEW→PROCESSING→RESOLVED→CLOSED`; xem complaint theo batch và mở luồng recall khi cần.

**ADM-12 Người dùng & bảo mật** — Admin login/logout/đổi mật khẩu, tài khoản seed an toàn; Customer tự đăng ký nhưng không thể tự thành Admin; Admin xem/tìm/khóa/mở khách kèm lý do; role/ownership kiểm tra trong backend; mật khẩu bcrypt/Argon2, rate limit, phiên/token an toàn, audit.

**ADM-13 Báo cáo** — doanh thu thuần theo ngày/tháng, đơn theo trạng thái, tồn theo batch, tình trạng lô/chất lượng, lượt quét QR; có lọc ngày; report chứa đơn/khách chỉ Admin được xem.

Không chỉ tạo menu: với mỗi nhóm cần **DB schema + service + API thật + trang danh sách/chi tiết/form + kiểm tra quyền + validation + tests + liên kết nghiệp vụ**.

## 4. Toàn bộ P1 phía CUSTOMER — Website và Mobile App dùng chung dữ liệu

Thực hiện đầy đủ 12 cụm `CUS-01…CUS-12` theo tài liệu Customer V1.0, khác biệt UX theo kênh nhưng thống nhất API:

- **CUS-01**: đăng ký, đăng nhập, đăng xuất; mật khẩu an toàn, thông báo lỗi hợp lý, chặn tài khoản khóa.
- **CUS-02**: sửa hồ sơ, quản lý nhiều địa chỉ giao, địa chỉ mặc định; chỉ thấy dữ liệu của mình.
- **CUS-03**: trang chủ, danh mục, tìm kiếm/lọc/sắp xếp; chỉ hiển thị sản phẩm ACTIVE/đã công khai (không hiển thị nháp); sản phẩm chưa có lô bán hợp lệ vẫn có thể xuất hiện với nhãn “Hết hàng”, tính trạng thái còn hàng từ batch đủ điều kiện.
- **CUS-04**: chi tiết sản phẩm, hình ảnh/giá/đơn vị/tồn, nhãn truy xuất đúng ý nghĩa, đánh giá đã được công khai.
- **CUS-05**: giỏ hàng thêm/sửa/xóa; giỏ khách đăng nhập **lưu server để đồng bộ Web↔App**; giỏ guest có thể cục bộ, khi login kiểm tra lại. Giỏ không giữ tồn.
- **CUS-06**: checkout preview tính server, địa chỉ thuộc Customer, COD/chuyển khoản thủ công, khuyến mãi P1, phí giao, giá/tồn recheck, phân bổ FIFO + giữ chỗ nguyên tử, `idempotency_key` ngăn đặt trùng; thiếu hàng rollback toàn bộ; thay đổi giá phải xác nhận lại.
- **CUS-07**: danh sách/chi tiết đơn của mình, timeline trạng thái/thanh toán; sau xuất hiện batch **thực xuất** theo từng line, trước xuất nếu có chỉ là “dự kiến”; cảnh báo batch bị recall.
- **CUS-08**: hủy đơn hợp lệ khi chưa xuất, nhả reserved nhưng không tăng on_hand; sau xuất chuyển sang khiếu nại/đổi trả.
- **CUS-09**: website mở URL `/t/{token}`, app quét bằng camera (xin quyền camera, xử lý từ chối quyền); trang QR public hiển thị đúng Batch; không lộ nháp, cảnh báo thu hồi; gửi báo cáo có thể chuyển login.
- **CUS-10**: review mỗi order_line đã giao/tất, không tạo trùng; hiển thị đánh giá duyệt công khai.
- **CUS-11**: complaint từ đơn hoặc QR, có ảnh; nếu line có nhiều batch không được gán bừa, cho chọn hoặc “chưa xác định”; khách theo dõi trạng thái/tin nhắn của mình.
- **CUS-12**: loading, empty, error, success, offline/retry; xử lý 401/403/404/409/422/429/500; không gửi lại checkout bằng idempotency key mới khi chưa biết đơn cũ thành công; không làm mất dữ liệu nhập vô lý.

**Website Customer**: tối ưu SEO cơ bản/trang public (nếu làm được không tăng phức tạp), responsive, trang chi tiết sản phẩm, giỏ, checkout, tài khoản, đơn hàng, QR public. **App**: bottom tabs phù hợp, camera scan, deep-link/URL open, giao diện cảm ứng và trạng thái mạng; hỗ trợ chạy thực tế, không phải chỉ ảnh giao diện.

### Đồng bộ liên kênh bắt buộc
- Một Customer đăng nhập cả Web và App bằng cùng tài khoản.
- Profile/address/cart/order/review/complaint luôn lấy từ backend chung.
- Đặt hàng trên Web thì App thấy ngay sau refresh, và ngược lại.
- Không để client tự quyết định tồn hợp lệ, trạng thái batch, số tiền, discount hoặc ownership.

## 5. BẤT BIẾN NGHIỆP VỤ — TEST BẮT BUỘC, KHÔNG ĐƯỢC BỎ

1. **Điều kiện bán batch** tại thời điểm hiện tại: `quality_status=PASS`, `publication_status=PUBLISHED`, `safety_status=NORMAL`, chưa hết hạn, product đang bán và `available_qty>0`. Với sản phẩm yêu cầu truy xuất, thiếu nhật ký/chứng cứ/phiếu test Đạt theo đặc tả thì không public.
2. **Ba trạng thái batch tách độc lập** (quality, publication, safety), tình trạng hết hàng tính từ tồn, **không** biến “hết hàng” thành trạng thái bất biến khiến nhập lại bị kẹt.
3. `available_qty=on_hand_qty-reserved_qty`, `on_hand>=reserved>=0`. Chỉ tăng/giảm kho qua nghiệp vụ/StockMovement, không cho chỉnh trực tiếp.
4. `OrderLine -> OrderLineBatchAllocation -> Batch` có số lượng chính xác; một dòng đơn có thể dùng nhiều batch.
5. **Checkout transactional/concurrency-safe**: khóa hàng tồn theo thứ tự ổn định/optimistic atomic update, reserve thành công hoặc rollback toàn bộ. Hai khách mua đồng thời không thể oversell.
6. **Idempotent checkout**: cùng customer + idempotency key trả cùng đơn, không duplicate order/hold.
7. **Thời điểm đặt đơn lưu snapshot**: tên/giá/địa chỉ/khuyến mãi/phí ship, không thay đổi khi Admin sửa product.
8. **Hủy trước xuất**: nhả reserved, không cộng on_hand; lưu audit; **sau xuất** không chạy luồng hủy trước xuất.
9. **Xuất kho**: `on_hand` và `reserved` cùng giảm tương ứng trong transaction; giữ shipped_qty/stock movement lịch sử không thể xóa khi hủy/hoàn.
10. **Lô hết hạn/khóa/thu hồi khi đang giữ chỗ**: chặn xuất, đưa đơn vào diện phân bổ lại hoặc hoàn; không âm kho hay tự ship.
11. **Thu hồi**: ngay lập tức chặn đặt mới/xuất, QR cảnh báo trạng thái mới; rà soát cả đơn đã giữ chỗ chưa xuất, đang giao và đã giao; danh sách khách xác định từ shipped allocations.
12. **Thời gian cách ly thuốc BVTV**: thu hoạch trước ngày hợp lệ bị chặn theo đặc tả, không chỉ hiển thị cảnh báo.
13. **Test không đạt**: khóa bán, giữ phiếu cũ; kiểm nghiệm lại là bản mới và cần xác nhận hợp lệ trước mở.
14. **Truy xuất chứng cứ**: file ảnh/PDF, metadata nguồn và audit; không tuyên bố dữ liệu do Admin nhập là chứng nhận độc lập. QR theo lô không chứng minh tem chống sao chép từng bao.
15. **Quyền**: CUSTOMER không đọc ghi Admin API hoặc dữ liệu của khách khác; public QR không trả PII; Admin không do user tự đăng ký. Tất cả kiểm tra ở server.
16. **Tiền tệ và thanh toán**: VND integer; thanh toán thực hiện thủ công; chỉ trạng thái PAID thực sự được Admin xác nhận; refund COMPLETED mới tính vào doanh thu thuần.
17. **Upload**: giới hạn loại/size file, kiểm tra server, tránh path traversal và hiển thị file tùy ý; có soft delete/audit cho bản ghi quan trọng.
18. **Dữ liệu thời gian**: UTC trong DB, `Asia/Ho_Chi_Minh` khi hiển thị; kiểm tra ngày hết hạn theo quy ước nhất quán.

## 6. CSDL, API và giao dịch — làm thật, không dùng mock thay backend

Thiết kế ERD bám sát mục 17 Admin V3.0 và mục 18 Customer V1.0. Tối thiểu cân nhắc các entity có quan hệ và khóa ngoại phù hợp:

`User/CustomerProfile`, `CustomerAddress`, `Category`, `Product`, `Supplier`, `Farm`, `Season`, `CultivationLog`, `Batch`, `Certificate`, `LabTest`, `LabTestMetric`, `EvidenceFile`, `QRCode`, `QRScan`, `Warehouse`, `Inventory`, `StockMovement`, `Order`, `OrderLine`, `OrderLineBatchAllocation`, `Cart`, `CartItem`, `Promotion`, `Payment`, `RefundRequest`, `Shipment`, `Review`, `Complaint`, `ComplaintMessage`, `Recall`, `RecallAffectedOrder/RecallContact`, `AuditLog`, `IdempotencyRecord`.

Tên bảng có thể khác nếu nhất quán; không tạo bảng vô ích. Chọn quan hệ n-n qua join model nếu cần. Có constraint/index/unique/foreign key, đặc biệt `Inventory(warehouse_id,batch_id)`, `QRCode(token)`, `Product(sku)`, `Review(order_line_id,customer_id)`, `Idempotency(customer_id,key)`; các bản ghi đã xuất/thu hồi không được xóa cứng.

API REST versioned (`/api/v1`) và Swagger cho Admin, Customer, Public; response/error shape thống nhất; DTO validation, pagination/filter/sort, role/ownership; tính toán giá/tồn/tiền server-only. Tạo OpenAPI spec cho typed clients Web/Mobile. **Không công khai danh sách khách từng batch** qua API QR; danh sách này chỉ Admin xem trong recall/report.

## 7. Bảo mật, hiệu năng tối thiểu, chất lượng code

- Dùng mật khẩu hash Argon2id hoặc bcrypt; chống brute-force, kiểm tra input, ORM parameterization, chống XSS/CSRF, CORS đúng nguồn, không hardcode secret, không commit `.env`, không lộ stack trace/PII trong API log.
- Web dùng cookie HttpOnly+Secure+SameSite thích hợp với CSRF protection hoặc chiến lược tương đương an toàn; mobile lưu token trong secure storage, không để secrets trong source/bundle.
- QR public rate-limit; signed/unguessable token hợp lý; thông tin nhạy cảm chỉ nội bộ.
- Transaction bảo vệ kho và order, idempotency, validation cả client và server; DB constraint là lớp bảo vệ cuối.
- Giao diện phải có trạng thái loading/empty/error, nhãn cảnh báo thu hồi rõ; hỗ trợ bàn phím, form labels, responsive, accessibility cơ bản.
- Ghi audit actor, action, entity, before/after phù hợp, timestamp, reason cho thao tác đặc biệt.
- Có cấu hình staging/dev, health endpoint; fail-fast khi thiếu env thiết yếu; lint/typecheck/build không báo lỗi.

## 8. Triển khai theo 10 giai đoạn, **không dừng ở việc lập kế hoạch**

**GĐ0 — Đọc tài liệu, thiết kế và dựng khung**: trích xuất 2 DOCX; lập ma trận `[mã yêu cầu → DB → API → web → mobile → test]` trong `docs/requirements-traceability.md`; quyết định công nghệ; khởi tạo monorepo; Docker Compose; lint/typecheck/test/build; README chạy từ máy mới. Chạy và xác nhận được API, **một Website với hai khu vực / và /admin**, cùng Mobile shell.

**GĐ1 — Database, Auth, quyền và file**: Prisma migrations + seed; Admin seed credential qua env/CLI không hardcode; Customer register/login/profile/address; API role/ownership; upload evidence. Test security.

**GĐ2 — Danh mục, sản phẩm, supplier/farm**: CRUD Admin, trang public danh mục/product; đồng bộ API; ảnh và trạng thái sản phẩm; GPS farm; dữ liệu seed.

**GĐ3 — Season, log, Batch, LabTest, Certificate**: chuỗi nguồn gốc, cách ly, timeline, chứng cứ, test Fail/Pass, publication, audit. Test chặn bán theo quality.

**GĐ4 — QR public**: token, sinh/in tem, public lookup, cảnh báo, lượt quét, link complaint; quét camera App. Test batch đúng và không lộ dữ liệu nháp/PII.

**GĐ5 — Kho & đơn hàng transactional**: warehouse, nhập/xuất/điều chỉnh, on_hand/reserved/available; cart server chung Web/App, checkout preview, idempotency, FIFO allocations, cancel/reallocate/ship, optimistic locking hoặc row locks. Viết concurrency tests và multi-batch test.

**GĐ6 — Admin Orders/Payments/Shipping/Promotions**: vòng đời, điều chỉnh trước xuất, COD/chuyển khoản thủ công, xác nhận tiền, hoàn tiền, voucher đơn giản, báo cáo nền.

**GĐ7 — Customer Website/App end-to-end và polish UI quốc tế**: hoàn thiện cả 12 cụm CUS, đồng bộ địa chỉ/giỏ/đơn/review/complaint, camera, refresh, auth, responsive, loading/error. Chạy kịch bản qua Website Customer và App thật; xác minh design system nhất quán và kiểm tra đầy đủ ảnh/banner theo `docs/IMAGE_SOURCES.md`.

**GĐ8 — Recall, Dashboard, Report, P2 chọn lọc**: thu hồi đầy đủ cả pre-ship và shipped, QR alert, danh sách khách ảnh hưởng, refund request; 13 nhóm Admin đủ; report đúng số liệu; sau khi P1 xanh mới làm P2: FEFO, giảm giá batch cận hạn, PDF báo cáo truy xuất một batch. Ghi rõ feature flag hoặc nhãn P2.

**GĐ9 — QA, demo, bàn giao**: unit/integration/e2e/security/regression; seed có batch đạt, fail, expired, recalled, multiple batches + multiple orders; chạy demo liên kênh; sửa lỗi build và bug test; hoàn thành tài liệu.

Sau **MỖI GIAI ĐOẠN**: thực sự chạy các lệnh hiện có (`lint`, `typecheck`, `test`, `build`, migration/seed, E2E khi phù hợp); in kết quả thành công/thất bại; liệt kê path file thay đổi, behavior đã xác nhận, lỗi còn lại và bước tiếp theo. Không bao giờ nói “đã xong” khi chưa chạy. Nếu môi trường thiếu dịch vụ/emulator, chỉ rõ kết quả chưa thể xác nhận và cung cấp lệnh tái hiện.

Chia nhỏ commit theo giai đoạn nếu workspace là Git; không push/merge main khi chưa được yêu cầu. **Được tự chủ sửa code trong nhánh/workspace được cho phép, nhưng phải xin xác nhận trước thao tác phá hủy dữ liệu, deploy thật, dùng tài khoản/số tiền thật hoặc thay đổi bảo mật rủi ro.**

## 9. Các kiểm thử nghiệm thu bắt buộc

Viết automated tests cho các điểm này (tên test thể hiện nghiệp vụ):

1. Không thể public batch thiếu test PASS hoặc thiếu trường bắt buộc.
2. Thu hoạch trước hết hạn cách ly phải bị từ chối.
3. Test FAIL khóa batch và chặn checkout/xuất.
4. QR hợp lệ tra đúng farm/season/batch, vô hiệu không lộ nháp, recall cập nhật cảnh báo.
5. Đăng nhập CUSTOMER không gọi được ADMIN API hoặc order/address người khác.
6. Hai khách checkout cùng tồn chỉ một lượng tồn thực sự đủ được reserve; không âm kho.
7. Checkout 7kg từ batch A 4kg, B 6kg tạo phân bổ A4 + B3 (theo thời điểm nhập FIFO).
8. Giữ chỗ rồi hủy đúng thì reserved giảm, on_hand không tăng.
9. Xuất 7kg làm on_hand và reserved giảm đúng, shipped allocation vẫn tồn tại.
10. Request checkout gửi hai lần cùng idempotency key chỉ sinh một order.
11. Giá thay đổi giữa preview và confirm: bắt người dùng xem lại.
12. Batch hết hạn/thu hồi khi đang reserved không thể xuất, có cơ chế reallocation/refund.
13. Thu hồi A xác định đúng đơn và khách đã nhận phần A, kể cả order sử dụng A+B; không quy sai toàn bộ sản phẩm.
14. Thu hồi A khóa QR/bán ngay, hiển thị nhóm chưa xuất + đang giao + đã giao.
15. Giao thất bại/hàng trả không tự tăng available nếu chưa được nhận/kiểm tra.
16. Khách chỉ review sau DELIVERED/COMPLETED, không tạo review trùng order_line.
17. Complaint từ QR không có order vẫn gắn được batch, luồng phản hồi lưu vết.
18. Web và App cùng user thấy một cart/order/profile; phân quyền vẫn đúng.
19. Revenue = paid amounts – completed refunds, không tính refund pending.
20. Sau khi thêm P2: FEFO chọn lô sớm hết hạn; batch-discount chỉ áp dụng phần quantity thực tế gán batch giảm giá; report PDF không lộ PII cho public.

Tạo `docs/test-report.md` với lệnh chạy, ngày, pass/fail/skip, lý do skip; thêm kiểm tra giao diện responsive và ảnh hợp pháp không bị hỏng; có `docs/demo-script.md` để giảng viên tự chạy mô phỏng đầy đủ.

## 10. Kịch bản demo phải chạy từ đầu tới cuối

1. Seed 1 ADMIN và 2 CUSTOMER, vài Product, 1 Supplier/Farm, 1 Warehouse.
2. Admin tạo Season, nhiều CultivationLog có 1 lần phun thuốc và thời gian cách ly.
3. Cố tạo Batch thu hoạch quá sớm: hệ thống chặn; sửa ngày hợp lệ để tạo.
4. Tạo phiếu LabTest FAIL cho Batch B: batch bị khóa; nhập phiếu PASS mới đúng quy trình xác nhận.
5. Công khai Batch A/B đúng điều kiện; sinh tem QR; quét xem public trace.
6. Nhập kho batch A 4kg, B 6kg theo thứ tự A trước B.
7. CUSTOMER đặt 7kg trên Website; API giữ chỗ FIFO A4/B3; App thấy đơn đồng bộ.
8. Admin xác nhận, xuất kho đúng allocation, cập nhật giao/đã giao; khách xem lô thực xuất, đánh giá hoặc complaint.
9. Admin thu hồi Batch A; kiểm tra app/web không bán tiếp A, QR báo đỏ, danh sách khách/đơn đã nhận A; phần B không bị gán nhầm.
10. Admin xử lý liên hệ, RefundRequest thủ công, cập nhật report và dashboard; báo cáo truy xuất nếu đã có P2.

## 11. Khu vực cố tình KHÔNG làm để tránh vỡ phạm vi

Không thêm role nông dân/nhà cung cấp/nhân viên; không RBAC đa vai trò, không blockchain, IoT, QR từng gói, xác thực chứng thư chính phủ, 2FA, cổng thanh toán/giao vận thực, email/SMS thật, công nợ/kế toán đầy đủ, hóa đơn điện tử, đa kho/chuyển kho, gộp tách batch, Flash Sale/khuyến mãi nhiều tầng, AI chatbot. Chỉ thực hiện nếu có yêu cầu mới rõ ràng sau khi các P1 + 3 P2 đã ổn.

## 12. Cách làm việc tự chủ, trạng thái và đầu ra cuối cùng

- **Bắt đầu ngay**: đọc 2 DOCX, khởi tạo project, chạy các lệnh cần thiết và bắt tay vào GĐ0 rồi GĐ1. Không chỉ viết proposal hay hỏi tôi chọn công nghệ khi có thể dùng kiến trúc mặc định.
- Tối ưu làm từng lát **end-to-end chạy được** (DB→API→UI→test), tránh tạo 50 file placeholder. Không dùng “TODO/coming soon” cho yêu cầu đã nhận là hoàn thành.
- Nếu bị giới hạn ngữ cảnh/thời lượng, **ghi checkpoint** vào `docs/IMPLEMENTATION_STATUS.md` (giai đoạn đã xong, lệnh đã chạy, lỗi, backlog và bước tiếp theo cụ thể). Ở phiên sau tiếp tục từ checkpoint chứ không tự nhận full.
- Sau mỗi giai đoạn trả báo cáo ngắn bằng tiếng Việt: `Đã làm | Tệp quan trọng | Test thực chạy | Vấn đề | Bước kế tiếp`.
- Chỉ tuyên bố **FULL P1** khi ma trận mã ADM/CUS đủ, build/test chạy, demo từ đầu tới cuối hoạt động và không có bug P0/P1 còn mở. Nêu riêng P2 đã làm và chưa làm.
- Không được hứa chạy âm thầm hoặc gửi kết quả về sau; thực hiện những gì môi trường hiện tại cho phép, đưa checkpoint khi cần.

**THỰC HIỆN NGAY:** Xác nhận tìm thấy đúng 2 DOCX; trích xuất nội dung và ma trận yêu cầu; tạo kiến trúc monorepo, cấu hình chạy local, schema nền; thực hiện GĐ0 đến hết khả năng trong phiên này, không dừng sau phân tích.


## 13. ĐIỀU KIỆN CHỐT PHIÊN BẢN V1.1 (KHÔNG ĐƯỢC HIỂU SAI)

- Đầu ra là **01 website** có Customer và Admin (2 khu vực quyền riêng), **01 ứng dụng mobile Customer**, **01 API và 01 PostgreSQL**; không tạo web Admin và web Customer thành 2 sản phẩm/bộ dữ liệu khác nhau.
- Giao diện chuyên nghiệp lấy cảm hứng Amazon/Shopee **về trải nghiệm**, không sao chép thương hiệu và không tự thêm mô hình đa nhà bán.
- Ảnh sản phẩm/banner có thể tự tìm/tải **chỉ khi công cụ có mạng và ảnh có giấy phép phù hợp**; có danh mục nguồn. Không bịa ảnh nguồn gốc/kiểm nghiệm.
- **FULL** nghĩa là thực thi và nghiệm thu đủ yêu cầu P1 của Admin V3.0 và Customer V1.0, rồi ba P2 chọn lọc. Không được báo FULL chỉ vì đã có menu/màn hình.
- Nếu yêu cầu design system, UX hoặc sourcing ảnh mâu thuẫn với quy tắc chất lượng và truy xuất của hai DOCX, **ưu tiên quy tắc nghiệp vụ và tính trung thực**.
