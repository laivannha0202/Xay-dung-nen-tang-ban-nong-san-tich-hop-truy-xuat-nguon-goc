import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachHoanTienTaiChinhDto,
  DanhSachThanhToanTaiChinhDto,
} from './dto/phan-hoi-tai-chinh.dto';
import {
  TruyVanHoanTienTaiChinhDto,
  TruyVanThanhToanTaiChinhDto,
} from './dto/truy-van-tai-chinh.dto';
import { ThanhToanTaiChinhService } from './thanh-toan-tai-chinh.service';

@ApiTags('Tài chính quản trị')
@ApiBearerAuth()
@Controller('quan-tri/tai-chinh')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class ThanhToanTaiChinhController {
  constructor(private readonly service: ThanhToanTaiChinhService) {}

  @Get('thanh-toan')
  @ApiOperation({
    operationId: 'layDanhSachThanhToanTaiChinh',
    summary: 'Lấy danh sách payment phục vụ Finance Admin UI',
  })
  @ApiOkResponse({ type: DanhSachThanhToanTaiChinhDto })
  layDanhSachThanhToan(
    @Query() query: TruyVanThanhToanTaiChinhDto,
  ): Promise<DanhSachThanhToanTaiChinhDto> {
    return this.service.layDanhSachThanhToan(query);
  }

  @Get('hoan-tien')
  @ApiOperation({
    operationId: 'layDanhSachHoanTienTaiChinh',
    summary: 'Lấy danh sách refund transaction phục vụ Finance Admin UI',
  })
  @ApiOkResponse({ type: DanhSachHoanTienTaiChinhDto })
  layDanhSachHoanTien(
    @Query() query: TruyVanHoanTienTaiChinhDto,
  ): Promise<DanhSachHoanTienTaiChinhDto> {
    return this.service.layDanhSachHoanTien(query);
  }
}
