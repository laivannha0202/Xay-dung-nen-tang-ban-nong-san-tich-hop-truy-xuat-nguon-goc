import { ConflictException } from '@nestjs/common';

import type { PrismaService } from '../src/database/prisma.service';
import { DonHangTaoFacadeService } from '../src/modules/don-hang/don-hang-tao-facade.service';
import type { DonHangService } from '../src/modules/don-hang/don-hang.service';
import type { TaoDonHangDto } from '../src/modules/don-hang/dto/tao-don-hang.dto';
import type { PhamViGiaoHangService } from '../src/modules/giao-hang/pham-vi-giao-hang.service';

describe('Create Order idempotency facade', () => {
  const maYeuCau = '00000000-0000-4000-8000-000000000777';
  const dto = {
    maYeuCau,
    diaChiGiaoHangId: '00000000-0000-4000-8000-000000000001',
    items: [
      {
        bienTheSanPhamId: '00000000-0000-4000-8000-000000000002',
        soLuong: 1,
        donGiaDuKien: 50_000,
      },
    ],
  } as TaoDonHangDto;

  function taoFacade(existingUserId: string | null, ownerSauCore = 'user-a') {
    const findUnique = jest.fn();
    findUnique.mockResolvedValueOnce(
      existingUserId
        ? {
            id: 'order-id',
            khachHang: { nguoiDungId: existingUserId },
          }
        : null,
    );
    if (existingUserId === null || existingUserId === 'user-a') {
      findUnique.mockResolvedValueOnce({
        khachHang: { nguoiDungId: ownerSauCore },
      });
    }

    const damBaoDiaChiHopLe = jest.fn().mockResolvedValue(undefined);
    const tao = jest.fn().mockResolvedValue({
      id: 'order-id',
      maDonHang: `ORD-${maYeuCau.replaceAll('-', '').toUpperCase()}`,
    });

    const facade = new DonHangTaoFacadeService(
      { donHang: { findUnique } } as unknown as PrismaService,
      { damBaoDiaChiHopLe } as unknown as PhamViGiaoHangService,
      { tao } as unknown as DonHangService,
    );

    return { facade, findUnique, damBaoDiaChiHopLe, tao };
  }

  it('chặn replay cùng maYeuCau khi Order thuộc tài khoản khác', async () => {
    const { facade, damBaoDiaChiHopLe, tao } = taoFacade('user-b');

    await expect(facade.tao('user-a', dto)).rejects.toBeInstanceOf(ConflictException);
    expect(damBaoDiaChiHopLe).not.toHaveBeenCalled();
    expect(tao).not.toHaveBeenCalled();
  });

  it('replay đúng chủ bỏ qua shipping/cart mutable validation và xác minh ownership sau core', async () => {
    const { facade, findUnique, damBaoDiaChiHopLe, tao } = taoFacade('user-a');

    await facade.tao('user-a', dto);

    expect(damBaoDiaChiHopLe).not.toHaveBeenCalled();
    expect(tao).toHaveBeenCalledTimes(1);
    expect(tao).toHaveBeenCalledWith('user-a', dto);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('request mới phải kiểm shipping trước khi gọi core Create Order', async () => {
    const { facade, findUnique, damBaoDiaChiHopLe, tao } = taoFacade(null);

    await facade.tao('user-a', dto);

    expect(damBaoDiaChiHopLe).toHaveBeenCalledTimes(1);
    expect(damBaoDiaChiHopLe).toHaveBeenCalledWith('user-a', dto.diaChiGiaoHangId);
    expect(tao).toHaveBeenCalledTimes(1);
    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(damBaoDiaChiHopLe.mock.invocationCallOrder[0]!).toBeLessThan(
      tao.mock.invocationCallOrder[0]!,
    );
  });

  it('chặn race nếu core trả Order vừa bị chiếm bởi tài khoản khác', async () => {
    const { facade, damBaoDiaChiHopLe, tao } = taoFacade(null, 'user-b');

    await expect(facade.tao('user-a', dto)).rejects.toBeInstanceOf(ConflictException);
    expect(damBaoDiaChiHopLe).toHaveBeenCalledTimes(1);
    expect(tao).toHaveBeenCalledTimes(1);
  });
});
