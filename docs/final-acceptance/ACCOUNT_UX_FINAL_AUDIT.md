# Kiểm toán cuối — khu vực tài khoản khách hàng (Account UX)

Nhánh `feat/premium-visual-redesign-v5`. Mốc xuất phát `c353674` (không reset). Mọi kết quả dưới
đây là bước đã chạy thật trong phiên này, không suy đoán.

## 1. Vấn đề người dùng nêu và cách xử lý

| # | Vấn đề | Trạng thái trước | Cách xử lý |
|---|---|---|---|
| 1 | `/tai-khoan` đổ dồn mọi biểu mẫu (hồ sơ, mật khẩu, địa chỉ) vào một trang, cuộn rất dài | Một trang gộp 3 form | Tách thành trang tổng quan + 6 trang chức năng, mỗi trang một việc |
| 2 | Không có lối vào rõ cho địa chỉ / bảo mật | Chỉ có tab ngang sơ sài | `AccountNav` 7 tab + 6 thẻ chức năng có mô tả và mũi tên |
| 3 | Xoá địa chỉ không hỏi lại | Xoá ngay khi bấm | Hộp thoại `role="alertdialog"` nêu rõ người nhận + địa chỉ, nút "Giữ lại" |
| 4 | Không thấy địa chỉ nào là mặc định | Chỉ có nhãn rời rạc | Thẻ địa chỉ + badge "Mặc định" + nút "Đặt mặc định" |
| 5 | Sửa hồ sơ xong header vẫn tên cũ | Chỉ `router.refresh()` thiếu | Lưu → `router.refresh()`, tổng quan đọc lại `/me` |
| 6 | Không biết email dùng để đăng nhập | Không hiển thị | Khối "Email tài khoản" chỉ đọc trong Hồ sơ + câu ở trang Bảo mật |
| 7 | `/tai-khoan/bao-mat` có hai thẻ `<h1>` | PageHeader + component cùng phát `<h1>` | Bỏ `<h1>` khỏi `ChangePassword`, giữ PageHeader của trang |
| 8 | `/tai-khoan/don-hang` không có `<h1>` | Chỉ `<h2>` | Dùng `PageHeader` như 4 trang còn lại, bỏ tiêu đề trùng |
| 9 | Link cũ `/doi-mat-khau` mất tiêu đề trang | Trang trơ một form | Thêm `PageHeader` + breadcrumb về `/tai-khoan/bao-mat` |

## 2. Cấu trúc mới

```
/tai-khoan                 Tổng quan: lời chào, tên, email + 6 thẻ chức năng
/tai-khoan/don-hang        Danh sách đơn (lọc trạng thái + khoảng ngày)
/tai-khoan/don-hang/[id]   Chi tiết đơn, tiến trình, thanh toán, mua lại
/tai-khoan/ho-so           Họ tên + số điện thoại, email chỉ đọc
/tai-khoan/dia-chi         Sổ địa chỉ: thêm/sửa/xoá/mặc định
/tai-khoan/bao-mat         Đổi mật khẩu + hướng dẫn an toàn
/tai-khoan/danh-gia        Đánh giá đã gửi (giữ nguyên)
/tai-khoan/khieu-nai       Khiếu nại (giữ nguyên)
/doi-mat-khau              Đường dẫn cũ, vẫn hoạt động, trỏ về Bảo mật
```

## 3. Kiểm chứng bằng trình duyệt (Playwright, phiên thật)

Đăng nhập `khach1@example.com`. Mỗi dòng là thao tác đã chạy và kết quả đọc từ DOM.

