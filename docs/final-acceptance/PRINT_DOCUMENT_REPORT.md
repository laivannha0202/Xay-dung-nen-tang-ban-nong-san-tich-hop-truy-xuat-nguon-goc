# PRINT_DOCUMENT_REPORT — Toàn bộ đầu ra in/PDF/CSV

Ngày: 2026-11-19 · Nhánh `feat/premium-visual-redesign-v5`

## 1. Kiến trúc

Có **ba** đường in độc lập, không dùng chung một mẫu cứng:

| Đường in | Công nghệ | Ai tạo | Mục đích |
|---|---|---|---|
| Chứng từ vận hành Admin | HTML + CSS `@page` → trình duyệt in | `apps/admin-web/app/admin/in/[kind]/[id]/page.tsx` + `components/print-doc.tsx` + `app/print.css` | Phiếu bán/giao/đóng gói/thanh toán/hoàn tiền/nhập/xuất/điều chỉnh/thu hồi, báo cáo doanh thu & tồn kho |
| Tem QR & trang truy xuất | PDFKit phía server | `apps/api/src/services/tracePdf.ts` (`renderLabelPdf`, `renderTracePdf`) | Tem dán kiện (QR 360px) và bản PDF trang truy xuất cho khách |
| Bảng dữ liệu | CSV UTF-8 (BOM) | `apps/api/src/lib/csv.ts` | `GET /admin/stock/export?format=csv`, `GET /admin/orders/export?format=csv` |

Lý do tách đường HTML khỏi shell Admin: sidebar, thanh lọc, form nhập **không bao giờ** được lọt vào bản in. Trang `/admin/in/...` nằm ngoài `AdminShell`, bản thân nó chỉ có một khối `.doc` A4. Bằng chứng: `emulateMedia({media:'print'})` → `.shell-sidebar` / `.shell-topbar` / `.no-print` = `display: none`, `.sticky` = `position: static`.

## 2. Khung chứng từ dùng chung (`PrintDoc`)

Mọi phiếu có cùng phần đầu–cuối, phần thân khác nhau:

- **Đầu**: logo `BrandLogo` + tên cửa hàng, tiêu đề phiếu (`PHIẾU BÁN HÀNG`, `PHIẾU XUẤT KHO`, …), `Số:` (mã chứng từ), `Ngày lập:` (giờ + `DD/MM/YYYY`), phụ đề tuỳ loại, các dòng liên hệ **chỉ in khi đã cấu hình** (`storeContactLines()`).
- **Cảnh báo demo**: khi bản ghi có `is_demo`, in dải `DỮ LIỆU MINH HOẠ (DEMO) — không dùng làm chứng từ thật`. Đơn `AGM-2026-0145` có `is_demo = false` nên **không** hiện dải này (đúng dữ liệu, không phải lỗi).
- **Thân**: `DocSection` (tiêu đề + ghi chú), `DocFields` (nhãn/giá trị 2 cột), `DocTable` (bảng), `.doc-amounts` (tổng tiền căn phải, dòng tổng đậm).
- **Cuối**: ô chữ ký theo từng loại phiếu, footer `AgriMarket — in từ hệ thống quản trị AgriMarket · Trang in A4 · tiền tệ VND`.

## 3. Danh mục chứng từ

| Kind (URL) | Mã chứng từ | Nguồn dữ liệu | Trường chính | Chữ ký |
|---|---|---|---|---|
| `ban-hang` | `AGM-YYYY-NNNN` | `GET /admin/orders/:id` | KH (tên/ĐT/email/địa chỉ/người nhận/trạng thái), bảng `SP–SL–Đơn giá–Thành tiền`, tổng tiền, hình thức + trạng thái thanh toán, lô xuất, ghi chú; câu "không phải hoá đơn điện tử/GTGT" | Người mua · Người lập phiếu |
| `giao-hang` | `AGM-YYYY-NNNN` | như trên + `shipment` | Người nhận, người giao, bảng `SP–SL` (`SL cần`), số tiền COD phải thu, vận đơn | Người giao hàng · Người nhận hàng |
| `dong-goi` | `AGM-YYYY-NNNN` | như trên | Bảng `SP–SL cần–Lô lấy hàng–HSD lô–Đã đủ ☐`, checklist 3 mục trước niêm phong | Người đóng gói · Người kiểm hàng |
| `thanh-toan` | `AGM-YYYY-NNNN` | như trên + `payment` | Số tiền, hình thức, thời điểm ghi nhận, trạng thái, mã tham chiếu; câu "không thay thế chứng từ ngân hàng/GTGT" | Người thu tiền · Kế toán xác nhận |
| `hoan-tien` | `HT-YYYY-NNNN` | `GET /admin/refunds` | Khách, đơn gốc, số tiền, lý do, trạng thái, thời điểm chuyển, ghi chú xử lý | Đề nghị · Duyệt chi · Khách nhận tiền |
| `nhap-kho` | `PNK-YYYY-NNNN` | `GET /admin/stock/movements/:id` | SP, mã lô, kho, thời điểm, người thực hiện, đơn liên quan, số lượng, tồn sau, lý do | Người giao hàng · Thủ kho |
| `xuat-kho` | `PXK-YYYY-NNNN` | như trên | như trên | Thủ kho · Người nhận hàng |
| `dieu-chinh` | `PDC-YYYY-NNNN` | như trên | Chênh lệch có dấu (`+1`), tồn sau, lý do + ghi chú "chỉ dùng cho hao hụt bảo quản hoặc chênh lệch kiểm kê" | Người kiểm kê · Quản lý kho |
| `thu-hoi` | `TH-<mã lô>` | `GET /admin/recalls/:id` | Lô, SP, lý do, mức độ, bắt đầu/kết thúc, tổng lượng ảnh hưởng, kết luận, bảng khách đã nhận (`Đơn–KH–SL–Xử lý`) | Người lập biên bản · Quản lý cửa hàng |
| `doanh-thu` | `BC-DT-YYYY-MM-DD` | `GET /admin/reports/revenue` | Kỳ, số đơn, doanh thu, đã thu, hoàn tiền, bảng theo ngày | — |
| `ton-kho` | `BC-TK-YYYY-MM-DD` | `GET /admin/inventory` | Tổng dòng tồn, tổng khả dụng, bảng `Lô/SP–Kho–HSD–Tồn–Giữ chỗ–Khả dụng` | — |

