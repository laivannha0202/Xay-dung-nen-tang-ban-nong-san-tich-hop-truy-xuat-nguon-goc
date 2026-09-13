import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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

import {
  ChienDichFlashSaleChiTietDto,
  DanhSachChienDichFlashSaleDto,
  DoiTrangThaiChienDichFlashSaleDto,
  LocChienDichFlashSaleDto,
  LuuChienDichFlashSaleDto,
  ThemMucFlashSaleDto,
} from './dto/flash-sale.dto';
import { FlashSaleService } from './flash-sale.service';

@ApiTags('Quản trị flash sale')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/flash-sale')
export class FlashSaleQuanTriController {
  constructor(private readonly service: FlashSaleService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_XEM)
  @ApiOperation({ operationId: 'layDanhSachFlashSale', summary: 'Danh sách chiến dịch flash sale' })
  @ApiOkResponse({ type: DanhSachChienDichFlashSaleDto })
  layDanhSach(
    @Query() query: LocChienDichFlashSaleDto,
  ): Promise<DanhSachChienDichFlashSaleDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_XEM)
  @ApiOperation({ operationId: 'layChiTietFlashSale', summary: 'Chi tiết chiến dịch flash sale' })
  @ApiOkResponse({ type: ChienDichFlashSaleChiTietDto })
  layChiTiet(@Param('id') id: string): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.layChiTietQuanTri(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_TAO)
  @ApiOperation({ operationId: 'taoFlashSale', summary: 'Tạo chiến dịch flash sale' })
  @ApiCreatedResponse({ type: ChienDichFlashSaleChiTietDto })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: LuuChienDichFlashSaleDto,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.taoQuanTri(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_SUA)
  @ApiOperation({ operationId: 'capNhatFlashSale', summary: 'Cập nhật chiến dịch flash sale' })
  @ApiOkResponse({ type: ChienDichFlashSaleChiTietDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: LuuChienDichFlashSaleDto,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.capNhatQuanTri(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_KHOA)
  @ApiOperation({ operationId: 'doiTrangThaiFlashSale', summary: 'Kích hoạt/tạm dừng chiến dịch' })
  @ApiOkResponse({ type: ChienDichFlashSaleChiTietDto })
  doiTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiChienDichFlashSaleDto,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.doiTrangThaiQuanTri(
      this.layActor(request),
      id,
      dto,
      this.layMetadata(request),
    );
  }

  @Post(':id/muc')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_TAO)
  @ApiOperation({ operationId: 'themMucFlashSale', summary: 'Thêm biến thể vào chiến dịch' })
  @ApiCreatedResponse({ type: ChienDichFlashSaleChiTietDto })
  themMuc(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: ThemMucFlashSaleDto,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.themMucQuanTri(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Delete(':id/muc/:mucId')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_KHOA)
  @ApiOperation({ operationId: 'xoaMucFlashSale', summary: 'Gỡ biến thể khỏi chiến dịch' })
  @ApiOkResponse({ type: ChienDichFlashSaleChiTietDto })
  xoaMuc(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Param('mucId') mucId: string,
  ): Promise<ChienDichFlashSaleChiTietDto> {
    return this.service.xoaMucQuanTri(this.layActor(request), id, mucId, this.layMetadata(request));
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
