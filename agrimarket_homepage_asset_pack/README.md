# AgriMarket Homepage Asset Pack

Bộ ZIP này giúp OpenCode hoặc bất kỳ coding agent nào dựng lại giao diện homepage AgriMarket theo đúng mẫu đã duyệt.

## Có gì trong đây?
- `reference/approved-homepage-full.png`: ảnh full mẫu desktop.
- `reference/sections/`: ảnh crop theo từng section để model yếu vẫn hiểu layout.
- `reference/products/`, `reference/farms/`, `reference/articles/`: crop ảnh nhỏ theo từng nhóm nội dung.
- `icons/`: bộ SVG icon gợi ý cho header, category, CTA, trust strip, service strip.
- `data/homepage-content-seed.json`: text/content seed theo đúng tinh thần mẫu.
- `data/design-tokens.json`: màu sắc chủ đạo.
- `PROMPT_FOR_OPENCODE.md`: prompt rất chi tiết để giao cho OpenCode.

## Lưu ý
- Đây là bộ reference, KHÔNG phải source production.
- Không commit nguyên thư mục asset pack này vào repo production.
- Nếu API chưa chạy, homepage vẫn phải hiển thị đẹp bằng fallback data từ `homepage-content-seed.json`.
- Khi API chạy, dữ liệu thật phải được ưu tiên.
