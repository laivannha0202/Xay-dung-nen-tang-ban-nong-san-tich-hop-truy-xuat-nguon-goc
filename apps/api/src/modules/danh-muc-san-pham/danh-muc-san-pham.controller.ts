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

import { CapNhatDanhMucSanPhamDto } from './dto/cap-nhat-danh-muc-san-pham.dto';
import { DoiTrangThaiDanhMucSanPhamDto } from './dto/doi-trang-thai-danh-muc-san-pham.dto';
import { DanhMucSanPhamDto, DanhSachDanhMucSanPhamDto } from './dto/phan-hoi-danh-muc-san-pham.dto';
import { TaoDanhMucSanPhamDto } from './dto/tao-danh-muc-san-pham.dto';
import { TruyVanDanhMucSanPhamDto } from './dto/truy-van-danh-muc-san-pham.dto';
import { DanhMucSanPhamService } from './danh-muc-san-pham.service';

@ApiTags('Danh mục sản phẩm')
@ApiBearerAuth()
@Controller('danh-muc-san-pham')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class DanhMucSanPhamController {
  constructor(private readonly service: DanhMucSanPhamService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.DANH_MUC_SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layDanhSachDanhMucSanPham',
    summary: 'Lấy danh sách danh mục sản phẩm',
  })
  @ApiOkResponse({
    type: DanhSachDanhMucSanPhamDto,
  })
  layDanhSach(
    @Query()
    dto: TruyVanDanhMucSanPhamDto,
  ): Promise<DanhSachDanhMucSanPhamDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.DANH_MUC_SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layChiTietDanhMucSanPham',
    summary: 'Lấy chi tiết danh mục sản phẩm',
  })
  @ApiOkResponse({
    type: DanhMucSanPhamDto,
  })
  layChiTiet(
    @Param('id')
    id: string,
  ): Promise<DanhMucSanPhamDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.DANH_MUC_SAN_PHAM_TAO)
  @ApiOperation({
    operationId: 'taoDanhMucSanPham',
    summary: 'Tạo danh mục sản phẩm',
  })
  @ApiCreatedResponse({
    type: DanhMucSanPhamDto,
  })
  tao(
    @Body()
    dto: TaoDanhMucSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<DanhMucSanPhamDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.DANH_MUC_SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'capNhatDanhMucSanPham',
    summary: 'Cập nhật danh mục sản phẩm',
  })
  @ApiOkResponse({
    type: DanhMucSanPhamDto,
  })
  capNhat(
    @Param('id')
    id: string,
    @Body()
    dto: CapNhatDanhMucSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<DanhMucSanPhamDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/trang-thai')
  @YeuCauQuyen(MA_QUYEN.DANH_MUC_SAN_PHAM_KHOA)
  @ApiOperation({
    operationId: 'doiTrangThaiDanhMucSanPham',
    summary: 'Khóa hoặc mở danh mục sản phẩm',
  })
  @ApiOkResponse({
    type: DanhMucSanPhamDto,
  })
  doiTrangThai(
    @Param('id')
    id: string,
    @Body()
    dto: DoiTrangThaiDanhMucSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<DanhMucSanPhamDto> {
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
