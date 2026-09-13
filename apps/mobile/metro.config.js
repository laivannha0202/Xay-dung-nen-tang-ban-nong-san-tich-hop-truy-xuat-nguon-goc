const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
const repoRoot = path.resolve(__dirname, '../..');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function repoPathRegex(relativePath) {
  const absolute = path.join(repoRoot, relativePath);
  return new RegExp(`^${escapeRegex(absolute)}(?:[/\\\\]|$)`);
}

// Expo tự nhận diện pnpm monorepo và vẫn được phép resolve packages/api-client.
// Các cây dưới đây không thuộc dependency graph của Mobile nhưng nếu Metro crawl
// toàn workspace trên Linux, chúng tiêu tốn rất nhiều inotify watchers.
// blockList chỉ thu hẹp file-map của Metro; không thay đổi Expo Go hay sysctl.
const mobileIrrelevantPaths = [
  'apps/api',
  'apps/admin-web',
  'apps/customer-web',
  'docs',
  '.playwright-mcp',
  'node_modules/@angular',
  'node_modules/@angular-devkit',
  'node_modules/@ant-design',
  'node_modules/@nestjs',
  'node_modules/@playwright',
  'node_modules/@prisma',
  'node_modules/antd',
  'node_modules/next',
  'node_modules/playwright',
  'node_modules/prisma',
].map(repoPathRegex);

const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
      ? [existingBlockList]
      : []),
  ...mobileIrrelevantPaths,
];

module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
