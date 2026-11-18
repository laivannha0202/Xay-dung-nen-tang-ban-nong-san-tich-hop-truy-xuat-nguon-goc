# Design System V6 — Editorial Organic Market

V6 is a **layout-level** redesign of Customer Web, Admin Web and Customer Mobile. It supersedes
V5's token polish: V5 changed hexes and card padding, V6 changes composition — one hero, a real
trust band, image-led category tiles, serif display type, and a shared shell across the three
surfaces. Business logic, routes, API contracts, SQL schema, pricing, allocation, recall and
complaint flows are untouched.

Branch: `feat/premium-visual-redesign-v5`.

## 1. Reference and what was actually measured

The brief's reference image could not be read by a vision model this session
(`402 Credits Required` from every vision call, retried across the block). Instead the reference
screenshots already in the repo were measured numerically, so the numbers below are facts, not
impressions:

| Measurement (`docs/design/references/v5/freshcart-1440.png`, 1440×3846) | Value |
| --- | --- |
| Content rail | x = 76 … 1363 → **1288px** wide (1280 + gutters), i.e. `max-w-[1280px] px-8` at 1440 |
| Palette (share of page area) | `#ffffff` 47.3 %, `#f0f3f2` 12.1 %, hero panel `#cfe7d9` 6.6 % |
| Hero | single pale panel, y = 204 … 748 → **544px tall**, copy column left, photo right |
| Sections | 6 blocks, white background between them, **no bordered cards** around the hero |
| Footer | pale `#f0f3f2`, not dark |

What V6 took from it: pale panel hero with a two-column split, the ~544px hero height, hairline
rails instead of card borders, one accent colour, and section rhythm driven by whitespace.

What V6 deliberately did **not** take: the white canvas (the brief asks for ivory/cream), the
marketplace density, and the sans-only type. AgriMarket is a provenance product, so the page earns
its "premium" claim differently — an editorial serif for headings and the traceability story told
once, in one dark band.

## 2. Palette

Brand identity is unchanged (`#166534` / `#14532D` / `#22C55E` / `#F97316`) — it already met the
brief. V6 adds two surface tones and one type voice.

| Role | Token | Hex | Where |
| --- | --- | --- | --- |
| Canvas | `ink-50` | `#FAFAF7` | page background |
| Hero panel | `mint-50` | `#F0F6EF` | hero, PDP perk list, account header |
| Hero panel strong | `mint-100` / `mint-200` | `#E3EFE2` / `#CFE7D9` | mobile hero, badges |
| Photo bed | `ivory-100` | `#F6F2E9` | under every product photo |
| Surface | — | `#FFFFFF` | cards, tiles, sheets |
| Primary | `brand-600` | `#166534` | buttons, links, active nav |
| Primary dark | `brand-800` / `brand-900` | `#113F24` / `#0D301C` | footer, traceability band, PDP trust block |
| Accent | `sand-500` | `#F97316` | cart badge, "Cận hạn", stars |
| Text | `ink-900` | `#172B22` | headings and body |
| Muted | `ink-500/600` | `#5B6B60` / `#4B5B53` | metadata |

Contrast (measured): `#172B22` on `#F0F6EF` = 12.6:1 · `#4B5B53` on `#F0F6EF` = 6.0:1 ·
`#FFFFFF` on `#166534` = 6.4:1 · `#FFFFFF` on `#0D301C` = 12.9:1.

## 3. Type

Two families, one job each.

- **Fraunces** (self-hosted variable woff2, `latin` + `vietnamese` subsets, 400–700) —
  `--font-display`, exposed as the `display` utility. Hero, section headings, product name on PDP,
  account name, KPI-free admin headings. Never body copy.
- **Be Vietnam Pro** — everything else, all admin data, all tables, all mobile UI text.

| Role | Size | Notes |
| --- | --- | --- |
| Hero H1 | 36 → 48 → 58px | `leading-[1.03]`, `-0.022em`, max 2 lines |
| Section H2 | clamp(22 → 28px) | serif, `leading-[1.15]` |
| PDP product name | 26 → 30px | serif |
| Eyebrow | 11.5px / 600 / `0.14em` | one per section, ≤4 words |
| Tile title | 14–14.5px / 600 | sans, `line-clamp-2` |
| Price | 17px tile, 32px PDP | `tabular-nums` |
| KPI numeral | 26px / 600 / `-0.02em` | `tabular-nums` |

Rule: **one display size per viewport per page.** Admin never uses `display`.

## 4. Layout

