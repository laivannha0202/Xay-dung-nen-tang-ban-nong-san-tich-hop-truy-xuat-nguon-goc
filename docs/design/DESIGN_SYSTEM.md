# AgriMarket — Design System (V4)

Nguồn sự thật duy nhất cho màu, chữ, bán kính, đổ bóng và các thành phần dùng chung trên
Customer Web, Admin Web và Customer Mobile. Sửa token ở một chỗ, cả ba bề mặt đổi theo.

| Bề mặt | Tệp token |
| --- | --- |
| Customer Web + Admin Web | `packages/ui/src/styles.css` (Tailwind v4 `@theme`) |
| Customer Mobile | `apps/customer-mobile/src/theme.ts` (mirror đúng các mã hex dưới đây) |
| Mockup tĩnh | `docs/design/mockups/mockup.css` |

## 1. Bảng màu

| Vai trò | Token web | Hex | Token mobile | Dùng ở đâu |
| --- | --- | --- | --- | --- |
| Primary | `brand-600` | `#166534` | `primary` | Nút chính, logo, tiêu đề nhấn, badge giỏ |
| Primary dark | `brand-700` | `#14532D` | `primaryDark` | Header hero, giá tiền, chữ trên nền sáng |
| Brand 800/900 | `brand-800/900` | `#113F24` / `#0D301C` | — | Footer, overlay hero |
| Fresh | `brand-500` | `#22C55E` | `fresh` | Gradient logo, chỉ báo dương, thanh tiến trình |
| Accent | `sand-500` | `#F97316` | `accent` | Badge giỏ hàng, tag "Lô cận hạn", sao đánh giá |
| Accent dark | `sand-700` | `#C2410C` | `clay` | Chữ accent trên nền sáng (đủ tương phản AA) |
| Background | `ink-50` | `#F7F8F2` | `bg` | Nền trang |
| Surface | `--color-white` | `#FFFFFF` | `surface` | Card, header, sheet |
| Text | `ink-900` | `#172B22` | `text` | Chữ chính |
| Muted | `ink-500` | `#64748B` | `muted` | Chữ phụ, metadata, ghi chú |
| Border | `ink-200` | `#E2E8E0` | `border` | Viền card, input, divider |
| Danger | `rose-600` | `#DC2626` | `danger` | Thu hồi lô, lỗi form, huỷ đơn |
| Warning | `sand-700` | `#B45309` | `warning` | Cận hạn, chờ xác nhận, giao thất bại |
| Success | `brand-600` | `#166534` | `success` | Đã giao, kiểm nghiệm đạt |

Thang phụ: `brand-50..900`, `sand-50..700`, `ink-50..900` — mọi thành phần phải chọn từ thang
này, không dùng hex tuỳ ý trong JSX.

**Alias legacy:** `leaf-*` → `brand-*`, `clay-50/100/700` → `sand-50/100/700`. Giữ để ~47 tệp cũ
biên dịch; xoá khối `@theme` thứ hai trong `styles.css` khi không còn `leaf-`/`clay-` trong mã.

## 2. Typography

- **Be Vietnam Pro** (self-host, subset `latin` + `vietnamese`, woff2, 400/500/600/700).
  Tải từ `/fonts/bvp-{400,500,600,700}-{la,vi}.woff2`; đã copy vào `public/fonts` của cả hai web.
  Không phụ thuộc CDN Google Fonts ⇒ bản offline và mạng nội bộ vẫn đúng font.
- Fallback: `Inter, system-ui, -apple-system, 'Segoe UI', sans-serif`.
- Mobile dùng font hệ thống (Be Vietnam Pro chưa bundle trong Expo); cấu trúc cỡ chữ giữ tương đương.

| Vai trò | Cỡ / đậm / line-height | Ghi chú |
| --- | --- | --- |
| Hero H1 | 40–52px / 700 / 1.1 | `clamp`, letter-spacing −0.03em, tối đa 2 dòng |
| Section H2 | 24–30px / 700 / 1.2 | −0.02em |
| Card title | 15–17px / 600 / 1.35 | −0.01em |
| Body | 14–15px / 400 / 1.6 | |
| Meta / caption | 11–13px / 400–600 | màu `ink-500`, không giảm dưới 11px |
| Kicker | 11px / 700 / uppercase / 0.09em | dùng cho nhãn nhóm, tối đa 1 dòng |
| Giá | 16–28px / 700 | `font-variant-numeric: tabular-nums` ở bảng |

