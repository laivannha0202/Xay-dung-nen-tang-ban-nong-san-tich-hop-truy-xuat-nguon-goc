import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { DiaBanHungYenService } from './dia-ban-hung-yen.service';
import {
  ThonToDanPhoPhanHoiDto,
  XaPhuongHungYenPhanHoiDto,
} from './dto/phan-hoi-dia-ban-hung-yen.dto';
import { TruyVanXaPhuongHungYenDto } from './dto/truy-van-dia-ban-hung-yen.dto';

@ApiTags('Địa bàn Hưng Yên')
@Controller('dia-ban-hung-yen')
export class DiaBanHungYenController {
  constructor(private readonly service: DiaBanHungYenService) {}

  @Get('xa-phuong')
  @ApiOperation({
    operationId: 'layDanhSachXaPhuongHungYen',
    summary: 'Lấy danh sách 104 xã/phường tỉnh Hưng Yên (snapshot 14/09/2026)',
  })
  @ApiOkResponse({ type: [XaPhuongHungYenPhanHoiDto] })
  layDanhSachXaPhuong(
    @Query() query: TruyVanXaPhuongHungYenDto,
  ): Promise<XaPhuongHungYenPhanHoiDto[]> {
    return this.service.layDanhSachXaPhuong(query.tuKhoa);
  }

  @Get('xa-phuong/:ma/thon-to-dan-pho')
  @ApiOperation({
    operationId: 'layDanhSachThonToDanPhoTheoXaPhuong',
    summary:
      'Lấy thôn/tổ dân phố theo xã/phường (toàn tỉnh NOT_COMPLETE — xã chưa công bố trả về rỗng)',
  })
  @ApiParam({ name: 'ma', example: 'HY-C079' })
  @ApiOkResponse({ type: [ThonToDanPhoPhanHoiDto] })
  layDanhSachThonToDanPho(
    @Param('ma') ma: string,
  ): Promise<ThonToDanPhoPhanHoiDto[]> {
    return this.service.layDanhSachThonToDanPhoTheoXaPhuong(ma);
  }
}
