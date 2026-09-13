'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(
  __dirname,
  '../../..',
);

function read(relativePath) {
  return fs.readFileSync(
    path.join(
      repoRoot,
      relativePath,
    ),
    'utf8',
  );
}

function trackedFiles() {
  const output =
    childProcess.execFileSync(
      'git',
      [
        'ls-files',
        '-z',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      },
    );

  return output
    .split('\0')
    .filter(Boolean);
}

function isTextFile(relativePath) {
  return !/\.(?:png|jpe?g|gif|webp|ico|zip|gz|pdf|mp4|mov|woff2?|ttf|eot)$/i
    .test(relativePath);
}

function safeReadTracked(relativePath) {
  const fullPath = path.join(
    repoRoot,
    relativePath,
  );

  try {
    return fs.readFileSync(
      fullPath,
      'utf8',
    );
  } catch {
    return '';
  }
}

test(
  'Repository does not track real env files or private-key material',
  () => {
    const files = trackedFiles();

    const badEnvFiles =
      files.filter(
        (file) =>
          /(^|\/)\.env(?:\..+)?$/.test(
            file,
          )
          && !file.endsWith(
            '.env.example',
          ),
      );

    assert.deepEqual(
      badEnvFiles,
      [],
      `Tracked env files: ${badEnvFiles.join(', ')}`,
    );

    const privateKeyHits = [];

    for (
      const file
      of files
    ) {
      if (!isTextFile(file)) {
        continue;
      }

      const content =
        safeReadTracked(file);

      if (
        content.includes(
          ("-----BEGIN " + "PRIVATE KEY-----"),
        )
        || content.includes(
          ("-----BEGIN RSA " + "PRIVATE KEY-----"),
        )
        || content.includes(
          ("-----BEGIN EC " + "PRIVATE KEY-----"),
        )
      ) {
        privateKeyHits.push(file);
      }
    }

    assert.deepEqual(
      privateKeyHits,
      [],
      `Tracked private keys: ${privateKeyHits.join(', ')}`,
    );
  },
);

test(
  'Tracked text files do not contain common high-confidence secret tokens',
  () => {
    const files = trackedFiles();

    const patterns = [
      {
        name: 'GitHub token',
        regex:
          /\b(?:ghp|github_pat)_[A-Za-z0-9_](20,)\b/g,
      },
      {
        name: 'OpenAI key',
        regex:
          /\bsk-[A-Za-z0-9_-](20,)\b/g,
      },
      {
        name: 'AWS access key',
        regex:
          /\bAKIA[0-9A-Z]{16}\b/g,
      },
      {
        name: 'Stripe live secret',
        regex:
          /\bsk_live_[A-Za-z0-9]{16,}\b/g,
      },
    ];

    const hits = [];

    for (
      const file
      of files
    ) {
      if (!isTextFile(file)) {
        continue;
      }

      const content =
        safeReadTracked(file);

      for (
        const pattern
        of patterns
      ) {
        pattern.regex.lastIndex = 0;

        if (
          pattern.regex.test(
            content,
          )
        ) {
          hits.push(
            `${pattern.name}:${file}`,
          );
        }
      }
    }

    assert.deepEqual(
      hits,
      [],
      `Potential tracked secrets: ${hits.join(', ')}`,
    );
  },
);

