# AgriMarket AutoFix Report

- Root: `E:\dev\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc`
- Frontend: `E:\dev\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc`
- Mode: `DRY-RUN`
- Planned/applied changes: **6**
- Findings: **45**

## Thay đổi
- `create_asset`: 3
- `create_helper`: 1
- `image_fallback`: 1
- `text_cleanup`: 1

### Chi tiết file
- `public\images\fallback\farm.svg` — **create_asset** — Tạo fallback farm.svg.
- `public\images\fallback\product.svg` — **create_asset** — Tạo fallback product.svg.
- `public\images\fallback\certificate.svg` — **create_asset** — Tạo fallback certificate.svg.
- `utils\media.ts` — **create_helper** — Tạo utils/media để đồng nhất URL ảnh API.
- `apps\api\test\gia-hieu-luc.e2e-spec.ts` — **text_cleanup** — Chuẩn hóa text demo/nhãn tab.
- `apps\admin-web\src\app\lo-san-pham\page.tsx` — **image_fallback** — Thêm onError fallback + lazy/async cho thẻ img.

## Audit logic/UI
- **HIGH** `KE_HOACH_HOAN_THIEN_MOBILE_AGRIMARKET.md:260` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `README.md:585` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `README.md:586` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `README.md:602` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\admin-web\src\app\providers.tsx:28` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\scripts\seed-data.before-repair-20260915_085240.ts:1439` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\scripts\seed-data.ts:1440` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\cau-hinh-ung-dung.ts:17` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\cau-hinh-ung-dung.ts:44` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\modules\hang-doi\hang-doi.config.ts:5` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\modules\tep-tin\tep-tin-serve.controller.ts:39` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\modules\tep-tin\tep-tin.service.ts:270` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\modules\thanh-toan\thanh-toan-callback.controller.ts:95` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\modules\xac-thuc\thu-dien-xac-thuc.service.ts:24` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\src\redis\redis.service.ts:10` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\test\redis-bullmq.e2e-spec.ts:157` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\test\tep-tin.e2e-spec.ts:51` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\test\trang-trai.e2e-spec.ts:55` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\api\test\xac-thuc.e2e-spec.ts:371` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\customer-web\src\app\providers.tsx:27` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\mobile\src\lib\api-runtime.ts:3` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `apps\mobile\src\lib\api-runtime.ts:18` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\MOBILE-APP.md:45` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\MOBILE-APP.md:84` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\MOBILE-APP.md:88` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\MOBILE-APP.md:89` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\NHAT_KY_PHIEN_AI.md:374` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\NHAT_KY_PHIEN_AI.md:377` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:1598` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:1604` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:2164` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:2537` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:2540` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:2543` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\PHAN-TICH-CONG-NGHE-UI-HIEN-DAI.md:2546` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\van-hanh-local.md:11` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\van-hanh-local.md:12` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\van-hanh-local.md:13` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\van-hanh-local.md:14` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `docs\van-hanh-local.md:15` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **HIGH** `packages\api-client\src\runtime.ts:1` `hardcoded_api` — Có URL localhost/127.0.0.1. Nên đưa vào biến môi trường.
- **MEDIUM** `apps\admin-web\src\app\danh-muc-san-pham\page.tsx:140` `mixed_content` — Ảnh HTTP có thể bị chặn trên site HTTPS.
- **MEDIUM** `apps\admin-web\src\app\san-pham\page.tsx:164` `mixed_content` — Ảnh HTTP có thể bị chặn trên site HTTPS.
- **LOW** `apps\customer-web\src\components\chi-tiet-trang-trai-content.tsx:256` `empty_state` — Public UX nên ẩn map hoặc dùng empty-state gọn thay vì để block lớn.
- **LOW** `apps\mobile\src\app\trang-trai\[id].tsx:339` `empty_state` — Public UX nên ẩn map hoặc dùng empty-state gọn thay vì để block lớn.

## Checklist marketplace nên có
- Card trang trại: ảnh thật, tên, địa phương, chứng nhận, số sản phẩm, rating, nút Theo dõi.
- Trang trại detail: cover/hero, badge xác minh, rating, lượt theo dõi, phản hồi, sản phẩm nổi bật.
- Sản phẩm: nhiều ảnh thật, giá/khuyến mãi, tồn kho, đơn vị bán, vận chuyển, Mua ngay/Thêm giỏ.
- Truy xuất: vùng trồng, lô/vụ, nhật ký canh tác, chứng nhận, QR/trace ID.
- Empty-state: không render GPS/chứng nhận/diện tích thành card lớn khi dữ liệu trống.
- Ảnh: farm 16:9, product 1:1, object-fit: cover, fallback cục bộ.
- Không dùng dữ liệu seed/test kiểu 'Trang trại Đà Lạt Xanh' trên giao diện public.

> Đây là dry-run. Chạy lại với `--apply` để ghi file.
