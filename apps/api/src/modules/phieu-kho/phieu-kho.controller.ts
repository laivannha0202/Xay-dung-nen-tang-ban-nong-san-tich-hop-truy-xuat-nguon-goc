import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';
import { TruyVanPhieuKhoDto } from './dto/truy-van-phieu-kho.dto';
import { PhieuKhoService } from './phieu-kho.service';

@ApiTags('Phiếu kho')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/phieu-kho')
export class PhieuKhoController {
  constructor(private readonly service: PhieuKhoService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layDanhSachPhieuKho',
    summary: 'Danh sách chứng từ kho liên kết inventory ledger',
  })
  @ApiOkResponse({ description: 'Danh sách phiếu kho' })
  layDanhSach(@Query() dto: TruyVanPhieuKhoDto) {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layChiTietPhieuKho',
    summary: 'Chi tiết phiếu kho và ledger transaction liên kết',
  })
  @ApiOkResponse({ description: 'Chi tiết phiếu kho' })
  layChiTiet(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.layChiTiet(id);
  }
}
