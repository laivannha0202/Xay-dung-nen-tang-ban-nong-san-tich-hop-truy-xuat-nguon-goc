# AgriMarket — Design System V5

V5 redesigns the **visual layer** of Customer Web, Admin Web and Customer Mobile. Business logic,
routes, API contracts and database schema are unchanged (see §9).

V4 was a dark-hero, dense-card system. V5 moves to an **editorial grocery** system: light hero,
generous whitespace, photographed produce on ivory, larger type, fewer boxes.

| Surface | Token file |
| --- | --- |
| Customer Web + Admin Web | `packages/ui/src/styles.css` |
| Customer Mobile | `apps/customer-mobile/src/theme.ts` |
| Static mockups | `docs/design/mockups/v5/mockup.css` |

## 1. What changed from V4

| Area | V4 | V5 | Reason |
| --- | --- | --- | --- |
| Hero | Dark green overlay over photo, stats row inside | **Light cream panel**, photo bleeding right, no colour veil, single row of proof chips | V4's dark hero contradicted the brief ("sáng hơn, nền kem"); dark veil also hid the produce |
| Type scale | H1 40–52px, H2 24–30px, body 14–15px | H1 **clamp(34→64)**, H2 **clamp(24→36)**, body **15–16px**, display numerals 34px | V4 body text sat at the browser default floor; premium grocery sites run larger |
| Rhythm | `space-y-10` (40px) | Section gap **64px desktop / 40px mobile**, section header to grid **24px** | V4 sections ran together |
| Product tile | Bordered card, 4:3 photo, 5 metadata rows | **Borderless tile** on white, 1:1 photo on ivory, 3 metadata rows max | Fewer boxes → photos carry the page |
| Radius | 16px cards everywhere | 12px tile, **20px panel**, 999px pill | Tighter tiles read sharper at grid density |
| Colour | brand-600 #166534 primary, ink-50 bg | Same palette, **bg #FAFAF7**, panel white, `--rule` hairlines only | Warm neutral removes the green tint that flattened the page |
| Admin | Single column of KPI boxes, plain table | **Sidebar + KPI band + sparkline bars + sticky table head** | V4 admin read as a form list |

## 2. Colour

Unchanged brand identity (extended, not replaced) — V4's palette already matched the brief.

| Role | Token | Hex | Use |
| --- | --- | --- | --- |
| Primary | `brand-600` | `#166534` | Primary buttons, links, active nav |
| Primary dark | `brand-700` | `#14532D` | Price, footer, heading emphasis |
| Fresh | `brand-500` | `#22C55E` | Logo mark, positive delta, progress |
| Accent | `sand-500` | `#F97316` | Cart badge, "Lô cận hạn", stars |
| Accent ink | `sand-700` | `#C2410C` | Accent text on light (AA) |
| Canvas | `ink-50` | `#FAFAF7` | Page background |
| Surface | — | `#FFFFFF` | Panels, tiles, sheets |
| Ivory | `sand-50` | `#F6F2E9` | Photo backdrop, hero panel |
| Text | `ink-900` | `#172B22` | Body |
| Muted | `ink-500` | `#64748B` | Metadata |
| Rule | `ink-200` | `#E2E8E0` | 1px borders only |
| Danger | `rose-600` | `#DC2626` | Recall, errors |
| Warning | `sand-700` | `#B45309` | Expiring batch |

**Contrast** (measured): `#172B22` on `#FAFAF7` = 13.0:1 · `#64748B` on `#FFFFFF` = 5.3:1 ·
`#FFFFFF` on `#166534` = 6.4:1 · `#C2410C` on `#FFFFFF` = 4.6:1. `#F97316` is only a **fill**
(badge, star, bar) or white-on-accent at ≥600 weight — never orange text on light.

## 3. Type

Be Vietnam Pro (self-hosted woff2, latin + vietnamese subsets; TTF bundle in the mobile app).

