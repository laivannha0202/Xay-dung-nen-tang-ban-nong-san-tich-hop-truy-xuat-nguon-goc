/** Shape of the `error` object every API failure returns. */
export interface ApiError {
  code: string
  message: string
  field_errors?: Record<string, string>
  [key: string]: unknown
}

export class ApiFailure extends Error {
  constructor(
    public status: number,
    public payload: ApiError,
  ) {
    super(payload.message)
    this.name = 'ApiFailure'
  }

  /** 401 on a private page always means "go and log in again". */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }
}

export function extractError(status: number, body: unknown): ApiFailure {
  const payload = (body as { error?: ApiError } | null)?.error ?? {
    code: 'UNKNOWN',
    message: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  }
  return new ApiFailure(status, payload)
}
