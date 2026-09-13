import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  TrangChuCongKhaiDto,
  TruyVanNoiDungTrangChuCongKhaiDto,
} from './dto/noi-dung-trang-chu.dto';
import { NoiDungTrangChuService } from './noi-dung-trang-chu.service';

@ApiTags('Nội dung trang chủ công khai')
@Controller('noi-dung-trang-chu-cong-khai')
export class NoiDungTrangChuCongKhaiController {
  constructor(private readonly service: NoiDungTrangChuService) {}

  @Get()
  @ApiOperation({
    operationId: 'layNoiDungTrangChuCongKhai',
    summary: 'Nội dung trang chủ công khai (banner, kiến thức, câu chuyện trang trại)',
  })
  @ApiOkResponse({ type: TrangChuCongKhaiDto })
  layTrangChu(
    @Query() query: TruyVanNoiDungTrangChuCongKhaiDto,
  ): Promise<TrangChuCongKhaiDto> {
    return this.service.layTrangChuCongKhai(query);
  }
}
