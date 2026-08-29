import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
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
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestDaXacThuc>();
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu thông tin người dùng đã xác thực.');
    }

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

    const thieu = yeuCau.filter((maQuyen) => !quyenHienCo.has(maQuyen));

    if (thieu.length) {
      throw new ForbiddenException(`Thiếu quyền: ${thieu.join(', ')}`);
    }

    return true;
  }
}
