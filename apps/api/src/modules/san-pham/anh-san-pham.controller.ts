import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { AnhSanPhamService } from './anh-san-pham.service';
import { GanAnhSanPhamDto } from './dto/gan-anh-san-pham.dto';
import { DanhSachAnhSanPhamDto, PhanHoiXoaAnhSanPhamDto } from './dto/phan-hoi-anh-san-pham.dto';
import { SapXepAnhSanPhamDto } from './dto/sap-xep-anh-san-pham.dto';

@ApiTags('Ảnh sản phẩm')
@ApiBearerAuth()
@Controller('san-pham/:sanPhamId/anh')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class AnhSanPhamController {
  constructor(private readonly service: AnhSanPhamService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_XEM)
  @ApiOperation({ operationId: 'layDanhSachAnhSanPham', summary: 'Lấy ảnh sản phẩm' })
  @ApiOkResponse({ type: DanhSachAnhSanPhamDto })
  layDanhSach(@Param('sanPhamId') sanPhamId: string): Promise<DanhSachAnhSanPhamDto> {
    return this.service.layDanhSach(sanPhamId);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'ganNhieuAnhSanPham',
    summary: 'Gắn nhiều ảnh đã upload vào sản phẩm',
  })
  @ApiCreatedResponse({ type: DanhSachAnhSanPhamDto })
  ganNhieu(
    @Param('sanPhamId') sanPhamId: string,
    @Body() dto: GanAnhSanPhamDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<DanhSachAnhSanPhamDto> {
    return this.service.ganNhieu(this.layActor(request), sanPhamId, dto, this.layMetadata(request));
  }

  @Patch('sap-xep')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({ operationId: 'sapXepAnhSanPham', summary: 'Sắp xếp ảnh sản phẩm' })
  @ApiOkResponse({ type: DanhSachAnhSanPhamDto })
  sapXep(
    @Param('sanPhamId') sanPhamId: string,
    @Body() dto: SapXepAnhSanPhamDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<DanhSachAnhSanPhamDto> {
    return this.service.sapXep(this.layActor(request), sanPhamId, dto, this.layMetadata(request));
  }

  @Patch(':id/anh-bia')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({ operationId: 'datAnhBiaSanPham', summary: 'Đặt ảnh bìa sản phẩm' })
  @ApiOkResponse({ type: DanhSachAnhSanPhamDto })
  datAnhBia(
    @Param('sanPhamId') sanPhamId: string,
    @Param('id') id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<DanhSachAnhSanPhamDto> {
    return this.service.datAnhBia(this.layActor(request), sanPhamId, id, this.layMetadata(request));
  }

  @Delete(':id')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({ operationId: 'xoaAnhSanPham', summary: 'Xóa ảnh khỏi sản phẩm' })
  @ApiOkResponse({ type: PhanHoiXoaAnhSanPhamDto })
  async xoa(
    @Param('sanPhamId') sanPhamId: string,
    @Param('id') id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiXoaAnhSanPhamDto> {
    await this.service.xoa(this.layActor(request), sanPhamId, id, this.layMetadata(request));
    return { id, thongBao: 'Đã xóa ảnh khỏi sản phẩm.' };
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu tác nhân.');
    return id;
  }

  private layMetadata(request: RequestDaXacThuc) {
    const userAgent = request.headers['user-agent'];
    return {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    };
  }
}
