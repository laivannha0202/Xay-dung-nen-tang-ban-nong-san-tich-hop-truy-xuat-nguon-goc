import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  DanhSachSanPhamCongKhaiDto,
  SanPhamCongKhaiChiTietDto,
} from './dto/phan-hoi-san-pham-cong-khai.dto';
import { TruyVanSanPhamCongKhaiDto } from './dto/truy-van-san-pham-cong-khai.dto';
import { SanPhamCongKhaiService } from './san-pham-cong-khai.service';

@ApiTags('Sản phẩm công khai')
@Controller('san-pham-cong-khai')
export class SanPhamCongKhaiController {
  constructor(private readonly service: SanPhamCongKhaiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachSanPhamCongKhai',
    summary: 'Danh sách sản phẩm công khai',
  })
  @ApiOkResponse({ type: DanhSachSanPhamCongKhaiDto })
  layDanhSach(@Query() dto: TruyVanSanPhamCongKhaiDto): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.service.layDanhSach(dto);
  }

  @Get('danh-muc/:slug')
  @ApiOperation({
    operationId: 'laySanPhamTheoDanhMucCongKhai',
    summary: 'Sản phẩm công khai theo danh mục',
  })
  @ApiOkResponse({ type: DanhSachSanPhamCongKhaiDto })
  @ApiNotFoundResponse({ description: 'Danh mục không public hoặc không tồn tại' })
  layTheoDanhMuc(
    @Param('slug') slug: string,
    @Query() dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.service.layTheoDanhMuc(slug, dto);
  }

  @Get('trang-trai/:trangTraiId')
  @ApiOperation({
    operationId: 'laySanPhamTheoTrangTraiCongKhai',
    summary: 'Sản phẩm công khai theo trang trại',
  })
  @ApiOkResponse({ type: DanhSachSanPhamCongKhaiDto })
  @ApiNotFoundResponse({ description: 'Trang trại không public hoặc không tồn tại' })
  layTheoTrangTrai(
    @Param('trangTraiId') trangTraiId: string,
    @Query() dto: TruyVanSanPhamCongKhaiDto,
  ): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.service.layTheoTrangTrai(trangTraiId, dto);
  }

  @Get(':id/lien-quan')
  @ApiOperation({
    operationId: 'laySanPhamLienQuanCongKhai',
    summary: 'Sản phẩm công khai liên quan',
  })
  @ApiOkResponse({ type: DanhSachSanPhamCongKhaiDto })
  @ApiNotFoundResponse({ description: 'Sản phẩm không public hoặc không tồn tại' })
  layLienQuan(@Param('id') id: string): Promise<DanhSachSanPhamCongKhaiDto> {
    return this.service.layLienQuan(id);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietSanPhamCongKhai',
    summary: 'Chi tiết sản phẩm công khai',
  })
  @ApiOkResponse({ type: SanPhamCongKhaiChiTietDto })
  @ApiNotFoundResponse({ description: 'Sản phẩm không public hoặc không tồn tại' })
  layChiTiet(@Param('id') id: string): Promise<SanPhamCongKhaiChiTietDto> {
    return this.service.layChiTiet(id);
  }
}
