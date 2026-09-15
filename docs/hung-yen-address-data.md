# Dữ liệu địa chỉ Hưng Yên (xã/phường snapshot 14/09/2026; thôn/TDP progress 15/09/2026)

Tài liệu chính thức duy nhất về địa bàn giao hàng AgriMarket.
Hợp nhất từ các gói dữ liệu tạm ban đầu
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
- Nguồn thôn/TDP canonical:
  `apps/api/prisma/seed-data/hung-yen-villages-2026.json`
  (tiến độ đã xác minh 15/09/2026) + đối chiếu phạm vi
  `apps/api/prisma/seed-data/hung-yen-villages-coverage-104-communes.json`.

## 2. Trạng thái thôn/tổ dân phố: PARTIAL_VERIFIED / NOT_COMPLETE

**Danh sách đầy đủ thôn/tổ dân phố toàn tỉnh CHƯA hoàn chỉnh.**
Snapshot kiểm tra: **15/09/2026**.

- Cấp xã/phường: **104/104 COMPLETE** (93 xã + 11 phường).
- Thôn/TDP có dataset xác minh: **12/104 xã/phường VERIFIED_COMPLETE**.
- Thôn/TDP còn chờ: **92/104 xã/phường PENDING_VERIFICATION**.
- Bản ghi đã xác minh đã import: **127 = 103 thôn + 24 tổ dân phố**.
- 12 xã/phường VERIFIED_COMPLETE (đối chiếu `coverage-104-communes.json`):
  HY-C004 Tiên Hoa 10, HY-C007 Tiên Tiến 9, HY-C008 Tống Trân 7,
  HY-C009 Lương Bằng 9, HY-C010 Nghĩa Dân 10, HY-C013 Ân Thi 11,
  HY-C017 Hồng Quang 11, HY-C019 Triệu Việt Vương 15, HY-C051 Hưng Phú 9,
  HY-C079 Kiến Xương 12, HY-C095 Sơn Nam 10 TDP, HY-C098 Đường Hào 14 TDP.
- Mã `HY-Cxxx-Vnnn` là **mã nội bộ AgriMarket, KHÔNG phải mã hành chính nhà nước**.

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
2. Tuyệt đối **không** coi file tiến độ 127 bản ghi là dữ liệu toàn tỉnh.
3. Tuyệt đối **không** báo đã có đủ 1.322 và **không** đổi trạng thái toàn tỉnh
   thành COMPLETE khi chưa đủ 104/104 xã/phường được xác minh.
4. Bảng `thon_to_dan_pho` + API
   `GET /api/v1/dia-ban-hung-yen/xa-phuong/:ma/thon-to-dan-pho`:
   xã VERIFIED_COMPLETE trả đủ danh sách; xã PENDING trả về `[]`, frontend hiển
   thị "Danh sách thôn/tổ dân phố của khu vực này đang được cập nhật." (không lộ
   thuật ngữ kỹ thuật `NOT_COMPLETE` ra khách hàng) và cho phép lưu địa chỉ với
   `thonToDanPhoMa = null` trong giai đoạn chuyển tiếp.
5. Backend (suy từ database, không hard-code 12 xã): xã/phường đã có > 0
   thôn/TDP active thì khi lưu địa chỉ theo schema mới, `thonToDanPhoMa` là bắt
   buộc; xã PENDING (COUNT = 0) tạm cho phép null. Địa chỉ legacy (chưa có
   `xaPhuongMa`) không bị ảnh hưởng.
6. Khi đổi xã/phường, frontend reset `thonToDanPhoMa` ngay rồi mới fetch mới.

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
- nếu xã đã có thôn/TDP active mà request không gửi `thonToDanPhoMa`
  → từ chối 400 (xã PENDING chưa có dataset vẫn cho phép null);
- `tinhThanh` (nếu client gửi) phải là Hưng Yên;
- từ chối `quanHuyen`/`maBuuChinh` khác rỗng;
- user chỉ sửa/xóa địa chỉ của chính mình (giữ ownership guard cũ).

## 5. Seed & kiểm tra

```bash
# Seed địa bàn (idempotent — upsert theo mã, chạy lại không duplicate):
# 104 xã/phường + 127 thôn/TDP đã xác minh
pnpm --filter @agrimarket/api seed:dia-ban-hung-yen

# Kiểm tra dataset (không cần DB): 104/93/11 + 127/103/24 + 12/92
pnpm --filter @agrimarket/api-client exec tsx ../../scripts/kiem-tra-du-lieu-hung-yen.ts
```

Seed FAIL khi COUNT xã/phường khác `104/93/11` hoặc COUNT progress khác
`127/103/24`, khi thôn/TDP trỏ tới xã không tồn tại, hoặc khi số record/xã
lệch khỏi coverage. Chạy lần 2 không tăng count.

## 6. Cập nhật dataset sau này

1. Thay `apps/api/prisma/seed-data/hung-yen-communes-2026.json` bằng snapshot
   mới (giữ nguyên shape `{ metadata, communes[] }`).
2. Bổ sung record mới vào `hung-yen-villages-2026.json` + cập nhật
   `hung-yen-villages-coverage-104-communes.json` theo từng xã/phường được xác minh
   (giữ nguyên shape `{ metadata, records[] }` / `{ coverage[] }`).
3. Chạy seed + kiểm tra counts mới.
4. Cập nhật snapshot date trong tài liệu này.
5. Chỉ khi đủ 104/104 xã/phường VERIFIED_COMPLETE và tổng cuối đối chiếu khớp
   nguồn chính thức mới xem xét bắt buộc `thonToDanPhoMa` toàn tỉnh và đổi
   trạng thái PARTIAL_VERIFIED/NOT_COMPLETE.

