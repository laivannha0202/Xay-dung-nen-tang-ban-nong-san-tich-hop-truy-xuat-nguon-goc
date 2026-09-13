import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DanhSachTrangTraiCongKhaiDto,
  TrangTraiCongKhaiChiTietDto,
} from './dto/phan-hoi-trang-trai.dto';
import { TruyVanTrangTraiCongKhaiDto } from './dto/truy-van-trang-trai-cong-khai.dto';
import { TrangTraiService } from './trang-trai.service';

@ApiTags('Trang trại công khai')
@Controller('cong-khai/trang-trai')
export class TrangTraiCongKhaiController {
  constructor(private readonly service: TrangTraiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachTrangTraiCongKhai',
    summary: 'Danh sách trang trại công khai (lọc trang trại tiêu biểu trang chủ)',
  })
  @ApiOkResponse({ type: DanhSachTrangTraiCongKhaiDto })
  layDanhSach(
    @Query() dto: TruyVanTrangTraiCongKhaiDto,
  ): Promise<DanhSachTrangTraiCongKhaiDto> {
    return this.service.layDanhSachCongKhai(dto);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietTrangTraiCongKhai',
    summary: 'Lấy chi tiết trang trại công khai',
  })
  @ApiOkResponse({
    type: TrangTraiCongKhaiChiTietDto,
  })
  layChiTiet(@Param('id') id: string): Promise<TrangTraiCongKhaiChiTietDto> {
    return this.service.layCongKhai(id);
  }
}
