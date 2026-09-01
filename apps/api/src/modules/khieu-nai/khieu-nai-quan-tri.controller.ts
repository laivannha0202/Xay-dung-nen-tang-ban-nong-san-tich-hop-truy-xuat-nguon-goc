import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { KhieuNaiService } from './khieu-nai.service';
import { DanhSachKhieuNaiDto, KhieuNaiDto } from './dto/phan-hoi-khieu-nai.dto';
import { TruyVanKhieuNaiDto } from './dto/truy-van-khieu-nai.dto';

@ApiTags('Quản trị khiếu nại')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
@Controller('quan-tri/khieu-nai')
export class KhieuNaiQuanTriController {
  constructor(private readonly service: KhieuNaiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachKhieuNaiQuanTri',
    summary: 'Danh sách khiếu nại cho nhân viên xử lý đơn',
  })
  @ApiOkResponse({ type: DanhSachKhieuNaiDto })
  layDanhSach(@Query() query: TruyVanKhieuNaiDto): Promise<DanhSachKhieuNaiDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietKhieuNaiQuanTri',
    summary: 'Chi tiết khiếu nại cho quản trị',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  layChiTiet(@Param('id') id: string): Promise<KhieuNaiDto> {
    return this.service.layChiTietQuanTri(id);
  }
}
