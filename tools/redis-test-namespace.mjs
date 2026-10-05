/**
 * CÔ LẬP REDIS CHO TEST — nguồn sự thật duy nhất cho prefix test.
 *
 * Vấn đề đo được trên máy dev (không phải phỏng đoán)
 * ----------------------------------------------------
 * `pnpm --filter @agrimarket/api test` chạy API trong đúng tiến trình Nest với
 * `REDIS_PREFIX` / `BULLMQ_PREFIX` lấy nguyên từ `.env`, tức là
 * `agrimarket:cache:` + `agrimarket:bull` — TRÙNG namespace dev. Một lần chạy
 * E2E để lại hàng nghìn key BullMQ/job/cache không TTL trong Redis mà máy dev
 * đang dùng. Đo trước khi sửa: 2302 key, 237 key nằm trong
 * `agrimarket:bull:*` (namespace dev), 2065 key `agrimarket:test:*` từ các
 * đường chạy đã cô lập (`release-gate`, `api-client-sync`).
 *
 * Nguyên tắc an toàn (fail-safe, không có ngoại lệ)
 * --------------------------------------------------
 * 1. TUYỆT ĐỐI không `FLUSHALL` / `FLUSHDB` — Redis local có thể đang giữ dữ
 *    liệu dev của người khác.
 * 2. TUYỆT ĐỐI không `KEYS *` — chặn server trên instance có nhiều dữ liệu.
 *    Chỉ `SCAN ... MATCH <namespace>*` rồi `UNLINK` theo lô.
 * 3. Chỉ xoá namespace có chữ `test` ở giữa (theo separator). Prefix dev
 *    `agrimarket:cache:` / `agrimarket:bull` bị TỪ CHỐI, không phải "cảnh báo
 *    rồi vẫn xoá".
 * 4. Namespace không phải test (ví dụ `agrimarket:ci:release` của CI) -> bỏ qua
 *    im lặng kèm log giải thích. Bỏ qua an toàn hơn xoá nhầm.
 * 5. `UNLINK` (Redis >= 4.0) để không chặn server; tự lùi về `DEL` nếu server
 *    cũ không biết lệnh.
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

/** Prefix CACHE mặc định khi chạy test. */
export const REDIS_PREFIX_TEST_MAC_DINH = 'agrimarket:test:cache:';

/** Prefix BullMQ mặc định khi chạy test. */
export const BULLMQ_PREFIX_TEST_MAC_DINH = 'agrimarket:test:bull';

/**
 * Namespace GỐC của test — phạm vi dọn thật sự.
 *
 * Phải là gốc chứ không phải từng prefix con, vì các đường chạy khác trong repo
 * tự đặt prefix riêng theo PID: `agrimarket:test:release:<pid>`,
 * `agrimarket:test:api-sync:<pid>`, `agrimarket:test:ps:<pid>`... Nếu chỉ dọn
 * `agrimarket:test:cache:` thì 2065 key vương lại từ các lần chạy đó không bao
 * giờ được dọn. Gốc `agrimarket:test:` bao trọn, và KHÔNG bao giờ chạm
 * `agrimarket:cache:` / `agrimarket:bull` (namespace dev).
 */
export const REDIS_NAMESPACE_TEST_MAC_DINH = 'agrimarket:test:';

/** Tên biến để đổi namespace gốc khi cần. */
export const TEN_BIEN_REDIS_NAMESPACE_TEST = 'AGRIMARKET_REDIS_TEST_NAMESPACE';

/**
 * Namespace dùng chung với DEV — cấm xoá. Đây đúng bằng giá trị fallback
 * trong `apps/api/src/redis/redis.service.ts` và `hang-doi.config.ts`, nên nếu
 * repo đổi fallback thì phải đổi cả ở đây.
 */
export const REDIS_PREFIX_DUNG_CHUNG = new Set(['agrimarket:cache:', 'agrimarket:bull']);

