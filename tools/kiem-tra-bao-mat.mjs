/**
 * KIỂM TRA BẢO MẬT DEPENDENCY — chặn CVE mới trước khi vào main.
 *
 * Vì sao cần
 * ----------
 * Trước khi có script này, `pnpm audit` KHÔNG được chạy ở bất kỳ đâu trong
 * release gate hay CI. Hệ quả đo được:
 *   - `next` 16.3.3 (RCE trong `next/og` ImageResponse) và `nodemailer` 8.0.11
 *     (đọc file tùy ý + SSRF qua mail reset mật khẩu) nằm trong cây phụ thuộc
 *     production mà không ai bị chặn.
 *   - Bản ghi duy nhất là `docs/evidence/final-defense/audit-security.txt` — một
 *     dump thô ghim tại commit `9b37014`, không có ngày, không có tổng kết, và
 *     đọc lên như con số hiện hành thì sai.
 *
 * Chốt
 * ----
 * 1. `critical` hoặc `high` còn tồn tại -> FAIL, không có ngoại lệ.
 * 2. `moderate` -> FAIL trừ khi advisory nằm trong `PHEP_MODERATE` kèm lý do
 *    viết tường minh. Muốn thêm phải sửa file này có bình luận => có người
 *    review, không phải im lặng nuốt.
 * 3. Báo cáo được ghi ra `docs/evidence/security/` kèm ngày + commit HEAD để
 *    luôn có con số MỚI NHẤT bên cạnh bản ghi lịch sử.
 *
 * Chạy tay: `node tools/kiem-tra-bao-mat.mjs`
 * Chạy trong CI: đã nối vào `tools/release-gate.mjs` (và qua đó là release CI).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const thuMucBaoCao = resolve(rootDir, 'docs/evidence/security');

/**
 * Moderate được phép tồn tại. Mỗi dòng PHẢI kèm lý do đọc được — thêm mục mới
 * mà không có lý do là regression của chính script này.
 *
 * `GHSA-vcc3-ghjq-m6fr` (decode-uri-component ReDoS):
 *   Đã thử override lên 0.5.0 và BỊ BẾ TẮT có chủ ý. Bản 0.5.0 khai báo
 *   `"type": "module"` và chỉ export `default`; `query-string` (kéo bởi
 *   expo-router) lại dùng CommonJS `require('decode-uri-component')` rồi gọi
 *   như function → `TypeError: decodeComponent is not a function` ngay khi Expo
 *   CLI build. Advisory chỉ nằm trên tooling build, không có mặt trên đường
 *   request của app. Chi tiết: `pnpm-workspace.yaml` (mục override).
 */
const PHEP_MODERATE = new Map([
  [
    'GHSA-vcc3-ghjq-m6fr',
    'decode-uri-component ReDoS — chỉ trong Expo CLI build tooling; override 0.5.0 sẽ phá query-string (ESM-only default export)',
  ],
]);

const BAC = { critical: 4, high: 3, moderate: 2, low: 1, info: 0 };

function docLenHienTai() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'khong-xac-dinh';
  }
}

function chayAudit() {
  // `pnpm audit` exit code khác 0 khi có phát hiện, nên bỏ qua status.
  try {
    const raw = execFileSync('pnpm', ['audit', '--json'], {
      cwd: rootDir,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
    });
    return JSON.parse(raw);
  } catch (error) {
    // pnpm audit trả JSON trên stdout rồi exit 1 -> lỗi là Error có .stdout.
    const stdout = error?.stdout;
    if (typeof stdout === 'string' && stdout.trim().startsWith('{')) {
      return JSON.parse(stdout);
    }
    throw new Error(
      'Không đọc được output của `pnpm audit`. Kiểm tra mạng/registry trước khi kết luận an toàn.',
      { cause: error },
    );
  }
}

const audit = chayAudit();
const advisories = Object.values(audit.advisories ?? {});
const dem = audit.metadata?.vulnerabilities ?? {};

// Đường prod (không phải devDependencies) được tính riêng: advisory chỉ nằm ở
// dev toolchain thì rủi ro thấp hơn nhiều, và báo cáo phải nói rõ điều đó.
const phanLoai = (advisory) =>
  advisory.findings.some((finding) => !finding.dev) ? 'production' : 'dev-tooling';

