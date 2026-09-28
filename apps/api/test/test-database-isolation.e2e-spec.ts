/**
 * Regression: bootstrap test phải FAIL-FAST khi thiếu TEST_DATABASE_URL.
 *
 * Mục tiêu kiến trúc: true-db/e2e test KHÔNG BAO GIỜ được fallback sang
 * DATABASE_URL development. Release gate và runner đã kiểm tra; test này khóa
 * lại hành vi đó ở tầng cấu hình để không ai vô tình nới lỏng.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const RUNNER = resolve(__dirname, '../../../tools/run-jest-vm.mjs');
const API_DIR = resolve(__dirname, '..');

function chayRunner(bienMoiTruoc: Record<string, string | undefined>) {
  const env = { ...process.env, ...bienMoiTruoc };
  try {
    execFileSync(process.execPath, [RUNNER, './test/jest-unit.json', '--listTests'], {
      cwd: API_DIR,
      env,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { thatSai: false, output: '' };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      thatSai: true,
      status: err.status,
      output: `${err.stdout ?? ''}${err.stderr ?? ''}`,
    };
  }
}

describe('Test database isolation bootstrap', () => {
  it('từ chối chạy khi thiếu TEST_DATABASE_URL', () => {
    const ketQua = chayRunner({ TEST_DATABASE_URL: undefined, NODE_ENV: 'test' });
    expect(ketQua.thatSai).toBe(true);
    expect(ketQua.status).toBe(2);
    expect(ketQua.output).toContain('TEST_DATABASE_URL');
  });

  it('từ chối chạy khi TEST_DATABASE_URL trùng DATABASE_URL', () => {
    // Đặt cả hai về cùng database dev để mô phỏng cấu hình sai.
    const devUrl = process.env.DATABASE_URL ?? 'mysql://u:p@127.0.0.1:3306/agrimarket';
    const ketQua = chayRunner({ TEST_DATABASE_URL: devUrl, DATABASE_URL: devUrl, NODE_ENV: 'test' });
    expect(ketQua.thatSai).toBe(true);
    expect(ketQua.status).toBe(2);
    expect(ketQua.output).toContain('trùng');
  });

  it('ép NODE_ENV=test cho mọi đường chạy qua runner', () => {
    // DATABASE_URL dev là URL hỏng; nếu runner rơi về nhánh dev thì Prisma
    // sẽ ném lỗi "DATABASE_URL phải dùng giao thức mysql://". Runner phải
    // ép NODE_ENV=test nên thay vào đó dùng TEST_DATABASE_URL hợp lệ.
    const ketQua = chayRunner({
      DATABASE_URL: 'khong-phai-mysql-url',
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
      NODE_ENV: 'development',
    });
    expect(ketQua.output).not.toContain('DATABASE_URL phải dùng giao thức');
  });
});

describe('Môi trường test hiện tại', () => {
  it('có TEST_DATABASE_URL riêng và khác DATABASE_URL', () => {
    const testUrl = process.env.TEST_DATABASE_URL;
    expect(testUrl).toBeTruthy();
    expect(testUrl).not.toBe(process.env.DATABASE_URL);
  });
});
