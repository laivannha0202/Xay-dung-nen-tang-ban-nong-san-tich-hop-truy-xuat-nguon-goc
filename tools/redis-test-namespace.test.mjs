/**
 * Test cô lập Redis cho đường chạy test.
 *
 * Chạy bằng `node --test tools/redis-test-namespace.test.mjs`.
 *
 * Test dùng client Redis GIẢ có bộ key thật + ngữ nghĩa SCAN/UNLINK thật, nên
 * hermetic: không cần Redis server, không chạm dữ liệu dev, và vẫn chứng minh
 * đúng ba điều quan trọng nhất:
 *   1. namespace dev KHÔNG bị xoá;
 *   2. namespace test ĐƯỢC xoá hết;
 *   3. không lệnh `FLUSHALL` / `FLUSHDB` / `KEYS` nào được phát ra.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BULLMQ_PREFIX_TEST_MAC_DINH,
  REDIS_NAMESPACE_TEST_MAC_DINH,
  REDIS_PREFIX_TEST_MAC_DINH,
  chanLenhNguyHiem,
  chonPrefixTest,
  donRedisChoTest,
  envTestCoLapRedis,
  laNamespaceGocHopLe,
  layNamespaceGocTest,
  xoaNamespaceRedis,
} from './redis-test-namespace.mjs';

const LENH_BI_GOI = [];

/**
 * Client Redis giả: SCAN phân trang + UNLINK/DEL xoá thật khỏi Map key.
 *
 * SCAN phân trang theo một DANH SÁCH KEY ỔN ĐỊNH chụp lần đầu. Nếu phân trang theo
 * chỉ số vào danh sách tính lại mỗi lần, việc UNLINK xoá key giữa chừng sẽ làm
 * lệch chỉ số và BỎ SÓT key — tức làm test thành xanh giả. Redis thật cũng có
 * tính chất yếu tương tự (SCAN chỉ bảo đảm key còn tồn tại suốt lần duyệt sẽ
 * được trả về ít nhất một lần).
 */