const sapXep = advisories
  .map((advisory) => ({
    id: advisory.github_advisory_id,
    severity: advisory.severity,
    module: advisory.module_name,
    vulnerable: advisory.vulnerable_versions,
    patched: advisory.patched_versions,
    phạmVi: phanLoai(advisory),
    title: advisory.title,
  }))
  .sort(
    (a, b) =>
      (BAC[b.severity] ?? 0) - (BAC[a.severity] ?? 0) || a.module.localeCompare(b.module),
  );

const chan = sapXep.filter((item) => item.severity === 'critical' || item.severity === 'high');
const moderateBiBo = sapXep.filter(
  (item) => item.severity === 'moderate' && !PHEP_MODERATE.has(item.id),
);
const moderateDuocPhep = sapXep.filter(
  (item) => item.severity === 'moderate' && PHEP_MODERATE.has(item.id),
);

// ---------------------------------------------------------------- báo cáo
const commit = docLenHienTai();
const ngay = new Date().toISOString().slice(0, 10);

const dongAdvisory = (item) =>
  `| ${item.severity.toUpperCase()} | \`${item.module}\` | ${item.vulnerable} | ${item.patched} | ${item.phạmVi} | ${item.id} |`;

const baoCao = `# Báo cáo dependency security (sinh tự động)

> **ĐỪNG sửa tay file này.** Nó được ghi đè bởi
> \`node tools/kiem-tra-bao-mat.mjs\`, vốn chạy trong \`pnpm release:gate\`.
> Bản ghi lịch sử (audit tại một commit cụ thể) nằm ở
> \`docs/evidence/final-defense/audit-security.txt\`.

| | |
|---|---|
| Sinh lúc | ${ngay} |
| HEAD | \`${commit}\` |
| critical | ${dem.critical ?? 0} |
| high | ${dem.high ?? 0} |
| moderate | ${dem.moderate ?? 0} |
| low | ${dem.low ?? 0} |
| Tổng phụ thuộc | ${audit.metadata?.totalDependencies ?? 'n/a'} |

## Chi tiết

${
  sapXep.length === 0
    ? '_Không có advisory nào._'
    : ['| Mức | Package | Dính lỗi | Đã vá | Phạm vi | Advisory |', '|---|---|---|---|---|---|', ...sapXep.map(dongAdvisory)].join('\n')
}

## Moderate được chấp nhận có chủ ý

${
  moderateDuocPhep.length === 0
    ? '_Không có._'
    : moderateDuocPhep.map((item) => `- **\`${item.id}\`** (\`${item.module}\`): ${PHEP_MODERATE.get(item.id)}`).join('\n')
}
`;

const baoCaoFinal = baoCao;

mkdirSync(thuMucBaoCao, { recursive: true });
writeFileSync(resolve(thuMucBaoCao, 'audit-hien-tai.md'), baoCaoFinal, 'utf8');

console.log(`🛡  Bảo cáo dependency security đã ghi: docs/evidence/security/audit-hien-tai.md`);
console.log(`   critical=${dem.critical ?? 0} high=${dem.high ?? 0} moderate=${dem.moderate ?? 0} low=${dem.low ?? 0}`);

// -------------------------------------------------------------- kết luận
if (chan.length > 0) {
  console.error('\n❌ Còn advisory critical/high:');
  for (const item of chan) {
    console.error(
      `   - [${item.severity.toUpperCase()}] ${item.module} (${item.vulnerable} -> ${item.patched}) ` +
        `${item.id} [${item.phạmVi}]`,
    );
  }
  console.error(
    '\n   Nâng version trực tiếp, hoặc thêm `overrides` trong pnpm-workspace.yaml ' +
      '(chỉ nâng trong CÙNG major; ghi rõ lý do cạnh override).',
  );
  process.exit(1);
}

if (moderateBiBo.length > 0) {
  console.error('\n❌ Moderate mới chưa được giải trình:');
  for (const item of moderateBiBo) {
    console.error(`   - ${item.module} (${item.vulnerable} -> ${item.patched}) ${item.id}`);
  }
  console.error(
    '\n   Hoặc nâng version, hoặc nếu không nâng được thì thêm id vào PHEP_MODERATE ' +
      'trong tools/kiem-tra-bao-mat.mjs KÈM lý do cụ thể (bắt buộc có người review).',
  );
  process.exit(1);
}

console.log('✅ Không có advisory critical/high, mọi moderate đều có giải trình.');
