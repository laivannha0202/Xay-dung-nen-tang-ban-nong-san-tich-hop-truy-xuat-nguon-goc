# Nguồn ảnh minh hoạ

Ảnh minh hoạ dùng cho bản demo, tải từ Wikimedia Commons. Tất cả đều là giấy phép tự do
(CC BY / CC BY-SA / CC0 / public domain) — xem trang tệp để biết tác giả và điều kiện ghi
công chính xác trước khi dùng cho mục đích thương mại.

Đường dẫn phục vụ tĩnh: `apps/customer-web/public/images/<nhóm>/<tên>.jpg`.

## Sản phẩm — `public/images/products/`

V5 chia ảnh sản phẩm thành hai loại, ghi rõ ngay trong bảng:

- **studio** — ảnh chụp trên nền trắng thật. Đo bằng công cụ: luminance 4 góc ≥ 217/255 và
  chênh lệch góc ≤ 25. Nhờ vậy sản phẩm nằm trong khung ivory `#f6f2e9` mà không cần viền giả.
- **graded** — ảnh thật nhưng nền không trắng. Chỉ **chỉnh tông** (gamma 1.35 + crop 1:1),
  không cắt nền, không ghép. Vẫn đúng chủ thể, chỉ chưa đồng nhất nền.

| Tệp | Loại | Chủ thể | Giấy phép | Tác giả | Trang nguồn |
| --- | --- | --- | --- | --- | --- |
| `cam-sanh.jpg` | studio | Cam sành | CC BY-SA 4.0 | Filo gèn' | https://commons.wikimedia.org/wiki/File:Citrus_reticulata_fruit_on_white_background.jpg |
| `xoai-cat-hoa-loc.jpg` | studio | Xoài | CC BY-SA 4.0 | Filo gèn' | https://commons.wikimedia.org/wiki/File:Mangofil_on_white_background.jpg |
| `chuoi-gia-nam.jpg` | studio | Chuối | CC BY 2.0 | Justus Blümer | https://commons.wikimedia.org/wiki/File:Bananas_(white_background).jpg |
| `buoi-da-xanh.jpg` | studio | Bưởi | Public domain | Renee Comet | https://commons.wikimedia.org/wiki/File:Grapefruit_(1).jpg |
| `ca-chua-bien.jpg` | studio | Cà chua bi | CC0 | Fructibus | https://commons.wikimedia.org/wiki/File:Cherry_Nebula_tomatoes_2017_A2.jpg |
| `nhan-long-hung-yen.jpg` | studio | Nhãn lồng | CC BY-SA 4.0 | Dinkun Chen | https://commons.wikimedia.org/wiki/File:Dimocarpus_longan_(2).jpg |
| `dua-hau-kim-long.jpg` | studio | Dưa hấu | CC BY 2.0 | Shixart1985 | https://commons.wikimedia.org/wiki/File:Pieces_of_watermelon_on_a_white_plate_with_a_fork_placed_beside_them_after_a_meal.jpg |
| `bi-do-hokkai.jpg` | studio | Bí đỏ | CC0 | rawpixel | https://www.rawpixel.com/image/6028737/photo-image-background-public-domain-white |
| `xa-lach-romaine.jpg` | studio | Xà lách | CC0 | rawpixel | https://www.rawpixel.com/image/5902321/photo-image-background-public-domain-green |
| `gao-st25.jpg` | studio | Gạo ST25 (hạt chưa nấu) | CC0 | USDA | https://www.rawpixel.com/image/8731984/photo-image-white-background-public-domain-food |
| `du-du-ruot-do.jpg` | graded | Đu đủ ruột đỏ | CC BY-SA 4.0 | Ivar Leidus | https://commons.wikimedia.org/wiki/File:Papaya_-_longitudinal_section.jpg |
| `rau-muong.jpg` | graded | Rau muống | CC BY-SA 4.0 | PattayaPatrol | https://commons.wikimedia.org/wiki/File:DSCF0308_Fresh_bundles_of_leafy_greens_neatly_tied_and_stacked_at_a_bustling_market_stall.jpg |
| `gao-nep-cai-hoa-vang.jpg` | graded | Gạo nếp (hạt chưa nấu) | CC BY-SA 4.0 | Takeaway | https://commons.wikimedia.org/wiki/File:2014_uncooked_Thai_glutinous_rice.jpg |
| `mat-ong-rung.jpg` | graded | Mật ong rừng | CC BY-SA | — | https://commons.wikimedia.org/wiki/File:Jar_and_honey_stick.jpg |

**Còn thiếu (V5):** 4 sản phẩm chưa có ảnh studio vì thư viện tự do không có ảnh nền trắng
đúng chủ thể (đu đủ → chỉ có hoa/quả xanh Thái; rau muống → chỉ có rau chân vịt/pizza;
gạo nếp → chỉ có gạo lứt đã nấu; mật ong → chỉ có ong/tổ). Khi có ảnh studio thật thì thay
và đổi cột Loại thành `studio`.

## Danh mục — `public/images/categories/`

| Tệp | Danh mục | Giấy phép | Tác giả | Trang nguồn |
| --- | --- | --- | --- | --- |
| `rau-cu.jpg` | Rau củ | CC BY-SA 2.0 | David Wright | https://commons.wikimedia.org/wiki/File:Vegetable_Stall,_Brigg_Market_-_geograph.org.uk_-_1725905.jpg |
| `trai-cay.jpg` | Trái cây | CC BY-SA 4.0 | Catherine Amia | https://commons.wikimedia.org/wiki/File:An_assortment_of_fresh_fruits.jpg |
| `gao-ngu-coc.jpg` | Gạo & ngũ cốc | CC BY-SA 4.0 | VinhNguyen.1257 | https://commons.wikimedia.org/wiki/File:Uncooked_ST25_rice_on_bamboo_surface.jpg |
| `dac-san.jpg` | Đặc sản | CC BY-SA 3.0 | Akarlovic | https://commons.wikimedia.org/wiki/File:Med_u_sacu_karlovic1.jpg |

