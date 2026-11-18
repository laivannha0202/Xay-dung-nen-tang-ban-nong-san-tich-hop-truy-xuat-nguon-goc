/**
 * Demo farms, one per origin region, so a passport never shows a Hưng Yên orchard for a lot whose
 * origin note says New Zealand or Bến Tre. Shared by `seed-demo-catalog.ts` and `seed-demo-v71.ts`;
 * every row is DEMO data (`is_demo`) and is keyed by name, so re-running changes nothing.
 */
import { one, q } from '../db.js'

export type FarmKey =
  | 'hy' | 'ld' | 'bt' | 'hd' | 'ag' | 'bp' | 'tg' | 'st' | 'cm' | 'bt2' | 'nz' | 'kr' | 'nk'

interface FarmDef {
  name: string
  province: string
  district: string
  commune: string
  address: string
  lat: number
  lon: number
  crops: string
}

export const DEMO_FARMS: Record<FarmKey, FarmDef> = {
  hy: { name: 'Vườn cam Khoái Châu', province: 'Hưng Yên', district: 'Khoái Châu', commune: 'Tân Dân', address: 'Đê sông Hồng, thôn Tân Dân', lat: 20.8333, lon: 106.0333, crops: 'Cam sành, nhãn lồng, rau ăn lá' },
  ld: { name: 'Nhà màng Đơn Dương (demo)', province: 'Lâm Đồng', district: 'Đơn Dương', commune: 'Lạc Xuân', address: 'Thôn Lạc Xuân 2', lat: 11.7519, lon: 108.5451, crops: 'Rau ăn quả, khoai tây' },
  bt: { name: 'Vườn dừa Bến Tre (demo)', province: 'Bến Tre', district: 'Mỏ Cày Nam', commune: 'An Thới', address: 'Ấp An Hòa', lat: 10.1333, lon: 106.35, crops: 'Dừa xiêm, bưởi da xanh' },
  hd: { name: 'Vườn rau Hải Dương (demo)', province: 'Hải Dương', district: 'Gia Lộc', commune: 'Đồng Quang', address: 'Thôn Đồng Quang', lat: 20.9333, lon: 106.3, crops: 'Bắp cải, ổi' },
  ag: { name: 'Ruộng lúa An Giang (demo)', province: 'An Giang', district: 'Thoại Sơn', commune: 'Vĩnh Trạch', address: 'Ấp Vĩnh Trạch', lat: 10.2833, lon: 105.4, crops: 'Lúa thơm' },
  bp: { name: 'Vườn điều Bình Phước (demo)', province: 'Bình Phước', district: 'Bù Đăng', commune: 'Đoàn Kết', address: 'Ấp Đoàn Kết', lat: 11.75, lon: 107.15, crops: 'Điều' },
  tg: { name: 'Vườn dứa Tiền Giang (demo)', province: 'Tiền Giang', district: 'Tân Phước', commune: 'Tân Hòa Thành', address: 'Ấp Tân Hòa', lat: 10.4667, lon: 106.2, crops: 'Dứa mật' },
  st: { name: 'Ruộng lúa Sóc Trăng (demo)', province: 'Sóc Trăng', district: 'Mỹ Xuyên', commune: 'Đại Tâm', address: 'Ấp Đại Tâm', lat: 9.5667, lon: 105.95, crops: 'Lúa ST25' },
  cm: { name: 'Rừng tràm U Minh (demo)', province: 'Cà Mau', district: 'U Minh', commune: 'Khánh Lâm', address: 'Ấp Khánh Lâm', lat: 9.3833, lon: 104.95, crops: 'Mật ong rừng' },
  bt2: { name: 'Vườn thanh long Bình Thuận (demo)', province: 'Bình Thuận', district: 'Hàm Thuận Nam', commune: 'Hàm Minh', address: 'Ấp Hàm Minh', lat: 10.85, lon: 107.95, crops: 'Thanh long' },
  nz: { name: 'Đối tác nhập khẩu New Zealand (demo)', province: 'New Zealand', district: 'Hawke’s Bay', commune: 'Hastings', address: 'Nhà đóng gói đối tác', lat: -39.64, lon: 176.84, crops: 'Táo, kiwi' },
  kr: { name: 'Đối tác nhập khẩu Hàn Quốc (demo)', province: 'Hàn Quốc', district: 'Naju', commune: 'Naju-si', address: 'Nhà đóng gói đối tác', lat: 35.0161, lon: 126.7108, crops: 'Lê' },
  nk: { name: 'Đơn vị nhập khẩu ngũ cốc (demo)', province: 'Nhập khẩu', district: 'Kho ngoại quan', commune: '—', address: 'Kho ngoại quan', lat: 10.8, lon: 106.7, crops: 'Yến mạch' },
}

/** Idempotent: creates the demo farm on first use and returns its id. */
export async function ensureFarm(key: FarmKey, supplierId: string): Promise<string> {
  const f = DEMO_FARMS[key]
  const existing = await one<{ id: string }>(`SELECT id FROM farms WHERE name=$1`, [f.name])
  if (existing) return existing.id
  const created = await one<{ id: string }>(
    `INSERT INTO farms (supplier_id, name, province, district, commune, address_detail, latitude, longitude, area_ha, crops, manager_name, manager_phone, is_demo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,'Bộ phận kỹ thuật','0912555777',true) RETURNING id`,
    [supplierId, f.name, f.province, f.district, f.commune, f.address, f.lat, f.lon, f.crops],
  )
  await q(`UPDATE farms SET is_demo=true WHERE id=$1`, [created!.id])
  return created!.id
}
