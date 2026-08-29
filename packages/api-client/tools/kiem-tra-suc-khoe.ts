import { cauHinhApiClient, layTrangThaiSucKhoe } from '../src/index';

async function main(): Promise<void> {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('Thiếu API_BASE_URL cho smoke test.');
  }

  cauHinhApiClient(apiBaseUrl);

  const ketQua = await layTrangThaiSucKhoe();

  if (ketQua.status !== 200) {
    throw new Error(`Generated client trả HTTP status không hợp lệ: ${ketQua.status}`);
  }

  const duLieu = ketQua.data;

  if (duLieu.trangThai !== 'ok') {
    throw new Error(`Generated client trả trạng thái không hợp lệ: ${duLieu.trangThai}`);
  }

  if (duLieu.dichVu !== 'agrimarket-api') {
    throw new Error(`Generated client trả dịch vụ không hợp lệ: ${duLieu.dichVu}`);
  }

  console.log('✓ Generated client gọi GET /api/v1/suc-khoe thành công.');
  console.log('✓ HTTP status=200.');
  console.log(`✓ trangThai=${duLieu.trangThai}; dichVu=${duLieu.dichVu}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