## Banner / khối nội dung — `public/images/banners/`

| Tệp | Dùng ở | Giấy phép | Tác giả | Trang nguồn |
| --- | --- | --- | --- | --- |
| `concept-fresh-daily.jpg` | Hero concept 1 — Nông sản tươi mỗi ngày | Public domain | George Chernilevsky | https://commons.wikimedia.org/wiki/File:Basket_with_vegetables_2017_G1.jpg |
| `concept-hung-yen.jpg` | Hero concept 2 — Đặc sản Hưng Yên | CC0 | Dinkum | https://commons.wikimedia.org/wiki/File:Longan_fruits.jpg |
| `concept-farm-to-table.jpg` | Hero concept 3 — Từ nông trại đến bàn ăn | CC BY-SA 2.0 | Michael Garlick | https://commons.wikimedia.org/wiki/File:Syleham,_Field_with_lettuces_growing_in_it_-_geograph.org.uk_-_6481232.jpg |
| `trace-lab.jpg` | Khối truy xuất | CC BY-SA 4.0 | Basile Morin | https://commons.wikimedia.org/wiki/File:Green_rice_sheaves_planted_in_a_paddy_field_with_long_shadows_at_golden_hour_in_Don_Det_Laos.jpg |

## Ghi chú

- Ảnh chỉ mang tính minh hoạ cho giao diện demo; không phải ảnh chụp thật của nông trại,
  phiếu kiểm nghiệm hay lô hàng trong hệ thống.
- Ảnh được cắt vuông/tỉ lệ 16:9 và nén JPEG (q80–82) bằng Pillow trước khi đưa vào repo.
- Trang nguồn ghi chính xác tác giả + điều kiện ghi công; khi dùng ngoài phạm vi demo phải
  ghi công theo giấy phép tương ứng (CC BY-SA yêu cầu chia sẻ tương tự).

## Phông chữ — `public/fonts/`

| Tệp | Mục đích | Giấy phép | Nguồn |
| --- | --- | --- | --- |
| `bvp-{400,500,600,700}-{la,vi}.woff2` | **Be Vietnam Pro** (subset latin + vietnamese) cho Customer Web & Admin Web | SIL Open Font License 1.1 | https://fonts.google.com/specimen/Be+Vietnam+Pro (tải từ `fonts.gstatic.com`, chuyển woff2, giữ nguyên `unicode-range`) |

Self-host để bản chạy offline/nội bộ vẫn đúng font; không gọi Google Fonts CDN. Bản sao lưu nguồn nằm ở `.audit/fonts/`.

## Ghi chú V4.2

- Ảnh sản phẩm phải là đúng nông sản đang bán. V4.2 thay 6 ảnh sai chủ thể:
  gạo nếp cũ là đĩa xôi đã nấu, gạo ST25 là bát cơm, cà chua bi là ảnh quảng cáo bánh pizza,
  rau muống là ảnh hoa, xoài là ảnh ghép có 2 lát cắt, nhãn là ảnh cũ độ phân giải thấp.
- Ba banner hero là 3 concept tĩnh cùng bộ (21:9, 1800×774). Người dùng chuyển concept bằng nút,
  không có slider tự chạy.
- Ảnh vẫn chỉ mang tính minh hoạ giao diện; không dùng làm bằng chứng kiểm nghiệm, chứng nhận hay
  nguồn gốc thực tế. Mọi ảnh sinh bởi AI đều bị loại khỏi hồ sơ truy xuất.

## Quy trình xử lý ảnh (V4.1)

Mọi ảnh trong `public/images/` đi qua một bộ xử lý duy nhất để danh mục đọc như một buổi chụp,
không phải ảnh ghép từ nhiều nguồn:

| Bước | Tham số |
| --- | --- |
| Cắt khung | cover-crop 4:3 sản phẩm (1000×750), 16:10 danh mục (840×525), 21:9 banner (1800×774) |
| Phơi sáng | chuẩn hoá độ sáng trung bình về 0.56, gain giới hạn 0.97–1.22 |
| Highlight | knee mềm ở 0.86 với rolloff tanh — giữ chi tiết thay vì cháy trắng |
| Cân trắng | +3% R, +1% G, −1.2% B (nền ivory ấm) |
| Màu | saturation ×1.05 |
| Nén | JPEG q80 progressive |

Script grade là công cụ audit cục bộ (`.audit/` không được commit); bản gốc trước khi grade nằm ở
`.audit/img/orig/`. Ảnh chỉ mang
tính minh hoạ giao diện, không dùng làm bằng chứng truy xuất; hồ sơ DEMO được gắn nhãn
"Dữ liệu minh hoạ" trên web và trong PDF.

## Ảnh tham chiếu thiết kế — `docs/design/references/`

Ảnh chụp màn hình trang tham chiếu, dùng nội bộ để đối chiếu thị giác (không phục vụ cho sản
phẩm, không tái phân phối): `genprint-{1440,full}.png` (genprint.vn) và
`freshcart-{1440,full}.png` (freshcart.codescandy.com).
