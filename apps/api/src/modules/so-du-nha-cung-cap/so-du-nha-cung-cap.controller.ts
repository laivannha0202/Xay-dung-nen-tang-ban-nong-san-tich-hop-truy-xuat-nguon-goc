import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachSoDuNhaCungCapDto,
  SoDuNhaCungCapDto,
} from './dto/phan-hoi-so-du-nha-cung-cap.dto';
import { TruyVanSoDuNhaCungCapDto } from './dto/truy-van-so-du-nha-cung-cap.dto';
import { SoDuNhaCungCapService } from './so-du-nha-cung-cap.service';

@ApiTags('Số dư nhà cung cấp')
@ApiBearerAuth()
@Controller('quan-tri/so-du-nha-cung-cap')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class SoDuNhaCungCapController {
  constructor(private readonly service: SoDuNhaCungCapService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachSoDuNhaCungCap',
    summary: 'Lấy danh sách số dư nhà cung cấp',
  })
  @ApiOkResponse({ type: DanhSachSoDuNhaCungCapDto })
  layDanhSach(@Query() query: TruyVanSoDuNhaCungCapDto): Promise<DanhSachSoDuNhaCungCapDto> {
    return this.service.layDanhSach(query);
  }

  @Get(':nhaCungCapId')
  @ApiOperation({
    operationId: 'laySoDuNhaCungCap',
    summary: 'Lấy số dư một nhà cung cấp',
  })
  @ApiParam({ name: 'nhaCungCapId', format: 'uuid' })
  @ApiOkResponse({ type: SoDuNhaCungCapDto })
  layTheoNhaCungCap(@Param('nhaCungCapId') nhaCungCapId: string): Promise<SoDuNhaCungCapDto> {
    return this.service.layTheoNhaCungCap(nhaCungCapId);
  }
}
