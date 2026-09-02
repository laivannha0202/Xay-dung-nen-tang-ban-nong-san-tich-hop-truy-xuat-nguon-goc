import { CauHinhHeThongService } from '../src/modules/cau-hinh-he-thong/cau-hinh-he-thong.service';

describe('PHIEN-081 System Settings contract', () => {
  it('trả đúng defaults 15/7/7 khi singleton chưa có row', async () => {
    const prisma = {
      cauHinhHeThong: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new CauHinhHeThongService(prisma as never);

    await expect(service.layCauHinh()).resolves.toEqual({
      reservationTtlPhut: 15,
      thoiHanKhieuNaiNgay: 7,
      nguongSapHetHanNgay: 7,
    });
    await expect(service.layReservationTtlMs()).resolves.toBe(15 * 60_000);
    await expect(service.layThoiHanKhieuNaiNgay()).resolves.toBe(7);
    await expect(service.layNguongSapHetHanNgay()).resolves.toBe(7);
  });

  it('đọc row cấu hình thay cho defaults', async () => {
    const prisma = {
      cauHinhHeThong: {
        findUnique: jest.fn().mockResolvedValue({
          reservationTtlPhut: 25,
          thoiHanKhieuNaiNgay: 10,
          nguongSapHetHanNgay: 9,
        }),
      },
    };
    const service = new CauHinhHeThongService(prisma as never);

    await expect(service.layCauHinh()).resolves.toEqual({
      reservationTtlPhut: 25,
      thoiHanKhieuNaiNgay: 10,
      nguongSapHetHanNgay: 9,
    });
  });
});
