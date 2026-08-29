import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';
import { PhanHoiDanhSachNhatKyDto } from './dto/phan-hoi-nhat-ky.dto';
import { TruyVanNhatKyDto } from './dto/truy-van-nhat-ky.dto';
import { NhatKyKiemToanService } from './nhat-ky-kiem-toan.service';

@ApiTags('Nhật ký kiểm toán')
@ApiBearerAuth()
@Controller('nhat-ky-kiem-toan')
export class NhatKyKiemToanController {
  constructor(private readonly service: NhatKyKiemToanService) {}

  @Get()
  @UseGuards(JwtAccessGuard, QuyenGuard)
  @YeuCauQuyen(MA_QUYEN.AUDIT_XEM)
  @ApiOperation({ operationId: 'layNhatKyKiemToan', summary: 'Lấy nhật ký kiểm toán' })
  @ApiOkResponse({ type: PhanHoiDanhSachNhatKyDto })
  layDanhSach(@Query() dto: TruyVanNhatKyDto): Promise<PhanHoiDanhSachNhatKyDto> {
    return this.service.layDanhSach(dto);
  }
}
