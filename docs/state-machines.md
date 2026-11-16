# Máy trạng thái

## 1. Đơn hàng

Nguồn: `apps/api/src/routes/adminOps.ts` (map `transitions`), `apps/api/src/routes/customer.ts` (`/me/orders/:id/cancel`).

```mermaid
stateDiagram-v2
  [*] --> PENDING: POST /orders
  PENDING --> CONFIRMED: admin confirm
  PENDING --> CANCELLED: khách huỷ (nhả reserved)
  CONFIRMED --> PREPARING: admin prepare
  CONFIRMED --> CANCELLED: khách huỷ
  PREPARING --> SHIPPING: admin ship (sinh phiếu xuất, trừ on_hand)
  PREPARING --> CANCELLED: khách huỷ (nếu chưa có OUT)
  SHIPPING --> DELIVERED: admin deliver
  SHIPPING --> DELIVERY_FAILED: admin delivery_failed
  DELIVERED --> COMPLETED: admin complete
  DELIVERED --> [*]
  COMPLETED --> [*]
  CANCELLED --> [*]
  DELIVERY_FAILED --> [*]
```

Bất biến:

- `CANCELLED` sau khi đã xuất kho (`shipped_qty > 0`) không được phép — API trả `409 ORDER_NOT_CANCELLABLE`.
- Huỷ chỉ giảm `reserved_qty`; `on_hand_qty` bất động. Giao thất bại **không** hoàn tồn tự động (`#15`).
- Mọi chuyển trạng thái Admin ghi `audit_logs` kèm ghi chú.

## 2. Lô hàng (ba cờ độc lập)

```mermaid
stateDiagram-v2
  state "quality_status" as Q {
    [*] --> PENDING_Q
    PENDING_Q --> PASS: phiếu kiểm nghiệm đạt, admin xác nhận
    PENDING_Q --> FAIL: bất kỳ chỉ tiêu không đạt
    FAIL --> PASS: phiếu mới đạt + admin mở khoá kèm lý do
  }
  state "publication_status" as P {
    [*] --> DRAFT
    DRAFT --> PUBLISHED: admin công khai (đủ điều kiện)
    PUBLISHED --> DRAFT: điều chỉnh đưa về nháp
  }
  state "safety_status" as S {
    [*] --> NORMAL
    NORMAL --> HOLD
    NORMAL --> RECALLED: thu hồi lô
    HOLD --> NORMAL
    HOLD --> RECALLED
  }
```

Lô bán được khi và chỉ khi `PASS + PUBLISHED + NORMAL + expiry_date >= hôm nay` — ràng buộc nằm ở `SELLABLE_SQL`. Bất kỳ cờ nào lệch nghĩa là biến khỏi catalog, khỏi checkout, khỏi xuất kho.

Chặn công khai (`POST /admin/batches/:id/publish`): thiếu phiếu kiểm nghiệm hiệu lực `PASS`; hoặc `harvest_date` sớm hơn `activity_at + isolation_days` của lần phun thuốc gần nhất.

## 3. Thu hồi

```mermaid
stateDiagram-v2
  [*] --> OPEN: admin tạo recall
  OPEN --> CLOSED: biên bản kết thúc
```

Tạo recall trong cùng transaction: đặt `batches.safety_status = 'RECALLED'`, giải phóng `reserved` của các dòng **chưa xuất** và bật `orders.needs_reallocation`, sinh `recall_contacts` từ các dòng **đã xuất**. Mỗi liên hệ có trạng thái riêng (chưa gọi → đã liên hệ → đã xử lý) ghi `handled_at`, `note`.

## 4. Yêu cầu hoàn tiền

```mermaid
stateDiagram-v2
  [*] --> PENDING
  PENDING --> APPROVED: admin duyệt
  PENDING --> REJECTED: admin từ chối
  APPROVED --> COMPLETED: admin xác nhận đã chuyển tiền
```

Doanh thu thuần = tổng `payments` đã `PAID` − tổng `refund_requests` `COMPLETED`. Yêu cầu `PENDING`/`APPROVED` **không** trừ vào doanh thu (`#19`).

## 5. Khiếu nại

```mermaid
stateDiagram-v2
  [*] --> NEW: khách gửi (từ đơn hoặc từ QR)
  NEW --> PROCESSING: admin tiếp nhận
  PROCESSING --> RESOLVED: có kết quả xử lý
  RESOLVED --> CLOSED: đóng ticket
  PROCESSING --> CLOSED
```

`CLOSED` không nhận thêm tin nhắn (`409 COMPLAINT_CLOSED`); lịch sử trao đổi luôn giữ.

## 6. Phiên đăng nhập

`POST /auth/login` → JWT `am_token` (cookie, 7 ngày) hoặc `token` trong body cho ứng dụng di động. `token_version` tăng khi đổi mật khẩu hoặc khi Admin khoá tài khoản, làm mọi token cũ vô hiệu ngay.
