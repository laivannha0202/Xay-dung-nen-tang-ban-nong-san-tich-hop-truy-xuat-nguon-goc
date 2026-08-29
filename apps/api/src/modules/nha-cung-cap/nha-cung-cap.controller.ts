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

import { CapNhatNhaCungCapDto } from './dto/cap-nhat-nha-cung-cap.dto';
import { DoiTrangThaiNhaCungCapDto } from './dto/doi-trang-thai-nha-cung-cap.dto';
import { DanhSachNhaCungCapDto, NhaCungCapDto } from './dto/phan-hoi-nha-cung-cap.dto';
import { TaoNhaCungCapDto } from './dto/tao-nha-cung-cap.dto';
import { TruyVanNhaCungCapDto } from './dto/truy-van-nha-cung-cap.dto';
import { NhaCungCapService } from './nha-cung-cap.service';

@ApiTags('Nhà cung cấp')
@ApiBearerAuth()
@Controller('nha-cung-cap')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class NhaCungCapController {
  constructor(private readonly service: NhaCungCapService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.NHA_CUNG_CAP_XEM)
  @ApiOperation({
    operationId: 'layDanhSachNhaCungCap',
    summary: 'Lấy danh sách nhà cung cấp',
  })
  @ApiOkResponse({
    type: DanhSachNhaCungCapDto,
  })
  layDanhSach(@Query() dto: TruyVanNhaCungCapDto): Promise<DanhSachNhaCungCapDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.NHA_CUNG_CAP_XEM)
  @ApiOperation({
    operationId: 'layChiTietNhaCungCap',
    summary: 'Lấy chi tiết nhà cung cấp',
  })
  @ApiOkResponse({
    type: NhaCungCapDto,
  })
  layChiTiet(@Param('id') id: string): Promise<NhaCungCapDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.NHA_CUNG_CAP_TAO)
  @ApiOperation({
    operationId: 'taoNhaCungCap',
    summary: 'Tạo nhà cung cấp',
  })
  @ApiCreatedResponse({
    type: NhaCungCapDto,
  })
  tao(@Body() dto: TaoNhaCungCapDto, @Req() request: RequestDaXacThuc): Promise<NhaCungCapDto> {
    const actor = this.layActor(request);

    return this.service.tao(actor, dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.NHA_CUNG_CAP_SUA)
  @ApiOperation({
    operationId: 'capNhatNhaCungCap',
    summary: 'Cập nhật nhà cung cấp',
  })
  @ApiOkResponse({
    type: NhaCungCapDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatNhaCungCapDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<NhaCungCapDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.NHA_CUNG_CAP_KHOA)
  @ApiOperation({
    operationId: 'doiTrangThaiNhaCungCap',
    summary: 'Khóa hoặc mở nhà cung cấp',
  })
  @ApiOkResponse({
    type: NhaCungCapDto,
  })
  doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiNhaCungCapDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<NhaCungCapDto> {
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
