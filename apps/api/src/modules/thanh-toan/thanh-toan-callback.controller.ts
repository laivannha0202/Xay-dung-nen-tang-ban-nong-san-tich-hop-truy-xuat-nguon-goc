import { ConfigService } from '@nestjs/config';
import { BadRequestException, Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { PhanHoiCallbackThanhToanDto } from './dto/phan-hoi-callback-thanh-toan.dto';
import { TEN_PAYMENT_GATEWAY, type TenPaymentGateway } from './gateway/payment-gateway.adapter';
import { ThanhToanCallbackService } from './thanh-toan-callback.service';

@ApiTags('Thanh toán')
@Controller('thanh-toan/callback')
export class ThanhToanCallbackController {
  constructor(
    private readonly service: ThanhToanCallbackService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':gateway/mobile')
  @Redirect()
  @ApiOperation({
    operationId: 'xuLyCallbackThanhToanMobile',
    summary: 'Verify payment callback rồi redirect về Mobile deep link cố định',
  })
  async xuLyMobile(
    @Param('gateway') gatewayRaw: string,
    @Query() query: Record<string, unknown>,
  ): Promise<{ url: string; statusCode: number }> {
    const gateway = this.gateway(gatewayRaw);
    const result = await this.service.xuLy(gateway, query);

    const base =
      this.configService.get<string>('MOBILE_PAYMENT_RETURN_URL')?.trim() ??
      'agrimarket://thanh-toan/ket-qua';

    if (!base.startsWith('agrimarket://')) {
      throw new BadRequestException(
        'MOBILE_PAYMENT_RETURN_URL phải dùng scheme agrimarket://.',
      );
    }

    const url = new URL(base);
    this.ganKetQua(url, result);

    return { url: url.toString(), statusCode: 302 };
  }

  @Get(':gateway/web')
  @Redirect()
  @ApiOperation({
    operationId: 'xuLyCallbackThanhToanWeb',
    summary: 'Verify payment callback rồi redirect về Customer Web cố định',
  })
  async xuLyWeb(
    @Param('gateway') gatewayRaw: string,
    @Query() query: Record<string, unknown>,
  ): Promise<{ url: string; statusCode: number }> {
    const gateway = this.gateway(gatewayRaw);
    const result = await this.service.xuLy(gateway, query);
    const base = this.customerWebReturnUrl();
    const url = new URL('/thanh-toan/ket-qua', base);
    this.ganKetQua(url, result);

    return { url: url.toString(), statusCode: 302 };
  }

  @Get(':gateway')
  @ApiOperation({
    operationId: 'xuLyCallbackThanhToan',
    summary: 'Verify và xử lý payment callback idempotent',
  })
  @ApiParam({
    name: 'gateway',
    enum: TEN_PAYMENT_GATEWAY,
  })
  @ApiOkResponse({
    type: PhanHoiCallbackThanhToanDto,
  })
  xuLy(
    @Param('gateway') gatewayRaw: string,
    @Query() query: Record<string, unknown>,
  ): Promise<PhanHoiCallbackThanhToanDto> {
    const gateway = this.gateway(gatewayRaw);
    return this.service.xuLy(gateway, query);
  }

  private ganKetQua(url: URL, result: PhanHoiCallbackThanhToanDto): void {
    url.searchParams.set('donHangId', result.donHangId);
    url.searchParams.set('paymentId', result.paymentId);
    url.searchParams.set('maDonHang', result.maDonHang);
    url.searchParams.set('trangThai', result.success ? 'success' : 'failure');
  }

  private customerWebReturnUrl(): URL {
    const raw =
      this.configService.get<string>('CUSTOMER_WEB_URL')?.trim() ??
      'http://127.0.0.1:3001';

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new BadRequestException('CUSTOMER_WEB_URL không phải URL hợp lệ.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('CUSTOMER_WEB_URL phải dùng http hoặc https.');
    }

    return parsed;
  }

  private gateway(value: string): TenPaymentGateway {
    if (value === 'MOCK' || value === 'VNPAY_SANDBOX') {
      return value;
    }

    throw new BadRequestException(`Payment gateway không hỗ trợ: ${value}`);
  }
}
