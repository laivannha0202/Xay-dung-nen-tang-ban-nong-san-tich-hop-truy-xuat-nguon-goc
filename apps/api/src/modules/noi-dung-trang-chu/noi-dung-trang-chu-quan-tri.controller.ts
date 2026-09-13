import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachNoiDungTrangChuQuanTriDto,
  DoiTrangThaiNoiDungTrangChuDto,
  LocNoiDungTrangChuQuanTriDto,
  LuuNoiDungTrangChuDto,
  NoiDungTrangChuDto,
} from './dto/noi-dung-trang-chu.dto';
import { NoiDungTrangChuService } from './noi-dung-trang-chu.service';

@ApiTags('Quản trị nội dung trang chủ')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('quan-tri/noi-dung-trang-chu')
export class NoiDungTrangChuQuanTriController {
  constructor(private readonly service: NoiDungTrangChuService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_XEM)
  @ApiOperation({ operationId: 'layDanhSachNoiDungTrangChu', summary: 'Danh sách nội dung trang chủ' })
  @ApiOkResponse({ type: DanhSachNoiDungTrangChuQuanTriDto })
  layDanhSach(
    @Query() query: LocNoiDungTrangChuQuanTriDto,
  ): Promise<DanhSachNoiDungTrangChuQuanTriDto> {
    return this.service.layDanhSachQuanTri(query);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_XEM)
  @ApiOperation({ operationId: 'layChiTietNoiDungTrangChu', summary: 'Chi tiết nội dung trang chủ' })
  @ApiOkResponse({ type: NoiDungTrangChuDto })
  layChiTiet(@Param('id') id: string): Promise<NoiDungTrangChuDto> {
    return this.service.layChiTietQuanTri(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_TAO)
  @ApiOperation({ operationId: 'taoNoiDungTrangChu', summary: 'Tạo nội dung trang chủ' })
  @ApiCreatedResponse({ type: NoiDungTrangChuDto })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: LuuNoiDungTrangChuDto,
  ): Promise<NoiDungTrangChuDto> {
    return this.service.taoQuanTri(this.layActor(request), dto, this.layMetadata(request));
  }

  @Put(':id')
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_SUA)
  @ApiOperation({ operationId: 'capNhatNoiDungTrangChu', summary: 'Cập nhật nội dung trang chủ' })
  @ApiOkResponse({ type: NoiDungTrangChuDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: LuuNoiDungTrangChuDto,
  ): Promise<NoiDungTrangChuDto> {
    return this.service.capNhatQuanTri(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_KHOA)
  @ApiOperation({ operationId: 'doiTrangThaiNoiDungTrangChu', summary: 'Ẩn/hiện nội dung trang chủ' })
  @ApiOkResponse({ type: NoiDungTrangChuDto })
  doiTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiNoiDungTrangChuDto,
  ): Promise<NoiDungTrangChuDto> {
    return this.service.doiTrangThaiQuanTri(
      this.layActor(request),
      id,
      dto,
      this.layMetadata(request),
    );
  }

  @Delete(':id')
  @YeuCauQuyen(MA_QUYEN.NOI_DUNG_TRANG_CHU_KHOA)
  @ApiOperation({ operationId: 'xoaNoiDungTrangChu', summary: 'Xóa nội dung trang chủ' })
  @ApiNoContentResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  async xoa(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<void> {
    await this.service.xoaQuanTri(this.layActor(request), id, this.layMetadata(request));
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
