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

type VillageRow = {
  id: string;
  commune_id: string;
  name: string;
  full_name: string;
  type: string;
  normalized_name: string;
  active: boolean;
};

type CoverageRow = {
  commune_id: string;
  status: string;
  verified_record_count: number;
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

  it('dataset village progress = 127 (103 thon + 24 TDP), khong trung ma, khong orphan FK', () => {
    const villagesDuongDan = resolve(
      __dirname,
      '../../../prisma/seed-data/hung-yen-villages-2026.json',
    );
    const villagesDuLieu = JSON.parse(readFileSync(villagesDuongDan, 'utf-8')) as {
      metadata: { status: string; safe_for_full_production_required_dropdown: boolean };
      records: VillageRow[];
    };
    expect(villagesDuLieu.metadata.status).toBe('PARTIAL_VERIFIED');
    expect(villagesDuLieu.metadata.safe_for_full_production_required_dropdown).toBe(false);

    const records = villagesDuLieu.records;
    expect(records).toHaveLength(127);
    expect(records.filter((item) => item.type === 'thon')).toHaveLength(103);
    expect(records.filter((item) => item.type === 'to_dan_pho')).toHaveLength(24);

    const ids = records.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);

    const communesDuongDan = resolve(
      __dirname,
      '../../../prisma/seed-data/hung-yen-communes-2026.json',
    );
    const communesDuLieu = JSON.parse(readFileSync(communesDuongDan, 'utf-8')) as {
      communes: CommuneRow[];
    };
    const communeIds = new Set(communesDuLieu.communes.map((item) => item.id));

    for (const item of records) {
      expect(item.id.trim().length).toBeGreaterThan(0);
      expect(item.commune_id.trim().length).toBeGreaterThan(0);
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(item.full_name.trim().length).toBeGreaterThan(0);
      expect(item.normalized_name.trim().length).toBeGreaterThan(0);
      expect(['thon', 'to_dan_pho']).toContain(item.type);
      expect(item.active).toBe(true);
      expect(communeIds.has(item.commune_id)).toBe(true);
    }
  });

  it('coverage 104 commune: 12 VERIFIED_COMPLETE, 92 PENDING, khop so record file', () => {
    const coverageDuLieu = JSON.parse(
      readFileSync(
        resolve(__dirname, '../../../prisma/seed-data/hung-yen-villages-coverage-104-communes.json'),
        'utf-8',
      ),
    ) as { coverage: CoverageRow[] };
    const villagesDuLieu = JSON.parse(
      readFileSync(resolve(__dirname, '../../../prisma/seed-data/hung-yen-villages-2026.json'), 'utf-8'),
    ) as { records: VillageRow[] };

    expect(coverageDuLieu.coverage).toHaveLength(104);
    const verified = coverageDuLieu.coverage.filter(
      (item) => item.status === 'VERIFIED_COMPLETE',
    );
    const pending = coverageDuLieu.coverage.filter(
      (item) => item.status === 'PENDING_VERIFICATION',
    );
    expect(verified).toHaveLength(12);
    expect(pending).toHaveLength(92);

    for (const item of verified) {
      const actual = villagesDuLieu.records.filter(
        (row) => row.commune_id === item.commune_id,
      ).length;
      expect(actual).toBe(item.verified_record_count);
    }
    for (const item of pending) {
      expect(item.verified_record_count).toBe(0);
    }
  });
});
