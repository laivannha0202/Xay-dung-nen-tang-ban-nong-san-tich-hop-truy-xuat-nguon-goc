import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi, TrangThaiNguoiDung } from '../../generated/prisma/client';

import type { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';
import type { MaTranPhanQuyenDto, VaiTroMaTranDto } from './dto/phan-hoi-ma-tran-quyen.dto';
import type { PhanQuyenNguoiDungDto } from './dto/phan-hoi-phan-quyen.dto';
import { MA_QUYEN, MA_VAI_TRO } from './ma-quyen';

type MetadataAudit = { ip: string | null; userAgent: string | null };

@Injectable()
export class PhanQuyenService {
  constructor(private readonly prisma: PrismaService) {}

  async layCuaNguoiDung(nguoiDungId: string): Promise<PhanQuyenNguoiDungDto> {
    const nguoiDung = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDungId },
      select: { id: true },
    });
    if (!nguoiDung) throw new NotFoundException('Không tìm thấy người dùng.');

    const danhSach = await this.prisma.nguoiDungVaiTro.findMany({
      where: { nguoiDungId, trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: {
        vaiTro: {
          select: {
            ma: true,
            trangThai: true,
            vaiTroQuyen: {
              where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
              select: {
                quyen: { select: { ma: true, trangThai: true } },
              },
            },
          },
        },
      },
    });

    const vaiTro = new Set<string>();
    const quyen = new Set<string>();
    for (const gan of danhSach) {
      if (gan.vaiTro.trangThai !== TrangThaiBanGhi.HOAT_DONG) continue;
      vaiTro.add(gan.vaiTro.ma);
      for (const ganQuyen of gan.vaiTro.vaiTroQuyen) {
        if (ganQuyen.quyen.trangThai === TrangThaiBanGhi.HOAT_DONG) {
          quyen.add(ganQuyen.quyen.ma);
        }
      }
    }

    return { nguoiDungId, vaiTro: [...vaiTro].sort(), quyen: [...quyen].sort() };
  }

  async ganVaiTro(
    tacNhanId: string,
    nguoiDungId: string,
    maVaiTro: string,
    metadata: MetadataAudit,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const [tacNhan, nguoiDung, vaiTro] = await Promise.all([
        tx.nguoiDung.findUnique({
          where: { id: tacNhanId },
          select: { id: true, email: true },
        }),
        tx.nguoiDung.findFirst({
          where: { id: nguoiDungId, trangThai: TrangThaiNguoiDung.HOAT_DONG },
          select: { id: true },
        }),
        tx.vaiTro.findFirst({
          where: { ma: maVaiTro, trangThai: TrangThaiBanGhi.HOAT_DONG },
          select: { id: true },
        }),
      ]);

      if (!tacNhan) throw new NotFoundException('Không tìm thấy tác nhân thực hiện.');
      if (!nguoiDung) throw new NotFoundException('Không tìm thấy người dùng đang hoạt động.');
      if (!vaiTro) throw new NotFoundException('Không tìm thấy vai trò đang hoạt động.');

      const hienTai = await tx.nguoiDungVaiTro.findFirst({
        where: { nguoiDungId, vaiTroId: vaiTro.id },
        select: { id: true, trangThai: true },
      });

      const truoc = { maVaiTro, trangThai: hienTai?.trangThai ?? null };
      const banGhi = hienTai
        ? await tx.nguoiDungVaiTro.update({
            where: { id: hienTai.id },
            data: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          })
        : await tx.nguoiDungVaiTro.create({
            data: { nguoiDungId, vaiTroId: vaiTro.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
          });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: tacNhan.id,
          tacNhan: tacNhan.email,
          hanhDong: 'PHAN_QUYEN_GAN_VAI_TRO',
          thucThe: 'nguoi_dung_vai_tro',
          thucTheId: banGhi.id,
          truoc,
          sau: { maVaiTro, trangThai: TrangThaiBanGhi.HOAT_DONG },
          metadata: { ip: metadata.ip, userAgent: metadata.userAgent, nguoiDungId, maVaiTro },
        },
      });
    });
  }

  async layMaTranQuyen(): Promise<MaTranPhanQuyenDto> {
    const [roles, permissions] = await Promise.all([
      this.prisma.vaiTro.findMany({
        where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
        orderBy: { ma: 'asc' },
        select: {
          id: true,
          ma: true,
          ten: true,
          moTa: true,
          vaiTroQuyen: {
            where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
            select: { quyen: { select: { ma: true, trangThai: true } } },
          },
        },
      }),
      this.prisma.quyen.findMany({
        where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
        orderBy: { ma: 'asc' },
        select: { id: true, ma: true, ten: true, moTa: true },
      }),
    ]);

    return {
      vaiTro: roles.map((role) => ({
        id: role.id,
        ma: role.ma,
        ten: role.ten,
        moTa: role.moTa,
        maQuyen: role.vaiTroQuyen
          .filter((item) => item.quyen.trangThai === TrangThaiBanGhi.HOAT_DONG)
          .map((item) => item.quyen.ma)
          .sort(),
      })),
      quyen: permissions,
    };
  }

  async capNhatQuyenVaiTro(
    tacNhanId: string,
    vaiTroId: string,
    dto: CapNhatQuyenVaiTroDto,
    metadata: MetadataAudit,
  ): Promise<VaiTroMaTranDto> {
    const requested = [...new Set(dto.maQuyen.map((value) => value.trim()).filter(Boolean))].sort();

    await this.prisma.$transaction(async (tx) => {
      const actor = await tx.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      });
      if (!actor) throw new NotFoundException('Không tìm thấy tác nhân thực hiện.');

      await tx.$queryRaw`SELECT id FROM vai_tro WHERE id = ${vaiTroId} FOR UPDATE`;

      const role = await tx.vaiTro.findFirst({
        where: { id: vaiTroId, trangThai: TrangThaiBanGhi.HOAT_DONG },
        select: { id: true, ma: true },
      });
      if (!role) throw new NotFoundException('Không tìm thấy vai trò đang hoạt động.');

      if (role.ma === MA_VAI_TRO.ADMIN && !requested.includes(MA_QUYEN.PHAN_QUYEN_QUAN_LY)) {
        throw new BadRequestException(
          'Role ADMIN bắt buộc giữ quyền phan_quyen.quan_ly để tránh khóa hệ thống.',
        );
      }

      const permissions = await tx.quyen.findMany({
        where: { ma: { in: requested }, trangThai: TrangThaiBanGhi.HOAT_DONG },
        select: { id: true, ma: true },
      });
      if (permissions.length !== requested.length) {
        throw new BadRequestException('Có quyền không tồn tại hoặc đã ngừng hoạt động.');
      }

      const current = await tx.vaiTroQuyen.findMany({
        where: { vaiTroId: role.id },
        include: { quyen: true },
      });

      const before = current
        .filter(
          (item) =>
            item.trangThai === TrangThaiBanGhi.HOAT_DONG &&
            item.quyen.trangThai === TrangThaiBanGhi.HOAT_DONG,
        )
        .map((item) => item.quyen.ma)
        .sort();

      if (JSON.stringify(before) === JSON.stringify(requested)) return;

      await tx.vaiTroQuyen.updateMany({
        where: { vaiTroId: role.id },
        data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
      });

      for (const permission of permissions) {
        const existing = current.find((item) => item.quyenId === permission.id);
        if (existing) {
          await tx.vaiTroQuyen.update({
            where: { id: existing.id },
            data: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          });
        } else {
          await tx.vaiTroQuyen.create({
            data: {
              vaiTroId: role.id,
              quyenId: permission.id,
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
          });
        }
      }

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'PHAN_QUYEN_CAP_NHAT_MA_TRAN',
          thucThe: 'vai_tro',
          thucTheId: role.id,
          truoc: { maVaiTro: role.ma, maQuyen: before },
          sau: { maVaiTro: role.ma, maQuyen: requested },
          metadata,
        },
      });
    });

    const matrix = await this.layMaTranQuyen();
    const role = matrix.vaiTro.find((item) => item.id === vaiTroId);
    if (!role) throw new NotFoundException('Không tìm thấy vai trò sau cập nhật.');
    return role;
  }
}