| Bước | Kết quả |
|---|---|
| Đăng nhập → `/tai-khoan` | 200, `<h1>` = "Nguyễn Văn An", email hiển thị, 6 thẻ chức năng có mặt |
| Điều hướng tài khoản | 7 tab: Tổng quan, Đơn hàng, Hồ sơ, Địa chỉ, Bảo mật, Đánh giá, Khiếu nại |
| Sửa hồ sơ → Lưu | Thông báo "Đã lưu hồ sơ…"; quay lại tổng quan `<h1>` = "Nguyễn Văn An QA" |
| Thêm địa chỉ | Chọn "Phố Hiến" bằng tìm không dấu `pho hien` → 1 kết quả; lưu xong thẻ mới xuất hiện |
| Danh sách xã/phường | 104 `role=option` khi ô tìm kiếm trống |
| Đặt mặc định | Badge "Mặc định" chuyển sang thẻ vừa chọn, thẻ cũ hiện nút "Đặt mặc định" |
| Sửa địa chỉ | Mở form "Sửa địa chỉ", trường đường phố nạp sẵn giá trị cũ |
| Xoá — bấm "Giữ lại" | Hộp thoại đóng, còn đủ 2 thẻ |
| Xoá — bấm "Xóa địa chỉ" | Còn 1 thẻ, đúng thẻ còn lại |
| `/tai-khoan/bao-mat` | Đúng 1 `<h1>` "Đăng nhập & bảo mật" |
| `/doi-mat-khau` | Đúng 1 `<h1>` "Đổi mật khẩu", nút "Lưu mật khẩu mới" |
| `/tai-khoan/don-hang` | `<h1>` "Đơn hàng của tôi", 28 đơn, bộ lọc + tab trạng thái |
| Chi tiết đơn chưa thu (COD) | "Tổng 56.000₫" + "Còn trả khi nhận hàng 56.000₫" |
| Chi tiết đơn đã thu đủ (COD) | "Đã thanh toán 13.000₫", **không** có dòng còn phải trả |
| Đã đăng xuất vào `/tai-khoan` | Chuyển tới `/dang-nhap?next=/tai-khoan` |
| Bàn phím | Tab đi qua thẻ chức năng; vòng focus 1,6px màu `rgb(28,116,57)` = `--color-brand-600` |

### Tràn ngang

| Bề rộng | `scrollWidth` | `clientWidth` | Tràn |
|---|---|---|---|
| 1440 | 1425 | 1425 | không |
| 1280 | 1265 | 1265 | không |
| 768 | 753 | 753 | không |
| 390 | 375 | 375 | không |
| 360 | 345 | 345 | không |

Thanh tab tài khoản ở 360px: `scrollWidth` 817 trong khung 329 → cuộn ngang trong nav, không đẩy
trang. Nút "Lưu thay đổi" cao 44px ở cả 1440 và 390 (đạt ngưỡng chạm 44px).

### Ảnh chụp

`docs/screenshots/final/account-ux/` — 14 tệp:

`account-overview-1440/1280/768/390/360.png`, `account-profile-1440/390.png`,
`account-addresses-1440/390.png`, `account-security-1440.png`,
`account-orders-1440/390.png`, `account-order-detail-1440/390.png`.

## 4. Giới hạn của lần kiểm này

- Ảnh chụp chỉ chứng minh trang dựng và bố cục; đánh giá thẩm mỹ bằng mắt do người dùng thực hiện.
- Chưa chạy trên thiết bị Android/iOS thật; phần native không thuộc phạm vi phiên này.
- Đổi mật khẩu **không** được bấm gửi trong phiên kiểm (sẽ đổi mật khẩu tài khoản demo dùng chung
  cho toàn bộ test). Luồng đã có test API riêng và form không đổi so với trước.

## 5. Tệp thay đổi

Thêm mới:
`app/tai-khoan/ho-so/page.tsx`, `app/tai-khoan/dia-chi/page.tsx`, `app/tai-khoan/bao-mat/page.tsx`.

Sửa:
`app/tai-khoan/page.tsx` (viết lại thành tổng quan), `app/tai-khoan/layout.tsx` (bỏ header, chỉ còn
auth guard + nav), `components/account-nav.tsx` (7 tab), `components/address-book.tsx` (thẻ + hộp
thoại xoá), `components/profile-form.tsx` (email chỉ đọc, refresh sau lưu),
`components/change-password.tsx` (bỏ `<h1>` trùng, nút rõ nghĩa), `app/doi-mat-khau/page.tsx`
(thêm PageHeader), `app/tai-khoan/don-hang/page.tsx` (PageHeader),
`app/tai-khoan/don-hang/[id]/page.tsx` (kiểu `payment` mới + dòng còn phải trả).

---