- Rail `1280px`, gutters 16 → 24 → 32px.
- Section gap `48px` mobile, `64px` desktop; `40px` inside a section between header and grid.
- Radius: `--radius-tile 12` · `--radius-panel 20` · `--radius-hero 28` · pill 999.
- Elevation: one shadow (`--shadow-card`) and only on hover for tiles; admin uses hairlines.
- Product grid: `gap-3` (12px) in both axes, 2 → 3 → 4 columns. Tiles carry a 8px inner inset so
  the photo sits inside the card instead of bleeding to its edge.

## 5. Component changes (structural, not cosmetic)

| Surface | V5 | V6 |
| --- | --- | --- |
| Home hero | ivory panel + **3 switchable concepts** + promo cards floating on the photo | **one** message, mint panel, serif H1, two CTAs, 3 proof stats, QR card on the photo. The concept tablist is deleted: three competing headlines is a carousel without autoplay. |
| Trust badges | 4 icons in a plain hairline row (moved into the page body) | 4 **cards** directly under the hero, each with a soft green disc, title, one-line proof |
| Category cards | 4:3 photo, name + count **below** the image | full-bleed photo tile, name + count on a bottom scrim (`category-tile.tsx`) |
| Product card | borderless, `rounded-2xl`, 1:1 photo flush | panel card, 8px inset, photo in 12px frame, hover lift + shadow |
| Header | white bar, search field, spacer between groups | translucent sticky bar, pill search with inset submit, category rail with underline-free active state |
| Footer | `brand-800`, 4 columns, 13px list | `brand-900`, uppercase column heads, wider rhythm, muted copyright rail |
| PDP | `card-pad` sections, price 30px | `radius-hero` buy box, serif title, price 32px, mint perk list with 3 promise lines, trust block flipped to `brand-900` |
| Cart | `surface` list + summary | `radius-panel` list with 72px ivory thumbs, serif summary title, `tabular-nums` money |
| Checkout | plain `h1` | step eyebrow ("Bước 2 / 2"), serif heading, service-area sentence |
| Account | avatar disc + icon chips | mint header band with initial monogram, serif name, **pill** nav (`aria-current` kept) |
| Passport | `rounded-3xl` cover, sans H1 | `radius-hero` cover, serif title 30 → 38px, panel sections. Recall alert still the first DOM child; DEMO banner still first on clean lots. |
| Admin shell | hairline active row + left tick | filled `brand-600` active row, white icon, `min-h-9` rows |
| Admin tables | 11px tracking-wide heads, `ink-50/70` | 10.5px `0.06em` heads on solid `ink-50`, `px-3.5 py-3` cells, last row borderless, `bg-brand-50/50` hover |
| Admin KPI | 24px | 26px `-0.02em` `tabular-nums` |
| Mobile home | photo hero with dark scrim + 3 concept chips + white card floating over the photo | **one** mint hero: eyebrow, serif headline, body, two pill CTAs, then the photo; 4-tile trust strip below |
| Mobile tab bar | 10.5px labels, 7px padding | `minHeight 56`, hairline `ivoryBorder`, 10px `500` labels |
| Mobile brand | sans 17px | serif 18px |

## 6. Imagery

The photo set is unchanged — it was re-sourced and licence-documented in V5
(`docs/IMAGE_SOURCES.md`). V6 changes the **frame**, which is what made V5's mixed sources look
inconsistent: every product photo now sits inside `--radius-tile` on `ivory-100`, inside a white
panel with an 8px inset. Category photos moved from a small tile with a label underneath to a
full-bleed 4:3 tile with a scrim, so the produce carries the section.

Still missing (honest): 4 of 14 product photos are graded rather than studio (`du-du-ruot-do`,
`rau-muong`, `gao-nep-cai-hoa-vang`, `mat-ong-rung`). No free-licence studio shot exists for those
subjects. They are the slots to replace first when a photo budget exists.

## 7. Accessibility held constant

- Focus ring 2px `brand-600`, 2px offset, global.
- Every interactive target ≥ 44px: `.btn` keeps `min-h-11`; mobile tab bar `minHeight 56`;
  account pills `min-h-11`; cart steppers 44px.
- Recall banner `role="alert"`, first DOM child on a recalled lot; DEMO banner first on demo lots.
- Colour never carries meaning alone — every badge has a word.
- Money and counts `tabular-nums`.

## 8. Out of scope

No API, schema, pricing, allocation, recall or complaint change. No new dependency: the serif is a
self-hosted woff2 shipped in both web apps' `public/fonts` and a TTF in the mobile bundle.
