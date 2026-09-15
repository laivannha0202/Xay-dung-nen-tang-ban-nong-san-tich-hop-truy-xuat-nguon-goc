import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { CapNhatTrangThaiVanChuyenDto } from './dto/cap-nhat-trang-thai-van-chuyen.dto';
import {
  GiaoHangService,
  type PhanHoiCapNhatVanChuyenQuanTri,
} from './giao-hang.service';

@ApiTags('Giao hàng quản trị')
@ApiBearerAuth()
@Controller('quan-tri/giao-hang')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class GiaoHangQuanTriController {
  constructor(private readonly service: GiaoHangService) {}

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'capNhatTrangThaiVanChuyenQuanTri',
    summary: 'Cập nhật trạng thái vận chuyển; DELIVERED tự ghi nhận COD đã thu khi toàn đơn giao xong',
  })
  @ApiOkResponse({
    description: 'Trạng thái vận chuyển, đơn hàng và COD sau đồng bộ',
  })
  capNhatTrangThai(
    @Param('id') id: string,
    @Body() dto: CapNhatTrangThaiVanChuyenDto,
  ): Promise<PhanHoiCapNhatVanChuyenQuanTri> {
    return this.service.capNhatTrangThaiQuanTri(id, dto);
  }
}
