import {
  Body,
  Controller,
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

import { BienTheSanPhamService } from './bien-the-san-pham.service';
import { CapNhatBienTheSanPhamDto } from './dto/cap-nhat-bien-the-san-pham.dto';
import { BienTheSanPhamDto, DanhSachBienTheSanPhamDto } from './dto/phan-hoi-bien-the-san-pham.dto';
import { TaoBienTheSanPhamDto } from './dto/tao-bien-the-san-pham.dto';

@ApiTags('Biến thể sản phẩm')
@ApiBearerAuth()
@Controller('san-pham/:sanPhamId/bien-the')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class BienTheSanPhamController {
  constructor(private readonly service: BienTheSanPhamService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layDanhSachBienTheSanPham',
    summary: 'Lấy biến thể và giá hiện tại của sản phẩm',
  })
  @ApiOkResponse({
    type: DanhSachBienTheSanPhamDto,
  })
  layDanhSach(
    @Param('sanPhamId')
    sanPhamId: string,
  ): Promise<DanhSachBienTheSanPhamDto> {
    return this.service.layDanhSach(sanPhamId);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_TAO)
  @ApiOperation({
    operationId: 'taoBienTheSanPham',
    summary: 'Tạo biến thể và giá catalog hiện tại',
  })
  @ApiCreatedResponse({
    type: BienTheSanPhamDto,
  })
  tao(
    @Param('sanPhamId')
    sanPhamId: string,
    @Body()
    dto: TaoBienTheSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<BienTheSanPhamDto> {
    return this.service.tao(this.layActor(request), sanPhamId, dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'capNhatBienTheSanPham',
    summary: 'Cập nhật SKU, quy cách hoặc giá catalog',
  })
  @ApiOkResponse({
    type: BienTheSanPhamDto,
  })
  capNhat(
    @Param('sanPhamId')
    sanPhamId: string,
    @Param('id')
    id: string,
    @Body()
    dto: CapNhatBienTheSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<BienTheSanPhamDto> {
    return this.service.capNhat(
      this.layActor(request),
      sanPhamId,
      id,
      dto,
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