function taoClientGia(keyTheoTen = {}, { soMoiMoiLan = 2 } = {}) {
  const khoa = new Map(Object.entries(keyTheoTen));
  let anhChup = null;

  const client = {
    async scan(cursor, ...thuocTinh) {
      LENH_BI_GOI.push(['scan', cursor, ...thuocTinh]);

      if (anhChup === null) anhChup = [...khoa.keys()];

      const index = Number(cursor);
      const pattern = thuocTinh[1];
      const regex = new RegExp(
        `^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
      );

      const batDau = index * soMoiMoiLan;
      const trang = anhChup.slice(batDau, batDau + soMoiMoiLan);
      const cursorTiep = batDau + soMoiMoiLan >= anhChup.length ? '0' : String(index + 1);

      return [cursorTiep, trang.filter((k) => regex.test(k))];
    },
    async unlink(...danhSach) {
      LENH_BI_GOI.push(['unlink', ...danhSach]);
      for (const k of danhSach) khoa.delete(k);
      return danhSach.length;
    },
    async del(...danhSach) {
      LENH_BI_GOI.push(['del', ...danhSach]);
      for (const k of danhSach) khoa.delete(k);
      return danhSach.length;
    },
  };

  chanLenhNguyHiem(client, 'clientGia');
  client.xemKey = () => [...khoa.keys()];

  return client;
}

function reset() {
  LENH_BI_GOI.length = 0;
}

// --- laNamespaceGocHopLe ------------------------------------------------------

test('laNamespaceGocHopLe chỉ nhận namespace GỐC có chữ "test" ở giữa', () => {
  assert.equal(REDIS_NAMESPACE_TEST_MAC_DINH, 'agrimarket:test:');
  assert.equal(laNamespaceGocHopLe('agrimarket:test:'), true);
  assert.equal(laNamespaceGocHopLe('am-test-e2e/'), true);
  assert.equal(laNamespaceGocHopLe('agrimarket:test'), false, 'phải có separator sau "test"');
  assert.equal(laNamespaceGocHopLe('mytest:'), false, 'phải có separator trước "test"');
  assert.equal(laNamespaceGocHopLe('testing:'), false, '"testing" khác "test"');
});

test('laNamespaceGocHopLe từ chối prefix dùng chung với DEV', () => {
  assert.equal(laNamespaceGocHopLe('agrimarket:cache:'), false);
  assert.equal(laNamespaceGocHopLe('agrimarket:bull'), false);
});

test('laNamespaceGocHopLe từ chối namespace GỐC là tiền tố của namespace dev', () => {
  // Chốt quan trọng nhất: `agrimarket:` thoả mọi điều kiện khác, nhưng xoá nó
  // là xoá sạch cache của máy dev (`agrimarket:cache:` bắt đầu bằng nó).
  assert.equal(laNamespaceGocHopLe('agrimarket:'), false);
  assert.equal(laNamespaceGocHopLe('agrimarket'), false);
});

test('laNamespaceGocHopLe từ chối rác', () => {
  assert.equal(laNamespaceGocHopLe(''), false);
  assert.equal(laNamespaceGocHopLe('*'), false);
  assert.equal(laNamespaceGocHopLe(undefined), false);
  assert.equal(laNamespaceGocHopLe(null), false);
});

test('layNamespaceGocTest mặc định và cho phép đổi qua env', () => {
  assert.equal(layNamespaceGocTest({}), REDIS_NAMESPACE_TEST_MAC_DINH);
  assert.equal(
    layNamespaceGocTest({ AGRIMARKET_REDIS_TEST_NAMESPACE: '  ' }),
    REDIS_NAMESPACE_TEST_MAC_DINH,
  );
  assert.equal(
    layNamespaceGocTest({ AGRIMARKET_REDIS_TEST_NAMESPACE: 'am-test-e2e/' }),
    'am-test-e2e/',
  );
});

// --- chonPrefixTest / envTestCoLapRedis ---------------------------------------

test('chưa cấu hình -> dùng prefix test mặc định', () => {
  assert.equal(REDIS_PREFIX_TEST_MAC_DINH, 'agrimarket:test:cache:');
  assert.equal(BULLMQ_PREFIX_TEST_MAC_DINH, 'agrimarket:test:bull');

  const env = envTestCoLapRedis({});
  assert.equal(env.REDIS_PREFIX, REDIS_PREFIX_TEST_MAC_DINH);
  assert.equal(env.BULLMQ_PREFIX, BULLMQ_PREFIX_TEST_MAC_DINH);
});

test('prefix lấy từ .env dev BỊ ÉP sang prefix test (đây là bug nhiễm Redis dev)', () => {
  const env = envTestCoLapRedis({
    REDIS_PREFIX: 'agrimarket:cache:',
    BULLMQ_PREFIX: 'agrimarket:bull',
  });

  assert.equal(env.REDIS_PREFIX, REDIS_PREFIX_TEST_MAC_DINH);
  assert.equal(env.BULLMQ_PREFIX, BULLMQ_PREFIX_TEST_MAC_DINH);
});

test('namespace do CI đặt tường minh (agrimarket:ci:release) được giữ nguyên', () => {
  const env = envTestCoLapRedis({ BULLMQ_PREFIX: 'agrimarket:ci:release' });
  assert.equal(env.BULLMQ_PREFIX, 'agrimarket:ci:release');
});

test('biến rieng *_TEST thắng tuyệt đối', () => {
  const env = envTestCoLapRedis({
    REDIS_PREFIX: 'agrimarket:ci:',
    REDIS_PREFIX_TEST: 'agrimarket:test:cache:ci-abc',
  });

  assert.equal(env.REDIS_PREFIX, 'agrimarket:test:cache:ci-abc');
});

test('chonPrefixTest cắt khoảng trắng', () => {
  assert.equal(
    chonPrefixTest(
      { REDIS_PREFIX: '  agrimarket:ci:  ' },
      'REDIS_PREFIX',
      'REDIS_PREFIX_TEST',
      'x',
    ),
    'agrimarket:ci:',
  );
  assert.equal(
    chonPrefixTest(
      { REDIS_PREFIX: ' agrimarket:cache: ' },
      'REDIS_PREFIX',
      'REDIS_PREFIX_TEST',
      'x',
    ),
    'x',
  );
});

// --- xoaNamespaceRedis --------------------------------------------------------

test('xoaNamespaceRedis xoá đúng key test, giữ nguyên key dev', async () => {
  reset();

  const client = taoClientGia({
    'agrimarket:test:cache:cau-hinh-he-thong:v1': '1',
    'agrimarket:test:cache:quyen:v2': '2',
    'agrimarket:test:bull:email:events': '3',
    'agrimarket:cache:cau-hinh-he-thong:v1': 'dev',
    'agrimarket:bull:email:id': 'dev',
  });

  const daXoa = await xoaNamespaceRedis(client, 'agrimarket:test:');

  assert.equal(daXoa, 3);
  assert.deepEqual(client.xemKey().sort(), [
    'agrimarket:bull:email:id',
    'agrimarket:cache:cau-hinh-he-thong:v1',
  ]);
});

test('xoaNamespaceRedis ném lỗi khi namespace không phải gốc của test', async () => {
  reset();

  const client = taoClientGia({ 'agrimarket:cache:x': '1' });

  await assert.rejects(
    () => xoaNamespaceRedis(client, 'agrimarket:cache:'),
    /TỪ CHỐI xoá namespace/,
  );
  await assert.rejects(() => xoaNamespaceRedis(client, 'agrimarket:'), /TỪ CHỐI xoá namespace/);

  assert.deepEqual(client.xemKey(), ['agrimarket:cache:x'], 'phải giữ nguyên key dev');
});

test('dùng UNLINK, không dùng DEL (không chặn Redis server)', async () => {
  reset();

  const client = taoClientGia({ 'agrimarket:test:bull:email:id': '1' });

  await xoaNamespaceRedis(client, 'agrimarket:test:');

  assert.ok(LENH_BI_GOI.some(([lenh]) => lenh === 'unlink'));
  assert.ok(!LENH_BI_GOI.some(([lenh]) => lenh === 'del'));
});

// --- donRedisChoTest ----------------------------------------------------------

test('donRedisChoTest dọn namespace GỐC nên bao trọn mọi prefix con theo PID', async () => {
  reset();

  const client = taoClientGia({
    'agrimarket:test:cache:a': '1',
    'agrimarket:test:bull:email:events': '2',
    // Đây chính là key thật đo được trên máy dev trước khi sửa:
    // release-gate / api-client-sync / run-ngang đều tự đặt prefix theo PID.
    'agrimarket:test:release:18244:email:events': '3',
    'agrimarket:test:full:inventory-reservation:het-han-01a0': '4',
    'agrimarket:test:ps:4812:inventory-reservation:het-han-01a1': '5',
    'agrimarket:test:regress:system-job:id': '6',
    'agrimarket:test:api-sync:999:email:id': '7',
    'agrimarket:cache:a': 'dev',
    'agrimarket:bull:email:id': 'dev',
    'khac:gia:tri': 'dev',
  });

  const { daXoa, boQua } = await donRedisChoTest(client, {});

  assert.equal(daXoa, 7);
  assert.deepEqual(boQua, []);
  assert.deepEqual(client.xemKey().sort(), [
    'agrimarket:bull:email:id',
    'agrimarket:cache:a',
    'khac:gia:tri',
  ]);
});

test('donRedisChoTest GIỮ NGUYÊN namespace dev (cache + BullMQ dev)', async () => {
  reset();

  const client = taoClientGia({
    'agrimarket:cache:cau-hinh-he-thong:v1': '{"thoiHanKhieuNaiNgay":7}',
    'agrimarket:cache:quyen-quan-tri:v1': 'dev',
    'agrimarket:bull:email:id': 'dev',
    'agrimarket:bull:thong-bao:events': 'dev',
    'agrimarket:test:cache:a': '1',
  });

  const { daXoa } = await donRedisChoTest(client, {});

  assert.equal(daXoa, 1);
  assert.deepEqual(client.xemKey().sort(), [
    'agrimarket:bull:email:id',
    'agrimarket:bull:thong-bao:events',
    'agrimarket:cache:cau-hinh-he-thong:v1',
    'agrimarket:cache:quyen-quan-tri:v1',
  ]);
});

test('runner test KHÔNG bao giờ phát lệnh FLUSHALL / FLUSHDB / KEYS', async () => {
  reset();

  const client = taoClientGia({
    'agrimarket:test:cache:a': '1',
    'agrimarket:test:bull:email:id': '2',
  });

  await donRedisChoTest(client, {});

  const lenhNguyHiem = LENH_BI_GOI.filter(([lenh]) =>
    ['flushall', 'flushdb', 'keys'].includes(lenh),
  );
  assert.deepEqual(lenhNguyHiem, [], `phát lệnh nguy hiểm: ${JSON.stringify(lenhNguyHiem)}`);

  // Và client thật sự chặn được nếu ai đó gọi nhầm.
  assert.throws(() => client.flushall(), /lệnh Redis nguy hiểm "flushall"/);
  assert.throws(() => client.flushdb(), /lệnh Redis nguy hiểm "flushdb"/);
  assert.throws(() => client.keys('*'), /lệnh Redis nguy hiểm "keys"/);
});

test('namespace CI nằm ngoài gốc test bị bỏ qua kèm lý do, không xoá gì', async () => {
  reset();

  const client = taoClientGia({
    'agrimarket:ci:release:email:events': '1',
    'agrimarket:test:cache:a': '2',
  });

  const { daXoa, boQua } = await donRedisChoTest(client, {
    BULLMQ_PREFIX: 'agrimarket:ci:release',
  });

  assert.equal(daXoa, 1, 'vẫn dọn được namespace gốc của test');
  assert.deepEqual(boQua, [
    {
      namespace: 'agrimarket:ci:release',
      lyDo: 'không thuộc namespace gốc của test — bỏ qua (an toàn)',
    },
  ]);
  assert.ok(client.xemKey().includes('agrimarket:ci:release:email:events'));
});
