import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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

import { KhieuNaiService } from './khieu-nai.service';
import {
  CapNhatXuLyKhieuNaiDto,
  HoanTienKhieuNaiDto,
} from './dto/xu-ly-khieu-nai.dto';
import {
  DanhSachKhieuNaiDto,
  KhieuNaiDto,
  ThongKeKhieuNaiDto,
} from './dto/phan-hoi-khieu-nai.dto';
import { TruyVanKhieuNaiDto } from './dto/truy-van-khieu-nai.dto';

@ApiTags('Quản trị khiếu nại')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
@Controller('quan-tri/khieu-nai')
export class KhieuNaiQuanTriController {
  constructor(private readonly service: KhieuNaiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachKhieuNaiQuanTri',
    summary: 'Danh sách khiếu nại cho nhân viên xử lý đơn',
  })
  @ApiOkResponse({ type: DanhSachKhieuNaiDto })
  layDanhSach(@Query() query: TruyVanKhieuNaiDto): Promise<DanhSachKhieuNaiDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get('thong-ke')
  @ApiOperation({
    operationId: 'layThongKeKhieuNaiQuanTri',
    summary: 'Thống kê khiếu nại cho nhân viên CSKH',
  })
  @ApiOkResponse({ type: ThongKeKhieuNaiDto })
  layThongKe(): Promise<ThongKeKhieuNaiDto> {
    return this.service.layThongKeQuanTri();
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietKhieuNaiQuanTri',
    summary: 'Chi tiết khiếu nại cho quản trị',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  layChiTiet(@Param('id') id: string): Promise<KhieuNaiDto> {
    return this.service.layChiTietQuanTri(id);
  }

  @Patch(':id/xu-ly')
  @ApiOperation({
    operationId: 'capNhatXuLyKhieuNaiQuanTri',
    summary: 'Chuyển trạng thái và phản hồi khiếu nại',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  capNhatXuLy(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: CapNhatXuLyKhieuNaiDto,
  ): Promise<KhieuNaiDto> {
    return this.service.capNhatXuLyQuanTri(this.nguoiDungId(request), id, dto);
  }

  @Post(':id/hoan-tien')
  @ApiOperation({
    operationId: 'hoanTienTheoKhieuNaiQuanTri',
    summary: 'Hoàn tiền cho payment của đơn liên quan và đánh dấu khiếu nại đã hoàn tiền',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  hoanTien(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: HoanTienKhieuNaiDto,
  ): Promise<KhieuNaiDto> {
    return this.service.hoanTienQuanTri(
      this.nguoiDungId(request),
      id,
      dto,
      request.ip ?? '127.0.0.1',
    );
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }
}

// AGRIMARKET-CUSTOMER-BUSINESS-FULL-V1
