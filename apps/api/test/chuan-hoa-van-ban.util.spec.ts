/**
 * Regression: phần "bỏ dấu tiếng Việt" phải có MỘT bản duy nhất và bản đó phải
 * bóc được chữ `Đ`.
 *
 * Bug gốc: `xep-hang-san-pham.ts` dùng `.replace(/\p{Diacritic}/gu, '')` nên
 * `normalize('NFD')` không tách được `Đ` (U+0110) — đây là chữ cách điệu riêng,
 * không phải `D` + dấu. Kết quả: tìm "Đà Lạt" / "Đức Thọ" trong ô tìm kiếm sản
 * phẩm không bao giờ khớp. Ba backend copy khác đều xử lý `đ` đúng, chỉ bản này
 * sót — đúng mẫu lỗi do copy/paste.
 *
 * Vì vậy spec này khóa cả hành vi ĐANG ĐÚNG, lẫn việc các module khác không
 * được tự viết lại `normalize('NFD')` nữa.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  boDauTiengViet,
  chuanHoaTenDiaBan,
  chuanHoaTenTinh,
  chuanHoaVanBanTimKiem,
} from '../src/modules/common/chuan-hoa-van-ban.util';

describe('chuan-hoa-van-ban.util', () => {
  describe('boDauTiengViet', () => {
    it('bóc dấu cơ bản', () => {
      expect(boDauTiengViet('Thái Bình')).toBe('Thai Binh');
      expect(boDauTiengViet('Xã Kiến Xương')).toBe('Xa Kien Xuong');
      expect(boDauTiengViet('Phố Hiến')).toBe('Pho Hien');
      expect(boDauTiengViet('Hưng Yên')).toBe('Hung Yen');
    });

    // Regression chính: `\p{Diacritic}` không bóc được Đ.
    it('bóc được chữ Đ (U+0110) — \p{Diacritic} không làm được', () => {
      expect(boDauTiengViet('Đà Lạt')).toBe('Da Lat');
      expect(boDauTiengViet('Đức Thọ')).toBe('Duc Tho');
      expect(boDauTiengViet('Hưng Yên')).toContain('H');
      expect(boDauTiengViet('đồng')).toBe('dong');
      expect(boDauTiengViet('Đồng')).toBe('Dong');

      // Chứng minh bản cũ thực sự hỏng, để test này có ý nghĩa.
      const cachSai = 'Đà Lạt'.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      expect(cachSai).not.toBe(boDauTiengViet('Đà Lạt'));
    });

    it('chỉ bỏ dấu tiếng Việt, không nuốt combining mark ngoài khối U+0300–U+036F', () => {
      // Dấu Hebrew (U+05B0 sheva) là combining mark thật nhưng nằm NGOÀI khối
      // tiếng Việt. `\p{Diacritic}` sẽ xoá nó (và cả dấu toán U+20D0–U+20FF).
      expect(boDauTiengViet(`x\u05B0`)).toBe(`x\u05B0`);
      expect(boDauTiengViet('x\u05B0').normalize('NFD').replace(/\p{Diacritic}/gu, '')).toBe(
        'x',
      );

      // Dấu độ C (U+00B0) là spacing character, không nằm trong khối nào ở trên.
      expect(boDauTiengViet('25°C')).toBe('25°C');
      expect(boDauTiengViet('ABC 123')).toBe('ABC 123');
    });
  });

  describe('chuanHoaTenDiaBan', () => {
    it('bỏ dấu + hạ chữ thường + gộp khoảng trắng', () => {
      expect(chuanHoaTenDiaBan('Thái Bình')).toBe('thai binh');
      expect(chuanHoaTenDiaBan('Xã Kiến Xương')).toBe('xa kien xuong');
      expect(chuanHoaTenDiaBan('Phố Hiến')).toBe('pho hien');
      expect(chuanHoaTenDiaBan('  Hưng   Yên  ')).toBe('hung yen');
    });

    it('KHÔNG bỏ tiền tố hành chính (dùng để so tên xã/phường)', () => {
      expect(chuanHoaTenDiaBan('Thành phố Hà Nội')).toBe('thanh pho ha noi');
    });
  });

  describe('chuanHoaTenTinh', () => {
    it('bỏ tiền tố "Tỉnh"/"Thành phố" để một tỉnh có nhiều cách ghi', () => {
      expect(chuanHoaTenTinh('Hưng Yên')).toBe('hung yen');
      expect(chuanHoaTenTinh('Tỉnh Hưng Yên')).toBe('hung yen');
      expect(chuanHoaTenTinh('THÀNH PHỐ Hưng Yên')).toBe('hung yen');
      expect(chuanHoaTenTinh('TỈNH HƯNG YÊN')).toBe('hung yen');
    });

    it('vẫn bỏ dấu đúng (Đ trong "Thái Bình"/"Thành phố Hà Nội")', () => {
      expect(chuanHoaTenTinh('Thái Bình')).toBe('thai binh');
      expect(chuanHoaTenTinh('Thành phố Hà Nội')).toBe('ha noi');
    });

    it('chỉ bỏ tiền tố ở đầu, không bỏ trong giữa', () => {
      expect(chuanHoaTenTinh('Phố Tỉnh')).toBe('pho tinh');
    });
  });

  describe('chuanHoaVanBanTimKiem', () => {
    it('khoá tìm kiếm: bỏ dấu + trim + hạ chữ thường', () => {
      expect(chuanHoaVanBanTimKiem('  Rau Củ  ')).toBe('rau cu');
      expect(chuanHoaVanBanTimKiem('Đà Lạt')).toBe('da lat');
    });

    it('so khớp được hai cách ghi có/không dấu', () => {
      expect(chuanHoaVanBanTimKiem('Rau Muống')).toBe(chuanHoaVanBanTimKiem('rau muong'));
      expect(chuanHoaVanBanTimKiem('Đậu Xanh')).toBe(chuanHoaVanBanTimKiem('dau xanh'));
    });
  });

  // Khóa luật "một nguồn sự thật": thêm bản `normalize('NFD')` thứ 5 là lặp
  // lại đúng cái lỗi đã xảy ra.
  it('không module nào tự viết lại normalize(\'NFD\')', () => {
    const thuMuc = resolve(__dirname, '../src');
    const tapBiDinhDanh = /\.(service|util|guard)\.ts$/;

    const offenders: string[] = [];

    const duyet = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const duongDan = resolve(dir, entry.name);

        if (entry.isDirectory()) {
          if (entry.name !== 'generated') duyet(duongDan);
          continue;
        }

        if (!tapBiDinhDanh.test(entry.name)) continue;

        const source = readFileSync(duongDan, 'utf8');

        // File này chính là nơi duy nhất được phép chứa NFD.
        if (duongDan.endsWith('chuan-hoa-van-ban.util.ts')) continue;

        if (source.includes("normalize('NFD')")) {
          offenders.push(duongDan.slice(thuMuc.length + 1));
        }
      }
    };

    duyet(thuMuc);

    expect(offenders).toEqual([]);
  });
});
