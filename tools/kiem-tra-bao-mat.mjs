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
 * 1. `critical` còn tồn tại -> FAIL, không có ngoại lệ.
 * 2. `high` -> FAIL trừ khi advisory nằm trong `PHEP_HIGH` kèm hồ sơ
 *    ACCEPTED TEMPORARY BUILD/TOOLING RISK viết tường minh (GHSA, package,
 *    chain, lý do chưa có fix upstream, classification tooling, bằng chứng
 *    không nằm runtime business/request path, mitigation, điều kiện xóa,
 *    ngày review). Chỉ match chính xác advisory ID — không wildcard, không
 *    tắt audit, không giảm level.
 * 3. `moderate` -> FAIL trừ khi advisory nằm trong `PHEP_MODERATE` kèm lý do
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
const PHEP_HIGH = new Map([
  [
    'GHSA-vfj7-8cjw-p6xm',
    [
      'Trạng thái: ACCEPTED TEMPORARY BUILD/TOOLING RISK (không phải "đã sửa").',
      'Package: braces@3.0.3, severity HIGH.',
      'Chain: apps/api > jest@29.7.0 (devDependencies) > jest-message-util/micromatch > braces@3.0.3; ' +
        'apps/mobile > expo > @expo/cli > @expo/metro-file-map > micromatch > braces@3.0.3 (100 paths, 100% qua micromatch>braces).',
      'Upstream: patched_versions=null, npm latest braces=3.0.3 — không có bản vá tương thích để nâng trực tiếp; ' +
        'override braces major khác phá micromatch/jest nên không ép version giả.',
      'Classification: build/test tooling (Jest glob matching, Metro file-map) — không nằm request/runtime API production path.',
      'Bằng chứng: grep import braces/micromatch trong apps/api/src + apps/mobile runtime = 0 hit; ' +
        'jest chỉ nằm devDependencies của apps/api; Metro file-map chỉ chạy lúc build.',
      'Phạm vi: máy dev + CI lúc chạy test/build.',
      'Mitigation: input brace pattern đến từ glob nội bộ tin cậy, request production không truyền user input vào braces.',
      'Điều kiện xóa: upstream phát hành braces đã vá + jest/micromatch nâng chain thì xóa exception và nâng version thật.',
      'Review lại: 2026-11-05.',
    ].join(' '),
  ],
  [
    'GHSA-86w9-cpqp-85rv',
    [
      'Trạng thái: ACCEPTED TEMPORARY BUILD/TOOLING RISK (không phải "đã sửa").',
      'Package: node-forge@1.4.0, severity HIGH (RSA PKCS#1 v1.5 verification chấp nhận DigestAlgorithm lồng thừa).',
      'Chain: apps/mobile > expo > @expo/cli@57.0.27 > @expo/code-signing-certificates + @expo/cli trực tiếp > node-forge@1.4.0 ' +
        '(58 paths, 100% qua @expo/cli).',
      'Upstream: patched_versions=null, npm latest node-forge=1.4.0 — không có bản vá; ' +
        'không nâng Expo major tùy tiện để né advisory.',
      'Classification: Expo CLI build/code-signing tooling — không nằm JS runtime nghiệp vụ sau bundle.',
      'Bằng chứng: apps/mobile/package.json không direct dep node-forge/@expo/cli; ' +
        'grep import node-forge trong apps/api/src + apps/mobile runtime = 0 hit; ' +
        'node-forge chỉ dùng ở bước verify chứng chỉ code-signing lúc build/publish.',
      'Phạm vi: máy build mobile + CI lúc prebuild/publish.',
      'Mitigation: khai thác cần chữ ký giả đưa vào bước verify code-signing ở môi trường build tin cậy; ' +
        'app production không verify chữ ký bên thứ ba bằng node-forge lúc runtime.',
      'Điều kiện xóa: upstream phát hành node-forge đã vá + Expo CLI bump chain thì xóa exception và nâng version thật.',
      'Review lại: 2026-11-05.',
    ].join(' '),
  ],
]);

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

const criticalChan = sapXep.filter((item) => item.severity === 'critical');
const highBiChan = sapXep.filter(
  (item) => item.severity === 'high' && !PHEP_HIGH.has(item.id),
);
const highDuocPhep = sapXep.filter(
  (item) => item.severity === 'high' && PHEP_HIGH.has(item.id),
);
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

## RAW AUDIT (pnpm audit, chưa trừ exception)

Bảng chi tiết dưới là output thô — advisory vẫn tồn tại, không được coi là "đã sửa" hay "0 vulnerabilities".

## Chi tiết thô

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

## HIGH — ACCEPTED TEMPORARY BUILD/TOOLING RISK

${
  highDuocPhep.length === 0
    ? '_Không có._'
    : highDuocPhep.map((item) => `- **\`${item.id}\`** (\`${item.module}\` ${item.vulnerable}): ${PHEP_HIGH.get(item.id)}`).join('\n')
}

## POLICY RESULT (sau exception)

- Raw: critical=${dem.critical ?? 0} high=${dem.high ?? 0} moderate=${dem.moderate ?? 0} low=${dem.low ?? 0}.
- Accepted: HIGH ${highDuocPhep.length} (${highDuocPhep.map((item) => item.id).join(', ') || 'không có'}), moderate ${moderateDuocPhep.length}.
- Blocking còn lại: critical=${criticalChan.length} high-chưa-giải-trình=${highBiChan.length} moderate-chưa-giải-trình=${moderateBiBo.length}.
`;

const baoCaoFinal = baoCao;

mkdirSync(thuMucBaoCao, { recursive: true });
writeFileSync(resolve(thuMucBaoCao, 'audit-hien-tai.md'), baoCaoFinal, 'utf8');

console.log(`🛡  Bảo cáo dependency security đã ghi: docs/evidence/security/audit-hien-tai.md`);
console.log(`   critical=${dem.critical ?? 0} high=${dem.high ?? 0} moderate=${dem.moderate ?? 0} low=${dem.low ?? 0}`);

// -------------------------------------------------------------- kết luận
if (criticalChan.length > 0 || highBiChan.length > 0) {
  console.error('\n❌ Còn advisory critical/high chưa được giải trình:');
  for (const item of [...criticalChan, ...highBiChan]) {
    console.error(
      `   - [${item.severity.toUpperCase()}] ${item.module} (${item.vulnerable} -> ${item.patched}) ` +
        `${item.id} [${item.phạmVi}]`,
    );
  }
  console.error(
    '\n   Nâng version trực tiếp, hoặc thêm `overrides` trong pnpm-workspace.yaml ' +
      '(chỉ nâng trong CÙNG major; ghi rõ lý do cạnh override). ' +
      'HIGH chỉ được accept khi thêm id chính xác vào PHEP_HIGH kèm hồ sơ đầy đủ.',
  );
  process.exit(1);
}

if (highDuocPhep.length > 0) {
  console.log('\n⚠️  HIGH accepted temporary build/tooling risk (raw advisory vẫn tồn tại):');
  for (const item of highDuocPhep) {
    console.log(`   - [HIGH] ${item.module} (${item.vulnerable}) ${item.id} [${item.phạmVi}]`);
  }
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

console.log('✅ Không có advisory critical/high chưa giải trình; mọi moderate và HIGH còn lại đều có documented exception.');
