import { spawnSync } from 'node:child_process';
import process from 'node:process';

function run(command, args, env = process.env) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function requireTestDatabase(name, value, expectedDatabase) {
  if (!value) {
    console.error(`❌ Thiếu ${name}. Release gate không được dùng database development.`);
    process.exit(2);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    console.error(`❌ ${name} không phải database URL hợp lệ.`);
    process.exit(2);
  }

  const database = parsed.pathname.replace(/^\//, '');
  if (database !== expectedDatabase) {
    console.error(
      `❌ ${name} phải trỏ chính xác tới database '${expectedDatabase}', hiện là '${database || '(rỗng)'}'.`,
    );
    process.exit(2);
  }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const testShadowDatabaseUrl = process.env.TEST_SHADOW_DATABASE_URL;

requireTestDatabase('TEST_DATABASE_URL', testDatabaseUrl, 'agrimarket_test');
requireTestDatabase('TEST_SHADOW_DATABASE_URL', testShadowDatabaseUrl, 'agrimarket_test_shadow');

const apiTestEnv = {
  ...process.env,
  DATABASE_URL: testDatabaseUrl,
  SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  TEST_DATABASE_URL: testDatabaseUrl,
  TEST_SHADOW_DATABASE_URL: testShadowDatabaseUrl,
  BULLMQ_PREFIX: process.env.BULLMQ_PREFIX || `agrimarket:test:release:${process.pid}`,
};

console.log('AgriMarket — RELEASE QUALITY GATE');
console.log('================================');
console.log('✓ Database test đã được khóa an toàn.');
console.log(`✓ BullMQ prefix: ${apiTestEnv.BULLMQ_PREFIX}`);

run('pnpm', ['--filter', '@agrimarket/api', 'exec', 'prisma', 'migrate', 'deploy', '--config', 'prisma7.config.ts'], apiTestEnv);
run('pnpm', ['--filter', '@agrimarket/api', 'test'], apiTestEnv);
run('pnpm', ['--filter', '@agrimarket/mobile', 'test']);
run('pnpm', ['lint']);
run('pnpm', ['typecheck']);
run('pnpm', ['build']);
run('git', ['diff', '--check']);

console.log('\n✅ RELEASE GATE PASS');
console.log('✅ API E2E + Mobile tests + lint + typecheck + build + diff-check đều PASS.');
