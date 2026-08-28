import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PhanHoiSucKhoeDto } from './dto/phan-hoi-suc-khoe.dto';
import { SucKhoeService } from './suc-khoe.service';

@ApiTags('Sức khỏe')
@Controller('suc-khoe')
export class SucKhoeController {
  constructor(private readonly sucKhoeService: SucKhoeService) {}

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái hoạt động của API',
  })
  @ApiOkResponse({
    description: 'API đang hoạt động bình thường',
    type: PhanHoiSucKhoeDto,
  })
  layTrangThai(): PhanHoiSucKhoeDto {
    return this.sucKhoeService.layTrangThai();
  }
}
