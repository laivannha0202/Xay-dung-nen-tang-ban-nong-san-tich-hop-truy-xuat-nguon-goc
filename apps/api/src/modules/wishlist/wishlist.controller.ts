import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachSanPhamYeuThichDto,
  TrangThaiSanPhamYeuThichDto,
} from './dto/phan-hoi-wishlist.dto';
import { WishlistService } from './wishlist.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/yeu-thich')
export class WishlistController {
  constructor(private readonly service: WishlistService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachSanPhamYeuThich',
    summary: 'Lấy danh sách sản phẩm yêu thích của tôi',
  })
  @ApiOkResponse({ type: DanhSachSanPhamYeuThichDto })
  layDanhSach(@Req() request: RequestDaXacThuc): Promise<DanhSachSanPhamYeuThichDto> {
    return this.service.layDanhSach(this.nguoiDungId(request));
  }

  @Get(':sanPhamId/trang-thai')
  @ApiOperation({
    operationId: 'layTrangThaiSanPhamYeuThich',
    summary: 'Kiểm tra sản phẩm có trong wishlist của tôi',
  })
  @ApiParam({ name: 'sanPhamId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiSanPhamYeuThichDto })
  layTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('sanPhamId', new ParseUUIDPipe()) sanPhamId: string,
  ): Promise<TrangThaiSanPhamYeuThichDto> {
    return this.service.layTrangThai(this.nguoiDungId(request), sanPhamId);
  }

  @Put(':sanPhamId')
  @ApiOperation({
    operationId: 'themSanPhamYeuThich',
    summary: 'Thêm sản phẩm vào wishlist',
  })
  @ApiParam({ name: 'sanPhamId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiSanPhamYeuThichDto })
  them(
    @Req() request: RequestDaXacThuc,
    @Param('sanPhamId', new ParseUUIDPipe()) sanPhamId: string,
  ): Promise<TrangThaiSanPhamYeuThichDto> {
    return this.service.them(this.nguoiDungId(request), sanPhamId);
  }

  @Delete(':sanPhamId')
  @ApiOperation({
    operationId: 'xoaSanPhamYeuThich',
    summary: 'Bỏ sản phẩm khỏi wishlist',
  })
  @ApiParam({ name: 'sanPhamId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiSanPhamYeuThichDto })
  xoa(
    @Req() request: RequestDaXacThuc,
    @Param('sanPhamId', new ParseUUIDPipe()) sanPhamId: string,
  ): Promise<TrangThaiSanPhamYeuThichDto> {
    return this.service.xoa(this.nguoiDungId(request), sanPhamId);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