## 4. Kiểm chứng bản in (tự động)

Kịch bản: đăng nhập admin, mở từng `/admin/in/...`, `page.pdf({format:'A4', margin 12/14mm, printBackground})`, đếm `/Type /Page` và đọc `innerText` của `.doc`.

| Tệp mẫu (`docs/final-acceptance/PRINT_SAMPLES/`) | Kích thước | Số trang |
|---|---|---|
| `phieu-ban-hang.pdf` | 61 KB | 1 |
| `phieu-giao-hang.pdf` | 55 KB | 1 |
| `phieu-dong-goi.pdf` | 60 KB | 1 |
| `phieu-xac-nhan-thanh-toan.pdf` | 50 KB | 1 |
| `phieu-hoan-tien.pdf` | 44 KB | 1 |
| `phieu-nhap-kho.pdf` | 44 KB | 1 |
| `phieu-xuat-kho.pdf` | 44 KB | 1 |
| `phieu-dieu-chinh-ton.pdf` | 48 KB | 1 |
| `bien-ban-thu-hoi.pdf` | 45 KB | 1 |
| `bao-cao-doanh-thu.pdf` | 56 KB | 1 |
| `bao-cao-ton-kho.pdf` | 64 KB | **5** (66 dòng tồn — đúng, không cắt) |
| `tem-qr-lo-hang.pdf` | 16 KB | 1 |
| `truy-xuat-nguon-goc.pdf` | 20 KB | 1 |

Nội dung văn bản đã đọc lại từng tệp: tiêu đề, `Số:`, `Ngày lập:`, nhãn cột, tổng tiền, ô chữ ký, footer — **không có** chồng chữ, không có giá trị `undefined`/`NaN`, không có dòng trống thừa. Ví dụ `phieu-ban-hang`: `Số: AGM-2026-0145 · Ngày lập: 06:52 19/11/2026 · Hành tây 2 kg × 18.000₫ = 36.000₫ · Tiền hàng 36.000₫ + Phí giao 20.000₫ = Tổng cộng 56.000₫`.

## 5. Quy cách A4

- `@page { size: A4; margin: 14mm 12mm }` trong `app/print.css`.
- Cỡ chữ: thân 11.5–12.5px, nhãn 10.5px, tiêu đề phiếu 17px. Không dùng ảnh nền, không gradient ⇒ in đen trắng vẫn đọc được.
- `break-inside: avoid` trên `.doc-table tbody tr`, `.doc-section`, `.doc-sign`.
- `.no-print` ẩn thanh công cụ "In / Lưu PDF", nút quay lại, badge demo của shell.
- Font Be Vietnam Pro self-host, có subset tiếng Việt — dấu hiển thị đúng trên bản in (đã kiểm trong PDF: "PHIẾU BÁN HÀNG", "Điều chỉnh", "Hưng Yên").
- Tem QR: PDFKit khổ tem `420×520pt` (không phải A4), font Noto, QR co theo chỗ còn lại (`min(360, pageHeight − y − 46)`) nên tên sản phẩm dài không đẩy chữ xuống đè mã; phiếu truy xuất A4, QR 240px góc phải trên. Cả hai vẽ logo AgriMarket bằng vector, khớp `packages/ui/brand/icon.svg`, không nhúng ảnh.
- CSV: UTF-8 **có BOM**, phân cách `,`, xuống dòng `CRLF` (`src/lib/csv.ts`). Tiêu đề cột tiếng Việt; ô bắt đầu bằng `=+-@` được thêm `'` để không thành công thức Excel. Mẫu thật: `xuat-ton-kho.csv` (66 dòng, 6.457 B), `xuat-don-hang.csv` (27 dòng, 4.902 B), cả hai `BOM = true`.

## 6. Giới hạn — những gì **chưa** kiểm được

- **Không** so sánh byte PDF với DOM: PDF sinh bởi Chrome, DOM do Next render; chỉ so nội dung văn bản trích ra được.
- **Không** in ra máy in thật / không kiểm tra lề vật lý, độ đậm mực, khổ giấy A4 thật. Mọi kết luận là trên PDF kỹ thuật số.
- **Không** kiểm tra in từ Safari/Firefox; mới chạy Chrome (bản in còn phụ thuộc trình duyệt).
- **Không** có chứng từ pháp lý thật (hoá đơn GTGT, hoá đơn điện tử) — đúng thiết kế: các phiếu đều ghi rõ "nội bộ", "không thay thế".
- Không có mẫu in cho khổ A5/nhiệt; tem QR dùng khổ riêng `420×520pt` nhưng vẫn chưa tối ưu cho máy in nhãn cuộn.
