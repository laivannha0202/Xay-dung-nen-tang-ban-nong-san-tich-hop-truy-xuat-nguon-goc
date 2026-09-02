import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service';
import { Prisma, TrangThaiBanGhi, TrangThaiNguoiDung } from '../../generated/prisma/client';
import type { CapNhatNhanVienQuanTriDto } from './dto/cap-nhat-nhan-vien-quan-tri.dto';
import type { GanVaiTroNhanVienDto } from './dto/gan-vai-tro-nhan-vien.dto';
import type { LocNhanVienQuanTriDto } from './dto/loc-nhan-vien-quan-tri.dto';
import type {
  DanhSachNhanVienQuanTriDto,
  DanhSachVaiTroKhaDungDto,
  DatLaiMatKhauNhanVienResponseDto,
  NhanVienQuanTriDto,
} from './dto/phan-hoi-nhan-vien-quan-tri.dto';
import type { TaoNhanVienQuanTriDto } from './dto/tao-nhan-vien-quan-tri.dto';

type MetadataAudit = { ip: string | null; userAgent: string | null };
type NhanVienRow = Prisma.NhanVienGetPayload<{
  include: {
    nguoiDung: {
      include: {
        nguoiDungVaiTro: { include: { vaiTro: true } };
      };
    };
  };
}>;

@Injectable()
export class NhanVienQuanTriService {
  constructor(private readonly prisma: PrismaService) {}

  async layDanhSach(query: LocNhanVienQuanTriDto): Promise<DanhSachNhanVienQuanTriDto> {
    const and: Prisma.NhanVienWhereInput[] = [];
    const timKiem = query.timKiem?.trim();
    if (timKiem) {
      and.push({
        OR: [
          { maNhanVien: { contains: timKiem } },
          { chucDanh: { contains: timKiem } },
          {
            nguoiDung: {
              is: {
                OR: [
                  { hoTen: { contains: timKiem } },
                  { email: { contains: timKiem } },
                  { soDienThoai: { contains: timKiem } },
                ],
              },
            },
          },
        ],
      });
    }
    if (query.trangThai) {
      and.push({ nguoiDung: { is: { trangThai: query.trangThai } } });
    }
    const where: Prisma.NhanVienWhereInput = and.length ? { AND: and } : {};
    const trang = query.trang ?? 1;
    const gioiHan = query.gioiHan ?? 20;
    const skip = (trang - 1) * gioiHan;
    const [rows, tong] = await this.prisma.$transaction([
      this.prisma.nhanVien.findMany({
        where,
        include: this.includeNhanVien(),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: gioiHan,
      }),
      this.prisma.nhanVien.count({ where }),
    ]);
    return { items: rows.map((row) => this.toDto(row as NhanVienRow)), tong, trang, gioiHan };
  }

  async layChiTiet(id: string): Promise<NhanVienQuanTriDto> {
    return this.toDto(await this.nhanVienBatBuoc(id));
  }

  async layVaiTroKhaDung(): Promise<DanhSachVaiTroKhaDungDto> {
    return {
      items: await this.prisma.vaiTro.findMany({
        where: { trangThai: TrangThaiBanGhi.HOAT_DONG, ma: { in: ['NHAN_VIEN', 'ADMIN'] } },
        orderBy: { ma: 'asc' },
        select: { ma: true, ten: true },
      }),
    };
  }

