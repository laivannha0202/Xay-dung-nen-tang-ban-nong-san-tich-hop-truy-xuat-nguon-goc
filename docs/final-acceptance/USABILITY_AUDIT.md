# USABILITY_AUDIT — Admin & Customer

Ngày: 2026-11-19 · Nhánh `feat/premium-visual-redesign-v5` · Nền: commit `3796d9b`

Loại bằng chứng được ghi rõ cho từng mục:
- **Tự động**: kiểm tra chạy bằng script/Playwright, số đo cụ thể.
- **Heuristic**: đánh giá theo checklist, chưa có người dùng thật.
- **UAT**: người dùng thật. **Chưa thực hiện** — không có tuyên bố nào dưới đây dựa trên UAT.

## 1. Lỗi bố cục Admin (tự động)

| Lỗi | Nguyên nhân | Sửa | Bằng chứng |
|---|---|---|---|
| Nút "Điều chỉnh tồn" cao bằng cả form Nhập kho | `CreateForm` khi thu gọn trả về `<button>` trực tiếp; button là grid item với `align-self: stretch` mặc định | Bọc trong `<div>` (`components/admin-kit.tsx`) | Đo DOM: nút thu gọn 44px, nút gửi 44px, ở cả 1280px và 390px |
| 5 KPI rơi 4+1, thẻ cuối kéo hết hàng | `lg:grid-cols-4` cho 5 thẻ | `sm:2 / lg:3 / xl:5` | Ảnh `.audit/kho-after.png`, đo bề rộng 5 thẻ = 189px đều nhau |
| Hai form Nhập kho / Điều chỉnh lệch đỉnh khi một form mở | grid item cao bằng nhau | `items-start` | Đo `getBoundingClientRect().y` của 2 form |
| Trang `/admin/don-hang` tràn ngang trên điện thoại (327px) | `<span class="sr-only">` trong `<th>` không có tổ tiên `position` nên không bị `overflow-x-auto` cắt | Bỏ span, dùng `aria-label` trên `<th>` | `document.scrollWidth - clientWidth = 0` |
| `/admin/kho`, `/admin/nha-cung-cap` tràn ngang trên điện thoại | cùng nguyên nhân `sr-only` + cột Liên hệ/Địa chỉ quá rộng | `aria-label`; ẩn 2 cột phụ dưới `sm` (`hidden sm:table-cell`) | overflow = 0 |

Quét toàn bộ 17 màn Admin ở viewport 390×844: 16/17 = 0 tràn ngang; `/admin/nha-cung-cap` và `/admin/don-hang` sửa xong cũng về 0.

## 2. Heuristic Admin — người quản trị ít hiểu công nghệ

Đã có sẵn và giữ nguyên:
- Mã chứng từ/đơn/lô tự sinh (`AGM-2026-0145`, `LO-DEMO-…`), không bắt người dùng nhập.
- Bảng chọn dài có ô lọc bỏ dấu (`Choice` + `searchable`), gõ "ca chua" ra "Cà chua".
- Tiền `vnd()`, số lượng `qty()` (3 số lẻ, dấu phẩy Việt Nam), ngày `DD/MM/YYYY`.
- Xác nhận trước thao tác phá huỷ (`Act` `confirmText`), ô lý do bắt buộc ≥ 5 ký tự cho thu hồi/điều chỉnh.
- Form giữ dữ liệu khi lỗi: không `reset()`, chỉ `window.location.reload()` sau khi thành công.
- Chặn rời trang khi form đang dở (`useDirtyGuard`).
- Nút gửi bị khoá khi đang lưu (`disabled={busy}`), chống gửi hai lần.

Còn thiếu (ghi nhận, không sửa trong đợt này vì ngoài phạm vi "không redesign"):
- Màn Cài đặt vẫn hiện **khoá kỹ thuật** (`allocation_strategy`, `low_stock_threshold`) trong bảng "Bảng cài đặt". Đây là bảng chỉ đọc phục vụ đối soát; cần bổ sung nhãn tiếng Việt nếu muốn người không kỹ thuật đọc trực tiếp. **Hành vi hiện tại: chỉ hiển thị, không bắt người dùng nhập.**

## 3. Heuristic Customer (Web + Mobile)

Đã có: tìm theo tên/danh mục, chọn xã/phường cuộn hết 104 mục (commit `3796d9b`), giá và đơn vị tính rõ, giỏ hàng, mã giảm giá, địa chỉ, theo dõi đơn, mua lại, huỷ đơn có điều kiện, đánh giá, khiếu nại, tra cứu tem QR.

Không thay đổi; không đưa khối giới thiệu QR dài trở lại trang chủ (đã xác nhận `app/page.tsx` không có).

## 4. Giới hạn của báo cáo này

- Không có kiểm thử người dùng thật. Mọi kết luận "dễ dùng" ở trên là **heuristic**, dựa trên số đo và checklist, không phải UAT.
- UAT checklist nằm ở `UAT_CHECKLIST.md`, trạng thái: chưa chạy.