| Role | Size / weight / leading | Notes |
| --- | --- | --- |
| Hero display | `clamp(2.125rem, 1.25rem + 2.6vw, 4rem)` / 700 / 1.04 | `-0.035em`, max 3 lines |
| Section H2 | `clamp(1.5rem, 1.15rem + 1vw, 2.25rem)` / 700 / 1.12 | `-0.025em` |
| Sub-section H3 | 18–20px / 600 / 1.3 | |
| Tile title | 14.5–15.5px / 600 / 1.4 | `line-clamp-2` |
| Body | 15–16px / 400 / 1.65 | |
| Meta | 12–13px / 400–500 | `ink-500`, never below 12px |
| Kicker | 11.5px / 700 / uppercase / 0.1em | one line, max 4 words |
| Price | 20–34px / 700 | `tabular-nums` in tables and KPI |
| KPI numeral | 30–34px / 650 | `tabular-nums`, `-0.03em` |

**Rule:** one display size per viewport per page. Admin never uses hero display; mobile hero
caps at 26px.

## 4. Space, radius, elevation

- Scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.
- Page gutters: 16 → 24 → 32 → 40px; content cap **1280px** (admin 1440 of usable width).
- Section vertical gap: 40px mobile, 64px desktop; 96px around editorial bands.
- Radius: 8 chip · 12 tile/input · 16 card · 20 panel · 24 hero · 999 pill.
- Elevation: at most **one** shadow (`--shadow-card`); admin uses hairlines, not shadow stacks.

## 5. Components

| Component | Rule |
| --- | --- |
| Button | 3 sizes (`btn-sm` 32px, default 40px, `btn-lg` 48px). Primary green fill, secondary hairline, ghost text. Radius 12. |
| Field | 40px tall, hairline border, focus = 2px brand ring. Labels above, never placeholder-as-label. |
| Tile (product) | No border, white, 1:1 image on ivory, name → price → one meta line. Hover lifts −2px + shadow. |
| Category tile | 4:3 image, name + count overlay at bottom on a white scrim. |
| Badge / pill | Radius 999, 11–12px/600. Text always present — colour never carries meaning alone. |
| Table | Sticky head, `bg-ink-50` head, 11px uppercase muted labels, 1px row rules, `tabular-nums` right-aligned money. |
| KPI | Label, numeral, delta chip. No box inside a box. |
| Timeline | Vertical rail 2px, node 10px, done = brand, pending = rule, recall = danger + `role="alert"`. |
| Empty state | Dashed 1px, icon in soft circle, one sentence + one action. |
| Skeleton | `animate-pulse` on `ink-100`, same box metrics as the loaded block. |
| Sheet (mobile) | Bottom sheet, 20px top radius, drag handle, safe-area padding. |

## 6. Imagery

- Product photography: **single subject, ivory/white backdrop, soft daylight, no props**.
- Category/tile art: 4:3, subject-centred, background ≥ 150 mean luminance (measured).
- Editorial/banner: wide, negative space reserved for copy on the side where text sits.
- Grade pipeline normalises exposure to 0.56 and warms white balance; V5 selects **light-backdrop
  studio shots** so tiles need no grade to look consistent (`docs/IMAGE_SOURCES.md`).
- No AI-generated image is used as evidence of traceability, certification, or a real farm.

## 7. Motion

150–250ms, `ease-out`, `transform`/`opacity` only. Image zoom ≤ 1.04 on tile hover, 400ms.
No autoplay carousels. `prefers-reduced-motion: reduce` zeroes durations (global rule).

## 8. Accessibility

- Focus ring 2px brand, 2px offset, global.
- All money/count columns `tabular-nums`.
- Recall banner is `role="alert"` and renders **above** everything else on the passport.
- Icon-only buttons carry `aria-label`; decorative images `alt=""`.
- Every tappable target ≥ 44px on mobile.

## 9. Out of scope (deliberate)

No change to API routes, SQL schema, pricing, allocation, recall or complaint logic. Mobile stays
Expo-web-verified; native device verification remains **BLOCKED** (no adb/Xcode on this machine).
