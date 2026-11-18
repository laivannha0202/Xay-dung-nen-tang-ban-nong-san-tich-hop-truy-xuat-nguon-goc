# UI/UX Upgrade Report — AgriMarket V5.0

Scope: visual layer of Customer Web, Admin Web, Customer Mobile. Business logic, API
contracts, DB schema, Hưng Yên delivery area, batch/recall/lab-test flows unchanged.

Branch: `feat/premium-visual-redesign-v5`.

---

## 1. What changed and why

V4 was measured, not guessed. Three findings drove every decision:

| Finding | Measurement | Consequence in V5 |
| --- | --- | --- |
| V4 hero photos were too dark for direct text | banner mean luminance 113 / 120 / 139 / 142 (0–255) | V4 needed a `#092e1b/95` veil, which the brief calls out as the "premium failure". V5 replaces the photo set and drops the veil entirely. |
| Product photos came from mixed lighting | corner-background luminance spread up to 160 on a single photo | V5 puts every 1:1 product photo on one ivory frame (`#f6f2e9`), so variety reads as a planned set. |
| `--color-ink-500` was `#64748b` | 4.26:1 on ivory, and a stray slate hue in a green-grey ramp | Changed to `#5b6b60` (5.06:1 on ivory, 5.65:1 on white). One token fixed nine screens. |

## 2. Design system

`docs/design/DESIGN_SYSTEM_V5.md`. Summary of the frozen decisions:

- **Canvas** `#fafaf7` (was `#f7f8f2`) — slightly brighter so white cards separate without a border.
- **Ivory frames** `#faf7ef` / `#f6f2e9` / `#ece6d7` — photo beds and the hero panel.
- **Brand kept** `#166534` / `#14532D` / `#22C55E` / `#F97316` — already matched the brief; no reason to churn it.
- **Radii** 8 / 12 / 16 / 20 / 999, via new `--radius-tile: 12px` and `--radius-panel: 20px`.
- **Type** H1 34 → 46 → 56 px with `tracking-[-0.035em]`; section H2 16 px semibold, so hierarchy comes from the H1 and photos rather than from many competing sizes.
- **Touch targets** every `.btn` now has `min-h-11`; card titles became stretched links so the whole tile is tappable.

## 3. Screen-by-screen

### Customer Web

| Screen | Change |
| --- | --- |
| Header | 1280px rail. Search owns the middle (full-height submit). Category rail has no icons, adds "Lô cận hạn" + a right-hand trust note. Announcement bar states the Hưng Yên free-ship threshold and links to policy. |
| Home hero | Ivory panel, two columns, three concept pills (still static — no autoplay). H1 second line in `brand-600`. Proof row under a hairline. QR floats on the photo, promo cards only at `xl` so they never crowd the mobile crop. |
| Home body | Section order: hero → service strip (one hairline row, not four cards) → categories (4:3) → top rated → batch promos → traceability (dark panel, the one intentional dark block) → seasonal → why-us → delivery band → newest. |
| Product card | Borderless. 1:1 photo on ivory, three meta lines, stretched-link hit area, `z-10` add button layered above it. |
| PLP | Header loses its card box. Sort bar becomes a hairline row. Grid gaps go `gap-x-4 gap-y-7` so tiles breathe vertically. |
| PDP | Buy box gets the price at 30px in `brand-700` and a separated ivory perk block. Gallery untouched. |
| Cart / checkout | `card` → `surface`, qty steppers become 44px, muted text raised to `ink-600`. |
| Passport `/t/[token]` | Cover with 280px photo column, 8-step hairline journey, `surface` sections, meter bars kept. **Recall alert still first DOM element** on recalled lots; DEMO banner still first on clean lots. |
| Account, policy, search | Token-level fixes only (`ink-400` → `ink-500/600`). No structural rewrite. |

### Admin Web

- Shell, sidebar, KPI band and tables were already at spec — left alone. Only the group label moved from `ink-400` to `ink-500` (it was 2.62:1).
- Dashboard cards `card-pad` → `surface p-5`. The `div`-bar chart is unchanged: **14 `data-testid="orders-bar"` elements still render**, so the `peak > 0` e2e guard is intact.
- Verified 6 routes at 1440: 0 overflow, 0 contrast failures.

### Customer Mobile

- `theme.ts` mirrors the web tokens: `bg #FAFAF7`, `muted #5B6B60`, new `ivory` / `ivoryBorder`, `radius.pill`, larger `space` scale.
- Because every mobile screen already used `theme.muted`, the contrast fix propagated without editing 3,000 lines of screen code.
- Typecheck clean.

## 4. Imagery

Measured selection (a vision model was unavailable all session — see §6).

| Class | Count | Criterion |
| --- | --- | --- |
| studio | 10 | corner luminance ≥ 217/255, corner spread ≤ 25 |
| graded | 4 | real photo, tone curve only (gamma 1.35 + 1:1 crop); no cut-out, no compositing |

The 4 remaining graded slots (đu đủ, rau muống, gạo nếp, mật ong) have **no studio original on any free library** — checked Wikimedia Commons and Openverse exhaustively; the only hits were papaya flowers, spinach pizza, cooked brown rice and bees.

## 5. Verification actually run

