# Manual UI Acceptance — AgriMarket (05/10/2026, ICT)

Thuc hien bang trinh duyet that (Playwright Chromium 153.0.8010.12, headless + mobile viewport 390x844).
Runtime: API :3000 (prod dist, dev DB `agrimarket`), Customer :3001 (build moi), Admin :3002 (build moi), Expo Web :8081 (Metro dev, `AGRIMARKET_LAN_IP=127.0.0.1`).

## ID dung chung xuyen 3 he (cross-system)

- Danh muc: `01a10a35-47ca-77fa-a46d-150ab5785b73` — "Ca rot" / `ca-rot`
- NCC: `01a10a35-6bcd-7308-b827-ae46b30759fa` — `NCC-MANUAL-0510-1056`
- Chung nhan: `01a10a35-b833-773d-ba69-8c9192f8e537` — `CN-MANUAL-0510-1056` (kem file `ca-ro-t.jpg`, tepTinId `01a10a35-b80e-...`)
- San pham: `01a10a41-4b88-7310-8138-5373445a2647` — "Ca rot Manual UI 0510-1056" (danh muc ca-rot, trai TT-SONG-HONG-01)
- Bien the: `01a10a41-5426-71cb-be19-d16306773092` — `CROT-MANUAL-0510-1056-500G`, 500g, gia catalog 22.000d
- Flash Sale: `01a10a45-be14-77d3-9fe6-0fb407e5aade` — item gia flash 15.000d (-32%), gioi han/khach = 2
- Mua vu: `01a10a46-1293-745a-b1cd-e97600d468d7` (Song Hong, Ca rot / Ca rot Da Lat)
- Thu hoach: `01a10a4a-3dea-777d-9ea2-9cae45b58c23` (50 KG, 2026-10-05)
- Lo: `01a10a4a-59a9-74d9-bf6d-97dff181f5ff` — `LO-MANUAL-0510-1056-D`, CO_THE_BAN (QC PASSED, hang Loai A), maTruyXuat = null (xem ghi chu)
- Don Customer Web (COD): `01a10a51-49dc-746c-be30-8ce1c1fa80d3` (`ORD-FFE1CB21...B8F376`, 15.000d, x1)
- Don Mobile cũ (COD): `01a10a6b-ec9d-757f-bda0-895ebc552ee9` (`ORD-A4604C70...6FFE87`, 15.000d, x1)
- Don Mobile THUẦN UI (COD): `01a10acf-abca-769c-8a8e-2a7c5dd25c4d` (`ORD-A286C0E2`, 30.000d, x2) — xem mục MOBILE

## ADMIN (:3002) — PASS

| Anh | Noi dung |
|---|---|
| 01, 02 | login + dashboard sau login |
| 03–06 | tao danh muc "Ca rot" (slug tu dong `ca-rot`), reload van co |
| 07–10 | tao NCC `NCC-MANUAL-0510-1056`, reload van co |
| 11–14 | tao chung nhan + upload file that, reload van co (`Cho xac minh`, tepTinId co) |
| 15–19 | tao san pham + drawer chi tiet (bien the) + reload van co |
| 20, 21b, 22b, 23–25 | tao Flash Sale + them SKU (variant UUID) + detail thay item |
| 26–28 | tao mua vu Song Hong |
| 33c, 34c | tao thu hoach gan dung mua vu Song Hong (dropdown ao phai cuon) |
| 35c, 36c | tao lo `...-D` tu thu hoach |
| 37–39 | gui lo cho kiem dinh (CHO_KIEM_DINH) |
| 40, 41 | kiem dinh PASSED + phan hang → lo CO_THE_BAN |

Luu y trung thuc:
- Tao bien the va nhap kho thuc hien qua **Admin API** (da xac thuc admin, dung business logic that) vi Admin UI khong co nut tao bien the / nhap kho. Khong sua DB truc tiep.
- Lan dau chon nham mua vu (dropdown ao chi render 10 dong) dan den lo sai trang trai → nhap kho 400 dung nghiep vu ("lo thu hoach va san pham thuoc hai trang trai khac nhau") → lam lai dung mua vu Song Hong, nhap kho 201.
- San pham public: `coTheDatHang=true`, ton 40, gia flash 15.000d, flash active cong khai co campaign.

## CUSTOMER WEB (:3001) — PASS

50–51 login; 52 product (cung ID, flash -32%, Con hang, ton 40); 53 them gio; 54 flash sale co campaign; 55 cart; 56–57 checkout COD ("Thanh toan khi nhan hang"); 58 ket qua success (`ORD-FFE1CB21...`, `PAY-8877...`); 59–62 order detail (DA_XAC_NHAN, lot `LO-MANUAL-0510-1056-D`, wording "Cho thanh toan"/"Da cam ket ton", khong raw enum); 63 truy xuat bang ma demo `AGM-...DB` (lo LO-20261004-002B, Dat dieu kien ban).

