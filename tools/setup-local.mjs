import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, '..');
const envPath = path.join(repoRoot, '.env');

console.log('AgriMarket Local Database Setup');
console.log('=================================');

// 1. Refuse if NODE_ENV=production
const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
if (nodeEnv === 'production') {
  console.error('❌ setup:local TUYỆT ĐỐI KHÔNG chạy trên môi trường production (NODE_ENV=production)!');
  process.exit(1);
}

// 2. Load root .env
if (!fs.existsSync(envPath)) {
  console.error('❌ File .env không tồn tại!');
  console.error('   Hãy copy từ .env.example:');
  console.error('   Windows CMD: copy .env.example .env');
  console.error('   PowerShell:  Copy-Item .env.example .env');
  process.exit(1);
}

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (error) {
    console.error(`❌ Không thể đọc .env: ${error.message}`);
    process.exit(1);
  }
}

function tcpOpen(host, port, timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: timeoutMs });
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(value);
    };
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

// 3. Check MySQL and Redis connection ports
const mysqlHost = process.env.MYSQL_HOST || '127.0.0.1';
const mysqlPort = Number(process.env.MYSQL_PORT || '3306');
if (!(await tcpOpen(mysqlHost, mysqlPort))) {
  console.error(`❌ MySQL service chưa chạy tại ${mysqlHost}:${mysqlPort}. Hãy khởi động MySQL 8.x trước.`);
  process.exit(1);
}
console.log(`✓ MySQL port: ${mysqlHost}:${mysqlPort}`);

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT || '6379');
if (!(await tcpOpen(redisHost, redisPort))) {
  console.error(`❌ Redis/Memurai chưa chạy tại ${redisHost}:${redisPort}. Hãy khởi động Redis/Memurai trước.`);
  process.exit(1);
}
console.log(`✓ Redis/Memurai port: ${redisHost}:${redisPort}`);

// 4. Ensure databases and user exist
const databaseUrl = process.env.DATABASE_URL;
const shadowUrl = process.env.SHADOW_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Thiếu DATABASE_URL trong .env');
  process.exit(1);
}

const dbParsed = new URL(databaseUrl);
const dbName = decodeURIComponent(dbParsed.pathname.replace(/^\//, '')) || 'agrimarket';
const dbUser = decodeURIComponent(dbParsed.username) || 'agrimarket';
const dbPass = decodeURIComponent(dbParsed.password) || '';

let shadowDbName = 'agrimarket_shadow';
if (shadowUrl) {
  try {
    const sParsed = new URL(shadowUrl);
    shadowDbName = decodeURIComponent(sParsed.pathname.replace(/^\//, '')) || 'agrimarket_shadow';
  } catch {
    // default
  }
}

// Check if mysql2 is available
let mysql;
try {
  const m = await import('mysql2/promise');
  mysql = m.default || m;
} catch (err) {
  console.warn('⚠️  Không thể load mysql2 client:', err.message);
}

if (mysql) {
  const rootPass = process.env.MYSQL_ROOT_PASSWORD || 'agrimarket_root_local';
  let adminConn = null;

  // Try connect as root or privileged user to create DBs and grant if needed
  try {
    adminConn = await mysql.createConnection({
      host: mysqlHost,
      port: mysqlPort,
      user: 'root',
      password: rootPass,
    });
  } catch {
    // If root fails, try with app user directly (in case user already has full rights or root has no password)
    try {
      adminConn = await mysql.createConnection({
        host: mysqlHost,
        port: mysqlPort,
        user: 'root',
        password: '',
      });
    } catch {
      try {
        adminConn = await mysql.createConnection({
          host: mysqlHost,
          port: mysqlPort,
          user: dbUser,
          password: dbPass,
        });
      } catch (appErr) {
        console.warn('⚠️  Không thể kết nối admin/root MySQL tự động:', appErr.message);
        console.warn('   Nếu database chưa tồn tại, hãy chạy script SQL thủ công được ghi trong README.');
      }
    }
  }

  if (adminConn) {
    try {
      console.log(`✓ Đảm bảo database \`${dbName}\` tồn tại...`);
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

      console.log(`✓ Đảm bảo shadow database \`${shadowDbName}\` tồn tại...`);
      await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${shadowDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

      // Ensure user and grants if connected as root
      if (adminConn.config.user === 'root') {
        console.log(`✓ Đảm bảo MySQL user \`${dbUser}\` và quyền truy cập tồn tại...`);
        await adminConn.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPass}';`);
        await adminConn.query(`ALTER USER '${dbUser}'@'%' IDENTIFIED BY '${dbPass}';`);
        await adminConn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%';`);
        await adminConn.query(`GRANT ALL PRIVILEGES ON \`${shadowDbName}\`.* TO '${dbUser}'@'%';`);
        await adminConn.query(`FLUSH PRIVILEGES;`);
      }
    } catch (sqlErr) {
      console.warn('⚠️  Lỗi nhẹ khi khởi tạo DB/user (có thể user đã tồn tại hoặc quyền giới hạn):', sqlErr.message);
    } finally {
      await adminConn.end();
    }
  }
}

// 5. Run Prisma migrate deploy
console.log('\n--- Prisma Migrate Deploy ---');
const isWin = process.platform === 'win32';
const pnpmBin = isWin ? 'pnpm.cmd' : 'pnpm';

try {
  execSync(`${pnpmBin} --filter @agrimarket/api exec prisma migrate deploy --config prisma7.config.ts`, {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  console.log('✓ Prisma migrate deploy thành công.');
} catch (err) {
  console.error('❌ Prisma migrate deploy thất bại:', err?.message || err);
  process.exit(1);
}

// 6. Run Prisma generate
console.log('\n--- Prisma Generate ---');
try {
  execSync(`${pnpmBin} --filter @agrimarket/api exec prisma generate --config prisma7.config.ts`, {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  console.log('✓ Prisma generate thành công.');
} catch (err) {
  console.error('❌ Prisma generate thất bại:', err?.message || err);
  process.exit(1);
}

// 7. Optional seed if requested via flag
const args = process.argv.slice(2);
if (args.includes('--seed')) {
  console.log('\n--- Seeding Demo Data ---');
  try {
    execSync(`${pnpmBin} db:seed:demo`, {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    console.log('✓ Seed demo data thành công.');
  } catch (err) {
    console.error('❌ Seed demo thất bại:', err?.message || err);
    process.exit(1);
  }
}

console.log('\n=================================');
console.log('✅ SETUP LOCAL HOÀN TẤT THÀNH CÔNG');
console.log('Bước tiếp theo:');
console.log('  pnpm doctor');
console.log('  pnpm db:seed:demo  (nếu chưa chạy flag --seed)');
console.log('  pnpm dev');
