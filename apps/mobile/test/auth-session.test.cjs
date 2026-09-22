'use strict';

/**
 * Sprint: Mobile Session Persistence — Regression Tests.
 * Tests cho: secure-token, phien-xac-thuc, api-error, api-xac-thuc, dang-nhap.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

const repoRoot = path.resolve(__dirname, '../../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function loadTsModule(relativePath) {
  const filename = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      verbatimModuleSyntax: false,
    },
    fileName: filename,
    reportDiagnostics: true,
  }).outputText;

  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(output, filename);

  return loaded.exports;
}

function withMocks(mocks, fn) {
  const originalLoad = Module._load;
  const mockKeys = Object.keys(mocks);
  Module._load = function (request) {
    if (mockKeys.includes(request)) return mocks[request];
    return originalLoad.apply(this, arguments);
  };
  try {
    return fn();
  } finally {
    Module._load = originalLoad;
  }
}

// ---------- Source-contract tests ----------

test('secure-token.ts dùng localStorage/sessionStorage trên web (không chỉ RAM)', () => {
  const src = read('apps/mobile/src/lib/secure-token.ts');
  assert.equal(src.includes('window.localStorage'), true);
  assert.equal(src.includes('window.sessionStorage'), true);
  assert.equal(src.includes('isBrowserAvailable'), true);
  assert.equal(src.includes('typeof window'), true);
});

test('secure-token.ts luuRefreshToken nhận tham số ghiNho', () => {
  const src = read('apps/mobile/src/lib/secure-token.ts');
  assert.equal(src.includes('luuRefreshToken(token: string, ghiNho?: boolean)'), true);
});

test('secure-token.ts lưu mode theo ghiNho (local/session)', () => {
  const src = read('apps/mobile/src/lib/secure-token.ts');
  assert.equal(src.includes("'local'"), true);
  assert.equal(src.includes("'session'"), true);
  assert.equal(src.includes('ghiNho === true'), true);
});

test('secure-token.ts xóa cả localStorage và sessionStorage khi logout', () => {
  const src = read('apps/mobile/src/lib/secure-token.ts');
  assert.equal(src.includes('window.localStorage.removeItem'), true);
  assert.equal(src.includes('window.sessionStorage.removeItem'), true);
});

test('secure-token.ts có persistence mode metadata key', () => {
  const src = read('apps/mobile/src/lib/secure-token.ts');
  assert.equal(src.includes('PERSISTENCE_MODE_KEY'), true);
  assert.equal(src.includes('agrimarket.mobile.persistence-mode'), true);
});

test('phien-xac-thuc.ts dangNhapMobile nhận tham số ghiNho', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes('dangNhapMobile(email: string, matKhau: string, ghiNho?: boolean)'), true);
});

test('phien-xac-thuc.ts apDungToken truyền ghiNho vào luuRefreshToken', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes('luuRefreshToken(response.refreshToken, ghiNho)'), true);
});

test('phien-xac-thuc.ts refresh không truyền ghiNho (dùng mode đã lưu)', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  const refreshCall = src.match(/apDungToken\(response as TokenResponse\)/);
  assert.ok(refreshCall, 'Refresh phải gọi apDungToken(response)');
  assert.equal(src.indexOf('apDungToken(response as TokenResponse), ghiNho'), -1);
});

test('dang-nhap.tsx truyền ghiNho vào dangNhapMobile', () => {
  const src = read('apps/mobile/src/app/(auth)/dang-nhap.tsx');
  assert.equal(src.includes('dangNhapMobile(taiKhoan.trim().toLowerCase(), matKhau, ghiNho)'), true);
});

test('dang-nhap.tsx label là "Email" KHÔNG phải "Email hoặc số điện thoại"', () => {
  const src = read('apps/mobile/src/app/(auth)/dang-nhap.tsx');
  assert.equal(src.includes('label="Email"'), true);
  assert.equal(src.includes('label="Email hoặc số điện thoại"'), false);
});

test('dang-nhap.tsx placeholder là "Nhập email" KHÔNG phải "Nhập email hoặc số điện thoại"', () => {
  const src = read('apps/mobile/src/app/(auth)/dang-nhap.tsx');
  assert.equal(src.includes('placeholder="Nhập email"'), true);
  assert.equal(src.includes('placeholder="Nhập email hoặc số điện thoại"'), false);
});

test('dang-nhap.tsx dùng thongBaoLoiXacThuc(error, login) cho login', () => {
  const src = read('apps/mobile/src/app/(auth)/dang-nhap.tsx');
  assert.equal(src.includes("thongBaoLoiXacThuc(error, 'login')"), true);
});

test('dang-nhap.tsx validation message KHÔNG nhắc số điện thoại', () => {
  const src = read('apps/mobile/src/app/(auth)/dang-nhap.tsx');
  assert.equal(src.includes('Vui lòng nhập email và mật khẩu.'), true);
  assert.equal(src.includes('Vui lòng nhập email hoặc số điện thoại'), false);
});

test('api-xac-thuc.ts thongBaoLoiXacThuc nhận context login', () => {
  const src = read('apps/mobile/src/lib/api-xac-thuc.ts');
  assert.equal(src.includes("thongBaoLoiXacThuc(error: unknown, context?: 'login')"), true);
});

test('api-xac-thuc.ts truyền context vào thongBaoLoiApi', () => {
  const src = read('apps/mobile/src/lib/api-xac-thuc.ts');
  assert.equal(src.includes('context,'), true);
  assert.equal(src.includes("thongBaoLoiApi("), true);
});

test('api-error.ts chuanHoaLoiApi nhận context parameter', () => {
  const src = read('apps/mobile/src/lib/api-error.ts');
  assert.equal(
    src.includes("chuanHoaLoiApi(error: unknown, fallback?: string, context?: 'login' | 'default')"),
    true,
  );
});

test('api-error.ts login 401 trả message credentials', () => {
  const src = read('apps/mobile/src/lib/api-error.ts');
  assert.equal(src.includes('Email hoặc mật khẩu không chính xác.'), true);
  assert.equal(src.includes("context === 'login'"), true);
});

test('api-error.ts protected 401 vẫn là hết phiên', () => {
  const src = read('apps/mobile/src/lib/api-error.ts');
  assert.equal(src.includes('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'), true);
});

// ---------- Functional tests: api-error.ts ----------

const apiError = loadTsModule('../src/lib/api-error.ts');

test('Login 401 (context=login) → "Email hoặc mật khẩu không chính xác."', () => {
  const error = { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  const result = apiError.chuanHoaLoiApi(error, undefined, 'login');
  assert.equal(result.thongDiep, 'Email hoặc mật khẩu không chính xác.');
  assert.equal(result.loai, 'unauthorized');
});

test('Login 401 no backend message (context=login) → default credentials message', () => {
  const error = { status: 401 };
  const result = apiError.chuanHoaLoiApi(error, undefined, 'login');
  assert.equal(result.thongDiep, 'Email hoặc mật khẩu không chính xác.');
});

test('Login 401 with different backend message (context=login) → dùng backend message', () => {
  const error = { status: 401, message: 'Tài khoản bị khóa.' };
  const result = apiError.chuanHoaLoiApi(error, undefined, 'login');
  assert.equal(result.thongDiep, 'Tài khoản bị khóa.');
});

test('Protected API 401 (context=default) → "Phiên đăng nhập đã hết hạn..."', () => {
  const error = { status: 401, message: 'Token expired' };
  const result = apiError.chuanHoaLoiApi(error, undefined, 'default');
  assert.equal(result.thongDiep, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
});

test('Protected API 401 (no context) → "Phiên đăng nhập đã hết hạn..."', () => {
  const error = { status: 401, message: 'Token expired' };
  const result = apiError.chuanHoaLoiApi(error);
  assert.equal(result.thongDiep, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
});

test('thongBaoLoiApi login context → credentials message', () => {
  const error = { status: 401, message: 'Email hoặc mật khẩu không chính xác.' };
  const result = apiError.thongBaoLoiApi(error, 'Fallback', 'login');
  assert.equal(result, 'Email hoặc mật khẩu không chính xác.');
});

test('thongBaoLoiApi default context → session message', () => {
  const error = { status: 401 };
  const result = apiError.thongBaoLoiApi(error, 'Fallback');
  assert.equal(result, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
});

test('thongBaoLoiApi với error không phải 401 không bị ảnh hưởng bởi context', () => {
  const error = { status: 403 };
  const result = apiError.thongBaoLoiApi(error, 'Fallback', 'login');
  assert.equal(result, 'Bạn không có quyền thực hiện thao tác này.');
});

test('network error vẫn là network message bất kể context', () => {
  const error = { message: 'Failed to fetch' };
  const result = apiError.chuanHoaLoiApi(error, undefined, 'login');
  assert.equal(result.loai, 'network');
  assert.equal(result.status, null);
});

// ---------- Functional tests: secure-token.ts ----------

const mockSecureStore = {
  setItemAsync: async () => {},
  getItemAsync: async () => null,
  deleteItemAsync: async () => {},
};

const mockReactNative = { Platform: { OS: 'web' } };

test('secure-token.ts on Android/iOS dùng SecureStore', async () => {
  withMocks(
    { 'expo-secure-store': mockSecureStore, 'react-native': mockReactNative },
    () => {
      mockReactNative.Platform.OS = 'android';
      return loadTsModule('../src/lib/secure-token.ts');
    },
  );

  let setItemCalled = false;
  const ssMock = {
    setItemAsync: async () => { setItemCalled = true; },
    getItemAsync: async () => null,
    deleteItemAsync: async () => {},
  };

  // Override with actual mock calls
  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') return ssMock;
    if (request === 'react-native') return { Platform: { OS: 'android' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken: luu } = loadTsModule('../src/lib/secure-token.ts');

    await luu('native-token');
    assert.equal(setItemCalled, true);

    let getItemResult = null;
    const ssGet = {
      setItemAsync: async () => {},
      getItemAsync: async () => getItemResult,
      deleteItemAsync: async () => {},
    };
    Module._load = function (request) {
      if (request === 'expo-secure-store') return ssGet;
      if (request === 'react-native') return { Platform: { OS: 'android' } };
      return originalLoad.apply(this, arguments);
    };

    try {
      const mod = loadTsModule('../src/lib/secure-token.ts');
      getItemResult = 'native-token';
      const token = await mod.docRefreshToken();
      assert.equal(token, 'native-token');
      await mod.xoaRefreshToken();
    } finally {
      Module._load = originalLoad;
    }
  } finally {
    Module._load = originalLoad;
  }
});

test('secure-token.ts on web ghiNho=true → localStorage mode', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken, xoaRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('web-local-token', true);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'web-local-token');

    const token = await docRefreshToken();
    assert.equal(token, 'web-local-token');

    await xoaRefreshToken();
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], undefined);
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('secure-token.ts on web ghiNho=false → sessionStorage mode', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken, xoaRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('web-session-token', false);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], 'web-session-token');
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'web-session-token');

    await xoaRefreshToken();
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], undefined);
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('secure-token.ts refresh rotation ghi token mới cùng storage mode', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    // Login with remember=true → localStorage
    await luuRefreshToken('token-old', true);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');

    // Simulate refresh: token rotated, ghiNho undefined → use stored mode
    await luuRefreshToken('token-new');
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'token-new');

    // F5 simulation: read from storage
    const token = await docRefreshToken();
    assert.equal(token, 'token-new');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('secure-token.ts F5 reload simulation: token persist qua storage', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('persisted-token', true);
    assert.equal(await docRefreshToken(), 'persisted-token');

    // Simulate second call (post-reload): fresh module, memory cache empty, read from storage
    const { docRefreshToken: docRefreshToken2 } = loadTsModule('../src/lib/secure-token.ts');
    const token = await docRefreshToken2();
    assert.equal(token, 'persisted-token');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('secure-token.ts logout xóa cả localStorage và sessionStorage', async () => {
  const originalWindow = global.window;
  const storage = {
    'agrimarket.mobile.refresh-token': 'some-token',
    'agrimarket.mobile.persistence-mode': 'local',
    'session:agrimarket.mobile.refresh-token': 'session-token',
  };
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { xoaRefreshToken } = loadTsModule('../src/lib/secure-token.ts');
    await xoaRefreshToken();
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], undefined);
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], undefined);
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('secure-token.ts trên web mặc định session (ghiNho undefined)', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('default-token');
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');

    const token = await docRefreshToken();
    assert.equal(token, 'default-token');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B1: ghiNho=false overrides local mode → session, localStorage null', async () => {
  const originalWindow = global.window;
  const storage = {
    'agrimarket.mobile.refresh-token': 'old-local-token',
    'agrimarket.mobile.persistence-mode': 'local',
    'session:agrimarket.mobile.refresh-token': 'old-session-token',
  };
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('new-token', false);

    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], 'new-token');
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'new-token');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B2: ghiNho=true overrides session mode → local, sessionStorage null', async () => {
  const originalWindow = global.window;
  const storage = {
    'agrimarket.mobile.refresh-token': 'old-session-token',
    'agrimarket.mobile.persistence-mode': 'session',
    'session:agrimarket.mobile.refresh-token': 'old-session-token',
  };
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    await luuRefreshToken('new-token', true);

    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'new-token');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'new-token');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B3: Login remember=false after remember=true → false wins mode', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    // First login: remember=true → local
    await luuRefreshToken('token-1', true);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'token-1');

    // Second login: remember=false → session (must override)
    await luuRefreshToken('token-2', false);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], 'token-2');
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'token-2');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B4: Login remember=true after session → true wins mode', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    // First login: remember=false → session
    await luuRefreshToken('token-1', false);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], 'token-1');

    // Second login: remember=true → local (must override)
    await luuRefreshToken('token-2', true);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'token-2');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'token-2');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B5: Refresh rotation preserves mode (local stays local)', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    // Login: remember=true → local
    await luuRefreshToken('token-old', true);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');

    // Refresh: ghiNho undefined → preserve local
    await luuRefreshToken('token-new');
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'local');
    assert.equal(storage['agrimarket.mobile.refresh-token'], 'token-new');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'token-new');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

test('B5b: Refresh rotation preserves mode (session stays session)', async () => {
  const originalWindow = global.window;
  const storage = {};
  global.window = {
    localStorage: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; },
    },
    sessionStorage: {
      getItem: (key) => storage['session:' + key] ?? null,
      setItem: (key, value) => { storage['session:' + key] = value; },
      removeItem: (key) => { delete storage['session:' + key]; },
    },
  };

  const originalLoad = Module._load;
  Module._load = function (request) {
    if (request === 'expo-secure-store') {
      return { setItemAsync: async () => {}, getItemAsync: async () => null, deleteItemAsync: async () => {} };
    }
    if (request === 'react-native') return { Platform: { OS: 'web' } };
    return originalLoad.apply(this, arguments);
  };

  try {
    const { luuRefreshToken, docRefreshToken } = loadTsModule('../src/lib/secure-token.ts');

    // Login: remember=false → session
    await luuRefreshToken('token-old', false);
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');

    // Refresh: ghiNho undefined → preserve session
    await luuRefreshToken('token-new');
    assert.equal(storage['agrimarket.mobile.persistence-mode'], 'session');
    assert.equal(storage['session:agrimarket.mobile.refresh-token'], 'token-new');
    assert.equal(storage['agrimarket.mobile.refresh-token'], undefined);

    const token = await docRefreshToken();
    assert.equal(token, 'token-new');
  } finally {
    Module._load = originalLoad;
    global.window = originalWindow;
  }
});

// ---------- Functional tests: phien-xac-thuc.ts (source inspection) ----------

test('phien-xac-thuc.ts source: single-flight lamMoiPromise preserved', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes('lamMoiPromise'), true);
  assert.equal(src.includes('lamMoiPhienMobile'), true);
});

test('phien-xac-thuc.ts source: dangXuatMobile xóa SecureStore/localStorage/sessionStorage', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes('xoaRefreshToken()'), true);
  assert.equal(src.includes('xoaHanhDongSauDangNhap()'), true);
  assert.equal(src.includes("datChuaDangNhap('dang-xuat')"), true);
});

test('phien-xac-thuc.ts source: refresh 401 xóa refresh token', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes('status === 400 || status === 401 || status === 403'), true);
  assert.equal(src.includes('await xoaRefreshToken()'), true);
});

test('phien-xac-thuc.ts source: network/5xx không xóa refresh token', () => {
  const src = read('apps/mobile/src/lib/phien-xac-thuc.ts');
  assert.equal(src.includes("datChuaDangNhap('loi-ket-noi')"), true);
  assert.equal(src.includes('// Network / 5xx'), true);
});

// ---------- Session restore state tests ----------

const authStore = loadTsModule('../src/stores/xac-thuc.store.ts');

test('Store initial state là dang-khoi-phuc', () => {
  authStore.useXacThucStore.setState({ trangThai: 'dang-khoi-phuc', nguoiDung: null, lyDoChuaDangNhap: null });
  assert.equal(authStore.useXacThucStore.getState().trangThai, 'dang-khoi-phuc');
});

test('datDaDangNhap đặt trạng thái da-dang-nhap', () => {
  authStore.useXacThucStore.setState({ trangThai: 'dang-khoi-phuc', nguoiDung: null, lyDoChuaDangNhap: null });
  authStore.datDaDangNhap({ id: '1', email: 'test@example.com', hoTen: 'Test' });
  assert.equal(authStore.useXacThucStore.getState().trangThai, 'da-dang-nhap');
});

test('datChuaDangNhap đặt trạng thái chua-dang-nhap', () => {
  authStore.useXacThucStore.setState({ trangThai: 'dang-khoi-phuc', nguoiDung: null, lyDoChuaDangNhap: null });
  authStore.datChuaDangNhap('chua-co-phien');
  assert.equal(authStore.useXacThucStore.getState().trangThai, 'chua-dang-nhap');
  assert.equal(authStore.useXacThucStore.getState().lyDoChuaDangNhap, 'chua-co-phien');
});

// Reset store
authStore.useXacThucStore.setState({ trangThai: 'dang-khoi-phuc', nguoiDung: null, lyDoChuaDangNhap: null });