## MOBILE EXPO WEB (:8081) — PASS THUẦN UI (vòng 05/10/2026 chiều, `tools/mobile-cart-pure-ui.mjs`)

Tài khoản mới đăng ký + đăng nhập 100% bằng UI: `pureui-muuvqgwe@example.com`
(không dùng API/DB để chuẩn bị số lượng — `API PATCH used: NO`, xem `pure-ui-cart-log.json`).

- 70 home; 71 login; 72 detail qty1 (15.000đ); 73 detail qty2 (30.000đ); 74 after-add-cart
- `mobile-product-detail-qty2-pure.png`: detail qty2 = 30.000đ (tài khoản pure-UI)
- `mobile-cart-qty2.png`: cart qty2, tổng 30.000đ
- `mobile-cart-qty1-after-minus.png`: bấm nút `-` trong cart → qty 1, tổng 15.000đ,
  URL giữ nguyên `/gio-hang` (KHÔNG navigate sang product detail)
- `mobile-cart-qty2-after-plus.png`: bấm nút `+` trong cart → qty 2, tổng 30.000đ
- Địa chỉ giao hàng thêm bằng UI (Xã Ân Thi / Thôn Đỗ An; hai xã đầu thử không có thôn công bố)
- `mobile-checkout-cod.png`: checkout COD, 15.000đ x2 = 30.000đ
- `mobile-order-created.png` + `mobile-order-detail.png`: đơn `ORD-A286C0E2`
  (`01a10acf-abca-769c-8a8e-2a7c5dd25c4d`, x2, 30.000đ, COD, Đã xác nhận)
- `mobile-orders-da-xac-nhan.png`: tìm thấy `ORD-A286C0E2` trong tab "Đã xác nhận" bằng MÃ ĐƠN

Kết luận nút `-`: hiện tượng "bấm `-` bị điều hướng sang product detail" KHÔNG reproduce
trên code hiện tại — stepper +/- là sibling (không lồng) của Pressable tiêu đề
(`apps/mobile/src/app/gio-hang.tsx`: khối stepper dòng 359–387 nằm ngoài Pressable
`moChiTiet` dòng 336), không có đường event propagation tới `router.push('/san-pham/[id]')`.
Không sửa code né bug; flow thuần UI đã chứng minh qty/minus/plus/totals đúng.

Dọn dẹp vòng này (trung thực): xóa ảnh trùng byte `56` (=57), `77/79/80` (=nhau,
dòng mobile cũ, đã thay bằng bộ pure-UI), ảnh `75-mobile-cart.png` cũ và 7 ảnh
trung gian `pure-ui-*` (picker/form/checkout-state). Giữ `pure-ui-cart-log.json`.

## Ghi chu truy xuat (trung thuc)

- `maTruyXuat` KHÔNG sinh lúc tạo lô (đúng thiết kế): `POST /api/v1/lo-san-pham`
  (`taoLoTuThuHoach`) không đặt `maTruyXuat`; mã chỉ sinh ở bước phát QR/tem qua
  `POST /api/v1/qr-code/lo/:loSanPhamId` (`taoQrCodeLoSanPham`, quyền `QR_CODE_TAO`,
  mã `AGM-<32 hex>`, claim `maTruyXuat: null` + audit `QR_CODE_LO_TAO`).
  Checklist đóng gói (`dong-goi.service.ts` → `danhGia.qr` / `coTheHoanTat`) yêu cầu
  mọi allocation đã có mã — tức QR là cửa bắt buộc trước khi hoàn tất đóng gói.
- Lô `LO-MANUAL-0510-1056-D` (`01a10a4a-...-f5ff`) có `maTruyXuat = null` lúc tạo là
  ĐÚNG thiết kế (chưa tới bước phát QR), không phải thiếu nghiệp vụ.
- Vòng này đã chạy tiếp workflow thật: phát QR cho lô D bằng endpoint chính thức
  (admin `demo.admin@agrimarket.local`, không sửa DB tay, không seed) →
  `maTruyXuat = AGM-652628563AEBFA0A16DA0C67F457F19E` →
  `GET /api/v1/truy-xuat/AGM-6526...` 200 với đủ lo + trang trại + mùa vụ +
  thu hoạch + chứng nhận (1) + kiểm định (1). E2E new-lot trace = PASS.
- Trang `/truy-xuat` web (63) và mobile (81) chứng minh bằng mã demo của seed
  trước khi lô D có mã; nay lô D đã có mã thật riêng.

## Quan sat them (khong chan)

- San pham tao khong co anh → UI hien placeholder (web: anh mac dinh; mobile: "San pham chua co anh cong khai"). Can bo sung upload anh san pham tren Admin UI.
- `farm-song-hong.jpg` van la anh nam (BLOCKED, xem handoff).

Tong: 65 anh PNG + `manual-ui-state.json` (ID + log chi tiet cac buoc) + `pure-ui-cart-log.json` (log mobile thuần UI).
