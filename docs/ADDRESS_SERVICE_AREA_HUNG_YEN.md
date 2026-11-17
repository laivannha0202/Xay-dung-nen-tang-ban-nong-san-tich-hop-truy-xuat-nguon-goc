# Vùng giao hàng tỉnh Hưng Yên & chọn xã/phường

Trạng thái: đã triển khai và nghiệm thu bằng API thật + Playwright (2026-11-17).
Phạm vi: toàn bộ luồng địa chỉ/checkout của Web khách, Admin và Expo.

## 1. Nguồn dữ liệu địa giới

| Thuộc tính | Giá trị |
|---|---|
| Tỉnh duy nhất | `Tỉnh Hưng Yên` — mã `33` |
| Số đơn vị cấp xã | **104** = 93 Xã + 11 Phường |
| `dataset_version` | `hy-2025-nq1666-2026-11-17` |
| Văn bản gốc | Nghị quyết **1666/NQ-UBTVQH15** (sắp xếp đơn vị hành chính cấp xã tỉnh Hưng Yên sau sáp nhập 2025) |
| Dữ liệu tra cứu mã | diachiviet.com, giấy phép CC BY 4.0 |
| Mức độ đối chiếu | **Tên 104/104 khớp từng dòng với văn bản NQ 1666** (so khớp NFC tự động, 2026-11-17). **Mã 5 số** lấy từ diachiviet.com, chưa đối chiếu từng mã với Tổng cục Thống kê — dùng làm khoá nội bộ, không trích dẫn như mã chính thức |
| Tệp | `apps/api/data/hung-yen-wards.json` (có `search_text` đã bỏ dấu) |

Mỗi bản ghi: `code` (5 chữ số, ví dụ `11953` Phường Phố Hiến, `12313` Xã Đức Hợp),
`name`, `type` ∈ {`Xã`, `Phường`}, `search_text`, `province_code = '33'`.

Địa giới **không** phải fixture demo: bảng `wards` được nạp từ migration, `seed.ts` chỉ
nạp lại sau `TRUNCATE` để môi trường test/demo luôn có đủ 104 dòng.

## 2. Mô hình dữ liệu

```sql
-- apps/api/migrations/004_service_area.sql
wards(code PK, province_code, name, type, search_text,
      in_service_area boolean DEFAULT true,
      dataset_version, source, source_checked_at,
      disabled_at, disabled_by, updated_at)
addresses + province_code text, ward_code text REFERENCES wards(code), needs_confirmation boolean
addresses.district → NULLABLE (chỉ còn để hiển thị lịch sử)
```

Địa chỉ mới **chỉ nhận `ward_code`**; tên xã/tỉnh do server resolve từ `wards`.
Client không gửi được tỉnh/xã tự do → không thể giả địa chỉ ngoài vùng.

`needs_confirmation` khi đọc danh sách được tính động bằng `(ward_code IS NULL)`:
địa chỉ cũ nhập tay (có `district`, không có `ward_code`) hiện badge
"Cần chọn lại xã/phường" cho tới khi khách chọn lại; cột `needs_confirmation`
vẫn còn để backfill và để `PATCH` xoá cờ.

## 3. Phí giao hàng

| Quy tắc | Giá trị | Nơi định nghĩa |
|---|---|---|
| Phí cơ bản | 20.000₫ | `services/pricing.ts` `BASE_SHIP_FEE_VND` |
| Miễn phí từ | 500.000₫ tiền hàng | `FREE_SHIP_THRESHOLD_VND` |
| Phạm vi | chỉ nội tỉnh Hưng Yên | `services/serviceArea.ts` |

`/checkout/preview` trả `ship_fee_final: false` khi chưa chọn địa chỉ — giao diện hiển thị
phí kèm nhãn "(tạm tính)". Chỉ khi `address_status = 'OK'` mới chốt phí và bật nút đặt hàng.

## 4. Hợp đồng API

