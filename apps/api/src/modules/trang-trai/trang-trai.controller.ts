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

import { CapNhatTrangTraiDto } from './dto/cap-nhat-trang-trai.dto';
import { DoiTrangThaiTrangTraiDto } from './dto/doi-trang-thai-trang-trai.dto';
import { DanhSachTrangTraiDto, TrangTraiChiTietDto } from './dto/phan-hoi-trang-trai.dto';
import { TaoTrangTraiDto } from './dto/tao-trang-trai.dto';
import { TruyVanTrangTraiDto } from './dto/truy-van-trang-trai.dto';
import { TrangTraiService } from './trang-trai.service';

@ApiTags('Trang trại')
@ApiBearerAuth()
@Controller('trang-trai')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class TrangTraiController {
  constructor(private readonly service: TrangTraiService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.TRANG_TRAI_XEM)
  @ApiOperation({
    operationId: 'layDanhSachTrangTrai',
    summary: 'Lấy danh sách trang trại',
  })
  @ApiOkResponse({
    type: DanhSachTrangTraiDto,
  })
  layDanhSach(@Query() dto: TruyVanTrangTraiDto): Promise<DanhSachTrangTraiDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.TRANG_TRAI_XEM)
  @ApiOperation({
    operationId: 'layChiTietTrangTrai',
    summary: 'Lấy chi tiết trang trại',
  })
  @ApiOkResponse({
    type: TrangTraiChiTietDto,
  })
  layChiTiet(@Param('id') id: string): Promise<TrangTraiChiTietDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.TRANG_TRAI_TAO)
  @ApiOperation({
    operationId: 'taoTrangTrai',
    summary: 'Tạo trang trại',
  })
  @ApiCreatedResponse({
    type: TrangTraiChiTietDto,
  })
  tao(
    @Body() dto: TaoTrangTraiDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<TrangTraiChiTietDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.TRANG_TRAI_SUA)
  @ApiOperation({
    operationId: 'capNhatTrangTrai',
    summary: 'Cập nhật trang trại',
  })
  @ApiOkResponse({
    type: TrangTraiChiTietDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatTrangTraiDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<TrangTraiChiTietDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.TRANG_TRAI_KHOA)
  @ApiOperation({
    operationId: 'doiTrangThaiTrangTrai',
    summary: 'Khóa hoặc mở trang trại',
  })
  @ApiOkResponse({
    type: TrangTraiChiTietDto,
  })
  doiTrangThai(
    @Param('id') id: string,
    @Body() dto: DoiTrangThaiTrangTraiDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<TrangTraiChiTietDto> {
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
