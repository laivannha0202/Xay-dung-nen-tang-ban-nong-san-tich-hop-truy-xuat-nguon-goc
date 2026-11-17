# AgriMarket V4.2 — acceptance bundle

Baseline V4.1 (`docs/screenshots/v4.1/`), branch `feat/hung-yen-checkout-security-ux`.
Every screenshot below was taken after asserting the route and the expected on-page markers;
an HTTP 200 alone was never treated as proof of the right screen.

## Surfaces

| surface | folder | files | what it shows |
| --- | --- | --- | --- |
| Customer Web (Next.js, :3000) | `customer-web/` | 27 PNG | home @390/768/1440, three hero concepts, catalog, category, search, PDP, cart, checkout (address / voucher / success), orders list, order states SHIPPING + DELIVERED, reviews, complaints, account, delivery policy |
| Admin Web (Next.js, :3001) | `admin-web/` | 23 PNG | dashboard with the 14-day orders chart, orders, batches, provenance, recalls, complaints, service areas, settings |
| Mobile app (Expo web, :8081) | `mobile-app/` | 16 PNG | home, category, search, PDP, cart, address picker, checkout, order success, orders, tracking, order detail, review, complaint, QR scan, traceability, account |
| Traceability passports (public `/t/:token`) | `traceability/` | 5 PNG | normal lot, recalled lot (Mật ong `LO-2026-0009`), expired lot, each at 1440 and 390 |
| Contact sheets | `contact-sheet-*.jpg` | 4 JPG | one sheet per surface, filename captions |
| JPEG mirror | `jpg/` | 71 JPG | q82, ≤1600 px wide, same relative paths |

## Method

- Playwright (Chromium) against the running stack: API `:4000`, customer web `:3000`,
  admin `:3001`, Expo web `:8081`.
- Fixtures created strictly through public/admin API calls — no database reset:
  cart filled with 4 SKUs, one order advanced `PENDING→SHIPPING` via
  `/admin/orders/:id/{confirm,prepare,ship}` + `/shipment`, one driven to `DELIVERED`,
  one recall opened on batch `LO-2026-0009`.
- Each capture records horizontal overflow (`scrollWidth − clientWidth`) and broken images
  (`complete && naturalWidth === 0`). All 71 captures: overflow 0, broken 0, no page errors.

## Fixes shipped in this pass

| area | change |
| --- | --- |
| Admin dashboard chart | bars were flex children whose percentage heights resolved against a content-sized parent → always 0 px. Now a `relative h-full flex-1` track with an `absolute inset-x-0 bottom-0` bar carrying `data-testid="orders-bar"`. |
| Chart regression guard | `apps/api/scripts/e2e-local.mjs` asserts `peak > 0` and at least one bar bounding box is visible. |
| Product photos | 6 SKUs re-sourced to raw-produce shots (uncooked rice, vine tomatoes, fresh longan, mangoes, leafy greens). Old offenders: cooked sticky rice, a pizza-advert tomato, Ipomoea flowers, a composite mango image. |
| Hero | static concept switcher (3 banners) replacing the autoplay slider on web and mobile; no autoplay, tab semantics. |
| Trace CTA | home CTA and trace card now push a real demo token instead of `''`, which previously rendered "Dữ liệu không hợp lệ". |
| Checkout layout | the two-column grid had no explicit column count below `lg`, so the implicit column took `max-content`; content wider than the viewport pushed the page 65 px sideways at 390. Fixed with `grid-cols-1` (grid items then shrink to the track). |
| Announcement bar | `overflow-hidden` on the mobile announcement row — the link's intrinsic width no longer escapes the header. |

## Reproduce

Capture scripts (`fixture-v42.mjs`, `shot-web-v42.mjs`, `shot-checkout-v42.mjs`,
`shot-mobile-v42.mjs`, `v42-bundle.py`) live in `.audit/`, which is git-ignored one-off
audit scratch — rerun them locally against the stack above.

Freeze pass added `shot-cart-v42.mjs` (re-shoots the cart and refuses to write a file when the
empty state shows) and `shot-copy-v42.mjs` (re-shoots home + delivery policy after the unverified
delivery promises were removed). Same `.audit/` scratch, git-ignored.
