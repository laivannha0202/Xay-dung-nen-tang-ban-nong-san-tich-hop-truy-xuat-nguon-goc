import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { CheckoutPreviewService } from './checkout-preview.service';
import { CapNhatMucGioHangDto } from './dto/cap-nhat-muc-gio-hang.dto';
import { CheckoutPreviewDto } from './dto/checkout-preview.dto';
import { GioHangDto } from './dto/phan-hoi-gio-hang.dto';
import { ThemMucGioHangDto } from './dto/them-muc-gio-hang.dto';
import { GioHangService } from './gio-hang.service';

@ApiTags('Giỏ hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('gio-hang')
export class GioHangController {
  constructor(
    private readonly service: GioHangService,
    private readonly checkoutPreviewService: CheckoutPreviewService,
  ) {}

  @Get('checkout-preview')
  @ApiOperation({
    operationId: 'layCheckoutPreview',
    summary: 'Tính Checkout Preview từ giỏ hàng hiện tại',
  })
  @ApiOkResponse({ type: CheckoutPreviewDto })
  layCheckoutPreview(@Req() request: RequestDaXacThuc): Promise<CheckoutPreviewDto> {
    return this.checkoutPreviewService.lay(this.layNguoiDungId(request));
  }

  @Get()
  @ApiOperation({
    operationId: 'layGioHang',
    summary: 'Lấy giỏ hàng active của khách đăng nhập',
  })
  @ApiOkResponse({ type: GioHangDto })
  lay(@Req() request: RequestDaXacThuc): Promise<GioHangDto> {
    return this.service.lay(this.layNguoiDungId(request));
  }

  @Post('muc')
  @ApiOperation({
    operationId: 'themMucGioHang',
    summary: 'Thêm biến thể vào giỏ hàng',
  })
  @ApiOkResponse({ type: GioHangDto })
  them(@Req() request: RequestDaXacThuc, @Body() dto: ThemMucGioHangDto): Promise<GioHangDto> {
    return this.service.them(this.layNguoiDungId(request), dto);
  }

  @Patch('muc/:id')
  @ApiOperation({
    operationId: 'capNhatMucGioHang',
    summary: 'Cập nhật số lượng mục giỏ hàng',
  })
  @ApiOkResponse({ type: GioHangDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: CapNhatMucGioHangDto,
  ): Promise<GioHangDto> {
    return this.service.capNhat(this.layNguoiDungId(request), id, dto);
  }

  @Delete('muc/:id')
  @ApiOperation({
    operationId: 'xoaMucGioHang',
    summary: 'Xóa mục khỏi giỏ hàng',
  })
  @ApiOkResponse({ type: GioHangDto })
  xoa(@Req() request: RequestDaXacThuc, @Param('id') id: string): Promise<GioHangDto> {
    return this.service.xoa(this.layNguoiDungId(request), id);
  }

  private layNguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
