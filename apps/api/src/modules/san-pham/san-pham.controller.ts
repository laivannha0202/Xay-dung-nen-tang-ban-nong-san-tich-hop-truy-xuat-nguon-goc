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

import { CapNhatSanPhamDto } from './dto/cap-nhat-san-pham.dto';
import { DoiTrangThaiSanPhamDto } from './dto/doi-trang-thai-san-pham.dto';
import { DanhSachSanPhamDto, SanPhamDto } from './dto/phan-hoi-san-pham.dto';
import { TaoSanPhamDto } from './dto/tao-san-pham.dto';
import { TruyVanSanPhamDto } from './dto/truy-van-san-pham.dto';
import { SanPhamService } from './san-pham.service';

@ApiTags('Sản phẩm')
@ApiBearerAuth()
@Controller('san-pham')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class SanPhamController {
  constructor(private readonly service: SanPhamService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layDanhSachSanPham',
    summary: 'Lấy danh sách sản phẩm',
  })
  @ApiOkResponse({
    type: DanhSachSanPhamDto,
  })
  layDanhSach(
    @Query()
    dto: TruyVanSanPhamDto,
  ): Promise<DanhSachSanPhamDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layChiTietSanPham',
    summary: 'Lấy chi tiết sản phẩm',
  })
  @ApiOkResponse({
    type: SanPhamDto,
  })
  layChiTiet(
    @Param('id')
    id: string,
  ): Promise<SanPhamDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_TAO)
  @ApiOperation({
    operationId: 'taoSanPham',
    summary: 'Tạo sản phẩm',
  })
  @ApiCreatedResponse({
    type: SanPhamDto,
  })
  tao(
    @Body()
    dto: TaoSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<SanPhamDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'capNhatSanPham',
    summary: 'Cập nhật sản phẩm',
  })
  @ApiOkResponse({
    type: SanPhamDto,
  })
  capNhat(
    @Param('id')
    id: string,
    @Body()
    dto: CapNhatSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<SanPhamDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_KHOA)
  @ApiOperation({
    operationId: 'doiTrangThaiSanPham',
    summary: 'Khóa hoặc mở sản phẩm',
  })
  @ApiOkResponse({
    type: SanPhamDto,
  })
  doiTrangThai(
    @Param('id')
    id: string,
    @Body()
    dto: DoiTrangThaiSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<SanPhamDto> {
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
