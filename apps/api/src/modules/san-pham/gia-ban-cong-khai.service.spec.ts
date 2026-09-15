import type { GiaHieuLuc } from '../flash-sale/gia-hieu-luc.service';
import { tinhGiaBan, tinhPhanTramGiam, toBienTheHieuLuc } from './gia-ban-cong-khai.helper';

function giaNormal(id: string, giaGoc: number, soLuong = 10): GiaHieuLuc {
  return {
    bienTheSanPhamId: id,
    giaGoc,
    giaHieuLuc: giaGoc,
    loaiGia: 'NORMAL',
    chienDichId: null,
    mucFlashSaleId: null,
    soLuongKhaDung: soLuong,
  };
}

function giaFlash(id: string, giaGoc: number, giaHieuLuc: number): GiaHieuLuc {
  return {
    bienTheSanPhamId: id,
    giaGoc,
    giaHieuLuc,
    loaiGia: 'FLASH_SALE',
    chienDichId: 'camp-1',
    mucFlashSaleId: `muc-${id}`,
    soLuongKhaDung: 10,
  };
}

describe('GiaBan cong khai (gia hieu luc cho card/detail)', () => {
  it('CASE 1: normal 30.000 khong flash => NORMAL, khong giam', () => {
    const map = new Map([['a', giaNormal('a', 30000)]]);
    const ketQua = tinhGiaBan([{ id: 'a', gia: 30000 }], map)!;
    expect(ketQua.giaHieuLucDaiDien).toBe(30000);
    expect(ketQua.loaiGia).toBe('NORMAL');
    expect(ketQua.dangGiam).toBe(false);
    expect(ketQua.phanTramGiam).toBeNull();
    expect(ketQua.tu).toBe(30000);
    expect(ketQua.den).toBe(30000);
  });

  it('CASE 2: goc 30.000 flash 24.000 => FLASH_SALE -20%', () => {
    const map = new Map([['a', giaFlash('a', 30000, 24000)]]);
    const ketQua = tinhGiaBan([{ id: 'a', gia: 30000 }], map)!;
    expect(ketQua.giaHieuLucDaiDien).toBe(24000);
    expect(ketQua.giaGocDaiDien).toBe(30000);
    expect(ketQua.loaiGia).toBe('FLASH_SALE');
    expect(ketQua.phanTramGiam).toBe(20);
    expect(ketQua.dangGiam).toBe(true);
  });

  it('CASE 3+4: het han / chua bat dau (resolver tra NORMAL) => UI ve gia goc, khong badge', () => {
    const map = new Map([['a', giaNormal('a', 30000)]]);
    const ketQua = tinhGiaBan([{ id: 'a', gia: 30000 }], map)!;
    expect(ketQua.loaiGia).toBe('NORMAL');
    expect(ketQua.giaHieuLucDaiDien).toBe(30000);
    expect(ketQua.phanTramGiam).toBeNull();
  });

  it('CASE 5: flash nhung het ton (resolver tra NORMAL) => NORMAL', () => {
    const map = new Map([['a', giaNormal('a', 30000, 0)]]);
    const ketQua = tinhGiaBan([{ id: 'a', gia: 30000 }], map)!;
    expect(ketQua.loaiGia).toBe('NORMAL');
    expect(ketQua.dangGiam).toBe(false);
  });

  it('CASE 6: A 30.000 normal, B 40.000 -> 20.000 => dai dien la B, 20.000/40.000/-50%', () => {
    const map = new Map([
      ['a', giaNormal('a', 30000)],
      ['b', giaFlash('b', 40000, 20000)],
    ]);
    const ketQua = tinhGiaBan(
      [
        { id: 'a', gia: 30000 },
        { id: 'b', gia: 40000 },
      ],
      map,
    )!;
    expect(ketQua.bienTheDaiDienId).toBe('b');
    expect(ketQua.giaHieuLucDaiDien).toBe(20000);
    expect(ketQua.giaGocDaiDien).toBe(40000);
    expect(ketQua.phanTramGiam).toBe(50);
    expect(ketQua.tu).toBe(20000);
    expect(ketQua.den).toBe(30000);
  });

  it('CASE 6b: khong ghep gia hieu luc min voi gia goc min khac variant (20.000/40.000, khong phai 20.000/25.000)', () => {
    const map = new Map([
      ['a', giaNormal('a', 25000)],
      ['b', giaFlash('b', 40000, 20000)],
    ]);
    const ketQua = tinhGiaBan(
      [
        { id: 'a', gia: 25000 },
        { id: 'b', gia: 40000 },
      ],
      map,
    )!;
    expect(ketQua.giaHieuLucDaiDien).toBe(20000);
    expect(ketQua.giaGocDaiDien).toBe(40000);
    expect(ketQua.phanTramGiam).toBe(50);
  });

  it('CASE 7: nhieu flash hop le trung thoi gian => resolver da chon gia thap nhat, card giu nguyen', () => {
    // GiaHieuLucService orderBy giaFlash asc nen muc thap nhat thang.
    // O day giaBan chi phan anh dung gia resolver tra ve.
    const map = new Map([['a', giaFlash('a', 50000, 35000)]]);
    const ketQua = tinhGiaBan([{ id: 'a', gia: 50000 }], map)!;
    expect(ketQua.giaHieuLucDaiDien).toBe(35000);
    expect(ketQua.phanTramGiam).toBe(30);
  });

  it('variant thieu du lieu resolver => fallback an toan, khong tra gia 0', () => {
    const bienThe = toBienTheHieuLuc('missing', 32000, undefined);
    expect(bienThe.giaGoc).toBe(32000);
    expect(bienThe.giaHieuLuc).toBe(32000);
    expect(bienThe.loaiGia).toBe('NORMAL');
    expect(bienThe.phanTramGiam).toBeNull();
  });

  it('phan tram chi de hien thi: dieu kien giaGoc>0, giaHieuLuc>0, giaHieuLuc<giaGoc, FLASH_SALE', () => {
    expect(tinhPhanTramGiam(32000, 25600, 'FLASH_SALE')).toBe(20);
    expect(tinhPhanTramGiam(30000, 30000, 'FLASH_SALE')).toBeNull();
    expect(tinhPhanTramGiam(30000, 24000, 'NORMAL')).toBeNull();
    expect(tinhPhanTramGiam(0, 0, 'FLASH_SALE')).toBeNull();
  });

  it('tie-break on dinh khi gia hieu luc bang nhau: chon id tang dan', () => {
    const map = new Map([
      ['b', giaNormal('b', 30000)],
      ['a', giaNormal('a', 30000)],
    ]);
    const ketQua = tinhGiaBan(
      [
        { id: 'b', gia: 30000 },
        { id: 'a', gia: 30000 },
      ],
      map,
    )!;
    expect(ketQua.bienTheDaiDienId).toBe('a');
  });
});
