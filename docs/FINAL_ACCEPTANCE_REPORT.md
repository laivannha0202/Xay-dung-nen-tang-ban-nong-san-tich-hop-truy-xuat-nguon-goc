# Final Acceptance Report — AgriMarket V5.0

Branch: `feat/premium-visual-redesign-v5`
Date: 2026-11-18

> **VISUAL SIGNOFF REQUIRED.** No vision model was available for any screenshot this session
> (`402 Credits Required` on every image read; no image-gen keys configured). Every "premium"
> claim below is backed by a **measurement** — luminance, WCAG ratio, bounding box, overflow,
> DOM order — not by a human or model having looked at the result. A human must review
> `docs/screenshots/v5/**/contact-*.jpg` before this ships as "premium".

---

## 1. Verification results

| Gate | Command | Result |
| --- | --- | --- |
| Types | `pnpm -r typecheck` | **PASS** — 6/6 packages, 0 errors |
| Repo gate | `pnpm verify:local` | **PASS** — 10/10 checks |
| End to end | `pnpm e2e:local` | **PASS** — 10/10 steps |

`verify:local` detail: env config, PostgreSQL reachable, 7 migrations, typecheck, 25 API tests,
admin build, customer build, expo typecheck, expo export, secret scan (857 files clean).

`e2e:local` detail: shop home 200, customer login, cart, address reuse, **order placed**
(`AGM-2026-0130`), confirmation render, checkout guard, admin login, service-area console
(104 ward rows), **dashboard chart 14 bars / peak 31 / 7 bars > 4px**.

Both gates passed only after stopping `next dev`. `verify:local` deletes `apps/*/.next` as part of
its build step; running it against a live dev server corrupts that server's module graph and every
route 500s. Ordering issue in tooling, not a product regression — documented in
`UI_UX_UPGRADE_REPORT.md` §7.

## 2. Layout and accessibility measurements

| Page set | Widths | Horizontal overflow | Broken images | WCAG AA failures |
| --- | --- | --- | --- | --- |
| Customer home | 360–1440 (6) | 0 px | 0 | 0 |
| Customer PLP | 360–1440 (6) | 0 px | 0 | 0 |
| Customer PDP | 360–1440 (6) | 0 px | 0 | 0 |
| Cart | 360–1440 (6) | 0 px | 0 | 0 |
| Trace search | 360–1440 (6) | 0 px | 0 | 0 |
| Passport (clean) | 360–1440 (6) | 0 px | 0 | 0 |
| Passport (recall) | 360–1440 (6) | 0 px | 0 | 0 |
| Admin dashboard | 360–1440 (6) | 0 px | 0 | 0 |
| Admin orders | 360–1440 (6) | 0 px | 0 | 0 |
| Admin batches | 360–1440 (6) | 0 px | 0 | 0 |
| Mobile home (Expo web) | 360, 390 | 0 px | 0 | n/a (native) |

Contrast was measured with a canvas-resolved compositor that walks every ancestor background, so
translucent layers (`/95`, `/85`) and Tailwind's `oklab` output are resolved correctly rather than
mis-parsed.

**Tap targets:** 8 targets under 44 px were found and fixed (search submit, cart pill, menu button,
announcement close, hero concept pills, section links, quick-add, qty steppers, pagination).
2 remain, both correct by design: a link inside a prose sentence, and a stretched-link overlay whose
`::after` covers the whole tile.

**DOM order, verified programmatically on both passport variants:**

| Lot | First element in `<main>` |
| --- | --- |
| `demo-mat-ong-rung` (recalled) | `role="alert"` recall banner — before DEMO banner, before any provenance |
| `demo-cam-sanh` (clean demo) | DEMO disclaimer banner — before any provenance claim |

This is the safety invariant: a recall can never be pushed below a "this is demo data" notice.

## 3. Business-flow preservation

The e2e suite passes end to end against the restyled UI, which means these flows still work:

- guest cart → login → server cart merge
- Hưng Yên ward selection and ship-fee quote
- order placement, lot allocation, confirmation page
- admin service-area console (104 rows)
- admin dashboard 14-day chart with `data-testid="orders-bar"` (7 bars > 4 px, peak 31)

No API endpoint, request shape, DB column, or status enum was modified. Only presentation markup,
CSS class names, and one CSS token changed.

## 4. Deliverables

| Path | Contents |
| --- | --- |
| `docs/design/DESIGN_SYSTEM_V5.md` | Colour, type scale, spacing, radius, component rules, a11y |
| `docs/design/VISUAL_REFERENCES_V5.md` | Reference measurements and the image-selection method |
| `docs/design/V5_MOCKUP_REVIEW.md` | Approval pack, V4→V5 change table |
| `docs/design/mockups/v5/` | 5 mockup HTML pages + rendered PNGs + contact sheets |
| `docs/design/v5/MOODBOARD.png` | Moodboard |
| `docs/screenshots/v5/customer-web/` | 5 routes × 6 widths + contact sheets |
| `docs/screenshots/v5/admin-web/` | 3 routes × 6 widths + contact sheets |
| `docs/screenshots/v5/traceability/` | 2 passport states × 6 widths + contact sheets |
| `docs/screenshots/v5/mobile-app/` | Home at 360 and 390 + contact sheets |
| `docs/IMAGE_SOURCES.md` | Per-file licence + author, studio vs graded, honest gaps |
| `docs/UI_UX_UPGRADE_REPORT.md` | What changed, why, and limitations |

## 5. Outstanding items

| Item | Status | Why |
| --- | --- | --- |
| Independent visual review | **BLOCKED** | Vision API 402 all session. Measurement is a substitute for checks, not for judgement. |
| 4 product photos still graded, not studio | **ACCEPTED WITH GAP** | No studio original exists on Wikimedia Commons or Openverse for đu đủ, rau muống, gạo nếp, mật ong. Verified by exhaustive search, not assumption. |
| Native Android / iOS verification | **BLOCKED** | No adb device, no emulator, no Xcode on this workstation. Expo Web export passes; that is **not** native. |
| Mobile screen-by-screen redesign | **PARTIAL** | Tokens mirrored and verified; individual mobile screens keep the V4 layout. |
| Mockups for the other ~20 screens | **NOT PRODUCED** | Mockups cover home, admin dashboard, mobile home, passport only. Other screens implement the same system without a diff target. |
| Lighthouse / Core Web Vitals | **NOT RUN** | Not requested; would need a production build served statically. |

## 6. Sign-off

Automated gates: **passed** (typecheck, verify, e2e, overflow, contrast, DOM order).
Human visual judgement: **outstanding**.

Recommend reviewing in this order before merge:
`docs/screenshots/v5/customer-web/contact-1440.jpg` →
`contact-390.jpg` → `docs/screenshots/v5/traceability/contact-1440.jpg` →
`docs/screenshots/v5/admin-web/contact-1440.jpg` → `docs/screenshots/v5/mobile-app/contact-390.jpg`.
