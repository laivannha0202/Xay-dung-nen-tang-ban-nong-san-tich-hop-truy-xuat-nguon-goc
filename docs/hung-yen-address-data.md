# Dữ liệu địa chỉ Hưng Yên (snapshot 14/09/2026)

Tài liệu chính thức duy nhất về địa bàn giao hàng AgriMarket.
Hợp nhất từ gói dữ liệu tạm ban đầu
(đã xóa sau khi tích hợp — production không phụ thuộc đường dẫn tạm đó).

## 1. Phạm vi

- Tỉnh giao hàng duy nhất: **Hưng Yên** (tỉnh Hưng Yên mới sau sắp xếp,
  gồm địa bàn Hưng Yên cũ + Thái Bình cũ).
- Tổng đơn vị cấp xã: **104** = **93 xã** + **11 phường**.
- Nguồn cấp xã/phường: Nghị quyết **1666/NQ-UBTVQH15** năm 2025
  (hoạt động từ 01/07/2025).
- Link tham chiếu:
  https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1666-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-tinh-hung-yen-nam-2025-119250616195158879.htm
- Nguồn duy nhất trong code:
  `apps/api/prisma/seed-data/hung-yen-communes-2026.json`
  (không giữ bản CSV trùng lặp, không giữ 3–4 bản copy).

## 2. Trạng thái thôn/tổ dân phố: NOT_COMPLETE

**Danh sách đầy đủ thôn/tổ dân phố toàn tỉnh CHƯA được đóng gói.**

- Phương án 97/PA-UBND ngày 08/06/2026 nêu mục tiêu toàn tỉnh còn
  **1.322 thôn, tổ dân phố**, nhưng đó là phương án tổng thể, không phải
  danh sách tên cuối cùng:
  https://hungphu.hungyen.gov.vn/updload_ubt/userfiles/files/12%20AA-%20%20_PA-UBND_6-2026_Phuong%20an%20tong%20the%20sap%20xep%2C%20to%20dan%20pho%202026.pdf
- Tên cuối do từng xã/phường ban hành/công bố cuối tháng 6/2026, có trường
  hợp khác dự thảo (ví dụ xã Kiến Xương: Nghị quyết 11/NQ-HĐND ngày
  29/06/2026, 12 thôn —
  https://kienxuong.hungyen.gov.vn/xa-kien-xuong-so-ket-cong-tac-6-thang-dau-nam-va-cong-bo-nghi-quyet-ve-sap-xep-to-chuc-lai-thon-tren-c2988.html).

Quy tắc bắt buộc:

1. Tuyệt đối **không** tự tạo tên thôn (`Thôn 1`, `Thôn 2`...).
2. Tuyệt đối **không** coi file ví dụ một xã là dữ liệu toàn tỉnh.
3. Tuyệt đối **không** đổi trạng thái thành COMPLETE khi chưa có dataset
   cuối đầy đủ đã xác minh.
4. Bảng `thon_to_dan_pho` + API
   `GET /api/v1/dia-ban-hung-yen/xa-phuong/:ma/thon-to-dan-pho` đã sẵn sàng:
   xã chưa công bố trả về `[]`, frontend hiển thị thông báo rõ và cho phép
   lưu địa chỉ với `thonToDanPhoMa = null` trong giai đoạn chuyển tiếp.
   Khi có file `hung-yen-villages-2026.json` đầy đủ, chỉ cần seed/import,
   không viết lại backend/UI.

## 3. Kiến trúc dữ liệu

```text
xa_phuong_hung_yen (ma HY-C001..HY-C104, ten, ten_day_du, ten_chuan_hoa, loai XA|PHUONG, hoat_dong)
  └─ thon_to_dan_pho (ma, xa_phuong_ma FK, ten, ten_day_du, ten_chuan_hoa, loai THON|TO_DAN_PHO, hoat_dong)
       └─ dia_chi (xa_phuong_ma FK nullable, thon_to_dan_pho_ma FK nullable)
```

- Migration: `apps/api/prisma/migrations/20260914090000_dia_ban_hung_yen_104_xa_phuong/`
  (chỉ CREATE TABLE + ADD COLUMN nullable + FK — không drop cột legacy
  `phuong_xa/quan_huyen/tinh_thanh/ma_buu_chinh`).
- `DiaChi` mới: `tinhThanh` cố định `Hưng Yên`, `phuongXa` tự suy ra từ
  `tenDayDu` của xã/phường, `quanHuyen = null`, `maBuuChinh = null`.
- Địa chỉ legacy (chưa có `xaPhuongMa`) vẫn đọc/ghi bình thường để không
  hỏng sổ địa chỉ cũ và test cũ; checkout vẫn chặn ngoài phạm vi ở
  `PhamViGiaoHangService`.

## 4. API

```text
GET /api/v1/dia-ban-hung-yen/xa-phuong?tuKhoa=kien xuong
→ [{ ma, ten, tenDayDu, loai, tenChuanHoa }] (tìm không dấu)

GET /api/v1/dia-ban-hung-yen/xa-phuong/:ma/thon-to-dan-pho
→ [{ ma, ten, tenDayDu, loai }] (rỗng nếu xã chưa công bố — NOT_COMPLETE)
```

Backend khi lưu địa chỉ có `xaPhuongMa`:

- xã phải tồn tại + đang hoạt động;
- `thonToDanPhoMa` (nếu có) phải tồn tại + hoạt động + thuộc đúng xã;
- `tinhThanh` (nếu client gửi) phải là Hưng Yên;
- từ chối `quanHuyen`/`maBuuChinh` khác rỗng;
- user chỉ sửa/xóa địa chỉ của chính mình (giữ ownership guard cũ).

## 5. Seed & kiểm tra

```bash
# Seed địa bàn (idempotent — upsert theo mã, chạy lại không duplicate)
pnpm db:seed:dia-ban-hung-yen

# Kiểm tra dataset (không cần DB)
pnpm --filter @agrimarket/api-client exec tsx ../../scripts/kiem-tra-du-lieu-hung-yen.ts
```

Seed FAIL khi COUNT khác `104/93/11`.
Chạy lần 2 không tăng count.

## 6. Cập nhật dataset sau này

1. Thay `apps/api/prisma/seed-data/hung-yen-communes-2026.json` bằng snapshot
   mới (giữ nguyên shape `{ metadata, communes[] }`).
2. Chạy seed + kiểm tra `104/93/11` (hoặc số mới theo nghị quyết mới).
3. Cập nhật snapshot date trong tài liệu này.
4. Khi có dataset thôn/TDP đầy đủ đã xác minh theo nghị quyết cấp xã:
   đặt `hung-yen-villages-2026.json` cạnh file commune, seed vào
   `thon_to_dan_pho`, lúc đó mới xem xét bắt buộc `thonToDanPhoMa` và đổi
   trạng thái NOT_COMPLETE.