  async tao(
    tacNhanId: string,
    dto: TaoNhanVienQuanTriDto,
    metadata: MetadataAudit,
  ): Promise<NhanVienQuanTriDto> {
    const email = dto.email.trim().toLowerCase();
    const soDienThoai = dto.soDienThoai?.trim() || null;
    const maNhanVien = dto.maNhanVien.trim();
    const hash = await argon2.hash(dto.matKhau, { type: argon2.argon2id });

    const [actor, trungUser, trungMa, role] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.nguoiDung.findFirst({
        where: { OR: [{ email }, ...(soDienThoai ? [{ soDienThoai }] : [])] },
        select: { email: true, soDienThoai: true },
      }),
      this.prisma.nhanVien.findUnique({ where: { maNhanVien }, select: { id: true } }),
      this.prisma.vaiTro.findFirst({
        where: { ma: 'NHAN_VIEN', trangThai: TrangThaiBanGhi.HOAT_DONG },
        select: { id: true },
      }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (trungUser?.email === email) throw new ConflictException('Email đã được sử dụng.');
    if (soDienThoai && trungUser?.soDienThoai === soDienThoai) {
      throw new ConflictException('Số điện thoại đã được sử dụng.');
    }
    if (trungMa) throw new ConflictException('Mã nhân viên đã được sử dụng.');
    if (!role) throw new NotFoundException('Thiếu role nền tảng NHAN_VIEN.');

    const nhanVienId = await this.prisma.$transaction(async (tx) => {
      const user = await tx.nguoiDung.create({
        data: {
          email,
          soDienThoai,
          matKhauHash: hash,
          hoTen: dto.hoTen.trim(),
          trangThai: TrangThaiNguoiDung.HOAT_DONG,
        },
      });
      const employee = await tx.nhanVien.create({
        data: {
          nguoiDungId: user.id,
          maNhanVien,
          chucDanh: dto.chucDanh?.trim() || null,
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      });
      await tx.nguoiDungVaiTro.create({
        data: { nguoiDungId: user.id, vaiTroId: role.id, trangThai: TrangThaiBanGhi.HOAT_DONG },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAN_VIEN_TAO',
          thucThe: 'nhan_vien',
          thucTheId: employee.id,
          sau: { email, maNhanVien, chucDanh: dto.chucDanh?.trim() || null, vaiTro: ['NHAN_VIEN'] },
          metadata,
        },
      });
      return employee.id;
    });
    return this.layChiTiet(nhanVienId);
  }

  async capNhat(
    tacNhanId: string,
    id: string,
    dto: CapNhatNhanVienQuanTriDto,
    metadata: MetadataAudit,
  ): Promise<NhanVienQuanTriDto> {
    const [actor, employee] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.nhanVien.findUnique({ where: { id }, select: { id: true, nguoiDungId: true } }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên.');

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM nguoi_dung WHERE id = ${employee.nguoiDungId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM nhan_vien WHERE id = ${employee.id} FOR UPDATE`;
      const current = await tx.nhanVien.findUniqueOrThrow({
        where: { id: employee.id },
        include: { nguoiDung: true },
      });
      const email = dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;
      const phone = dto.soDienThoai !== undefined ? dto.soDienThoai.trim() : undefined;
      const code = dto.maNhanVien !== undefined ? dto.maNhanVien.trim() : undefined;

      if (
        email !== undefined &&
        (await tx.nguoiDung.count({ where: { email, id: { not: current.nguoiDungId } } }))
      ) {
        throw new ConflictException('Email đã được sử dụng.');
      }
      if (
        phone !== undefined &&
        (await tx.nguoiDung.count({
          where: { soDienThoai: phone, id: { not: current.nguoiDungId } },
        }))
      ) {
        throw new ConflictException('Số điện thoại đã được sử dụng.');
      }
      if (
        code !== undefined &&
        (await tx.nhanVien.count({ where: { maNhanVien: code, id: { not: current.id } } }))
      ) {
        throw new ConflictException('Mã nhân viên đã được sử dụng.');
      }

      const userData: Prisma.NguoiDungUpdateInput = {};
      if (email !== undefined) userData.email = email;
      if (dto.hoTen !== undefined) userData.hoTen = dto.hoTen.trim();
      if (phone !== undefined) userData.soDienThoai = phone;

      const employeeData: Prisma.NhanVienUpdateInput = {};
      if (code !== undefined) employeeData.maNhanVien = code;
      if (dto.chucDanh !== undefined) employeeData.chucDanh = dto.chucDanh.trim() || null;

      if (Object.keys(userData).length) {
        await tx.nguoiDung.update({ where: { id: current.nguoiDungId }, data: userData });
      }
      if (Object.keys(employeeData).length) {
        await tx.nhanVien.update({ where: { id: current.id }, data: employeeData });
      }

      const after = await tx.nhanVien.findUniqueOrThrow({
        where: { id: current.id },
        include: { nguoiDung: true },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAN_VIEN_CAP_NHAT',
          thucThe: 'nhan_vien',
          thucTheId: current.id,
          truoc: {
            email: current.nguoiDung.email,
            hoTen: current.nguoiDung.hoTen,
            soDienThoai: current.nguoiDung.soDienThoai,
            maNhanVien: current.maNhanVien,
            chucDanh: current.chucDanh,
          },
          sau: {
            email: after.nguoiDung.email,
            hoTen: after.nguoiDung.hoTen,
            soDienThoai: after.nguoiDung.soDienThoai,
            maNhanVien: after.maNhanVien,
            chucDanh: after.chucDanh,
          },
          metadata,
        },
      });
    });
    return this.layChiTiet(id);
  }

  async khoa(tacNhanId: string, id: string, metadata: MetadataAudit): Promise<NhanVienQuanTriDto> {
    const [actor, employee] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.nhanVien.findUnique({ where: { id }, select: { id: true, nguoiDungId: true } }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên.');
    if (employee.nguoiDungId === tacNhanId) {
      throw new ConflictException('Không thể tự khóa tài khoản đang thao tác.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM nguoi_dung WHERE id = ${employee.nguoiDungId} FOR UPDATE`;
      const current = await tx.nguoiDung.findUniqueOrThrow({ where: { id: employee.nguoiDungId } });
      if (current.trangThai === TrangThaiNguoiDung.TAM_KHOA) return;
      await tx.nguoiDung.update({
        where: { id: current.id },
        data: { trangThai: TrangThaiNguoiDung.TAM_KHOA },
      });
      await tx.phienDangNhap.updateMany({
        where: { nguoiDungId: current.id, thuHoiLuc: null },
        data: { thuHoiLuc: new Date() },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAN_VIEN_KHOA',
          thucThe: 'nhan_vien',
          thucTheId: employee.id,
          truoc: { trangThaiNguoiDung: current.trangThai },
          sau: { trangThaiNguoiDung: TrangThaiNguoiDung.TAM_KHOA },
          metadata,
        },
      });
    });
    return this.layChiTiet(id);
  }

