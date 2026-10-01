import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';
import type { RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { KHOA_YEU_CAU_QUYEN } from './yeu-cau-quyen.decorator';

@Injectable()
export class QuyenGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const yeuCau = this.reflector.getAllAndOverride<string[]>(KHOA_YEU_CAU_QUYEN, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!yeuCau?.length) {
      // FAIL-CLOSED. Truoc day o day `return true`, nghia la route da gan
      // `QuyenGuard` nhung quen `@YeuCauQuyen()` se im lap bo qua phan quyen
      // va mo ra toan bo API. `QuyenGuard` chi dung o cap voi `JwtAccessGuard`
      // cho route da xac thuc, nen route do BAT BUOC phai neu ra quyen can co.
      // Endpoint cong khai khong gan guard nao nen khong affected.
      //
      // Loi 500 con y do la loi cau hinh code, khong phai loi nguoi dung —
      // dung de phat hien ngay khi nguoi moi them guard ma quen decorator.
      const handler = context.getHandler().name;
      throw new InternalServerErrorException(
        `Route "${handler}" gan QuyenGuard nhung thieu @YeuCauQuyen().`,
      );
    }

    const request = context.switchToHttp().getRequest<RequestDaXacThuc>();
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu thông tin người dùng đã xác thực.');
    }

    const quyenHienCo = await this.taiQuyen(nguoiDungId);

    const thieu = yeuCau.filter((maQuyen) => !quyenHienCo.has(maQuyen));

    if (thieu.length) {
      throw new ForbiddenException(`Thiếu quyền: ${thieu.join(', ')}`);
    }

    return true;
  }

  /**
   * Nap tap quyen ma hieu luc cua mot nguoi dung tu DB.
   *
   * Ghi chu: KHONG cache o day. Doi quyen phai co hieu luc ngay (test RBAC doi
   * vai tro roi goi API ngay, va `phan-quyen-quan-tri` cap nhan xong phai
   * co hieu luc). Neu muon cache, phai co khoa ghi khi gan/giao quyen.
   */
  private async taiQuyen(nguoiDungId: string): Promise<Set<string>> {
    const danhSachGan = await this.prisma.nguoiDungVaiTro.findMany({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
      select: {
        vaiTro: {
          select: {
            trangThai: true,
            vaiTroQuyen: {
              where: {
                trangThai: TrangThaiBanGhi.HOAT_DONG,
              },
              select: {
                quyen: {
                  select: {
                    ma: true,
                    trangThai: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const quyenHienCo = new Set<string>();

    for (const gan of danhSachGan) {
      if (gan.vaiTro.trangThai !== TrangThaiBanGhi.HOAT_DONG) {
        continue;
      }

      for (const ganQuyen of gan.vaiTro.vaiTroQuyen) {
        if (ganQuyen.quyen.trangThai === TrangThaiBanGhi.HOAT_DONG) {
          quyenHienCo.add(ganQuyen.quyen.ma);
        }
      }
    }

    return quyenHienCo;
  }
}
