import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { TruyXuatCongKhaiDto } from './dto/phan-hoi-truy-xuat-cong-khai.dto';
import { TruyXuatCongKhaiService } from './truy-xuat-cong-khai.service';

@ApiTags('Truy xuất công khai')
@Controller('truy-xuat')
export class TruyXuatCongKhaiController {
  constructor(private readonly service: TruyXuatCongKhaiService) {}

  @Get(':ma')
  @ApiOperation({
    operationId: 'layTruyXuatCongKhai',
    summary: 'Tra cứu nguồn gốc công khai bằng mã truy xuất',
  })
  @ApiParam({
    name: 'ma',
    example: 'AGM-0123456789ABCDEF0123456789ABCDEF',
    description: 'Stable trace code trên QR của Lô sản phẩm',
  })
  @ApiOkResponse({
    type: TruyXuatCongKhaiDto,
  })
  @ApiNotFoundResponse({
    description: 'Mã truy xuất không hợp lệ hoặc không tồn tại',
  })
  layTheoMa(
    @Param('ma')
    ma: string,
  ): Promise<TruyXuatCongKhaiDto> {
    return this.service.layTheoMa(ma);
  }
}
