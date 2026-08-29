import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto, NenTangDangNhap } from './dto/dang-nhap.dto';
import { DatLaiMatKhauDto } from './dto/dat-lai-mat-khau.dto';
import { DoiMatKhauDto } from './dto/doi-mat-khau.dto';
import { LamMoiTokenDto } from './dto/lam-moi-token.dto';
import { PhanHoiDangKyDto, PhanHoiThongBaoDto, PhanHoiTokenDto } from './dto/phan-hoi-xac-thuc.dto';
import { YeuCauDatLaiMatKhauDto } from './dto/yeu-cau-dat-lai-mat-khau.dto';
import { JwtAccessGuard, type RequestDaXacThuc } from './jwt-access.guard';
import { XacThucService } from './xac-thuc.service';

@ApiTags('Xác thực')
@Controller('xac-thuc')
export class XacThucController {
  constructor(
    private readonly xacThucService: XacThucService,
    private readonly configService: ConfigService,
  ) {}

  @Post('dang-ky')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    operationId: 'dangKyKhachHang',
    summary: 'Đăng ký tài khoản khách hàng',
  })
  @ApiOkResponse({ type: PhanHoiDangKyDto })
  async dangKy(@Body() dto: DangKyDto): Promise<PhanHoiDangKyDto> {
    return {
      nguoiDung: await this.xacThucService.dangKy(dto),
    };
  }

  @Post('dang-nhap')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    operationId: 'dangNhap',
    summary: 'Đăng nhập',
  })
  @ApiOkResponse({ type: PhanHoiTokenDto })
  async dangNhap(
    @Body() dto: DangNhapDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PhanHoiTokenDto> {
    const ketQua = await this.xacThucService.dangNhap(dto.email, dto.matKhau);

    return this.traCapToken(response, ketQua, dto.nenTang);
  }

  @Post('lam-moi')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiCookieAuth('agrimarket_refresh')
  @ApiOperation({
    operationId: 'lamMoiToken',
    summary: 'Rotate refresh token và cấp access token mới',
  })
  @ApiOkResponse({ type: PhanHoiTokenDto })
  async lamMoi(
    @Body() dto: LamMoiTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PhanHoiTokenDto> {
    const refreshToken = this.layRefreshToken(request, dto);

    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token.');
    }

    const ketQua = await this.xacThucService.lamMoi(refreshToken);

    const nenTang =
      dto.nenTang ?? (dto.refreshToken ? NenTangDangNhap.MOBILE : NenTangDangNhap.WEB);

    return this.traCapToken(response, ketQua, nenTang);
  }

  @Post('dang-xuat')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('agrimarket_refresh')
  @ApiOperation({
    operationId: 'dangXuat',
    summary: 'Thu hồi phiên đăng nhập',
  })
  @ApiOkResponse({ type: PhanHoiThongBaoDto })
  async dangXuat(
    @Body() dto: LamMoiTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PhanHoiThongBaoDto> {
    const refreshToken = this.layRefreshToken(request, dto);

    await this.xacThucService.dangXuat(refreshToken);
    response.clearCookie(this.layCookieName(), {
      path: '/api/v1/xac-thuc',
    });

    return {
      thongBao: 'Đã đăng xuất.',
    };
  }

  @Post('quen-mat-khau')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    operationId: 'yeuCauDatLaiMatKhau',
    summary: 'Gửi email đặt lại mật khẩu',
  })
  @ApiOkResponse({ type: PhanHoiThongBaoDto })
  async quenMatKhau(@Body() dto: YeuCauDatLaiMatKhauDto): Promise<PhanHoiThongBaoDto> {
    await this.xacThucService.yeuCauDatLaiMatKhau(dto.email);

    return {
      thongBao: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.',
    };
  }

  @Post('dat-lai-mat-khau')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    operationId: 'datLaiMatKhau',
    summary: 'Đặt lại mật khẩu bằng mã một lần',
  })
  @ApiOkResponse({ type: PhanHoiThongBaoDto })
  async datLaiMatKhau(@Body() dto: DatLaiMatKhauDto): Promise<PhanHoiThongBaoDto> {
    await this.xacThucService.datLaiMatKhau(dto.maDatLai, dto.matKhauMoi);

    return {
      thongBao: 'Đã đặt lại mật khẩu.',
    };
  }

  @Post('doi-mat-khau')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'doiMatKhau',
    summary: 'Đổi mật khẩu khi đã đăng nhập',
  })
  @ApiOkResponse({ type: PhanHoiThongBaoDto })
  async doiMatKhau(
    @Body() dto: DoiMatKhauDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiThongBaoDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu thông tin người dùng.');
    }

    await this.xacThucService.doiMatKhau(nguoiDungId, dto.matKhauHienTai, dto.matKhauMoi);

    return {
      thongBao: 'Đã đổi mật khẩu.',
    };
  }

  private layRefreshToken(request: Request, dto: LamMoiTokenDto): string | undefined {
    return dto.refreshToken ?? request.cookies?.[this.layCookieName()];
  }

  private traCapToken(
    response: Response,
    ketQua: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      nguoiDung: {
        id: string;
        email: string;
        hoTen: string;
      };
    },
    nenTang: NenTangDangNhap,
  ): PhanHoiTokenDto {
    if (nenTang === NenTangDangNhap.WEB) {
      response.cookie(this.layCookieName(), ketQua.refreshToken, {
        httpOnly: true,
        secure: this.layCookieSecure(),
        sameSite: 'lax',
        path: '/api/v1/xac-thuc',
        maxAge: this.layRefreshTtlSeconds() * 1000,
      });

      return {
        accessToken: ketQua.accessToken,
        expiresIn: ketQua.expiresIn,
        nguoiDung: ketQua.nguoiDung,
      };
    }

    return ketQua;
  }

  private layCookieName(): string {
    return this.configService.get<string>('REFRESH_COOKIE_NAME') ?? 'agrimarket_refresh';
  }

  private layCookieSecure(): boolean {
    return (
      (this.configService.get<string>('REFRESH_COOKIE_SECURE') ??
        (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true'
    );
  }

  private layRefreshTtlSeconds(): number {
    return Number(this.configService.get<string>('JWT_REFRESH_TTL_SECONDS') ?? '604800');
  }
}
