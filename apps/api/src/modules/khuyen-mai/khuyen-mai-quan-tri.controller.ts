import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  DanhSachKhuyenMaiQuanTriDto,
  DoiTrangThaiKhuyenMaiQuanTriDto,
  KhuyenMaiQuanTriDto,
  LocKhuyenMaiQuanTriDto,
  LuuKhuyenMaiQuanTriDto,
} from './dto/quan-tri-khuyen-mai.dto';
import { KhuyenMaiService } from './khuyen-mai.service';

@ApiTags('Quản trị khuyến mãi')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/khuyen-mai')
export class KhuyenMaiQuanTriController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_XEM)
  @ApiOperation({ operationId: 'layDanhSachKhuyenMaiQuanTri', summary: 'Lấy danh sách khuyến mãi' })
  @ApiOkResponse({ type: DanhSachKhuyenMaiQuanTriDto })
  layDanhSach(@Query() query: LocKhuyenMaiQuanTriDto): Promise<DanhSachKhuyenMaiQuanTriDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_XEM)
  @ApiOperation({ operationId: 'layChiTietKhuyenMaiQuanTri', summary: 'Lấy chi tiết khuyến mãi' })
  @ApiOkResponse({ type: KhuyenMaiQuanTriDto })
  layChiTiet(@Param('id') id: string): Promise<KhuyenMaiQuanTriDto> {
    return this.service.layChiTietQuanTri(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_TAO)
  @ApiOperation({ operationId: 'taoKhuyenMaiQuanTri', summary: 'Tạo khuyến mãi' })
  @ApiCreatedResponse({ type: KhuyenMaiQuanTriDto })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: LuuKhuyenMaiQuanTriDto,
  ): Promise<KhuyenMaiQuanTriDto> {
    return this.service.taoQuanTri(this.layActor(request), dto, this.layMetadata(request));
  }

  @Put(':id')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_SUA)
  @ApiOperation({ operationId: 'capNhatKhuyenMaiQuanTri', summary: 'Cập nhật khuyến mãi' })
  @ApiOkResponse({ type: KhuyenMaiQuanTriDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: LuuKhuyenMaiQuanTriDto,
  ): Promise<KhuyenMaiQuanTriDto> {
    return this.service.capNhatQuanTri(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.KHUYEN_MAI_KHOA)
  @ApiOperation({ operationId: 'doiTrangThaiKhuyenMaiQuanTri', summary: 'Khóa hoặc mở khuyến mãi' })
  @ApiOkResponse({ type: KhuyenMaiQuanTriDto })
  doiTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiKhuyenMaiQuanTriDto,
  ): Promise<KhuyenMaiQuanTriDto> {
    return this.service.doiTrangThaiQuanTri(this.layActor(request), id, dto, this.layMetadata(request));
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
