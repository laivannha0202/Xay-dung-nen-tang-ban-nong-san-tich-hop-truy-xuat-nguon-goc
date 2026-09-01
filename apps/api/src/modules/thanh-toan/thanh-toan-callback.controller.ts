import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { PhanHoiCallbackThanhToanDto } from './dto/phan-hoi-callback-thanh-toan.dto';
import { TEN_PAYMENT_GATEWAY, type TenPaymentGateway } from './gateway/payment-gateway.adapter';
import { ThanhToanCallbackService } from './thanh-toan-callback.service';

@ApiTags('Thanh toán')
@Controller('thanh-toan/callback')
export class ThanhToanCallbackController {
  constructor(private readonly service: ThanhToanCallbackService) {}

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

  private gateway(value: string): TenPaymentGateway {
    if (value === 'MOCK' || value === 'VNPAY_SANDBOX') {
      return value;
    }

    throw new BadRequestException(`Payment gateway không hỗ trợ: ${value}`);
  }
}