| Endpoint | Quyền | Trả về |
|---|---|---|
| `GET /locations/service-area` | công khai | `{province:{code,name}, dataset_version, ward_count, serviceable_ward_count, ship_fee_vnd, free_ship_threshold_vnd}` |
| `GET /locations/wards?q=&include_disabled=` | công khai | 104 xã/phường; `q` tìm **không dấu**; mặc định chỉ xã đang phục vụ |
| `GET /locations/wards/:code` | công khai | 1 xã/phường hoặc 404 |
| `GET /admin/service-area/wards` | ADMIN | kèm `saved_addresses`, `open_orders` để cân nhắc trước khi tắt |
| `PATCH /admin/service-area/wards/:code` | ADMIN | `{in_service_area, reason}` → ghi `audit_logs`; tắt xã cuối cùng → 409 `SERVICE_AREA_LAST_WARD` |
| `POST /me/addresses`, `PATCH /me/addresses/:id` | CUSTOMER | nhận `{recipient_name, phone, ward_code, street_detail, is_default?}` |
| `GET /me/addresses` | CUSTOMER | thêm `ward_name`, `in_service_area`, `needs_confirmation` |
| `POST /checkout/preview` | CUSTOMER | `address_id?`; trả `address_status`, `ship_fee_final`, `ward_name`, `service_area` |
| `POST /orders` | CUSTOMER | kiểm lại vùng giao **trong transaction** trước khi giữ kho |

`address_status`: `MISSING` (chưa chọn) · `OUTSIDE_SERVICE_AREA` (xã ngoài vùng) ·
`NEEDS_UPDATE` (địa chỉ cũ chưa có `ward_code`) · `OK`.

Mã lỗi: `ADDRESS_NEEDS_UPDATE`, `SERVICE_AREA_UNAVAILABLE`, `SERVICE_AREA_LAST_WARD`.
Đơn bị chặn vùng giao **không** giữ kho và **không** tạo `idempotency_records`, nên khách
gửi lại cùng `Idempotency-Key` sau khi sửa địa chỉ vẫn đặt được bình thường.

## 5. Bề mặt giao diện

| Bề mặt | Tệp | Hành vi |
|---|---|---|
| Web khách — sổ địa chỉ | `apps/customer-web/components/address-book.tsx` | tỉnh khoá "Tỉnh Hưng Yên"; sửa/xoá/đặt mặc định; badge cần chọn lại / ngoài vùng |
| Web khách — combobox xã | `components/ward-picker.tsx` | tìm không dấu, điều hướng `↑ ↓ Enter Esc`, cache dùng chung, ARIA `combobox`/`listbox`/`option` |
| Web khách — thanh toán | `components/checkout-flow.tsx` | chọn địa chỉ → re-quote theo `address_id`; chặn đặt khi chưa `OK` |
| Admin — vùng giao hàng | `apps/admin-web/components/service-area-console.tsx` | tìm, tắt/bật, confirm khi xã còn đơn chưa giao |
| Expo — chọn xã | `apps/customer-mobile/src/ward-picker.tsx` | bottom sheet + ô tìm không dấu |

Số xã đang phục vụ hiển thị ở giỏ hàng ("Chỉ giao trong tỉnh Hưng Yên — N/104 xã/phường").

## 6. Vận hành

1. Áp migration: `pnpm db:migrate` (chạy `004_service_area.sql`, 104 dòng `ON CONFLICT DO UPDATE`).
2. Kiểm tra: `curl localhost:4000/api/v1/locations/service-area` → `ward_count: 104`.
3. Tắt một xã: `/admin/cai-dat` → mục **Vùng giao hàng** → nút `Tắt` (nhập lý do nếu còn đơn chưa giao).
   Xã bị tắt biến mất khỏi combobox của khách ngay, và đơn đang chờ chọn xã đó bị chặn khi đặt.
4. Sai sót dữ liệu địa giới: sửa `apps/api/data/hung-yen-wards.json`, đổi `dataset_version`,
   thêm migration `005_*` nạp lại — không `UPDATE` tay trên DB thật.

Rollout: migration chỉ thêm bảng/cột, địa chỉ cũ được đánh dấu "cần chọn lại" chứ không bị xoá.
Xã bị tắt không xoá dữ liệu, chỉ đặt `in_service_area = false` + `disabled_at/disabled_by`.

## 7. Kiểm thử

`apps/api/test/07-service-area.test.ts` — 11 test:

