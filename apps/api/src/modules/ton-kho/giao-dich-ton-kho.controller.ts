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

import { DanhSachGiaoDichTonKhoDto, GiaoDichTonKhoDto } from './dto/phan-hoi-giao-dich-ton-kho.dto';
import { TruyVanGiaoDichTonKhoDto } from './dto/truy-van-giao-dich-ton-kho.dto';
import { GiaoDichTonKhoService } from './giao-dich-ton-kho.service';

@ApiTags('Giao dịch tồn kho')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('giao-dich-ton-kho')
export class GiaoDichTonKhoController {
  constructor(private readonly service: GiaoDichTonKhoService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layDanhSachGiaoDichTonKho',
    summary: 'Lấy immutable Inventory Transaction Ledger',
  })
  @ApiOkResponse({ type: DanhSachGiaoDichTonKhoDto })
  layDanhSach(@Query() dto: TruyVanGiaoDichTonKhoDto): Promise<DanhSachGiaoDichTonKhoDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layChiTietGiaoDichTonKho',
    summary: 'Lấy chi tiết một giao dịch tồn kho',
  })
  @ApiOkResponse({ type: GiaoDichTonKhoDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy giao dịch tồn kho' })
  layChiTiet(@Param('id', ParseUUIDPipe) id: string): Promise<GiaoDichTonKhoDto> {
    return this.service.layChiTiet(id);
  }
}
