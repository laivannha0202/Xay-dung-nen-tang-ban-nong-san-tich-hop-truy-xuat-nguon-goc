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

import { CapNhatKhoDto } from './dto/cap-nhat-kho.dto';
import { DoiTrangThaiKhoDto } from './dto/doi-trang-thai-kho.dto';
import { DanhSachKhoDto, KhoDto } from './dto/phan-hoi-kho.dto';
import { TaoKhoDto } from './dto/tao-kho.dto';
import { TruyVanKhoDto } from './dto/truy-van-kho.dto';
import { KhoService } from './kho.service';

@ApiTags('Kho')
@ApiBearerAuth()
@Controller('kho')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class KhoController {
  constructor(private readonly service: KhoService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layDanhSachKho',
    summary: 'Lấy danh sách kho',
  })
  @ApiOkResponse({ type: DanhSachKhoDto })
  layDanhSach(@Query() dto: TruyVanKhoDto): Promise<DanhSachKhoDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layChiTietKho',
    summary: 'Lấy chi tiết kho',
  })
  @ApiOkResponse({ type: KhoDto })
  layChiTiet(@Param('id') id: string): Promise<KhoDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.KHO_TAO)
  @ApiOperation({
    operationId: 'taoKho',
    summary: 'Tạo kho',
  })
  @ApiCreatedResponse({ type: KhoDto })
  tao(@Body() dto: TaoKhoDto, @Req() request: RequestDaXacThuc): Promise<KhoDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_SUA)
  @ApiOperation({
    operationId: 'capNhatKho',
    summary: 'Cập nhật kho',
  })
  @ApiOkResponse({ type: KhoDto })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatKhoDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<KhoDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.KHO_KHOA)
  @ApiOperation({
    operationId: 'doiTrangThaiKho',
    summary: 'Khóa hoặc mở kho',
  })
  @ApiOkResponse({ type: KhoDto })
  doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiKhoDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<KhoDto> {
    return this.service.doiTrangThai(
      this.layActor(request),
      id,
      dto.trangThai,
      this.layMetadata(request),
    );
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu tác nhân.');
    }
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
