let apiBaseUrl = 'http://127.0.0.1:3000';

export function cauHinhApiClient(baseUrl: string): void {
  const giaTri = baseUrl.trim();

  if (!giaTri) {
    throw new Error('API base URL không được rỗng.');
  }

  apiBaseUrl = giaTri.replace(/\/+$/, '');
}

export function layApiBaseUrl(): string {
  return apiBaseUrl;
}