/** Các lệnh nguy hiểm — chỉ để tự kiểm, không bao giờ được gọi. */
const LENH_CAM = new Set(['flushall', 'flushdb', 'keys']);

/**
 * Namespace GỐC có an toàn để xoá không?
 *
 * Ba chốt, tất cả đều phải đạt:
 *   1. có `test` ở giữa hai separator (`:`, `-`, `_`, `/`) và có ký tự trước —
 *      để `agrimarket:cache:` (không có `test`) bị từ chối;
 *   2. không trùng bất kỳ prefix dùng chung với dev nào;
 *   3. KHÔNG phải tiền tố của một prefix dev — đây là chốt quan trọng nhất:
 *      namespace gốc `agrimarket:` thoả (1) và (2) nhưng là tiền tố của
 *      `agrimarket:cache:`, nên xoá nó là xoá sạch cache của máy dev.
 */
export function laNamespaceGocHopLe(namespace) {
  if (typeof namespace !== 'string') return false;

  const raw = namespace.trim();

  if (!raw || raw === '*') return false;
  if (REDIS_PREFIX_DUNG_CHUNG.has(raw)) return false;
  if (!/[:\-_/]$/.test(raw)) return false;
  if (!/[:\-_/]test[:\-_/]/.test(raw)) return false;

  return ![...REDIS_PREFIX_DUNG_CHUNG].some((dev) => raw.startsWith(dev));
}

/** Namespace gốc test đang dùng, đọc từ env (fallback mặc định). */
export function layNamespaceGocTest(env) {
  const raw = (env?.[TEN_BIEN_REDIS_NAMESPACE_TEST] ?? '').trim();
  return raw || REDIS_NAMESPACE_TEST_MAC_DINH;
}

/**
 * Chọn prefix cho đường chạy test.
 *
 * - `REDIS_PREFIX_TEST` / `BULLMQ_PREFIX_TEST` -> ưu tiên tuyệt đối.
 * - Biến chung (`REDIS_PREFIX` / `BULLMQ_PREFIX`) đã được đặt tường minh và
 *   KHÔNG phải prefix dev -> giữ nguyên (ví dụ CI đặt `agrimarket:ci:release`).
 * - Còn lại (chưa đặt, hoặc đang trỏ đúng prefix dev lấy từ `.env`) -> ép sang
 *   prefix test. Đây chính là chỗ chặn nhiễm Redis dev.
 */
export function chonPrefixTest(env, tenBienChung, tenBienRieng, macDinh) {
  const rieng = env[tenBienRieng];
  if (rieng && rieng.trim()) return rieng.trim();

  const chung = env[tenBienChung];
  if (chung && chung.trim() && !REDIS_PREFIX_DUNG_CHUNG.has(chung.trim())) {
    return chung.trim();
  }

  return macDinh;
}

/** Trả về env đã gắn prefix test (không mutate input). */
export function envTestCoLapRedis(env) {
  return {
    ...env,
    REDIS_PREFIX: chonPrefixTest(
      env,
      'REDIS_PREFIX',
      'REDIS_PREFIX_TEST',
      REDIS_PREFIX_TEST_MAC_DINH,
    ),
    BULLMQ_PREFIX: chonPrefixTest(
      env,
      'BULLMQ_PREFIX',
      'BULLMQ_PREFIX_TEST',
      BULLMQ_PREFIX_TEST_MAC_DINH,
    ),
  };
}

/**
 * Chọn prefix test có hậu tố PID cho một đường chạy gate (`release`, `api-sync`...).
 *
 * Cùng policy với `chonPrefixTest`, chỉ khác giá trị fallback:
 * - `*_TEST` đặt tường minh -> thắng tuyệt đối (giữ nguyên, không gắn PID);
 * - biến chung đã đặt tường minh và KHÔNG phải prefix dev -> giữ nguyên
 *   (ví dụ CI đặt `agrimarket:ci:release`);
 * - còn lại (chưa đặt, hoặc đang trỏ đúng prefix dev lấy từ `.env`) -> dùng
 *   `agrimarket:test:<nhan>:<pid>[...]` để hai lần chạy song song không va nhau.
 */
