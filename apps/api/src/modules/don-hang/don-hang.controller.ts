import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { DonHangService } from './don-hang.service';
import { DonHangPhanHoiDto } from './dto/phan-hoi-don-hang.dto';
import { TaoDonHangDto } from './dto/tao-don-hang.dto';

@ApiTags('Đơn hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('don-hang')
export class DonHangController {
  constructor(private readonly service: DonHangService) {}

  @Post()
  @ApiOperation({
    operationId: 'taoDonHang',
    summary: 'Validate cart/price, reserve FEFO và tạo đơn hàng',
  })
  @ApiCreatedResponse({ type: DonHangPhanHoiDto })
  tao(@Req() request: RequestDaXacThuc, @Body() dto: TaoDonHangDto): Promise<DonHangPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    return this.service.tao(nguoiDungId, dto);
  }
}
