import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { DanhSachTonKhoLoDto, TonKhoLoDto } from './dto/phan-hoi-ton-kho.dto';
import { TruyVanTonKhoDto } from './dto/truy-van-ton-kho.dto';
import { TonKhoService } from './ton-kho.service';

@ApiTags('Tồn kho')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('ton-kho')
export class TonKhoController {
  constructor(private readonly service: TonKhoService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layDanhSachTonKho',
    summary: 'Lấy danh sách tồn kho theo Kho + Lô + Biến thể',
  })
  @ApiOkResponse({ type: DanhSachTonKhoLoDto })
  layDanhSach(@Query() dto: TruyVanTonKhoDto): Promise<DanhSachTonKhoLoDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layChiTietTonKho',
    summary: 'Lấy chi tiết tồn kho theo lô',
  })
  @ApiOkResponse({ type: TonKhoLoDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tồn kho theo lô' })
  layChiTiet(@Param('id', ParseUUIDPipe) id: string): Promise<TonKhoLoDto> {
    return this.service.layChiTiet(id);
  }
}