test(
  'Sensitive env variables are not committed with non-placeholder values',
  () => {
    const files =
      trackedFiles();

    const assignment =
      /^\s*(VNPAY_HASH_SECRET|EXPO_ACCESS_TOKEN|DATABASE_URL|JWT_SECRET)\s*=\s*(.+?)\s*$/gm;

    const bad = [];

    const placeholders = [
      '',
      'changeme',
      'change-me',
      'your-secret',
      'your-token',
      '<secret>',
      '<token>',
      'example',
      'replace-me',
    ];

    for (
      const file
      of files
    ) {
      if (!isTextFile(file)) {
        continue;
      }

      // Example env files intentionally contain local/sample connection
      // strings. High-confidence token/private-key scans still cover them.
      if (
        file.endsWith(
          '.env.example',
        )
      ) {
        continue;
      }

      const content =
        safeReadTracked(file);

      assignment.lastIndex = 0;

      for (
        const match
        of content.matchAll(
          assignment,
        )
      ) {
        const raw =
          (match[2] ?? '')
          .trim()
          .replace(
            /^['"]|['"]$/g,
            '',
          );

        const lower =
          raw.toLowerCase();

        const obviouslyPlaceholder =
          placeholders.includes(
            lower,
          )
          || lower.includes(
            'example',
          )
          || lower.includes(
            'your_',
          )
          || lower.includes(
            'your-',
          )
          || lower.includes(
            'xxx',
          )
          || lower.startsWith(
            '${',
          );

        if (
          raw
          && !obviouslyPlaceholder
        ) {
          bad.push(
            `${match[1]}:${file}`,
          );
        }
      }
    }

    assert.deepEqual(
      bad,
      [],
      `Sensitive env assignments: ${bad.join(', ')}`,
    );
  },
);

test(
  'Auth returnTo security regression remains covered',
  () => {
    const auth = read(
      'apps/mobile/src/lib/auth-navigation.ts',
    );

    const authTest = read(
      'apps/mobile/test/navigation-auth.test.cjs',
    );

    assert.equal(
      auth.includes(
        'chuanHoaReturnTo',
      ),
      true,
    );

    for (
      const marker
      of [
        '//evil.example/path',
        'https://evil.example',
        '/dang-nhap',
        '/dang-ky',
        '/quen-mat-khau',
        '513',
      ]
    ) {
      assert.equal(
        authTest.includes(
          marker,
        ),
        true,
        `Missing returnTo security case: ${marker}`,
      );
    }

    assert.equal(
      authTest.includes(
        'Fallback must reject backslash',
      ),
      true,
      'Backslash rejection assertion must remain covered',
    );

    assert.equal(
      authTest.includes(
        'hasControlCharacter',
      ),
      true,
    );
  },
);

test(
  'Mobile does not persist auth secrets through AsyncStorage or log obvious secret fields',
  () => {
    const srcRoot = path.join(
      repoRoot,
      'apps/mobile/src',
    );

    const stack = [srcRoot];
    const badStorage = [];
    const badLogs = [];

    while (stack.length) {
      const current = stack.pop();

      for (
        const entry
        of fs.readdirSync(
          current,
          { withFileTypes: true },
        )
      ) {
        const fullPath =
          path.join(
            current,
            entry.name,
          );

        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }

        if (
          !entry.isFile()
          || !/\.(?:ts|tsx)$/.test(
            entry.name,
          )
        ) {
          continue;
        }

        const relative =
          path.relative(
            repoRoot,
            fullPath,
          );

        const content =
          fs.readFileSync(
            fullPath,
            'utf8',
          );

        if (
          content.includes(
            'AsyncStorage',
          )
          && /(?:access|refresh|token|matKhau|password)/i
            .test(content)
        ) {
          badStorage.push(
            relative,
          );
        }

        for (
          const line
          of content.split('\n')
        ) {
          if (
            /console\.(?:log|debug|info)\s*\(/.test(
              line,
            )
            && /(?:accessToken|refreshToken|matKhau|password|secret)/i
              .test(line)
          ) {
            badLogs.push(
              `${relative}:${line.trim()}`,
            );
          }
        }
      }
    }

    assert.deepEqual(
      badStorage,
      [],
      `AsyncStorage auth-secret usage: ${badStorage.join(', ')}`,
    );

    assert.deepEqual(
      badLogs,
      [],
      `Secret logging: ${badLogs.join(', ')}`,
    );
  },
);

test(
  'Mobile raw fetch boundary allows only local asset URI conversion',
  () => {
    const srcRoot = path.join(
      repoRoot,
      'apps/mobile/src',
    );

    const stack = [srcRoot];
    const bad = [];

    while (stack.length) {
      const current = stack.pop();

      for (
        const entry
        of fs.readdirSync(
          current,
          { withFileTypes: true },
        )
      ) {
        const fullPath =
          path.join(
            current,
            entry.name,
          );

        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }

        if (
          !entry.isFile()
          || !/\.(?:ts|tsx)$/.test(
            entry.name,
          )
        ) {
          continue;
        }

        const relative =
          path.relative(
            repoRoot,
            fullPath,
          );

        const content =
          fs.readFileSync(
            fullPath,
            'utf8',
          );

        for (
          const line
          of content.split('\n')
        ) {
          if (
            /\bfetch\s*\(/.test(
              line,
            )
            && !/fetch\s*\(\s*asset\.uri\s*\)/.test(
              line,
            )
          ) {
            bad.push(
              `${relative}:${line.trim()}`,
            );
          }
        }
      }
    }

    assert.deepEqual(
      bad,
      [],
      `Unexpected Mobile fetch(): ${bad.join(' | ')}`,
    );
  },
);

test(
  'Payment return screen verifies backend state instead of trusting deep-link status',
  () => {
    const result = read(
      'apps/mobile/src/app/thanh-toan/ket-qua.tsx',
    );

    assert.equal(
      /(?:lay|use).*ThanhToan|thanhToan.*query|refetch/i
        .test(result),
      true,
      'Payment result must query/refetch backend payment state',
    );

    assert.equal(
      /params\.(?:status|trangThai)\s*===?\s*['"](?:SUCCESS|PAID|DA_THANH_TOAN)/i
        .test(result),
      false,
      'Payment result must not trust success from URL params',
    );
  },
);

test(
  'Push tap/deep-link handling validates an internal allowlisted path before routing',
  () => {
    const ts = require(
      'typescript',
    );

    const sourceText = read(
      'apps/mobile/src/lib/thong-bao-push.ts',
    );

    const sourceFile =
      ts.createSourceFile(
        'thong-bao-push.ts',
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );

    function walk(
      node,
      visitor,
    ) {
      visitor(node);

      ts.forEachChild(
        node,
        (child) => {
          walk(
            child,
            visitor,
          );
        },
      );
    }

    function findFunction(
      name,
    ) {
      let found = null;

      walk(
        sourceFile,
        (node) => {
          if (
            found
            || !ts.isFunctionDeclaration(
              node,
            )
            || node.name?.text !== name
          ) {
            return;
          }

          found = node;
        },
      );

      return found;
    }

    function unwrapExpression(
      node,
    ) {
      let current = node;

      while (
        current
        && (
          ts.isAsExpression(
            current,
          )
          || ts.isTypeAssertionExpression(
            current,
          )
          || ts.isParenthesizedExpression(
            current,
          )
          || ts.isNonNullExpression(
            current,
          )
        )
      ) {
        current =
          current.expression;
      }

      return current;
    }

    function propertyPath(
      node,
    ) {
      const current =
        unwrapExpression(
          node,
        );

      if (!current) {
        return null;
      }

      if (
        ts.isIdentifier(
          current,
        )
      ) {
        return current.text;
      }

      if (
        ts.isPropertyAccessExpression(
          current,
        )
      ) {
        const left =
          propertyPath(
            current.expression,
          );

        return left
          ? `${left}.${current.name.text}`
          : null;
      }

      return null;
    }

    function isCallNamed(
      node,
      name,
    ) {
      return (
        ts.isCallExpression(
          node,
        )
        && ts.isIdentifier(
          node.expression,
        )
        && node.expression.text === name
      );
    }

    function routerMethod(
      node,
    ) {
      if (
        !ts.isCallExpression(
          node,
        )
        || !ts.isPropertyAccessExpression(
          node.expression,
        )
        || !ts.isIdentifier(
          node.expression.expression,
        )
        || node.expression.expression.text !== 'router'
      ) {
        return null;
      }

      const method =
        node.expression.name.text;

      return [
        'push',
        'replace',
        'navigate',
      ].includes(
        method,
      )
        ? method
        : null;
    }

    const sanitizer =
      findFunction(
        'laDeepLinkNoiBoAnToan',
      );

    const parser =
      findFunction(
        'phanTichDuLieuThongBaoPush',
      );

    const handler =
      findFunction(
        'moThongBaoTheoDeepLink',
      );

    assert.notEqual(
      sanitizer,
      null,
      'Push deep-link sanitizer must exist',
    );

    assert.notEqual(
      parser,
      null,
      'Push notification parser must exist',
    );

    assert.notEqual(
      handler,
      null,
      'Push notification handler must exist',
    );

    const sanitizerLiterals =
      new Set();

    let usesAllowlist =
      false;

    walk(
      sanitizer,
      (node) => {
        if (
          ts.isStringLiteral(
            node,
          )
        ) {
          sanitizerLiterals.add(
            node.text,
          );
        }

        if (
          ts.isIdentifier(
            node,
          )
          && node.text
            === 'DUONG_DAN_NOI_BO_CHO_PHEP'
        ) {
          usesAllowlist =
            true;
        }
      },
    );

    assert.equal(
      sanitizerLiterals.has(
        '//',
      ),
      true,
      'Protocol-relative URLs must be rejected',
    );

    assert.equal(
      sanitizerLiterals.has(
        '://',
      ),
      true,
      'External schemes must be rejected',
    );

    assert.equal(
      usesAllowlist,
      true,
      'Push deep links must use the internal route allowlist',
    );

    let sanitizerCall =
      null;

    walk(
      parser,
      (node) => {
        if (
          sanitizerCall
          || !isCallNamed(
            node,
            'laDeepLinkNoiBoAnToan',
          )
        ) {
          return;
        }

        if (
          propertyPath(
            node.arguments[0],
          )
          === 'data.deepLink'
        ) {
          sanitizerCall =
            node;
        }
      },
    );

    assert.notEqual(
      sanitizerCall,
      null,
      'Parser must validate data.deepLink with laDeepLinkNoiBoAnToan',
    );

    let parserCall =
      null;

    let parsedRouterCall =
      null;

    const rawRouterCalls =
      [];

    walk(
      handler,
      (node) => {
        if (
          !parserCall
          && isCallNamed(
            node,
            'phanTichDuLieuThongBaoPush',
          )
        ) {
          parserCall =
            node;
        }

        const method =
          routerMethod(
            node,
          );

        if (!method) {
          return;
        }

        const path =
          propertyPath(
            node.arguments[0],
          );

        if (
          method === 'push'
          && path
            === 'payload.deepLink'
        ) {
          parsedRouterCall =
            node;
          return;
        }

        if (
          path
          && (
            path.startsWith(
              'data.',
            )
            || path.startsWith(
              'notification.',
            )
            || path.startsWith(
              'response.',
            )
          )
        ) {
          rawRouterCalls.push(
            `${method}:${path}`,
          );
        }
      },
    );

    assert.notEqual(
      parserCall,
      null,
      'Notification handler must parse notification payload',
    );

    assert.notEqual(
      parsedRouterCall,
      null,
      'Notification handler must route only payload.deepLink',
    );

    assert.equal(
      parserCall.getStart(
        sourceFile,
      )
      < parsedRouterCall.getStart(
        sourceFile,
      ),
      true,
      'Notification payload must be parsed before router.push',
    );

    assert.deepEqual(
      rawRouterCalls,
      [],
      `Raw notification deepLink routed directly: ${rawRouterCalls.join(', ')}`,
    );
  },
);

test(
  'Mobile CI is read-only, secret-free and runs security validator',
  () => {
    const workflow = read(
      '.github/workflows/mobile-ci.yml',
    );

    assert.equal(
      workflow.includes(
        'permissions:\n  contents: read',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'secrets.',
      ),
      false,
    );

    assert.equal(
      workflow.includes(
        'pnpm --filter @agrimarket/mobile security:validate',
      ),
      true,
    );

    assert.equal(
      /(?:contents|actions|packages): write/.test(
        workflow,
      ),
      false,
    );
  },
);

test(
  'Maestro E2E flows do not embed credentials',
  () => {
    const maestroRoot =
      path.join(
        repoRoot,
        'apps/mobile/.maestro',
      );

    const bad = [];

    for (
      const name
      of fs.readdirSync(
        maestroRoot,
      )
    ) {
      if (!name.endsWith('.yml')) {
        continue;
      }

      const content =
        fs.readFileSync(
          path.join(
            maestroRoot,
            name,
          ),
          'utf8',
        );

      if (
        /(?:password|secret|access[_-]?token|refresh[_-]?token)\s*:/i
          .test(content)
      ) {
        bad.push(name);
      }
    }

    assert.deepEqual(
      bad,
      [],
      `Credential-bearing Maestro flows: ${bad.join(', ')}`,
    );
  },
);
