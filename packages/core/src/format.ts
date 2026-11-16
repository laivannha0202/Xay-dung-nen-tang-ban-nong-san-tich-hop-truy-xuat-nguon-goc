/** Money and quantity are formatted identically on the website and the app. */
export const vnd = (n: number | string | null | undefined): string =>
  `${Math.round(Number(n ?? 0)).toLocaleString('vi-VN')}₫`

export const qty = (n: number | string | null | undefined): string => {
  const v = Number(n ?? 0)
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export const dateVN = (v: string | null | undefined): string =>
  v
    ? new Date(v).toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—'

export const dateTimeVN = (v: string | null | undefined): string =>
  v
    ? new Date(v).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

/** Order lifecycle wording shared by every client. */
export const ORDER_STATUS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  DELIVERY_FAILED: 'Giao thất bại',
}

export const PAYMENT_STATUS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  PARTIALLY_REFUNDED: 'Hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
}

export const PAYMENT_METHOD: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
}

/** The steps a customer sees on the tracking timeline, in order. */
export const ORDER_TIMELINE: Array<{ key: string; label: string }> = [
  { key: 'PENDING', label: 'Đặt hàng' },
  { key: 'CONFIRMED', label: 'Xác nhận' },
  { key: 'PREPARING', label: 'Chuẩn bị hàng' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
]

export const ACTIVITY_LABEL: Record<string, string> = {
  TILLING: 'Làm đất',
  SOWING: 'Gieo trồng',
  FERTILIZING: 'Bón phân',
  PESTICIDE: 'Phun thuốc BVTV',
  IRRIGATION: 'Tưới nước',
  PRUNING: 'Tỉa cành',
  HARVEST: 'Thu hoạch',
  OTHER: 'Khác',
}

export const COMPLAINT_TYPE: Record<string, string> = {
  QUALITY: 'Chất lượng',
  DAMAGED: 'Hư hỏng',
  WRONG_ITEM: 'Sai hàng',
  SUSPECTED_FAKE: 'Nghi hàng giả',
  OTHER: 'Khác',
}

export const COMPLAINT_STATUS: Record<string, string> = {
  NEW: 'Mới',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
}

export const QUALITY_STATUS: Record<string, string> = {
  PENDING: 'Chờ kiểm nghiệm',
  PASS: 'Đạt',
  FAIL: 'Không đạt',
}

export const PUBLICATION_STATUS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đã công khai',
  UNPUBLISHED: 'Ngừng công khai',
}

export const SAFETY_STATUS: Record<string, string> = {
  NORMAL: 'Bình thường',
  HOLD: 'Tạm giữ',
  RECALLED: 'Thu hồi',
}

export const RECALL_SEVERITY: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Nghiêm trọng',
}

/** Free shipping threshold promised on the storefront, in VND. */
export const FREE_SHIPPING_FROM_VND = 500_000