## 6. Phiên làm lại (2026-11-23) — làm phẳng form, thẻ tổng quan, sửa lỗi đổi mật khẩu

### Lỗi UX phát hiện và đã sửa

| # | Lỗi | Bằng chứng trước khi sửa | Cách sửa |
|---|---|---|---|
| 1 | Đổi mật khẩu thành công là **bị đăng xuất ngay**: API ký token mới (`token_version + 1`) nhưng không cấp lại cookie | Playwright: gửi form → "Đã đổi mật khẩu" → vào `/tai-khoan` bị đẩy về `/dang-nhap` | `setAuthCookie(reply, token)` trong `POST /me/password`; test hồi quy `08-security.test.ts` (bỏ dòng này → test đỏ) |
| 2 | `/tai-khoan/dia-chi` tràn ngang trên mobile | `scrollWidth 754` / `clientWidth 390` | Form địa chỉ bỏ khung lồng, ô xã/phường nằm đúng cột lưới |
| 3 | Ba biểu mẫu lồng khung trong khung (`card-pad` bên trong `card-pad`) | Hồ sơ / Mật khẩu / Địa chỉ đều 2 lớp viền | Bỏ vỏ `card-pad` của component; trang chỉ còn một mặt phẳng, phân tách bằng đường kẻ |
| 4 | Tab tài khoản dạng viên thuốc chiếm 817px, phải cuộn ngang cả thanh | 360px: thanh tab 817px | Chuyển sang tab gạch chân (`border-b`), cao 44px, không tràn |
| 5 | Thẻ tổng quan cao 118px, mô tả + "Xem" chiếm 3 dòng | 454×118 | Một dòng mô tả, mũi tên bên phải: 459×85 |
| 6 | Avatar một chữ cái | `A` | Viết tắt họ + tên (`NA`), không cần upload ảnh |
| 7 | Link quay lại mỗi trang một kiểu | `Tài khoản` chữ nhỏ rời rạc | `AccountBreadcrumb` dùng chung: "‹ Tài khoản của tôi" |

### Kiểm chứng sau sửa (Playwright, phiên thật)

| Bước | Kết quả |
|---|---|
| Lưu họ tên ở `/tai-khoan/ho-so` | `<header>` đổi ngay sang "Xin chào, QA3"; `/tai-khoan` `<h1>` = "Nguyễn Văn An QA3" sau `router.refresh()` |
| Đổi mật khẩu | "Đã đổi mật khẩu…", vẫn ở `/tai-khoan` với phiên mới, đăng nhập lại bằng mật khẩu mới thành công |
| Thêm địa chỉ | Tìm không dấu `pho hien` → 1 kết quả; lưu → thẻ mới hiện |
| Đặt mặc định | Badge "Mặc định" chuyển sang thẻ mới, thẻ cũ hiện lại nút "Đặt mặc định" |
| Sửa địa chỉ | Form nạp sẵn `12 Lý Thường Kiệt` + xã/phường; lưu → dòng địa chỉ đổi |
| Xóa → "Giữ lại" | Hộp thoại đóng, còn 2 thẻ |
| Xóa → "Xóa địa chỉ" | Còn 1 thẻ |
| Người dùng chưa có địa chỉ | Trạng thái rỗng có icon, tiêu đề, gợi ý + nút "Thêm địa chỉ" |
| Danh sách xã/phường | 104 `role=option` |
| Bàn phím | Tab tới thẻ chức năng; focus ring 1.6px `rgb(28,116,57)` = `--color-brand-600` |
| Tràn ngang 390px | `scrollWidth 375` = `clientWidth 375` ở cả 4 trang |
| `<h1>` mỗi trang | Đúng một tiêu đề ở tổng quan, hồ sơ, địa chỉ, bảo mật, đơn hàng, đánh giá, khiếu nại |

`pnpm typecheck` PASS · `pnpm e2e:local` 10/10 · ảnh `docs/screenshots/final/account-ux-v2/`
(`before-*` / `after-*` ở 1440 và 390, thêm `after-empty-addresses-1440.png`).

Logic địa chỉ Hưng Yên, danh sách 104 xã/phường, phí ship và API đơn hàng/đánh giá/khiếu nại không đổi.