- Dataset đúng 104/93/11, `dataset_version`, tìm "pho hien" không dấu, tỉnh khác trả rỗng.
- Lưu địa chỉ theo `ward_code`, từ chối mã xã không tồn tại, resolve đúng tên xã + tỉnh.
- Địa chỉ cũ `needs_confirmation` → `PATCH` chọn lại thì hết cờ.
- Phí 20.000₫ dưới ngưỡng, 0₫ từ 500.000₫, `address_status = MISSING` khi chưa chọn.
- Xã bị tắt → 409 `SERVICE_AREA_UNAVAILABLE`, không tạo `idempotency_records`, không giữ kho.
- Ảnh chụp địa chỉ bịa ngoài tỉnh → bị chặn.
- Admin tắt/bật xã: xã biến mất rồi hiện lại trong picker của khách.

`apps/api/test/08-security.test.ts` — 9 test (uploads riêng tư, evidence chỉ khi công bố,logout thu hồi đúng token, tệp khiếu nại chỉ nhận file của chính khách).

Đối chiếu tên gọi: script đọc văn bản NQ 1666 trên `xaydungchinhsach.chinhphu.vn`, bắt 104 mệnh đề
"thành xã/phường mới có tên gọi là …", chuẩn hoá NFC rồi so tập với `hung-yen-wards.json` → khớp tuyệt đối
(khác biệt duy nhất là dấu tổ hợp Unicode, đã chuẩn hoá).

Nghiệm thu thủ công bằng Playwright (2026-11-17), ảnh trong `docs/screenshots/`:

| Bước | Kết quả |
|---|---|
| Web: thêm địa chỉ, gõ `duc` → chọn "Xã Đức Hợp" → lưu | `GET /me/addresses` có `ward_code: 12313`, `needs_confirmation: false` |
| Web: `/thanh-toan` chọn địa chỉ Đức Hợp | "Giao đến Xã Đức Hợp, Tỉnh Hưng Yên", phí chốt 20.000₫ |
| Admin: tìm `pho hien`, bấm `Tắt` + xác nhận | dòng đổi "Đã tắt / Bật", `/locations/service-area` còn 103, picker của khách 0 kết quả |
| Admin: bấm `Bật` | trở lại 104 |
| Expo web :8081: mở picker, gõ `duc hop`, chọn xã | hiện "Xã Đức Hợp" trong form địa chỉ |
| Expo web :8081: Đăng xuất | token trong storage bị xoá; bearer cũ gọi `/me/addresses` trả **401** |

Ảnh: `docs/screenshots/checkout-390.png`, `checkout-768.png`, `checkout-1440.png`,
`admin-service-area-1440.png`, `mobile-ward-picker-390.png`.

## 8. Giới hạn đã biết

- Native Android/iOS **BLOCKED**: máy không có `adb`/emulator/`ANDROID_HOME`; mọi hành vi di động chỉ chứng minh trên Expo web.
  Chuẩn bị cho Expo Go (chưa chạy được ở đây):
  1. Điện thoại cùng Wi-Fi với máy chạy API; lấy IP LAN (`ipconfig` → IPv4, ví dụ `192.168.1.10`).
  2. `apps/customer-mobile/.env`: `EXPO_PUBLIC_API_BASE=http://192.168.1.10:4000/api/v1`,
     `EXPO_PUBLIC_WEB_BASE=http://192.168.1.10:3000` (ảnh seed trong `public/images`).
     Ảnh upload đi qua `API_BASE` nhờ `imgUrl()` trong `src/nav.ts`.
  3. API phải cho origin đó: `CORS_ORIGINS=http://192.168.1.10:8081` trong `apps/api/.env` (mặc định chỉ có `localhost`).
  4. `cd apps/customer-mobile && npx expo start --tunnel` rồi quét QR bằng Expo Go; camera/`expo-secure-store`
     chỉ kiểm được trên máy thật.
- Chưa tích hợp đơn vị vận chuyển thật; phí là phí nội bộ, không lấy bảng giá GHN/ViettelPost.
- Danh mục xã/phường cố định theo nghị quyết 1666; khi có nghị quyết mới phải thêm dataset + migration.
