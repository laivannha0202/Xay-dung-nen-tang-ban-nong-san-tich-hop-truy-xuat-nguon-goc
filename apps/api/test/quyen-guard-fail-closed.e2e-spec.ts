import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { AppModule } from '../src/app.module';

const SRC = join(__dirname, '../src');

/** Thu thập mọi file .ts trong src/ (bỏ qua test/ vì nằm ngoài src). */
function collectTs(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      collectTs(full, out);
    } else if (name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('QuyenGuard fail-closed (phan quyen)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('mo ta guard la FAIL-CLOSED, khong phai fail-open', () => {
    const source = readFileSync(
      join(SRC, 'modules/phan-quyen/quyen.guard.ts'),
      'utf8',
    );

    // Khoa fail-open: khi thieu decorator phai nem loi, khong `return true`.
    expect(source).not.toMatch(/if \(!yeuCau\?\.length\) \{\s*return true;/);
    expect(source).toContain('InternalServerErrorException');
  });

  it('khong controller nao gan QuyenGuard ma thieu @YeuCauQuyen', () => {
    const sai = collectTs(SRC).filter((file) => {
      const source = readFileSync(file, 'utf8');
      const guards = source.match(/@UseGuards\([^)]*\)/g) ?? [];
      const dungQuyenGuard = guards.some((g) => g.includes('QuyenGuard'));
      return dungQuyenGuard && !source.includes('YeuCauQuyen(');
    });

    expect(sai.map((f) => f.replace(SRC, 'src'))).toEqual([]);
  });

  it('guard chi dung keo JwtAccessGuard (route da xac thuc)', () => {
    const sai = collectTs(SRC).filter((file) => {
      const source = readFileSync(file, 'utf8');
      const guards = source.match(/@UseGuards\([^)]*\)/g) ?? [];
      return guards.some((g) => g.includes('QuyenGuard')) &&
        !guards.some((g) => g.includes('JwtAccessGuard'));
    });

    expect(sai.map((f) => f.replace(SRC, 'src'))).toEqual([]);
  });
});
