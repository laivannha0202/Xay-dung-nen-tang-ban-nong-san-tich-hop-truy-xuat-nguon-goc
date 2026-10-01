import { CauHinhHeThongService } from '../src/modules/cau-hinh-he-thong/cau-hinh-he-thong.service';

/**
 * Redis giả lập đúng ngữ nghĩa read-through của `RedisService`:
 * có giá trị trong TTL thì trả lại, không thì gọi `napGiaTri()` rồi nhớ kết quả.
 *
 * Stub phải thật sự hoạt động chứ không chỉ là object rỗng — nếu `layJsonKemNut`
 * trả `undefined` thì `layCauHinh()` sẽ âm thầm trả sai dữ liệu và test cũ vẫn
 * xanh trong khi hàm đã hỏng.
 */
function taoRedisGiaLap<T>() {
  const kho = new Map<string, T>();

  return {
    da: kho,
    async layJsonKemNut<U>(tenKhoa: string, _ttl: number, nap: () => Promise<U>): Promise<U | null> {
      if (kho.has(tenKhoa)) return kho.get(tenKhoa) as U;
      const giaTri = await nap();
      kho.set(tenKhoa, giaTri as unknown as T);
      return giaTri;
    },
    async xoa(tenKhoa: string): Promise<void> {
      kho.delete(tenKhoa);
    },
  };
}


describe('PHIEN-081 System Settings contract', () => {
  it('trả đúng defaults khi singleton chưa có row', async () => {
    const prisma = {
      cauHinhHeThong: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new CauHinhHeThongService(prisma as never, taoRedisGiaLap<unknown>() as never);

    await expect(service.layCauHinh()).resolves.toEqual({
      reservationTtlPhut: 15,
      thoiHanKhieuNaiNgay: 7,
      nguongSapHetHanNgay: 7,
      nguongTonKhoToiThieuNgay: 15,
      phiVanChuyenCoBan: 0,
      nguongMienPhiVanChuyen: null,
      giaTriQuyDoiMoiDiem: 0,
    });
    await expect(service.layReservationTtlMs()).resolves.toBe(15 * 60_000);
    await expect(service.layThoiHanKhieuNaiNgay()).resolves.toBe(7);
    await expect(service.layNguongSapHetHanNgay()).resolves.toBe(7);
    await expect(service.layGiaTriQuyDoiMoiDiem()).resolves.toBe(0);
  });

  it('đọc row cấu hình thay cho defaults', async () => {
    const prisma = {
      cauHinhHeThong: {
        findUnique: jest.fn().mockResolvedValue({
          reservationTtlPhut: 25,
          thoiHanKhieuNaiNgay: 10,
          nguongSapHetHanNgay: 9,
          nguongTonKhoToiThieuNgay: 5,
          phiVanChuyenCoBan: 12000,
          nguongMienPhiVanChuyen: 250000,
          giaTriQuyDoiMoiDiem: 1000,
        }),
      },
    };
    const service = new CauHinhHeThongService(prisma as never, taoRedisGiaLap<unknown>() as never);

    await expect(service.layCauHinh()).resolves.toEqual({
      reservationTtlPhut: 25,
      thoiHanKhieuNaiNgay: 10,
      nguongSapHetHanNgay: 9,
      nguongTonKhoToiThieuNgay: 5,
      phiVanChuyenCoBan: 12000,
      nguongMienPhiVanChuyen: 250000,
      giaTriQuyDoiMoiDiem: 1000,
    });
    await expect(service.layGiaTriQuyDoiMoiDiem()).resolves.toBe(1000);
  });

  // Regression: `layCauHinh()` mới đi qua Redis cache. Nếu Redis lỗi thì phải đọc
  // thẳng DB — cache là tối ưu hoá, không phải điều kiện đúng đắn. Nếu không,
  // một sự cố Redis sẽ làm hỏng mọi ngưỡng nghiệp vụ (reservation TTL, cảnh báo
  // hết hạn, quy đổi điểm).
  it('Redis lỗi thì vẫn đọc được cấu hình từ DB', async () => {
    const prisma = {
      cauHinhHeThong: {
        findUnique: jest.fn().mockResolvedValue({ nguongSapHetHanNgay: 11 }),
      },
    };
    const redis = {
      layJsonKemNut: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      xoa: jest.fn(),
    };
    const service = new CauHinhHeThongService(prisma as never, redis as never);

    await expect(service.layNguongSapHetHanNgay()).resolves.toBe(11);
  });

  it('đọc cache chỉ gọi DB một lần cho nhiều lần đọc liên tiếp', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      reservationTtlPhut: 15,
      thoiHanKhieuNay: 7,
      thoiHanKhieuNaiNgay: 7,
      nguongSapHetHanNgay: 9,
      nguongTonKhoToiThieuNgay: 15,
      phiVanChuyenCoBan: 0,
      nguongMienPhiVanChuyen: null,
      giaTriQuyDoiMoiDiem: 0,
    });
    const prisma = { cauHinhHeThong: { findUnique } };
    const redis = taoRedisGiaLap<unknown>();

    const service = new CauHinhHeThongService(prisma as never, redis as never);

    await expect(service.layNguongSapHetHanNgay()).resolves.toBe(9);
    await expect(service.layNguongSapHetHanNgay()).resolves.toBe(9);

    // Lần đầu đọc DB, lần sau ra cache — nếu không cache thì đây là 2 lần gọi.
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('xoá cache khi capNhat xong, để cấu hình mới có hiệu lực ngay', async () => {
    // Đây là điều làm cho cache ở đây AN TOÀN: đổi cấu hình không được bị
    // "đọc cũ" trong tối đa TTL giây.
    const redis = taoRedisGiaLap<unknown>();
    const xoa = jest.spyOn(redis, 'xoa');

    const prisma = {
      cauHinhHeThong: { findUnique: jest.fn() },
      nguoiDung: {
        findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'admin@example.com' }),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) =>
        cb({
          cauHinhHeThong: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockResolvedValue({
              reservationTtlPhut: 20,
              thoiHanKhieuNaiNgay: 7,
              nguongSapHetHanNgay: 7,
              nguongTonKhoToiThieuNgay: 15,
              phiVanChuyenCoBan: 0,
              nguongMienPhiVanChuyen: null,
              giaTriQuyDoiMoiDiem: 0,
            }),
          },
          nhatKyKiemToan: { create: jest.fn() },
        }),
      ),
    };

    const service = new CauHinhHeThongService(prisma as never, redis as never);

    await service.capNhat('u1', {
      reservationTtlPhut: 20,
      thoiHanKhieuNaiNgay: 7,
      nguongSapHetHanNgay: 7,
      nguongTonKhoToiThieuNgay: 15,
      phiVanChuyenCoBan: 0,
      giaTriQuyDoiMoiDiem: 0,
    } as never, { ip: null, userAgent: null });

    expect(xoa).toHaveBeenCalledTimes(1);
  });
});