Số liệu trong bảng và KPI luôn `tabular-nums` để cột không nhảy.

## 3. Bố cục, bán kính, đổ bóng

- Container: `max-w-[1440px]`, padding ngang 16 / 24 / 32px theo breakpoint.
- Grid sản phẩm: 2 cột (mobile) → 3 (768) → 4 (1024) → 5 (1280). Mọi card cao bằng nhau nhờ
  ảnh `aspect-[4/3]` + tiêu đề `line-clamp-2`.
- Bán kính: `--radius-card: 16px` cho card/khối lớn; 12px input, nút; 8px chip nhỏ; 999px pill.
- Đổ bóng: `--shadow-card` cho card, `--shadow-pop` cho popover/sheet. Không dùng bóng đen đậm.
- Khoảng cách thang 4px: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`.

## 4. Thành phần dùng chung

| Thành phần | Web | Mobile |
| --- | --- | --- |
| Nút | `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sand`, `.btn-danger`, `.btn-sm` | `Button` (`variant: primary/secondary/ghost`) |
| Ô nhập | `.field` (`focus:border-brand-400 focus:ring-brand-100`) | `Input`, `SearchBar` |
| Card | `Card` trong `@agrimarket/ui` | `Card` |
| Badge trạng thái | `Badge` (tone theo bảng màu) | `Badge` |
| KPI | `KpiTile` | `KpiTile` |
| Product card | `components/product-card.tsx` + `QuickAdd` | `GridCard` trong `src/home.tsx` |
| Bảng | `table` với header `bg-ink-50`, `text-ink-500`, `uppercase text-[11px]` | danh sách dòng + `Row` |
| Bottom sheet | — | `BottomSheet` (Modal + Animated) |
| Breadcrumb | `admin-shell.tsx` topbar, PLP | `SectionTitle` |
| Empty state | viền nét đứt `border-ink-200`, tiêu đề 15px, gợi ý muted | `EmptyState` |

Icon: `Icon` của `@agrimarket/ui` trên web (SVG, `currentColor`), `Ionicons` trên mobile.
Không dùng emoji làm icon chức năng.

## 5. Chuyển động

- Thời lượng 150–250ms, easing `ease-out`; chỉ animate `transform`/`opacity`.
- Hover card: `-translate-y-0.5` + `shadow-card`; ảnh `scale-[1.03]` trong 400ms.
- Sheet mobile: `translateY` 220ms vào, 160ms ra.
- `prefers-reduced-motion: reduce` tắt toàn bộ animation/transition về 0.01ms (đã có trong `styles.css`).

## 6. Khả năng tiếp cận

- Tương phản chữ ≥ 4.5:1: `#172B22` trên `#F7F8F2` (13.1:1), `#64748B` trên trắng (5.3:1),
  trắng trên `#166534` (6.4:1), `#C2410C` trên trắng (4.6:1). Accent `#F97316` chỉ dùng làm nền
  có chữ trắng ≥ 700 hoặc chấm/badge nhỏ, không dùng làm chữ trên nền sáng.
- Focus ring 2px `#166534`, offset 2px, áp dụng toàn cục qua `:focus-visible`.
- Mọi nút chỉ có icon phải có `aria-label` / `accessibilityLabel`.
- Ảnh sản phẩm có `alt` theo tên sản phẩm; ảnh trang trí `alt=""`.
- Cảnh báo thu hồi lô dùng `role="alert"` và nằm **trên cùng** trang passport, không bị banner che.
- Trạng thái không truyền tải chỉ bằng màu: badge có nhãn chữ, timeline có nhãn bước.

## 7. Nguyên tắc nội dung

- Tiếng Việt có dấu đầy đủ; số dùng định dạng `vi-VN` (`12.480.000 ₫`, `0,008 mg/kg`).
- Không bịa số liệu: mọi KPI, phiếu kiểm nghiệm, lô hàng đến từ API; dữ liệu thiếu hiển thị
  "chưa có", không hiển thị giá trị mẫu.
- Đơn vị luôn hiện cạnh giá: `35.000 ₫/kg`.
