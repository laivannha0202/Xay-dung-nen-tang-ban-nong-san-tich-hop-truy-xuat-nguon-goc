# BRAND_STANDARD — AgriMarket

## 1. Nguồn nhận diện duy nhất

| Hạng mục | Nguồn | Dùng ở đâu |
|---|---|---|
| Biểu tượng lá + wordmark | `BrandLogo` trong `packages/ui/src/primitives.tsx` | Admin sidebar, Admin đăng nhập, header/footer cửa hàng, đăng nhập cửa hàng, mọi chứng từ in |
| Favicon / app icon | `packages/ui/brand/icon.svg` (nguồn thật) | `apps/customer-web/app/icon.svg`, `apps/admin-web/app/icon.svg`, `customer-mobile/assets/icon.png` |
| Splash | sinh từ `icon.svg` | `customer-mobile/assets/splash-icon.png`, `app.json` `splash.backgroundColor = #1c7439` |
| Màu | token `--color-brand-*` trong `packages/ui/src/styles.css`, mirror `theme.ts` của mobile | toàn hệ thống |
| Font | Be Vietnam Pro (self-host, woff2 có subset tiếng Việt; mobile bundle `.ttf`) | toàn hệ thống |
| Icon | bộ `packages/ui/src/icons.tsx` (inline, `currentColor`) | web; mobile dùng Ionicons cho tab bar |
| Tiền / ngày | `vnd()`, `qty()`, `dateVN()`, `dateTimeVN()` trong `packages/core` | mọi màn hình và chứng từ |

Trước đây admin và cửa hàng dùng **hai favicon khác nhau** (nền `#161c21` đen vs `#256b48` xanh). Nay cả hai là cùng một file SVG; icon mobile và splash sinh từ đúng SVG đó bằng `sharp`.

Kiểm tra: `apps/customer-web/app/icon.svg` == `apps/admin-web/app/icon.svg` == `packages/ui/brand/icon.svg` (byte-for-byte).

## 2. Màu thương hiệu

```
brand-500  #238b45   nút chính, link
brand-600  #1c7439   khối logo, hover
brand-700  #186231   wordmark storefront, chữ nhấn
buy-500    #ffcc48   nút mua (chữ ink-900, không bao giờ chữ trắng)
sand-500   #f97316   khuyến mãi, cận hạn
```

`themeColor` của cả hai web = `#238B45`; splash mobile = `#1c7439`.

## 3. Font

- Web: `Be Vietnam Pro` 400/500/600/700, woff2 + subset `vi`, `display: swap`, self-host trong `public/fonts`.
- Mobile: cùng họ font, nạp qua `expo-font`.
- Không dùng serif ở bất kỳ đâu (utility `display` giữ `--font-sans`).

## 4. Thông tin cửa hàng

Một nguồn: `STORE` trong `packages/core/src/store.ts`, đọc từ `NEXT_PUBLIC_STORE_*`.

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `name` | có | mặc định `AgriMarket` |
| `legalName` | không | **để trống** trong demo — chưa có pháp nhân đăng ký |
| `address` | không | **để trống** — không bịa địa chỉ |
| `hotline` | không | **để trống** — không bịa số |
| `email` | không | **để trống** |
| `website` | không | **để trống** |
| `taxCode` | không | **để trống** — MST giả trên chứng từ là sai pháp lý |

`storeContactLines()` chỉ trả về dòng đã cấu hình; chứng từ in **bỏ qua** dòng trống thay vì in "—". Không có tên công ty, địa chỉ, hotline hay mã số thuế nào được tạo ra trong mã nguồn.

## 5. Header / Footer / Đăng nhập

- Header cửa hàng: `BrandLogo size="md"` + wordmark `brand-700` (ẩn dưới `lg`).
- Footer cửa hàng: `BrandLogo wordmark` + các dòng liên hệ đã cấu hình (rỗng ⇒ không hiện).
- Admin sidebar: `BrandLogo wordmark subtitle="Bảng điều khiển"`.
- Admin đăng nhập: `BrandLogo size="lg" wordmark subtitle="Quản trị vận hành"`.
- Cửa hàng đăng nhập: `BrandLogo size="lg"` căn giữa.

## 6. Giới hạn

- App icon/splash chưa được kiểm tra trên thiết bị thật (chưa build native). Đã xác nhận `app.json` hợp lệ và trỏ đúng file PNG 512/1024px.
- Không có bộ nhận diện in ấn riêng (name card, bao bì) ngoài chứng từ.
