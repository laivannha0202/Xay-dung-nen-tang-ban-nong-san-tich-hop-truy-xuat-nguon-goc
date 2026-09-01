import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { DonHangService } from './don-hang.service';
import { LocDonHangQuanTriDto } from './dto/loc-don-hang-quan-tri.dto';
import {
  ChiTietDonHangQuanTriDto,
  DanhSachDonHangQuanTriDto,
} from './dto/phan-hoi-don-hang-quan-tri.dto';

@ApiTags('Đơn hàng quản trị')
@ApiBearerAuth()
@Controller('quan-tri/don-hang')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class DonHangQuanTriController {
  constructor(private readonly service: DonHangService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'layDanhSachDonHangQuanTri',
    summary: 'Lấy danh sách đơn hàng cho nhân viên/admin',
  })
  @ApiOkResponse({ type: DanhSachDonHangQuanTriDto })
  layDanhSach(@Query() query: LocDonHangQuanTriDto): Promise<DanhSachDonHangQuanTriDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'layChiTietDonHangQuanTri',
    summary: 'Lấy chi tiết đơn hàng cho nhân viên/admin',
  })
  @ApiOkResponse({ type: ChiTietDonHangQuanTriDto })
  layChiTiet(@Param('id') id: string): Promise<ChiTietDonHangQuanTriDto> {
    return this.service.layChiTietQuanTri(id);
  }
}
