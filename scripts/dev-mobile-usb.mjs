#!/usr/bin/env node

/**
 * 🌱 AGRIMARKET MOBILE — KHỞI ĐỘNG QUA CÁP USB (ADB) 🌱
 *
 * Entry point `pnpm mobile:usb`. Toàn bộ luồng một-phát nằm ở
 * `apps/mobile/tools/expo-go-usb.mjs` (luồng chuẩn, đã được test
 * `usb:validate` khóa lại):
 *   ADB → điện thoại thật → ensure API client MỘT LẦN →
 *   backend → reverse ports → Metro 8081 (reuse nếu còn chạy) →
 *   tự mở exp://127.0.0.1:8081 trên điện thoại.
 *
 * File này CHỈ delegate để:
 *  - Xóa lỗi double-ensure cũ (ensure ở đây + prestart của
 *    `mobile start` chạy ensure lần nữa và giết Expo khi lỗi).
 *    Luồng chuẩn chạy Metro qua `pnpm exec expo ...` nên prestart
 *    không bao giờ kích hoạt.
 *  - Không duplicate logic ADB/reverse/Metro ở hai nơi.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const expoGoUsb = path.join(repoRoot, 'apps', 'mobile', 'tools', 'expo-go-usb.mjs');

console.log('=====================================================');
console.log('🌱 AGRIMARKET MOBILE — KHỞI ĐỘNG QUA CÁP USB (ADB) 🌱');
console.log('=====================================================\n');

const child = spawn(process.execPath, [expoGoUsb], {
  cwd: path.join(repoRoot, 'apps', 'mobile'),
  stdio: 'inherit',
  // process.execPath là binary trực tiếp nên không cần shell (tránh lỗi
  // quoting path có dấu cách trên Windows).
  shell: false,
  env: process.env,
});

child.on('error', (err) => {
  console.error('❌ Lỗi khởi động Expo:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code && code !== 0) {
    console.log(`\nmobile:usb kết thúc với mã ${code}`);
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
