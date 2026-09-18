import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  CapNhatHienThiDanhGiaQuanTriDto,
  DanhGiaQuanTriDto,
  DanhSachDanhGiaQuanTriDto,
  LocDanhGiaQuanTriDto,
} from './dto/quan-tri-danh-gia.dto';
import { DanhGiaQuanTriService } from './danh-gia-quan-tri.service';

@ApiTags('Quản trị đánh giá')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/danh-gia')
export class DanhGiaQuanTriController {
  constructor(private readonly service: DanhGiaQuanTriService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({
    operationId: 'layDanhSachDanhGiaQuanTri',
    summary: 'Danh sách đánh giá quản trị',
  })
  @ApiOkResponse({ type: DanhSachDanhGiaQuanTriDto })
  layDanhSach(@Query() query: LocDanhGiaQuanTriDto): Promise<DanhSachDanhGiaQuanTriDto> {
    return this.service.layDanhSach(query);
  }

  @Patch(':id/hien-thi')
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({
    operationId: 'capNhatHienThiDanhGiaQuanTri',
    summary: 'Ẩn/hiện đánh giá, không sửa nội dung khách',
  })
  @ApiOkResponse({ type: DanhGiaQuanTriDto })
  capNhatHienThi(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: CapNhatHienThiDanhGiaQuanTriDto,
  ): Promise<DanhGiaQuanTriDto> {
    const actorId = request.nguoiDungXacThuc?.id;
    if (!actorId) throw new UnauthorizedException('Thiếu tác nhân quản trị.');
    return this.service.capNhatHienThi(actorId, id, dto);
  }
}