| Check | Result |
| --- | --- |
| `pnpm -r typecheck` | PASS — 6/6 packages |
| `pnpm verify:local` | see `FINAL_ACCEPTANCE_REPORT.md` |
| `pnpm e2e:local` | see `FINAL_ACCEPTANCE_REPORT.md` |
| Overflow, 10 routes × 6 widths (360→1440) | 0 px |
| Broken images | 0 |
| WCAG AA contrast, customer home/PLP/PDP/cart | 0 failures |
| WCAG AA contrast, 6 admin routes | 0 failures |
| Tap targets < 44px | 2 remaining, both legitimate (inline sentence link, stretched-link overlay) |
| Recall alert is first DOM child on recalled lot | verified |
| DEMO banner is first DOM child on clean demo lot | verified |

## 6. Honest limitations

1. **No independent visual review.** The vision API returned `402 Credits Required` for every
   request this session, and no image-generation keys were present. All "looks right" claims are
   **measured** (luminance, contrast ratio, bounding boxes, overflow, DOM order), not seen.
   **VISUAL SIGNOFF REQUIRED.**
2. **4 of 14 product photos are graded, not studio.** Documented per-file in `IMAGE_SOURCES.md`.
3. **Native Android/iOS not verified.** No adb device, no emulator, no Xcode on this workstation.
   Expo Web export passes; that is not native.
4. **Mobile was restyled at the token level, not screen-by-screen.** Layout of individual mobile
   screens is V4 and still uses the older card rhythm.
5. **Mockups exist for 4 screens only** (home, admin dashboard, mobile home, passport). The other
   ~20 screens implement the same system without a mockup to diff against.

## 7. Build-integrity note

`pnpm verify:local`'s build step deletes `apps/*/.next`. Running it while `next dev` is live on
port 3000/3001 corrupts the dev server's module graph and every route then returns 500. This is a
tooling ordering issue, not a regression: stop the dev servers before verifying.

---

# V7.1 — bug fix + real photography + larger demo catalogue

Same palette, same font, same V7 storefront direction. This pass fixed one user-visible bug,
rebuilt the `/san-pham` filter as a rail, and replaced the placeholder photography.

## Duplicate React key

Symptom: `Encountered two children with the same key` on the home page and, occasionally, on the
listing. Cause: the same product could appear twice in one row — `featured ∩ newest` on the home
payload, and `products.map` appended after `promo` items on the listing.

Fixed on both sides:

| Layer | Change |
| --- | --- |
| API (`routes/public.ts`) | `/home` newest excludes featured ids: `WHERE NOT (id = ANY($1::uuid[]))`. Categories only listed when they still have `ACTIVE` products. |
| Core | `uniqueById()` in `packages/core/src/collect.ts`, exported from the package root. |
| Web | `app/page.tsx` `claim()` walks each list once and skips ids already shown; listing and category pages de-dupe before render. |
| Mobile | `home.tsx` de-dupes `featured`, `newest`, per-category rows. |

Regression test: `apps/api/test/10-home-dedupe.test.ts` (asserts no repeated id in the payload and
that `uniqueById` preserves order).

## Listing filter (`/san-pham`)

The old sidebar was `position: sticky` inside a `space-y` parent, so it slid under the header and
covered product rows while scrolling.

- Desktop (`lg+`): two-column grid `[minmax(220px,240px)_minmax(0,1fr)]`; the rail is
  `lg:sticky lg:top-28 lg:self-start` in its own grid cell. Measured sticky offset at 1440/1280 =
  112px under a 101px header; no horizontal overflow at 1440/1280/900/390.
- Below `lg`: the same filters live in a `<details>` disclosure that stays in flow, so it can never
  cover the grid.
- Filtering is a client submit (`useParamPush`) rather than a native GET form: the native form also
  posted empty fields and polluted shareable URLs with `?q=&danh-muc=&gia-tu=&gia-den=`.
- Sort keeps the active filters, and both drop `page`.

## Photography

Every product, category tile and banner on the storefront is now a real photo of the subject it
claims, from Wikimedia Commons under a free licence. Per-file licence and source are recorded in
`IMAGE_SOURCES.md`. Deliberate exclusions:

- No AI or generated imagery anywhere in the catalogue or traceability pages.
- Water-spinach and pak-choi product shots were not available with the right subject, so the demo
  catalogue dropped the products that had no correct photo instead of shipping an off-subject one.

Processing (single pass, same for every file): cover-crop to 1000×1000 (product) / 600×600
(category) / 1800×800 (banner), normalise mean luminance to 0.62 with gain clamped to 0.98–1.12,
soft highlight knee at 0.90, saturation ×1.04, JPEG q82 progressive.

## Demo catalogue

`apps/api/src/scripts/seed-demo-v71.ts` (`pnpm --filter @agrimarket/api seed:v71`) is idempotent:
it keys on product slug/sku and batch code, so re-running changes nothing. It seeds 30 products
across all seven departments, with batch, inventory and supplier links, and 10 demo reviews.

Reviews are attached to orders flagged `is_demo`, and the storefront shows them as
"Dữ liệu minh hoạ". No lab result or certificate is fabricated — demo batches simply have none.

## Verification

| Check | Result |
| --- | --- |
| `pnpm -r typecheck` | pass (6 packages) |
| `pnpm e2e:local` | 10/10 steps; now also collects `console` errors/warnings, so a repeated-key React warning fails the run |
| Home / listing / category / product console | no errors, no warnings, no 4xx/5xx responses |
| Catalogue | 50 products, every one with an existing image file |
| Screenshots | `docs/screenshots/v7.1/` — home (viewport + full), listing desktop/mobile, filtered listing, product detail, category |

Known limits: native iOS/Android still not exercised (no device on this workstation); photography
is illustration for the demo, not evidence of provenance.
