# Tham chiếu thị giác V5

## 1. Nguồn đã mở bằng trình duyệt thật

| Nguồn | Ảnh chụp | Số đo lấy được | Điều áp dụng vào V5 |
| --- | --- | --- | --- |
| https://www.genprint.vn/ | `references/v5/genprint-1440.png` (1440×3337) | nền `rgb(255,255,255)`, chữ Montserrat, **H1 212,96px / line-height 189,5px** (tỉ lệ 0,89), 5 `<section>`, gần như không chrome | Nhịp thở: một thông điệp mỗi màn, chữ rất lớn, không viền/không bóng. V5 lấy **tỉ lệ dòng 1,04** và khoảng cách khối 64–96px, nhưng hạ cỡ H1 xuống 58px vì trang còn phải bán hàng, không phải portfolio. |
| https://freshcart.codescandy.com/ | `references/v5/freshcart-1440.png` (1440×3846) | nền trắng, Inter; bảng màu chủ đạo `#5C6C75` (853 phần tử), `#21313C`, `#001E2B`, vàng `#FFC107`, xanh `#0AAD0A`; 6 `<section>` | Cấu trúc thương mại: thẻ sản phẩm có nút thêm ngay trên thẻ, giá đậm + đơn vị nhỏ. V5 giữ cấu trúc này nhưng **bỏ khung viền thẻ**, cho ảnh tự mang bố cục, và dùng một màu nhấn duy nhất. |
| Dribbble/Behance (grocery app, admin) | Không tải được ảnh (chặn hotlink) | — | Ghi nhận trung thực: phần mobile/admin dựa trên cấu trúc app thương mại phổ biến (bottom nav 5 tab, 2 cột, bottom sheet) chứ không chép ảnh cụ thể nào. |

Không sao chép thương hiệu, mã nguồn hay tài sản của hai trang trên.

## 2. Vì sao V5 đi theo hướng "sáng" thay vì "hero tối" của V4

Đo độ sáng trung bình (0–255) của ảnh đang dùng ở V4:

| Ảnh | Luminance TB | % điểm ảnh sáng (>170) | Kết luận |
| --- | --- | --- | --- |
| `banners/concept-fresh-daily.jpg` | 113 | 0,19 | Quá tối để đặt trên nền kem mà không phủ lớp xanh |
| `banners/concept-hung-yen.jpg` | 120 | 0,16 | Như trên |
| `banners/concept-farm-to-table.jpg` | 139 | 0,08 | Ruộng lúa, tối |
| `banners/trace-lab.jpg` | 142 | 0,06 | Tối |
| `products/cam-sanh.jpg` | 133 | — | Nền không đồng nhất (lệch 91 giữa 4 góc) |
| `products/gao-nep-cai-hoa-vang.jpg` | 52 | — | Nền rất tối (lệch 83) |

V4 phải phủ gradient `#092e1b/95` lên hero để chữ trắng đọc được — đó chính là lý do hero
"tối + ám xanh" mà brief V5 yêu cầu bỏ. V5 giải quyết ở gốc: **chọn ảnh nền sáng** rồi đặt
chữ màu tối lên, không cần lớp phủ.

## 3. Quy trình chọn ảnh (đo được, không dựa cảm tính)

API thị giác của phiên này trả **402 (hết credit)** — đã thử lại 2 lần trong suốt phiên, kể cả
sau khi hết thời gian reset. Vì vậy việc chọn ảnh dựa trên số đo, không dựa mô tả thẩm mỹ:

1. Tìm ứng viên: Wikimedia Commons API + Openverse API (giấy phép CC0/PD/CC BY/CC BY-SA).
2. Tải về, chấm điểm từng ảnh:
   - **độ lệch nền** = chênh lệch luminance trung bình giữa 4 góc (thấp = nền phẳng, hợp lưới thẻ),
   - **luminance TB** (cao = hợp nền sáng),
   - **độ bão hoà** (quá cao = ảnh chợ, không phải studio).
3. Giữ ảnh nền trắng thật (lệch 0, luminance 255) cho thẻ sản phẩm.

Kết quả: 6/14 ảnh sản phẩm được thay bằng ảnh **nền trắng studio** đo được:

| Sản phẩm | Ảnh mới | Nền | Lệch góc | Giấy phép |
| --- | --- | --- | --- | --- |
| Cam sành | `Citrus reticulata fruit on white background.jpg` | 255 | 0,0 | CC BY-SA 4.0 |
| Xoài cát Hoà Lộc | `Mangofil on white background.jpg` | 255 | 0,0 | CC BY-SA 4.0 |
| Chuối già | `Bananas (white background).jpg` | 255 | 0,0 | CC BY 2.0 |
| Bưởi da xanh | `Grapefruit (1).jpg` | 255 | 0,0 | Public domain |
| Cà chua bi | `Cherry Nebula tomatoes 2017 A2.jpg` | 244 | 11 | CC0 |
| Nhãn lồng | `Dimocarpus longan (2).jpg` | 218 | 25 | CC BY-SA 4.0 |

8 ảnh còn lại **không có** ảnh studio tương ứng trên kho CC (đã thử 3 vòng truy vấn khác nhau
cho mỗi từ khoá; kết quả chỉ là ảnh bìa sách cũ, ảnh chợ, hoặc ảnh con vật). Chúng được giữ
nguyên và nằm trong khung nền kem `--ivory` để giảm chênh lệch cảm nhận. Đây là giới hạn thật
của nguồn ảnh miễn phí, không phải bỏ sót.

## 4. Điểm V5 cố ý không làm

- Không dùng ảnh AI: phiên này không có quyền truy cập công cụ tạo ảnh, và brief cấm dùng ảnh AI
  làm bằng chứng truy xuất. Ảnh minh hoạ vẫn là ảnh CC có ghi nguồn.
- Không chép bố cục nguyên khối của FreshCart (dải khuyến mãi dày, lưới 6 cột) — chỉ học nhịp.
