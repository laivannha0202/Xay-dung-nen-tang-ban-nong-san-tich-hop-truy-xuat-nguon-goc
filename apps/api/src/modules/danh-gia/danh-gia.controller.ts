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

import { DanhGiaService } from './danh-gia.service';
import {
  DanhGiaDto,
  DanhSachDanhGiaSanPhamDto,
  TrangThaiDanhGiaMucDonHangDto,
} from './dto/phan-hoi-danh-gia.dto';
import { TaoDanhGiaDto } from './dto/tao-danh-gia.dto';
import { TruyVanDanhGiaSanPhamDto } from './dto/truy-van-danh-gia-san-pham.dto';

@ApiTags('Đánh giá')
@Controller('danh-gia')
export class DanhGiaController {
  constructor(private readonly service: DanhGiaService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    operationId: 'taoDanhGia',
    summary: 'Khách đánh giá một order item đã giao',
  })
  @ApiOkResponse({ type: DanhGiaDto })
  tao(@Req() request: RequestDaXacThuc, @Body() dto: TaoDanhGiaDto): Promise<DanhGiaDto> {
    return this.service.tao(this.layNguoiDungId(request), dto);
  }

  @Get('muc-don-hang/:mucDonHangId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    operationId: 'layTrangThaiDanhGiaMucDonHang',
    summary: 'Kiểm tra eligibility/review của order item thuộc khách hiện tại',
  })
  @ApiOkResponse({ type: TrangThaiDanhGiaMucDonHangDto })
  layTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('mucDonHangId') mucDonHangId: string,
  ): Promise<TrangThaiDanhGiaMucDonHangDto> {
    return this.service.layTrangThaiMuc(this.layNguoiDungId(request), mucDonHangId);
  }

  @Get('san-pham/:sanPhamId')
  @ApiOperation({
    operationId: 'layDanhSachDanhGiaSanPham',
    summary: 'Danh sách đánh giá công khai của sản phẩm',
  })
  @ApiOkResponse({ type: DanhSachDanhGiaSanPhamDto })
  layTheoSanPham(
    @Param('sanPhamId') sanPhamId: string,
    @Query() query: TruyVanDanhGiaSanPhamDto,
  ): Promise<DanhSachDanhGiaSanPhamDto> {
    return this.service.layDanhSachSanPham(sanPhamId, query);
  }

  private layNguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
