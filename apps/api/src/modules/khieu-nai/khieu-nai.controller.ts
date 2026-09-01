import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { KhieuNaiService } from './khieu-nai.service';
import {
  DanhSachKhieuNaiDto,
  DieuKienKhieuNaiMucDonHangDto,
  KhieuNaiDto,
} from './dto/phan-hoi-khieu-nai.dto';
import { TaoKhieuNaiDto } from './dto/tao-khieu-nai.dto';
import { TruyVanKhieuNaiDto } from './dto/truy-van-khieu-nai.dto';

@ApiTags('Khiếu nại')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khieu-nai')
export class KhieuNaiController {
  constructor(private readonly service: KhieuNaiService) {}

  @Post()
  @ApiOperation({
    operationId: 'taoKhieuNai',
    summary: 'Khách tạo khiếu nại cho order item đã giao',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  tao(@Req() request: RequestDaXacThuc, @Body() dto: TaoKhieuNaiDto): Promise<KhieuNaiDto> {
    return this.service.tao(this.layNguoiDungId(request), dto);
  }

  @Get('muc-don-hang/:mucDonHangId/dieu-kien')
  @ApiOperation({
    operationId: 'layDieuKienKhieuNaiMucDonHang',
    summary: 'Kiểm tra order item có đủ điều kiện khiếu nại',
  })
  @ApiOkResponse({ type: DieuKienKhieuNaiMucDonHangDto })
  layDieuKien(
    @Req() request: RequestDaXacThuc,
    @Param('mucDonHangId') mucDonHangId: string,
  ): Promise<DieuKienKhieuNaiMucDonHangDto> {
    return this.service.layDieuKienMuc(this.layNguoiDungId(request), mucDonHangId);
  }

  @Get('cua-toi')
  @ApiOperation({
    operationId: 'layDanhSachKhieuNaiCuaToi',
    summary: 'Danh sách khiếu nại của khách hiện tại',
  })
  @ApiOkResponse({ type: DanhSachKhieuNaiDto })
  layDanhSach(
    @Req() request: RequestDaXacThuc,
    @Query() query: TruyVanKhieuNaiDto,
  ): Promise<DanhSachKhieuNaiDto> {
    return this.service.layDanhSachCuaToi(this.layNguoiDungId(request), query);
  }

  @Get('cua-toi/:id')
  @ApiOperation({
    operationId: 'layChiTietKhieuNaiCuaToi',
    summary: 'Chi tiết khiếu nại thuộc khách hiện tại',
  })
  @ApiOkResponse({ type: KhieuNaiDto })
  layChiTiet(@Req() request: RequestDaXacThuc, @Param('id') id: string): Promise<KhieuNaiDto> {
    return this.service.layChiTietCuaToi(this.layNguoiDungId(request), id);
  }

  private layNguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