## 7. Nguồn xác minh (snapshot nghiên cứu 15/09/2026)

Mốc toàn tỉnh — Phương án 97/PA-UBND ngày 08/06/2026 (mục tiêu 1.322 = 1.117
thôn + 205 TDP; là phương án tổng thể, tên cuối theo nghị quyết/công bố cấp
xã/phường sau 29–30/06/2026):

- https://namtienhai.hungyen.gov.vn/bai-tuyen-truyen-ve-viec-trien-khai-phuong-an-tong-the-sap-xep-to-chuc-lai-thon-to-dan-pho-tren-dia--c2191.html
- https://hungphu.hungyen.gov.vn/updload_ubt/userfiles/files/12%20AA-%20%20_PA-UBND_6-2026_Phuong%20an%20tong%20the%20sap%20xep%2C%20to%20dan%20pho%202026.pdf

12 xã/phường VERIFIED_COMPLETE:

- HY-C004 Tiên Hoa (10): https://tienhoa.hungyen.gov.vn/hoi-nghi-cong-bo-quyet-dinh-sap-xep-to-chuc-cac-thon-tren-dia-ban-xa-tien-hoa-c2377.html ; https://tienhoa.hungyen.gov.vn/hoi-nghi-tiep-xuc-cu-tri-truoc-ki-hop-thuong-le-cuoi-nam-2025-cua-cac-to-dai-bieu-hoi-dong-nhan-dan--c2133.html
- HY-C007 Tiên Tiến (9): https://tientien.hungyen.gov.vn/xa-tien-tien-day-manh-ung-dung-tri-tue-nhan-tao-tao-dot-pha-trong-chuyen-doi-so-va-nang-cao-chat-luo-c2526.html ; https://tientien.hungyen.gov.vn/dong-thuan-tu-co-so-de-thuc-hien-hieu-qua-de-an-sap-xep-to-chuc-lai-thon-tai-xa-tien-tien-c2434.html
- HY-C008 Tống Trân (7): https://tongtran.hungyen.gov.vn/de-an-sap-xep-to-chuc-lai-thon-tren-dia-ban-xa-tong-tran-nam-2026-c2390.html ; https://tongtran.hungyen.gov.vn/ubnd-xa-tong-tran-trien-khai-nhiem-vu-lay-y-kien-nhan-dan-doi-voi-du-thao-de-an-sap-xep-to-chuc-lai--c2404.html ; https://tongtran.hungyen.gov.vn/xa-tong-tran-van-hanh-thu-nghiem-quy-trinh-bau-cu-san-sang-cho-ngay-bau-cu-dai-bieu-quoc-hoi-va-dai--c2262.html
- HY-C009 Lương Bằng (9): https://luongbang.hungyen.gov.vn/hoi-nghi-cong-bo-nghi-quyet-sap-xep-to-chuc-lai-cac-thon-tren-dia-ban-xa-luong-ban-c2282.html
- HY-C010 Nghĩa Dân (10): https://nghiadan.hungyen.gov.vn/xa-nghia-dan-tiep-tuc-trien-khai-thu-thap-cap-nhat-co-so-du-lieu-dat-dai-c2588.html ; https://nghiadan.hungyen.gov.vn/chung-tay-dong-thuan-thuc-hien-chu-truong-sap-xep-thon-tren-dia-ban-xa-nghia-dan-nam-2026-c2396.html
- HY-C013 Ân Thi (11): https://anthi.hungyen.gov.vn/hdnd-xa-an-thi-khoa-ii-to-chuc-ky-hop-thu-ba-ky-hop-chuyen-de-c2223.html ; https://anthi.hungyen.gov.vn/xa-an-thi-trien-khai-de-an-sap-xep-to-chuc-lai-thon-nam-2026-giam-tu-29-thon-xuong-con-11-thon-c2207.html
- HY-C017 Hồng Quang (11): https://hongquang.hungyen.gov.vn/xa-hong-quang-cong-bo-cac-quyet-dinh-ve-thanh-lap-thon-chi-bo-va-ban-chi-uy-bi-thu-pho-bi-thu-chi-bo-c2881.html
- HY-C019 Triệu Việt Vương (15): https://trieuvietvuong.hungyen.gov.vn/ban-thuong-vu-dang-uy-xa-trieu-viet-vuong-cong-bo-cac-quyet-dinh-ve-to-chuc-bo-may-va-cong-tac-can-b-c2236.html
- HY-C051 Hưng Phú (9): https://hungphu.hungyen.gov.vn/hung-phu-to-chuc-hoi-nghi-so-ket-01-nam-thuc-hien-mo-hinh-chinh-quyen-dia-phuong-hai-cap-cong-bo-cac-c2505.html
- HY-C079 Kiến Xương (12): https://kienxuong.hungyen.gov.vn/xa-kien-xuong-so-ket-cong-tac-6-thang-dau-nam-va-cong-bo-nghi-quyet-ve-sap-xep-to-chuc-lai-thon-tren-c2988.html
- HY-C095 Sơn Nam (10 TDP): https://sonnam.hungyen.gov.vn/phuong-son-nam-to-chuc-hoi-nghi-cong-bo-nghi-quyet-sap-xep-to-chuc-lai-to-dan-pho-cac-quyet-dinh-ve--c2454.html ; https://sonnam.hungyen.gov.vn/phuong-son-nam-soi-noi-lien-hoan-giai-dieu-tuoi-hong-va-thieu-nhi-ke-chuyen-he-nam-2026-c2476.html
- HY-C098 Đường Hào (14 TDP): https://duonghao.hungyen.gov.vn/phuong-duong-hao-to-chuc-hoi-nghi-cong-bo-cac-quyet-dinh-ve-sap-xep-to-chuc-lai-to-dan-pho-tren-dia--c2360.html
