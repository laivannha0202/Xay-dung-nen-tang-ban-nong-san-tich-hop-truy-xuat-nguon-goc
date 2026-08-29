import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TrangTraiChiTietDto } from './dto/phan-hoi-trang-trai.dto';
import { TrangTraiService } from './trang-trai.service';

@ApiTags('Trang trại công khai')
@Controller('cong-khai/trang-trai')
export class TrangTraiCongKhaiController {
  constructor(private readonly service: TrangTraiService) {}

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietTrangTraiCongKhai',
    summary: 'Lấy chi tiết trang trại công khai',
  })
  @ApiOkResponse({
    type: TrangTraiChiTietDto,
  })
  layChiTiet(@Param('id') id: string): Promise<TrangTraiChiTietDto> {
    return this.service.layCongKhai(id);
  }
}
