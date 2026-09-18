import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const [configPath, ...rawArgs] = process.argv.slice(2);
if (!configPath) {
  console.error('❌ Thiếu Jest config path.');
  process.exit(2);
}

const requireFromPackage = createRequire(
  pathToFileURL(resolve(process.cwd(), 'package.json')),
);
const jestPackagePath = requireFromPackage.resolve('jest/package.json');
const jestPackage = JSON.parse(readFileSync(jestPackagePath, 'utf8'));
const jestBinRelative =
  typeof jestPackage.bin === 'string' ? jestPackage.bin : jestPackage.bin?.jest;

if (!jestBinRelative) {
  console.error('❌ Không resolve được jest binary.');
  process.exit(2);
}

const jestBin = resolve(dirname(jestPackagePath), jestBinRelative);
const args = [...rawArgs];
if (args[0] === '--') args.shift();

const forwarded = args.filter((arg) => arg !== '--runInBand');

const result = spawnSync(
  process.execPath,
  [
    '--experimental-vm-modules',
    jestBin,
    '--config',
    configPath,
    '--runInBand',
    ...forwarded,
  ],
  {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);
