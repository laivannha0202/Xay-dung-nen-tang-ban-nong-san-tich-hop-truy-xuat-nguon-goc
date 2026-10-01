import {
  lamTronSoLuong,
  lamTronTien,
  toCent,
  fromCent,
  homNay,
} from '../src/modules/common/tien-te.util';

describe('tien-te.util (dedup tien/soLuong/homNay/toCents)', () => {
  describe('lamTronTien', () => {
    it('làm tròn đối xứng cho số âm (tiền hoàn / điều chỉnh)', () => {
      expect(lamTronTien(-1.005)).toBe(-1.01);
      expect(lamTronTien(-12.345)).toBe(-12.35);
      expect(lamTronTien(0)).toBe(0);
      expect(lamTronTien(-12.345)).toBe(-lamTronTien(12.345));
    });

    // Regression: trước đây checkout/don-hang dùng `Number(x.toFixed(2))` còn
    // dashboard dùng `Math.round((x + EPSILON) * 100) / 100`. Hai cách cho khác
    // kết quả ở số bị biểu diễn sai -> lệch tiền giữa màn hình và API.
    it('xử lý đúng số bị biểu diễn sai (1.005 -> 1.01, không phải 1.00)', () => {
      expect(lamTronTien(1.005)).toBe(1.01);
      expect(lamTronTien(8.115)).toBe(8.12);
      // Xác nhận bản cũ thực sự sai, để test này có ý nghĩa.
      expect(Number((1.005).toFixed(2))).not.toBe(lamTronTien(1.005));
    });

    it('làm tròn 2 chữ số thập phân', () => {
      expect(lamTronTien(12.345)).toBe(12.35);
      expect(lamTronTien(12.344)).toBe(12.34);
    });
  });

  describe('lamTronSoLuong', () => {
    it('làm tròn 3 chữ số thập phân', () => {
      expect(lamTronSoLuong(1.2345)).toBe(1.235);
      expect(lamTronSoLuong(-1.2345)).toBe(-1.235);
      expect(lamTronSoLuong(0.5)).toBe(0.5);
      expect(lamTronSoLuong(12)).toBe(12);
    });
  });

  describe('toCent / fromCent', () => {
    it('đổi qua lại không mất số', () => {
      expect(toCent(12000)).toBe(1200000);
      expect(toCent(0.1 + 0.2)).toBe(30);
      expect(fromCent(1200000)).toBe(12000);
      expect(fromCent(toCent(123.456))).toBe(123.46);
    });
  });

  describe('homNay', () => {
    it('lấy ngày địa phương rồi biểu diễn ở UTC', () => {
      const moc = homNay(new Date(2026, 0, 15, 23, 30));
      expect(moc.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    });

    // Regression: bản cũ ở `dat-cho-ton-kho.service.ts` dùng `getUTCFullYear()`
    // -> lệch 7 giờ ở server Asia/Ho_Chi_Minh, lô tồn kho bị đánh giá sai ngày.
    it('KHÔNG dùng getUTC* (lệch 7 giờ so với giờ địa phương)', () => {
      // 00:30 ngày 15/01 giờ địa phương = 17:30 ngày 14/01 UTC.
      // Bản UTC sẽ trả về 14/01 -> sai.
      const moc = homNay(new Date(2026, 0, 15, 0, 30));
      expect(moc.toISOString().slice(0, 10)).toBe('2026-01-15');
    });
  });
});