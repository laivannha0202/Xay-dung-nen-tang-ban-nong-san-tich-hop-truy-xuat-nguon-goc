export const vnd = (n: number | null | undefined) =>
  `${Math.round(Number(n ?? 0)).toLocaleString('vi-VN')}₫`

export const qty = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0)
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
}

export const dateVN = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'

export const dateTimeVN = (v: string | null | undefined) =>
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

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ xác nhận', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Đã xác nhận', className: 'bg-sky-100 text-sky-800' },
  PREPARING: { label: 'Đang chuẩn bị', className: 'bg-sky-100 text-sky-800' },
  SHIPPING: { label: 'Đang giao', className: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Đã giao', className: 'bg-leaf-100 text-leaf-800' },
  COMPLETED: { label: 'Hoàn tất', className: 'bg-leaf-100 text-leaf-800' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-700' },
  DELIVERY_FAILED: { label: 'Giao thất bại', className: 'bg-red-100 text-red-800' },
}

export const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  UNPAID: { label: 'Chưa thanh toán', className: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Đã thanh toán', className: 'bg-leaf-100 text-leaf-800' },
  PARTIALLY_REFUNDED: { label: 'Hoàn một phần', className: 'bg-sky-100 text-sky-800' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-slate-100 text-slate-700' },
}

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

export const COMPLAINT_STATUS: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Mới', className: 'bg-amber-100 text-amber-800' },
  PROCESSING: { label: 'Đang xử lý', className: 'bg-sky-100 text-sky-800' },
  RESOLVED: { label: 'Đã giải quyết', className: 'bg-leaf-100 text-leaf-800' },
  CLOSED: { label: 'Đã đóng', className: 'bg-slate-100 text-slate-700' },
}

export const QUALITY: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ kiểm nghiệm', className: 'bg-amber-100 text-amber-800' },
  PASS: { label: 'Đạt', className: 'bg-leaf-100 text-leaf-800' },
  FAIL: { label: 'Không đạt', className: 'bg-red-100 text-red-800' },
}

export const PUBLICATION: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Nháp', className: 'bg-slate-100 text-slate-700' },
  PUBLISHED: { label: 'Đã công khai', className: 'bg-leaf-100 text-leaf-800' },
  UNPUBLISHED: { label: 'Ngừng công khai', className: 'bg-slate-100 text-slate-600' },
}

export const SAFETY: Record<string, { label: string; className: string }> = {
  NORMAL: { label: 'Bình thường', className: 'bg-leaf-100 text-leaf-800' },
  HOLD: { label: 'Tạm giữ', className: 'bg-amber-100 text-amber-900' },
  RECALLED: { label: 'Thu hồi', className: 'bg-red-100 text-red-800' },
}