  async datLaiMatKhau(
    tacNhanId: string,
    id: string,
    matKhauMoi: string,
    metadata: MetadataAudit,
  ): Promise<DatLaiMatKhauNhanVienResponseDto> {
    const [actor, employee] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.nhanVien.findUnique({ where: { id }, select: { id: true, nguoiDungId: true } }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên.');
    const hash = await argon2.hash(matKhauMoi, { type: argon2.argon2id });

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM nguoi_dung WHERE id = ${employee.nguoiDungId} FOR UPDATE`;
      await tx.nguoiDung.update({
        where: { id: employee.nguoiDungId },
        data: { matKhauHash: hash },
      });
      const now = new Date();
      await tx.phienDangNhap.updateMany({
        where: { nguoiDungId: employee.nguoiDungId, thuHoiLuc: null },
        data: { thuHoiLuc: now },
      });
      await tx.yeuCauDatLaiMatKhau.updateMany({
        where: { nguoiDungId: employee.nguoiDungId, daDungLuc: null },
        data: { daDungLuc: now },
      });
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAN_VIEN_DAT_LAI_MAT_KHAU',
          thucThe: 'nhan_vien',
          thucTheId: employee.id,
          sau: { refreshSessionsRevoked: true, pendingResetTokensInvalidated: true },
          metadata,
        },
      });
    });
    return {
      id: employee.id,
      nguoiDungId: employee.nguoiDungId,
      thongBao: 'Đã đặt lại mật khẩu và thu hồi các phiên đăng nhập.',
    };
  }

  async ganVaiTro(
    tacNhanId: string,
    id: string,
    dto: GanVaiTroNhanVienDto,
    metadata: MetadataAudit,
  ): Promise<NhanVienQuanTriDto> {
    const [actor, employee] = await Promise.all([
      this.prisma.nguoiDung.findUnique({
        where: { id: tacNhanId },
        select: { id: true, email: true },
      }),
      this.prisma.nhanVien.findUnique({ where: { id }, select: { id: true, nguoiDungId: true } }),
    ]);
    if (!actor) throw new NotFoundException('Không tìm thấy tác nhân quản trị.');
    if (!employee) throw new NotFoundException('Không tìm thấy nhân viên.');
    if (employee.nguoiDungId === tacNhanId) {
      throw new ConflictException('Không thể tự thay đổi vai trò của tài khoản đang thao tác.');
    }

    const requested = [...new Set(dto.maVaiTro.map((value) => value.trim()))].sort();
    const allowedRoles = new Set(['NHAN_VIEN', 'ADMIN']);
    if (requested.some((role) => !allowedRoles.has(role))) {
      throw new BadRequestException('Nhân viên chỉ được gán role NHAN_VIEN hoặc ADMIN.');
    }
    const roles = await this.prisma.vaiTro.findMany({
      where: { ma: { in: requested }, trangThai: TrangThaiBanGhi.HOAT_DONG },
      select: { id: true, ma: true },
    });
    if (roles.length !== requested.length) {
      throw new BadRequestException('Có vai trò không tồn tại hoặc đã ngừng hoạt động.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM nguoi_dung WHERE id = ${employee.nguoiDungId} FOR UPDATE`;
      const current = await tx.nguoiDungVaiTro.findMany({
        where: { nguoiDungId: employee.nguoiDungId },
        include: { vaiTro: true },
      });
      const before = current
        .filter(
          (item) =>
            item.trangThai === TrangThaiBanGhi.HOAT_DONG &&
            item.vaiTro.trangThai === TrangThaiBanGhi.HOAT_DONG &&
            item.vaiTro.ma !== 'KHACH_HANG',
        )
        .map((item) => item.vaiTro.ma)
        .sort();

      const staffRoles = await tx.vaiTro.findMany({
        where: { ma: { in: ['NHAN_VIEN', 'ADMIN'] } },
        select: { id: true },
      });
      await tx.nguoiDungVaiTro.updateMany({
        where: {
          nguoiDungId: employee.nguoiDungId,
          vaiTroId: { in: staffRoles.map((item) => item.id) },
        },
        data: { trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG },
      });
      for (const role of roles) {
        const existing = current.find((item) => item.vaiTroId === role.id);
        if (existing) {
          await tx.nguoiDungVaiTro.update({
            where: { id: existing.id },
            data: { trangThai: TrangThaiBanGhi.HOAT_DONG },
          });
        } else {
          await tx.nguoiDungVaiTro.create({
            data: {
              nguoiDungId: employee.nguoiDungId,
              vaiTroId: role.id,
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
          });
        }
      }
      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'NHAN_VIEN_GAN_VAI_TRO',
          thucThe: 'nhan_vien',
          thucTheId: employee.id,
          truoc: { vaiTro: before },
          sau: { vaiTro: requested },
          metadata,
        },
      });
    });
    return this.layChiTiet(id);
  }

  private includeNhanVien() {
    return {
      nguoiDung: {
        include: {
          nguoiDungVaiTro: {
            where: { trangThai: TrangThaiBanGhi.HOAT_DONG },
            include: { vaiTro: true },
          },
        },
      },
    } satisfies Prisma.NhanVienInclude;
  }

  private async nhanVienBatBuoc(id: string): Promise<NhanVienRow> {
    const row = await this.prisma.nhanVien.findUnique({
      where: { id },
      include: this.includeNhanVien(),
    });
    if (!row) throw new NotFoundException('Không tìm thấy nhân viên.');
    return row as NhanVienRow;
  }

  private toDto(row: NhanVienRow): NhanVienQuanTriDto {
    return {
      id: row.id,
      nguoiDungId: row.nguoiDungId,
      maNhanVien: row.maNhanVien,
      chucDanh: row.chucDanh,
      email: row.nguoiDung.email,
      hoTen: row.nguoiDung.hoTen,
      soDienThoai: row.nguoiDung.soDienThoai,
      trangThaiNguoiDung: row.nguoiDung.trangThai,
      trangThaiNhanVien: row.trangThai,
      vaiTro: row.nguoiDung.nguoiDungVaiTro
        .filter((item) => item.vaiTro.trangThai === TrangThaiBanGhi.HOAT_DONG)
        .map((item) => item.vaiTro.ma)
        .sort(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