export function chonPrefixTestTheoPid(env, tenBienChung, tenBienRieng, macDinhTheoPid) {
  const rieng = env[tenBienRieng];
  if (rieng && rieng.trim()) return rieng.trim();

  const chung = env[tenBienChung];
  if (chung && chung.trim() && !REDIS_PREFIX_DUNG_CHUNG.has(chung.trim())) {
    return chung.trim();
  }

  return macDinhTheoPid;
}

/**
 * Trả về env test đã cô lập Redis/BullMQ cho một lần chạy gate (không mutate input).
 *
 * Khác `envTestCoLapRedis` ở chỗ fallback đã gắn `<nhan>:<pid>` cho CẢ HAI prefix,
 * nên hai PID khác nhau không bao giờ chung namespace — kể cả khi `.env` máy dev
 * đang đặt `BULLMQ_PREFIX=agrimarket:bull`. Mọi prefix fallback đều nằm dưới gốc
 * `agrimarket:test:` nên `donRedisChoTest` vẫn dọn được và `laNamespaceGocHopLe`
 * vẫn chấp nhận.
 */
export function envTestCoLapRedisChoGate(env, { nhan = 'release', pid = process.pid } = {}) {
  const tienTrinh = String(pid ?? process.pid).trim() || String(process.pid);
  return {
    ...env,
    REDIS_PREFIX: chonPrefixTestTheoPid(
      env,
      'REDIS_PREFIX',
      'REDIS_PREFIX_TEST',
      `agrimarket:test:${nhan}:${tienTrinh}:cache:`,
    ),
    BULLMQ_PREFIX: chonPrefixTestTheoPid(
      env,
      'BULLMQ_PREFIX',
      'BULLMQ_PREFIX_TEST',
      `agrimarket:test:${nhan}:${tienTrinh}`,
    ),
  };
}

/**
 * Xoá MỘT namespace bằng SCAN + UNLINK. Trả số key đã xoá.
 *
 * `client` chỉ cần có `scan` và (`unlink` hoặc `del`). Không dùng connection
 * có `keyPrefix`: pattern SCAN phải khớp trên key THẬT trong Redis.
 */
export async function xoaNamespaceRedis(client, namespace, { batchSize = 500, quyMo = null } = {}) {
  if (!laNamespaceGocHopLe(namespace)) {
    throw new Error(
      `TỪ CHỐI xoá namespace "${namespace}": không phải namespace gốc của test. ` +
        'Chỉ xoá prefix dạng "...:test:..." VÀ không phải tiền tố của namespace dev ' +
        'để không đụng dữ liệu máy dev.',
    );
  }

  const ghi = quyMo ?? (() => {});

  // UNLINK không chặn server; server cũ (< 4.0) không có lệnh này.
  let xoa = client.unlink?.bind(client);
  if (typeof xoa !== 'function') {
    xoa = client.del.bind(client);
  }

  let cursor = '0';
  let daXoa = 0;

  do {
    const [cursorTiep, khoa] = await client.scan(
      cursor,
      'MATCH',
      `${namespace}*`,
      'COUNT',
      batchSize,
    );

    cursor = String(cursorTiep);

    if (khoa.length > 0) {
      await xoa(...khoa);
      daXoa += khoa.length;
      ghi(`   - đã xoá ${khoa.length} key (${namespace}*)`);
    }
  } while (cursor !== '0');

  return daXoa;
}

/**
 * Dọn Redis namespace test.
 *
 * Phạm vi = namespace GỐC test (`agrimarket:test:`), nên bao trọn mọi prefix con
 * do các đường chạy khác tự đặt theo PID (`...:release:<pid>`, `...:ps:<pid>`...).
 * Prefix nào KHÔNG nằm dưới gốc (ví dụ `agrimarket:ci:release` của CI) được bỏ
 * qua kèm lý do — bỏ qua an toàn hơn xoá nhầm.
 *
 * Trả `{ daXoa, boQua: [{ namespace, lyDo }] }`.
 */
