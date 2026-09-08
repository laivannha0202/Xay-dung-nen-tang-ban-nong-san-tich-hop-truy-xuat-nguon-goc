'use strict';

const assert = require('node:assert/strict');
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

function readJson(relativePath) {
  return JSON.parse(
    read(relativePath),
  );
}

const WORKFLOW =
  '.github/workflows/mobile-ci.yml';

test(
  'Mobile CI uses repository runtime versions and frozen lockfile',
  () => {
    const workflow = read(
      WORKFLOW,
    );

    assert.equal(
      workflow.includes(
        'actions/checkout@v7',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'pnpm/setup@v2',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'version: 11.24.0',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'actions/setup-node@v7',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        "node-version: '24'",
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'pnpm install --frozen-lockfile',
      ),
      true,
    );
  },
);

test(
  'Mobile CI runs 019 and 020 deterministic gates',
  () => {
    const workflow = read(
      WORKFLOW,
    );

    const requiredCommands = [
      'pnpm api-client:ensure',
      'pnpm --filter @agrimarket/mobile test',
      'pnpm --filter @agrimarket/mobile e2e:validate',
      'pnpm --filter @agrimarket/mobile exec expo install --check',
      'pnpm --filter @agrimarket/mobile typecheck',
      'pnpm lint',
      'pnpm typecheck',
      'git diff --check',
    ];

    for (
      const command
      of requiredCommands
    ) {
      assert.equal(
        workflow.includes(
          command,
        ),
        true,
        `Missing CI command: ${command}`,
      );
    }
  },
);

test(
  'Mobile CI stays secret-free and does not trigger paid EAS or Maestro runtime',
  () => {
    const workflow = read(
      WORKFLOW,
    );

    const forbidden = [
      'secrets.',
      'EXPO_TOKEN',
      'EXPO_ACCESS_TOKEN',
      'google-services.json',
      'eas build',
      'eas workflow:run',
      'maestro test',
      'pnpm test',
    ];

    for (
      const marker
      of forbidden
    ) {
      assert.equal(
        workflow.includes(
          marker,
        ),
        false,
        `Forbidden CI marker: ${marker}`,
      );
    }
  },
);

test(
  'Mobile CI has least-privilege permissions and bounded runtime',
  () => {
    const workflow = read(
      WORKFLOW,
    );

    assert.equal(
      workflow.includes(
        'permissions:\n  contents: read',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'timeout-minutes: 25',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'cancel-in-progress: true',
      ),
      true,
    );
  },
);

test(
  'Mobile package exposes unit, e2e validator and CI validator scripts',
  () => {
    const packageJson = readJson(
      'apps/mobile/package.json',
    );

    const scripts =
      packageJson.scripts ?? {};

    assert.match(
      scripts.test ?? '',
      /node --test/,
    );

    assert.equal(
      scripts['e2e:validate'],
      'node --test --test-reporter=spec test/e2e-config.test.cjs',
    );

    assert.equal(
      scripts['ci:validate'],
      'node --test --test-reporter=spec test/ci-config.test.cjs',
    );
  },
);
