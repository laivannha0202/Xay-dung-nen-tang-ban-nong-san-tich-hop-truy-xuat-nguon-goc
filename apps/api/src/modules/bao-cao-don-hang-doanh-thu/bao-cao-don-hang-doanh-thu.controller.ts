import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { BaoCaoDonHangDoanhThuService } from './bao-cao-don-hang-doanh-thu.service';
import { BaoCaoDonHangDoanhThuDto } from './dto/phan-hoi-bao-cao-don-hang-doanh-thu.dto';
import { TruyVanBaoCaoDonHangDoanhThuDto } from './dto/truy-van-bao-cao-don-hang-doanh-thu.dto';

@ApiTags('Báo cáo đơn hàng/doanh thu')
@ApiBearerAuth()
@Controller('quan-tri/bao-cao-don-hang-doanh-thu')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class BaoCaoDonHangDoanhThuController {
  constructor(private readonly service: BaoCaoDonHangDoanhThuService) {}

  @Get()
  @ApiOperation({
    operationId: 'layBaoCaoDonHangDoanhThu',
    summary: 'Báo cáo order/revenue với filter ngày/farm/category',
  })
  @ApiOkResponse({ type: BaoCaoDonHangDoanhThuDto })
  layBaoCao(@Query() query: TruyVanBaoCaoDonHangDoanhThuDto): Promise<BaoCaoDonHangDoanhThuDto> {
    return this.service.layBaoCao(query);
  }
}
