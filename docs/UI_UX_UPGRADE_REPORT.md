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
