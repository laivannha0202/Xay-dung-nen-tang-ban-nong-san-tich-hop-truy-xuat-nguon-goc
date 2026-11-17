/**
 * AgriMarket local verification — replacement for the removed GitHub Actions CI.
 * Everything runs on this machine against the real PostgreSQL and the real API tests.
 *
 *   pnpm verify:local                        all steps
 *   pnpm verify:local --skip-admin --skip-customer --skip-expo
 *
 * Exit code 1 if any step fails; a skipped step is printed as PASS (--skip …), never silent.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ROOT = resolve(fileURLToPath(new URL('../../..', import.meta.url)))
const args = process.argv.slice(2)
const skip = new Set(
  args.flatMap((a) => (a.startsWith('--skip-') ? [a.slice('--skip-'.length)] : [])),
)
const results = []

/** Word match so --skip-tests covers "api tests", --skip-expo covers both Expo steps. */
const skipped = (label) =>
  [...skip].some((s) => label.split(' ').includes(s)) || [...skip].some((s) => label.startsWith(s))

// Windows resolves pnpm/npx through .cmd shims, which need a shell; the shell then splits
// unquoted args, and this worktree path contains spaces. Build one quoted command line.
const isWin = process.platform === 'win32'
const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)

function run(label, cmd, argv, { cwd = ROOT, env } = {}) {
  if (skipped(label)) {
    results.push({ label, ok: true, note: 'skipped (--skip)' })
    return true
  }
  process.stdout.write(`\n=== ${label} ===\n`)
  const started = Date.now()
  const line = [cmd, ...argv].map(quote).join(' ')
  const r = isWin
    ? spawnSync(line, { cwd, stdio: 'inherit', env: { ...process.env, ...env }, shell: true })
    : spawnSync(cmd, argv, { cwd, stdio: 'inherit', env: { ...process.env, ...env } })
  const ok = r.status === 0
  results.push({ label, ok, note: `${((Date.now() - started) / 1000).toFixed(1)}s` })
  return ok
}

function fail(label, note) {
  results.push({ label, ok: false, note })
}

// 1. Environment configuration ------------------------------------------------
function checkEnv() {
  const envPath = resolve(ROOT, 'apps/api/.env')
  const example = resolve(ROOT, 'apps/api/.env.example')
  if (!existsSync(example)) return fail('env config', 'apps/api/.env.example missing')
  if (!existsSync(envPath)) return fail('env config', 'apps/api/.env missing (copy .env.example)')
  const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
  )
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((k) => !env[k])
  if (missing.length) return fail('env config', `missing ${missing.join(', ')}`)
  if (env.JWT_SECRET.length < 24) return fail('env config', 'JWT_SECRET shorter than 24 chars')
  results.push({ label: 'env config', ok: true, note: 'apps/api/.env valid' })
}

const TEST_URL = 'postgres://agri:agri@127.0.0.1:5544/agrimarket_test'

// 2 + 3. PostgreSQL reachable, isolated test database exists ------------------
async function checkDatabase() {
  const url = new URL(TEST_URL)
  const probe = new pg.Client({ connectionString: TEST_URL.replace(/\/[^/]+$/, '/postgres') })
  try {
    await probe.connect()
  } catch (e) {
    return fail('postgresql', `cannot connect on ${url.host}: ${e.message}`)
  }
  try {
    const db = url.pathname.slice(1)
    const { rows } = await probe.query('SELECT 1 FROM pg_database WHERE datname = $1', [db])
    results.push({ label: 'postgresql', ok: true, note: `${url.host} reachable` })
    if (!rows.length) {
      return fail('test database', `${db} missing — run: pnpm db:up`)
    }
    if (!/_test$/.test(db)) return fail('test database', `${db} does not look like a test database`)
    const test = new pg.Client({ connectionString: TEST_URL })
    await test.connect()
    const { rows: applied } = await test.query('SELECT COUNT(*)::int AS n FROM schema_migrations')
    await test.end()
    results.push({ label: 'test database', ok: true, note: `${db}, ${applied[0].n} migrations applied` })
  } finally {
    await probe.end()
  }
}

// 9. Secret scan over tracked + untracked (not ignored) files -----------------
function checkSecrets() {
  const list = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  if (list.status !== 0) return fail('secret scan', 'git ls-files failed — is this a git checkout?')
  const files = list.stdout.split('\0').filter(Boolean)
  const patterns = [
    ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['aws key', /\bAKIA[0-9A-Z]{16}\b/],
    ['stripe live key', /\bsk_live_[0-9a-zA-Z]{24,}/],
    ['smtp/generic secret', /\b(?:api[_-]?key|client[_-]?secret|password)\s*[:=]\s*['"][^'"\s]{16,}['"]/i],
  ]
  const hits = []
  for (const f of files) {
    if (f === 'pnpm-lock.yaml' || f.endsWith('.png') || f.endsWith('.pdf') || f.endsWith('.docx')) continue
    if (!existsSync(resolve(ROOT, f))) continue
    let text
    try {
      text = readFileSync(resolve(ROOT, f), 'utf8')
    } catch {
      continue
    }
    for (const [name, re] of patterns) {
      const m = text.match(re)
      if (m) hits.push(`${f}: ${name} -> ${m[0].slice(0, 60)}`)
    }
  }
  const committedEnv = files.filter((f) => /(^|\/)\.env$/.test(f))
  if (committedEnv.length) hits.push(`.env staged for commit: ${committedEnv.join(', ')}`)
  if (hits.length) return fail('secret scan', hits.join('\n    '))
  results.push({ label: 'secret scan', ok: true, note: `${files.length} files clean` })
}

checkEnv()
await checkDatabase()
run('typecheck', 'pnpm', ['-r', 'typecheck'])
run('api tests', 'pnpm', ['test'])
run('admin build', 'pnpm', ['--filter', '@agrimarket/admin-web', 'build'])
run('customer build', 'pnpm', ['--filter', '@agrimarket/customer-web', 'build'])
const expoOut = resolve(ROOT, '.verify/expo-web')
run('expo typecheck', 'pnpm', ['--filter', '@agrimarket/mobile', 'typecheck']) &&
  run('expo export', 'npx', ['--no-install', 'expo', 'export', '--platform', 'web', '--output-dir', expoOut], {
    cwd: resolve(ROOT, 'apps/customer-mobile'),
  })
rmSync(expoOut, { recursive: true, force: true })
checkSecrets()

const failed = results.filter((r) => !r.ok)
console.log('\n=== summary ===')
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label.padEnd(16)} ${r.note ?? ''}`)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
