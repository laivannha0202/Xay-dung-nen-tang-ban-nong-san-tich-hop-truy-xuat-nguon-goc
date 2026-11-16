export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
    public extra?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export const errors = {
  unauthenticated: () => new AppError(401, 'UNAUTHENTICATED', 'Bạn cần đăng nhập để tiếp tục.'),
  forbidden: () => new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.'),
  notFound: (what = 'dữ liệu') => new AppError(404, 'NOT_FOUND', `Không tìm thấy ${what}.`),
  invalid: (msg: string, fieldErrors?: Record<string, string>) =>
    new AppError(422, 'INVALID_DATA', msg, fieldErrors),
  conflict: (code: string, msg: string, extra?: Record<string, unknown>) =>
    new AppError(409, code, msg, undefined, extra),
  outOfStock: (lines: { product_name: string; requested: number; available: number }[]) =>
    new AppError(409, 'OUT_OF_STOCK', 'Một số sản phẩm không đủ số lượng còn hàng.', undefined, { lines }),
  priceChanged: (quote: unknown) =>
    new AppError(409, 'PRICE_CHANGED', 'Giá hoặc khuyến mãi đã thay đổi. Vui lòng xem lại tổng tiền.', undefined, {
      quote,
    }),
  tooMany: () => new AppError(429, 'TOO_MANY_REQUESTS', 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'),
}
