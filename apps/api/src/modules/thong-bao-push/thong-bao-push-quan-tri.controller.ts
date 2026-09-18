import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { GuiThuPushPhanHoiDto } from './dto/phan-hoi-thiet-bi-push.dto';
import { GuiThongBaoPushQuanTriDto } from './dto/quan-tri-thong-bao-push.dto';
import { ThongBaoPushService } from './thong-bao-push.service';

@ApiTags('Quản trị thông báo Push')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/thong-bao-push')
export class ThongBaoPushQuanTriController {
  constructor(private readonly service: ThongBaoPushService) {}

  @Post('gui')
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({
    operationId: 'guiThongBaoPushQuanTri',
    summary: 'Gửi Push tới toàn bộ thiết bị đang hoạt động',
  })
  @ApiOkResponse({ type: GuiThuPushPhanHoiDto })
  gui(@Body() dto: GuiThongBaoPushQuanTriDto): Promise<GuiThuPushPhanHoiDto> {
    return this.service.guiQuanTri(dto);
  }
}
