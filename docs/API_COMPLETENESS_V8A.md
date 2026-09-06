# AgriMarket V8A — Checkout Money Foundation

- Backend calculates base shipping fee from system settings.
- Checkout Preview no longer treats promotion/shipping/points placeholders as blockers.
- Promotion and loyalty stay optional and are explicitly `KHONG_AP_DUNG` until V8B.
- Order recalculates subtotal + shipping on the server.
- Order stores immutable `tamTinhHangHoa` and `phiVanChuyen` snapshots.
- Neutral migration default: shipping fee = 0, free-shipping threshold = null.

V8B will add voucher discount value, loyalty redemption, promotion usage locking and Customer Web controls.