export async function donRedisChoTest(client, env, { quyMo = null } = {}) {
  const ghi = quyMo ?? (() => {});
  const goc = layNamespaceGocTest(env);
  const { REDIS_PREFIX, BULLMQ_PREFIX } = envTestCoLapRedis(env);

  const can = [goc];

  // Prefix nằm NGOÀI gốc test thì không tự dọn — chỉ báo lại để người đọc log
  // thấy rõ namespace nào được giữ lại.
  for (const ns of [REDIS_PREFIX, BULLMQ_PREFIX]) {
    if (!ns.startsWith(goc) && !can.includes(ns)) {
      can.push(ns);
    }
  }

  let daXoa = 0;
  const boQua = [];

  for (const ns of can) {
    if (ns === goc) {
      daXoa += await xoaNamespaceRedis(client, ns, { quyMo: ghi });
      continue;
    }

    if (!laNamespaceGocHopLe(ns)) {
      boQua.push({ namespace: ns, lyDo: 'không thuộc namespace gốc của test — bỏ qua (an toàn)' });
    }
  }

  if (!daXoa && !boQua.length) {
    ghi('   (không có key test nào để xoá)');
  }

  return { daXoa, boQua };
}

/** Mở kết nối ioredis thô (không `keyPrefix`) từ REDIS_URL. */
export async function moKetNoiRedis(redisUrl) {
  const { Redis } = require('ioredis');

  const client = new Redis(redisUrl, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 2,
    connectionName: 'agrimarket-test-cleanup',
  });

  await client.connect();

  return client;
}

/**
 * Bảo đảm không lọt lệnh nguy hiểm khi client bị thay thế.
 *
 * Ghi đè CẢ lệnh đang có lẫn lệnh chưa có: nếu sau này ai đó gọi nhầm
 * `client.flushall()`, phải ném lỗi ngay tại chỗ thay vì im lặng chạy trên
 * Redis dev.
 */
export function chanLenhNguyHiem(client, tenBien) {
  for (const ten of LENH_CAM) {
    client[ten] = () => {
      throw new Error(
        `[${tenBien}] Không được gọi lệnh Redis nguy hiểm "${ten}" trong đường chạy test.`,
      );
    };
  }

  return client;
}
// --- CLI ---------------------------------------------------------------------
// Chạy trực tiếp: `node tools/redis-test-namespace.mjs`
// Dùng sau khi chạy test để dọn key test mà máy dev còn vương.
const chayCli = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (chayCli) {
  const env = envTestCoLapRedis(process.env);
  const { REDIS_PREFIX, BULLMQ_PREFIX, REDIS_URL } = env;
  const goc = layNamespaceGocTest(env);

  console.log('🧹 Dọn Redis namespace test');
  console.log(`   Goc    : ${goc}`);
  console.log(`   Cache  : ${REDIS_PREFIX}`);
  console.log(`   BullMQ : ${BULLMQ_PREFIX}`);

  if (!REDIS_URL) {
    console.error('❌ Thiếu REDIS_URL. Không đoán cổng — hãy kiểm tra .env.');
    process.exit(2);
  }

  // Client thô, KHÔNG `keyPrefix`, và chặn sẵn lệnh nguy hiểm.
  const client = chanLenhNguyHiem(await moKetNoiRedis(REDIS_URL), 'redis-test-cleanup');

  try {
    const { daXoa, boQua } = await donRedisChoTest(client, env, {
      quyMo: (dong) => console.log(dong),
    });

    for (const bo of boQua) console.log(`⏭  Bỏ qua "${bo.namespace}": ${bo.lyDo}`);
    console.log(`✓ Đã xoá ${daXoa} key trong namespace test. Redis dev giữ nguyên.`);
  } finally {
    await client.quit();
  }
}
