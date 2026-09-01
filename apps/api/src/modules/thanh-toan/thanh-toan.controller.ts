import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { ThanhToanPhanHoiDto } from './dto/phan-hoi-thanh-toan.dto';
import { TaoThanhToanDto } from './dto/tao-thanh-toan.dto';
import { ThanhToanService } from './thanh-toan.service';

@ApiTags('Thanh toán')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('thanh-toan')
export class ThanhToanController {
  constructor(private readonly service: ThanhToanService) {}

  @Post()
  @ApiOperation({
    operationId: 'taoThanhToan',
    summary: 'Tạo thanh toán COD hoặc Mock không phụ thuộc gateway thật',
  })
  @ApiCreatedResponse({
    type: ThanhToanPhanHoiDto,
  })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: TaoThanhToanDto,
  ): Promise<ThanhToanPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    return this.service.tao(nguoiDungId, dto);
  }
}
