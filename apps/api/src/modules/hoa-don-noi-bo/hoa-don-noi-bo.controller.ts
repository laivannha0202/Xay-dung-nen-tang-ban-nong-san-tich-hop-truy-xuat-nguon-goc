import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';
import { TruyVanHoaDonNoiBoDto } from './dto/truy-van-hoa-don-noi-bo.dto';
import { HoaDonNoiBoService } from './hoa-don-noi-bo.service';

@ApiTags('Hóa đơn bán hàng nội bộ')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/hoa-don-noi-bo')
export class HoaDonNoiBoController {
  constructor(private readonly service: HoaDonNoiBoService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'layDanhSachHoaDonNoiBo',
    summary: 'Danh sách hóa đơn bán hàng nội bộ',
  })
  @ApiOkResponse({ description: 'Danh sách hóa đơn nội bộ' })
  layDanhSach(@Query() dto: TruyVanHoaDonNoiBoDto) {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'layChiTietHoaDonNoiBo',
    summary: 'Chi tiết hóa đơn bán hàng nội bộ',
  })
  @ApiOkResponse({ description: 'Chi tiết hóa đơn nội bộ' })
  layChiTiet(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.layChiTiet(id);
  }

  @Post('don-hang/:donHangId/phat-hanh')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'phatHanhHoaDonNoiBo',
    summary: 'Phát hành idempotent hóa đơn nội bộ từ snapshot đơn hàng',
  })
  @ApiCreatedResponse({ description: 'Hóa đơn nội bộ đã phát hành' })
  phatHanh(@Param('donHangId', ParseUUIDPipe) donHangId: string, @Req() request: RequestDaXacThuc) {
    const actorId = request.nguoiDungXacThuc?.id;
    if (!actorId) throw new UnauthorizedException('Thiếu tác nhân.');
    return this.service.phatHanh(donHangId, actorId);
  }
}
