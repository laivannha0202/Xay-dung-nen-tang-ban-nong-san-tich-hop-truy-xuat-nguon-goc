type BanGhiKhongXacDinh = Record<string, unknown>;

export type LoaiLoiApiMobile =
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'server'
  | 'unknown';

export type LoiApiMobile = {
  loai: LoaiLoiApiMobile;
  status: number | null;
  thongDiep: string;
  thongDiepBackend: string[];
};

function laBanGhi(value: unknown): value is BanGhiKhongXacDinh {
  return typeof value === 'object' && value !== null;
}

function laySo(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && /^\d{3}$/.test(value.trim())) {
    return Number(value);
  }

  return null;
}

function layThongDiep(value: unknown): string[] {
  if (typeof value === 'string') {
    const message = value.trim();
    return message ? [message] : [];
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function layData(error: unknown): unknown {
  if (!laBanGhi(error)) return undefined;
  return error.data;
}

export function layTrangThaiHttp(error: unknown): number | null {
  if (!laBanGhi(error)) return null;

  const trucTiep = laySo(error.status) ?? laySo(error.statusCode);
  if (trucTiep !== null) return trucTiep;

  const data = layData(error);
  if (laBanGhi(data)) {
    const tuData = laySo(data.status) ?? laySo(data.statusCode);
    if (tuData !== null) return tuData;
  }

  const response = error.response;
  if (laBanGhi(response)) {
    const tuResponse = laySo(response.status) ?? laySo(response.statusCode);
    if (tuResponse !== null) return tuResponse;
  }

  return null;
}

function layThongDiepBackend(error: unknown): string[] {
  if (!laBanGhi(error)) {
    return error instanceof Error ? layThongDiep(error.message) : [];
  }

  const messages: string[] = [];

  const data = layData(error);
  if (laBanGhi(data)) {
    messages.push(...layThongDiep(data.message));
    messages.push(...layThongDiep(data.error));
  } else {
    messages.push(...layThongDiep(data));
  }

  messages.push(...layThongDiep(error.message));

  const response = error.response;
  if (laBanGhi(response)) {
    const responseData = response.data;
    if (laBanGhi(responseData)) {
      messages.push(...layThongDiep(responseData.message));
      messages.push(...layThongDiep(responseData.error));
    }
  }

  return [...new Set(messages)];
}

function laLoiMang(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const text =
    error instanceof Error
      ? error.message.toLowerCase()
      : laBanGhi(error) && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : '';

  return (
    text.includes('failed to fetch') ||
    text.includes('network request failed') ||
    text.includes('networkerror') ||
    text.includes('network error') ||
    text.includes('load failed')
  );
}

export function chuanHoaLoiApi(error: unknown, fallback?: string): LoiApiMobile {
  const status = layTrangThaiHttp(error);
  const thongDiepBackend = layThongDiepBackend(error);

  if (laLoiMang(error)) {
    return {
      loai: 'network',
      status,
      thongDiep: 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.',
      thongDiepBackend,
    };
  }

  if (status === 401) {
    return {
      loai: 'unauthorized',
      status,
      thongDiep: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      thongDiepBackend,
    };
  }

  if (status === 403) {
    return {
      loai: 'forbidden',
      status,
      thongDiep: 'Bạn không có quyền thực hiện thao tác này.',
      thongDiepBackend,
    };
  }

  if (status === 404) {
    return {
      loai: 'not-found',
      status,
      thongDiep: 'Không tìm thấy dữ liệu yêu cầu.',
      thongDiepBackend,
    };
  }

  if (status === 409) {
    return {
      loai: 'conflict',
      status,
      thongDiep:
        thongDiepBackend[0] ??
        fallback ??
        'Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.',
      thongDiepBackend,
    };
  }

  if (status === 400 || status === 422) {
    return {
      loai: 'validation',
      status,
      thongDiep:
        thongDiepBackend.join(', ') ||
        fallback ||
        'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.',
      thongDiepBackend,
    };
  }

  if (status !== null && status >= 500) {
    return {
      loai: 'server',
      status,
      thongDiep: 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.',
      thongDiepBackend,
    };
  }

  return {
    loai: 'unknown',
    status,
    thongDiep:
      thongDiepBackend[0] ??
      fallback ??
      'Đã xảy ra lỗi. Vui lòng thử lại.',
    thongDiepBackend,
  };
}

export function thongBaoLoiApi(
  error: unknown,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.',
): string {
  return chuanHoaLoiApi(error, fallback).thongDiep;
}

/**
 * Query GET có thể retry ngắn với lỗi mạng/5xx.
 * Không retry lỗi client 4xx vì retry tự động không thể sửa input/quyền/session.
 */
export function coNenThuLaiQueryApi(failureCount: number, error: unknown): boolean {
  const status = layTrangThaiHttp(error);

  if (status !== null && status >= 400 && status < 500) {
    return false;
  }

  return failureCount < 2;
}
