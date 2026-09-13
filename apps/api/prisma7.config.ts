import { config as loadDotenv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

// Chạy thường (không USB): `pnpm --filter @agrimarket/api start:dev` chạy với
// cwd apps/api nên `dotenv/config` mặc định chỉ thấy apps/api/.env (không tồn
// tại). Nạp thêm root .env (chỉ fill biến còn thiếu, không override) để
// prisma generate/find DATABASE_URL hoạt động khi chạy bình thường.
loadDotenv();
loadDotenv({
  path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.env'),
});

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
});
