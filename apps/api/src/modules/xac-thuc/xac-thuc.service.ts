import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiNguoiDung } from '../../generated/prisma/client';

import type { DangKyDto } from './dto/dang-ky.dto';
import type { NguoiDungXacThucDto } from './dto/phan-hoi-xac-thuc.dto';
import { ThuDienXacThucService } from './thu-dien-xac-thuc.service';

type JwtRefreshPayload = {
  sub: string;
  sid: string;
  loai: 'refresh';
  jti: string;
};

type CapTokenNoiBo = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  nguoiDung: NguoiDungXacThucDto;
};

@Injectable()
export class XacThucService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly thuDienService: ThuDienXacThucService,
  ) {}

  async dangKy(dto: DangKyDto): Promise<NguoiDungXacThucDto> {
    const email = this.chuanHoaEmail(dto.email);
    const soDienThoai = dto.soDienThoai?.trim() || null;

    const trung = await this.prisma.nguoiDung.findFirst({
      where: {
        OR: [{ email }, ...(soDienThoai ? [{ soDienThoai }] : [])],
      },
      select: {
        email: true,
        soDienThoai: true,
      },
    });

    if (trung?.email === email) {
      throw new ConflictException('Email đã được sử dụng.');
    }

    if (soDienThoai && trung?.soDienThoai === soDienThoai) {
      throw new ConflictException('Số điện thoại đã được sử dụng.');
    }

    const matKhauHash = await this.hash(dto.matKhau);

    const nguoiDung = await this.prisma.$transaction(async (tx) => {
      const moi = await tx.nguoiDung.create({
        data: {
          email,
          soDienThoai,
          matKhauHash,
          hoTen: dto.hoTen.trim(),
          trangThai: TrangThaiNguoiDung.HOAT_DONG,
        },
      });

      await tx.khachHang.create({
        data: {
          nguoiDungId: moi.id,
        },
      });

      return moi;
    });

    return this.toNguoiDungDto(nguoiDung);
  }

  async dangNhap(emailRaw: string, matKhau: string): Promise<CapTokenNoiBo> {
    const email = this.chuanHoaEmail(emailRaw);

    const nguoiDung = await this.prisma.nguoiDung.findUnique({
      where: { email },
    });

    if (
      !nguoiDung ||
      nguoiDung.trangThai !== TrangThaiNguoiDung.HOAT_DONG ||
      !(await this.verify(nguoiDung.matKhauHash, matKhau))
    ) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    return this.taoCapToken(nguoiDung);
  }

  async lamMoi(refreshToken: string): Promise<CapTokenNoiBo> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const phien = await this.prisma.phienDangNhap.findUnique({
      where: { id: payload.sid },
      include: { nguoiDung: true },
    });

    if (
      !phien ||
      phien.nguoiDungId !== payload.sub ||
      phien.thuHoiLuc ||
      phien.hetHanLuc.getTime() <= Date.now() ||
      phien.nguoiDung.trangThai !== TrangThaiNguoiDung.HOAT_DONG
    ) {
      throw new UnauthorizedException('Refresh token không còn hiệu lực.');
    }

    const hopLe = await this.verify(phien.refreshTokenHash, refreshToken);

    if (!hopLe) {
      throw new UnauthorizedException('Refresh token đã bị rotate hoặc không hợp lệ.');
    }

    const accessToken = await this.taoAccessToken(phien.nguoiDung.id);
    const refreshTtl = this.layRefreshTtlSeconds();
    const refreshTokenMoi = await this.taoRefreshToken(phien.nguoiDung.id, phien.id);
    const refreshTokenHash = await this.hash(refreshTokenMoi);

    await this.prisma.phienDangNhap.update({
      where: { id: phien.id },
      data: {
        refreshTokenHash,
        hetHanLuc: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenMoi,
      expiresIn: this.layAccessTtlSeconds(),
      nguoiDung: this.toNguoiDungDto(phien.nguoiDung),
    };
  }

  async dangXuat(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);

      await this.prisma.phienDangNhap.updateMany({
        where: {
          id: payload.sid,
          nguoiDungId: payload.sub,
          thuHoiLuc: null,
        },
        data: {
          thuHoiLuc: new Date(),
        },
      });
    } catch {
      // Logout luôn idempotent; cookie vẫn được xóa ở controller.
    }
  }

  async doiMatKhau(nguoiDungId: string, matKhauHienTai: string, matKhauMoi: string): Promise<void> {
    const nguoiDung = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDungId },
    });

    if (!nguoiDung || !(await this.verify(nguoiDung.matKhauHash, matKhauHienTai))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác.');
    }

    const matKhauHash = await this.hash(matKhauMoi);

    await this.prisma.$transaction([
      this.prisma.nguoiDung.update({
        where: { id: nguoiDungId },
        data: { matKhauHash },
      }),
      this.prisma.phienDangNhap.updateMany({
        where: {
          nguoiDungId,
          thuHoiLuc: null,
        },
        data: {
          thuHoiLuc: new Date(),
        },
      }),
    ]);
  }

  async yeuCauDatLaiMatKhau(emailRaw: string): Promise<void> {
    const email = this.chuanHoaEmail(emailRaw);

    const nguoiDung = await this.prisma.nguoiDung.findUnique({
      where: { email },
    });

    // Không tiết lộ email có tồn tại hay không.
    if (!nguoiDung) {
      return;
    }

    const now = new Date();

    await this.prisma.yeuCauDatLaiMatKhau.updateMany({
      where: {
        nguoiDungId: nguoiDung.id,
        daDungLuc: null,
      },
      data: {
        daDungLuc: now,
      },
    });

    const yeuCau = await this.prisma.yeuCauDatLaiMatKhau.create({
      data: {
        nguoiDungId: nguoiDung.id,
        tokenHash: 'dang-tao-token',
        hetHanLuc: new Date(Date.now() + this.layResetTtlMinutes() * 60_000),
      },
    });

    const secret = randomBytes(32).toString('base64url');
    const maDatLai = `${yeuCau.id}.${secret}`;
    const tokenHash = await this.hash(secret);

    await this.prisma.yeuCauDatLaiMatKhau.update({
      where: { id: yeuCau.id },
      data: { tokenHash },
    });

    await this.thuDienService.guiMaDatLaiMatKhau(nguoiDung.email, maDatLai);
  }

  async datLaiMatKhau(maDatLai: string, matKhauMoi: string): Promise<void> {
    const tach = maDatLai.split('.');

    if (tach.length !== 2) {
      throw new UnauthorizedException('Mã đặt lại mật khẩu không hợp lệ.');
    }

    const [id, secret] = tach;

    if (!id || !secret) {
      throw new UnauthorizedException('Mã đặt lại mật khẩu không hợp lệ.');
    }

    const yeuCau = await this.prisma.yeuCauDatLaiMatKhau.findUnique({
      where: { id },
    });

    if (
      !yeuCau ||
      yeuCau.daDungLuc ||
      yeuCau.hetHanLuc.getTime() <= Date.now() ||
      !(await this.verify(yeuCau.tokenHash, secret))
    ) {
      throw new UnauthorizedException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    const matKhauHash = await this.hash(matKhauMoi);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.nguoiDung.update({
        where: { id: yeuCau.nguoiDungId },
        data: { matKhauHash },
      }),
      this.prisma.yeuCauDatLaiMatKhau.update({
        where: { id: yeuCau.id },
        data: { daDungLuc: now },
      }),
      this.prisma.phienDangNhap.updateMany({
        where: {
          nguoiDungId: yeuCau.nguoiDungId,
          thuHoiLuc: null,
        },
        data: {
          thuHoiLuc: now,
        },
      }),
    ]);
  }

  private async taoCapToken(nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  }): Promise<CapTokenNoiBo> {
    const refreshTtl = this.layRefreshTtlSeconds();

    const phien = await this.prisma.phienDangNhap.create({
      data: {
        nguoiDungId: nguoiDung.id,
        refreshTokenHash: 'dang-tao-token',
        hetHanLuc: new Date(Date.now() + refreshTtl * 1000),
      },
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.taoAccessToken(nguoiDung.id),
      this.taoRefreshToken(nguoiDung.id, phien.id),
    ]);

    await this.prisma.phienDangNhap.update({
      where: { id: phien.id },
      data: {
        refreshTokenHash: await this.hash(refreshToken),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.layAccessTtlSeconds(),
      nguoiDung: this.toNguoiDungDto(nguoiDung),
    };
  }

  private async taoAccessToken(nguoiDungId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: nguoiDungId,
        loai: 'access',
      },
      {
        secret: this.layAccessSecret(),
        expiresIn: this.layAccessTtlSeconds(),
      },
    );
  }

  private async taoRefreshToken(nguoiDungId: string, phienId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: nguoiDungId,
        sid: phienId,
        loai: 'refresh',
        // JWT là deterministic nếu payload + iat + exp giống nhau.
        // jti ngẫu nhiên bảo đảm mỗi lần rotate sinh token mới,
        // kể cả khi hai lần ký xảy ra trong cùng một giây.
        jti: randomUUID(),
      },
      {
        secret: this.layRefreshSecret(),
        expiresIn: this.layRefreshTtlSeconds(),
      },
    );
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.layRefreshSecret(),
      });

      if (payload.loai !== 'refresh' || !payload.sub || !payload.sid || !payload.jti) {
        throw new Error('invalid-payload');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }
  }

  private async hash(value: string): Promise<string> {
    return argon2.hash(value, {
      type: argon2.argon2id,
    });
  }

  private async verify(hash: string, value: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, value);
    } catch {
      return false;
    }
  }

  private chuanHoaEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toNguoiDungDto(nguoiDung: {
    id: string;
    email: string;
    hoTen: string;
  }): NguoiDungXacThucDto {
    return {
      id: nguoiDung.id,
      email: nguoiDung.email,
      hoTen: nguoiDung.hoTen,
    };
  }

  private layAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production thiếu JWT_ACCESS_SECRET.');
    }

    return 'agrimarket-local-access-secret-change-before-production-012';
  }

  private layRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (secret) {
      return secret;
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production thiếu JWT_REFRESH_SECRET.');
    }

    return 'agrimarket-local-refresh-secret-change-before-production-012';
  }

  private layAccessTtlSeconds(): number {
    return Number(this.configService.get<string>('JWT_ACCESS_TTL_SECONDS') ?? '900');
  }

  private layRefreshTtlSeconds(): number {
    return Number(this.configService.get<string>('JWT_REFRESH_TTL_SECONDS') ?? '604800');
  }

  private layResetTtlMinutes(): number {
    return Number(this.configService.get<string>('PASSWORD_RESET_TTL_MINUTES') ?? '30');
  }
}
