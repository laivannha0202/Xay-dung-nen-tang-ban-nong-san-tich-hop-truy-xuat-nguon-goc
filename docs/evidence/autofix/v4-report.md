# AgriMarket Fix ALL v4 Report

- Root: `E:\dev\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc`
- Mode: `APPLY`
- Changes: **12**

## Changes
- packages\eslint-config\index.mjs — ignore AutoFix/snapshot + allow RN static require
- apps\customer-web\src\components\danh-sach-trang-trai-content.tsx — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\customer-web\src\components\trang-chu-content.before-4-knowledge-4-news-20260915_093408.tsx — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\customer-web\src\components\trang-chu-content.tsx — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\api\src\modules\theo-doi-trang-trai\theo-doi-trang-trai.service.ts — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\api\src\modules\trang-trai\trang-trai-quan-he.service.spec.ts — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\api\src\modules\trang-trai\trang-trai.service.ts — xóa constant AutoFix không dùng: FARM_DEFAULT_IMAGE, PRODUCT_DEFAULT_IMAGE
- apps\admin-web\src\app\page.tsx — xóa unused apiLayBaoCaoHetHan
- apps\customer-web\src\components\tong-quan-tai-khoan-content.tsx — xóa eslint-disable của rule react-hooks chưa cấu hình
- apps\mobile\src\app\(tabs)\index.tsx — dọn unused mobile homepage
- apps\mobile\src\app\goi-y.tsx — xóa PRIMARY không dùng
- utils\media.ts — di chuyển helper AutoFix cũ không được import

## Notes
- Backup trước eslint --fix: 1427 file

> Backup: `E:\dev\Xay-dung-nen-tang-ban-nong-san-tich-hop-truy-xuat-nguon-goc\.agrimarket-autofix-backup\v4-20260915-111933-214051`
