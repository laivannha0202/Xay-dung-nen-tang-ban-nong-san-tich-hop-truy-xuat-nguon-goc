import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolsDir, '..');

const pkgJsonPath = path.join(repoRoot, 'package.json');
const readmePath = path.join(repoRoot, 'README.md');
const mobileDocPath = path.join(repoRoot, 'docs', 'MOBILE-APP.md');

const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const pkgScripts = pkg.scripts || {};

const readmeContent = fs.readFileSync(readmePath, 'utf8');
const mobileDocContent = fs.readFileSync(mobileDocPath, 'utf8');

let errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
    console.error(`❌ ${message}`);
  } else {
    console.log(`✓ ${message}`);
  }
}

console.log('Testing Documentation Command Contract...');
console.log('=========================================');

// 1. Verify root scripts mentioned as `pnpm <script>` in README exist in package.json
const ignoreTokens = new Set(['install', 'add', 'remove', 'exec', 'run', 'dlx', 'create']);
const readmePnpmMatches = Array.from(readmeContent.matchAll(/(?:^|[^\w@])pnpm\s+([a-zA-Z0-9_\-:]+)/g))
  .map(m => m[1])
  .filter(scriptName => !ignoreTokens.has(scriptName) && !/^\d+/.test(scriptName) && !scriptName.startsWith('--'));

const uniqueReadmeScripts = [...new Set(readmePnpmMatches)];

for (const script of uniqueReadmeScripts) {
  assert(
    Boolean(pkgScripts[script]),
    `Script 'pnpm ${script}' trong README tồn tại trong package.json`
  );
}

// 2. Verify files/links in README exist on disk
const readmeLinks = Array.from(readmeContent.matchAll(/\[.*?\]\(((\.\/)?(docs|packages|apps|tools)\/[^\s)#]+)/g))
  .map(m => m[1]);

for (const link of new Set(readmeLinks)) {
  const resolved = path.resolve(repoRoot, decodeURIComponent(link));
  assert(fs.existsSync(resolved), `File link từ README tồn tại: ${link}`);
}

// 3. Ensure docker-compose.yml is NOT mentioned as an existing file
assert(
  !readmeContent.includes('docker-compose.yml'),
  'README không liệt kê docker-compose.yml như file tồn tại trong repository'
);

assert(
  !readmeContent.toLowerCase().includes('docker compose up'),
  'README không chứa lệnh docker compose up'
);

// 4. Ensure MOBILE-APP.md does not reference non-existent scripts
assert(
  !mobileDocContent.includes('pnpm mobile:usb'),
  'MOBILE-APP.md không nhắc lệnh pnpm mobile:usb'
);

assert(
  !mobileDocContent.includes('pnpm dev:mobile:usb'),
  'MOBILE-APP.md không nhắc lệnh pnpm dev:mobile:usb'
);

// 5. Ensure docs/van-hanh-local.md exists and is consistent
const vanHanhLocal = path.join(repoRoot, 'docs', 'van-hanh-local.md');
assert(fs.existsSync(vanHanhLocal), 'docs/van-hanh-local.md tồn tại');

console.log('=========================================');
if (errors.length > 0) {
  console.error(`FAILED: ${errors.length} contract error(s) found.`);
  process.exit(1);
} else {
  console.log('✅ ALL DOCUMENTATION CONTRACT CHECKS PASSED');
  process.exit(0);
}
