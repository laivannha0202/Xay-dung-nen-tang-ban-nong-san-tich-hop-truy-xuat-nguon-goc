'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const mobileRoot = path.resolve(
  __dirname,
  '..',
);

function read(relativePath) {
  return fs.readFileSync(
    path.join(
      mobileRoot,
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

const APP_ID =
  "com.agrimarket.mobile";
const SCHEME =
  "agrimarket";
const FLOW_NAMES =
  ["00-cold-launch.yml", "10-tab-history.yml", "20-guest-protected.yml", "30-deep-links.yml"];

test(
  'Expo app identity matches E2E suite',
  () => {
    const app = readJson(
      'app.json',
    );

    assert.equal(
      app.expo.android.package,
      APP_ID,
    );

    assert.equal(
      app.expo.scheme,
      SCHEME,
    );
  },
);

test(
  'EAS has installable Android e2e-test APK profile',
  () => {
    const eas = readJson(
      'eas.json',
    );

    const profile =
      eas.build?.['e2e-test'];

    assert.equal(
      profile?.withoutCredentials,
      true,
    );

    assert.equal(
      profile?.android?.buildType,
      'apk',
    );
  },
);

test(
  'All Maestro flows target the configured Android package',
  () => {
    for (
      const name
      of FLOW_NAMES
    ) {
      const flow = read(
        `.maestro/${name}`,
      );

      assert.equal(
        flow.startsWith(
          `appId: ${APP_ID}\n---`,
        ),
        true,
        `Wrong appId in ${name}`,
      );

      assert.equal(
        /password|secret|token/i.test(
          flow,
        ),
        false,
        `Possible secret-like text in ${name}`,
      );
    }
  },
);

test(
  'Maestro suite covers launch, tab back, guest protection and deep links',
  () => {
    const cold = read(
      '.maestro/00-cold-launch.yml',
    );

    const history = read(
      '.maestro/10-tab-history.yml',
    );

    const guest = read(
      '.maestro/20-guest-protected.yml',
    );

    const links = read(
      '.maestro/30-deep-links.yml',
    );

    assert.equal(
      cold.includes(
        'clearState: true',
      ),
      true,
    );

    for (
      const tab
      of [
        'Trang chủ',
        'Khám phá',
        'Quét QR',
        'Đơn hàng',
        'Tài khoản',
      ]
    ) {
      assert.equal(
        cold.includes(tab),
        true,
        `Missing tab anchor: ${tab}`,
      );
    }

    assert.equal(
      history.includes(
        'pressKey: BACK',
      ),
      true,
    );

    assert.equal(
      history.includes(
        'selected: true',
      ),
      true,
    );

    assert.equal(
      guest.includes(
        'Đăng nhập để xem đơn hàng',
      ),
      true,
    );

    assert.equal(
      links.includes(
        `${SCHEME}://kham-pha`,
      ),
      true,
    );

    assert.equal(
      links.includes(
        `${SCHEME}://don-hang`,
      ),
      true,
    );
  },
);

test(
  'EAS workflow builds e2e-test APK then runs all Maestro flows',
  () => {
    const workflow = read(
      '.eas/workflows/e2e-test-android.yml',
    );

    assert.equal(
      workflow.includes(
        'profile: e2e-test',
      ),
      true,
    );

    assert.equal(
      workflow.includes(
        'type: maestro',
      ),
      true,
    );

    for (
      const name
      of FLOW_NAMES
    ) {
      assert.equal(
        workflow.includes(
          `.maestro/${name}`,
        ),
        true,
        `Workflow missing ${name}`,
      );
    }
  },
);
