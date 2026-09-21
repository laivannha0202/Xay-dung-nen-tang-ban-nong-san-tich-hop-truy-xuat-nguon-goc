import { doiMatKhau } from '@agrimarket/api-client';

import { duLieuApi } from './api-response';
import { layTuyChonBearer } from './phien-xac-thuc';

export async function doiMatKhauMobile(input: {
  matKhauHienTai: string;
  matKhauMoi: string;
}): Promise<{ thongBao?: string }> {
  const response = await doiMatKhau(input, await layTuyChonBearer());
  return duLieuApi(response) as { thongBao?: string };
}

// AGRIMARKET-MOBILE-WEB-PARITY-V1
