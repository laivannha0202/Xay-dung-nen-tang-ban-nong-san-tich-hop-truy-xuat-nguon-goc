import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { HoanTienThanhToanDto } from './dto/hoan-tien-thanh-toan.dto';
import { HoanTienThanhToanPhanHoiDto } from './dto/phan-hoi-hoan-tien-thanh-toan.dto';
import { ThanhToanHoanTienService } from './thanh-toan-hoan-tien.service';

@ApiTags('Quản trị thanh toán')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
@Controller('quan-tri/thanh-toan')
export class ThanhToanHoanTienController {
  constructor(private readonly service: ThanhToanHoanTienService) {}

  @Post(':thanhToanId/hoan-tien')
  @ApiOperation({
    operationId: 'hoanTienThanhToan',
    summary: 'Hoàn tiền qua Payment adapter, tổng refund không vượt paid amount',
  })
  @ApiOkResponse({ type: HoanTienThanhToanPhanHoiDto })
  hoanTien(
    @Req() request: RequestDaXacThuc,
    @Param('thanhToanId') thanhToanId: string,
    @Body() dto: HoanTienThanhToanDto,
  ): Promise<HoanTienThanhToanPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;
    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return this.service.hoanTien(nguoiDungId, thanhToanId, dto, request.ip ?? '127.0.0.1');
  }
}
