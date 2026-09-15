import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { chuanHoaTenDiaBanHungYen } from './dia-ban-hung-yen.service';

type CommuneRow = {
  id: string;
  name: string;
  full_name: string;
  type: string;
  normalized_name: string;
  active: boolean;
};

describe('DiaBanHungYen', () => {
  it('chuan hoa khong dau phuc vu tim kiem', () => {
    expect(chuanHoaTenDiaBanHungYen('Thái Bình')).toBe('thai binh');
    expect(chuanHoaTenDiaBanHungYen('Xã Kiến Xương')).toBe('xa kien xuong');
    expect(chuanHoaTenDiaBanHungYen('Phố Hiến')).toBe('pho hien');
  });

  it('dataset commune = 104 (93 xa + 11 phuong), khong trung ma', () => {
    const duongDan = resolve(__dirname, '../../../prisma/seed-data/hung-yen-communes-2026.json');
    const duLieu = JSON.parse(readFileSync(duongDan, 'utf-8')) as { communes: CommuneRow[] };
    const communes = duLieu.communes;

    expect(communes).toHaveLength(104);
    expect(communes.filter((item) => item.type === 'xa')).toHaveLength(93);
    expect(communes.filter((item) => item.type === 'phuong')).toHaveLength(11);

    const ids = communes.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const item of communes) {
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(item.full_name.trim().length).toBeGreaterThan(0);
      expect(item.normalized_name.trim().length).toBeGreaterThan(0);
      expect(['xa', 'phuong']).toContain(item.type);
      expect(item.active).toBe(true);
    }
  });
});
