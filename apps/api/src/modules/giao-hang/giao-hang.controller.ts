import { Controller, Get, Param, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { GiaoHangDonHangCuaToiDto } from './dto/phan-hoi-giao-hang-khach.dto';
import { GiaoHangService } from './giao-hang.service';

@ApiTags('Giao hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('giao-hang')
export class GiaoHangController {
  constructor(private readonly service: GiaoHangService) {}

  @Get('don-hang/:donHangId')
  @ApiOperation({
    operationId: 'layGiaoHangDonHangCuaToi',
    summary: 'Theo dõi các vận đơn thuộc đơn hàng của khách hiện tại',
  })
  @ApiOkResponse({ type: GiaoHangDonHangCuaToiDto })
  layTheoDonHang(
    @Req() request: RequestDaXacThuc,
    @Param('donHangId') donHangId: string,
  ): Promise<GiaoHangDonHangCuaToiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    return this.service.layTheoDonHangCuaToi(nguoiDungId, donHangId);
  }
}
