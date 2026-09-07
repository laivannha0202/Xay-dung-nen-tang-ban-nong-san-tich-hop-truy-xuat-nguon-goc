/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

function loadTsModule(relativePath) {
  const filename = path.resolve(
    __dirname,
    relativePath,
  );

  const source = fs.readFileSync(
    filename,
    'utf8',
  );

  let output = ts.transpileModule(
    source,
    {
      compilerOptions: {
        target:
          ts.ScriptTarget.ES2022,
        module:
          ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        verbatimModuleSyntax:
          false,
      },
      fileName: filename,
      reportDiagnostics: true,
    },
  ).outputText;

  // Các module được test chỉ dùng expo-router cho type.
  // Nếu transpile còn giữ require, mock bằng object rỗng để Node Linux
  // không phải boot React Native runtime.
  output = output.replace(
    /require\((['"])expo-router\1\)/g,
    '{}',
  );

  const loaded = new Module(
    filename,
    module,
  );

  loaded.filename = filename;
  loaded.paths =
    Module._nodeModulePaths(
      path.dirname(filename),
    );

  loaded._compile(
    output,
    filename,
  );

  return loaded.exports;
}


function hasControlCharacter(value) {
  return Array.from(
    value,
  ).some((character) => {
    const code =
      character.charCodeAt(0);

    return (
      code <= 31
      || code === 127
    );
  });
}

const auth = loadTsModule(
  '../src/lib/auth-navigation.ts',
);

const navigation =
  loadTsModule(
    '../src/lib/navigation-mobile.ts',
  );

test(
  'chuanHoaReturnTo accepts safe internal routes',
  () => {
    assert.equal(
      auth.chuanHoaReturnTo(
        '/gio-hang',
      ),
      '/gio-hang',
    );

    assert.equal(
      auth.chuanHoaReturnTo(
        '/don-hang/abc-123',
      ),
      '/don-hang/abc-123',
    );

    assert.equal(
      auth.chuanHoaReturnTo(
        '/thanh-toan?source=cart',
      ),
      '/thanh-toan?source=cart',
    );
  },
);

test(
  'chuanHoaReturnTo normalizes absent or unsafe values to a safe internal fallback',
  () => {
    const invalidValues = [
      undefined,
      null,
      '',
      '   ',
      'gio-hang',
      '//evil.example/path',
      'https://evil.example',
      '/go://evil.example',
      '/abc\\def',
      '/dang-nhap',
      '/dang-ky',
      '/quen-mat-khau',
      '/abc\u0000def',
      `/${'a'.repeat(513)}`,
    ];

    for (
      const value
      of invalidValues
    ) {
      const normalized =
        auth.chuanHoaReturnTo(
          value,
        );

      assert.equal(
        typeof normalized,
        'string',
        `Expected string fallback for: ${String(value)}`,
      );

      assert.equal(
        normalized.startsWith('/'),
        true,
        `Fallback must be internal: ${normalized}`,
      );

      assert.equal(
        normalized.startsWith('//'),
        false,
        `Fallback must reject protocol-relative route: ${normalized}`,
      );

      assert.equal(
        normalized.includes('://'),
        false,
        `Fallback must reject external scheme: ${normalized}`,
      );

      assert.equal(
        normalized.includes('\\'),
        false,
        `Fallback must reject backslash: ${normalized}`,
      );

      assert.equal(
        hasControlCharacter(
          normalized,
        ),
        false,
        `Fallback must reject control characters: ${JSON.stringify(normalized)}`,
      );

      assert.equal(
        [
          '/dang-nhap',
          '/dang-ky',
          '/quen-mat-khau',
        ].includes(
          normalized,
        ),
        false,
        `Fallback must not loop into auth route: ${normalized}`,
      );

      if (
        typeof value === 'string'
        && value.length > 0
      ) {
        const definitelyUnsafe =
          !value.startsWith('/')
          || value.startsWith('//')
          || value.includes('://')
          || value.includes('\\')
          || hasControlCharacter(
            value,
          )
          || [
            '/dang-nhap',
            '/dang-ky',
            '/quen-mat-khau',
          ].includes(value)
          || value.length > 512;

        if (definitelyUnsafe) {
          assert.notEqual(
            normalized,
            value,
            `Unsafe returnTo must not survive unchanged: ${JSON.stringify(value)}`,
          );
        }
      }
    }
  },
);

test(
  'quayLaiHoacVe uses router.back when history exists',
  () => {
    const calls = [];

    const router = {
      canGoBack: () => true,
      back: () => {
        calls.push('back');
      },
      navigate: (href) => {
        calls.push(
          `navigate:${href}`,
        );
      },
      replace: (href) => {
        calls.push(
          `replace:${href}`,
        );
      },
    };

    navigation.quayLaiHoacVe(
      router,
      '/kham-pha',
    );

    assert.deepEqual(
      calls,
      ['back'],
    );
  },
);

test(
  'quayLaiHoacVe replaces with fallback when history is empty',
  () => {
    const calls = [];

    const router = {
      canGoBack: () => false,
      back: () => {
        calls.push('back');
      },
      navigate: (href) => {
        calls.push(
          `navigate:${href}`,
        );
      },
      replace: (href) => {
        calls.push(
          `replace:${href}`,
        );
      },
    };

    navigation.quayLaiHoacVe(
      router,
      '/don-hang',
    );

    assert.deepEqual(
      calls,
      ['replace:/don-hang'],
    );
  },
);

test(
  'moTabChinh uses navigate instead of push semantics',
  () => {
    const calls = [];

    const router = {
      canGoBack: () => false,
      back: () => {
        calls.push('back');
      },
      navigate: (href) => {
        calls.push(
          `navigate:${href}`,
        );
      },
      replace: (href) => {
        calls.push(
          `replace:${href}`,
        );
      },
    };

    navigation.moTabChinh(
      router,
      '/kham-pha',
    );

    assert.deepEqual(
      calls,
      ['navigate:/kham-pha'],
    );
  },
);
