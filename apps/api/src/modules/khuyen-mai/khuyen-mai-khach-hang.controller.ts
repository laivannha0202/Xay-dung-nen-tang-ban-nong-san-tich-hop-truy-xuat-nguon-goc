import {
  Controller,
  Delete,
  Get,
  Param,
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

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  BoLuuKhuyenMaiKhachHangDto,
  KhuyenMaiKhachHangDto,
} from './dto/khuyen-mai-khach-hang.dto';
import { KhuyenMaiService } from './khuyen-mai.service';

@ApiTags('Khuyến mãi')
@Controller('khuyen-mai')
export class KhuyenMaiCongKhaiController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get('cong-khai')
  @ApiOperation({
    operationId: 'layKhuyenMaiCongKhai',
    summary: 'Lấy voucher đang hiệu lực để khách hàng có thể lưu',
  })
  @ApiOkResponse({ type: [KhuyenMaiKhachHangDto] })
  layCongKhai(): Promise<KhuyenMaiKhachHangDto[]> {
    return this.service.layCongKhaiKhachHang();
  }
}

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/khuyen-mai')
export class KhuyenMaiKhachHangController {
  constructor(private readonly service: KhuyenMaiService) {}

  @Get()
  @ApiOperation({
    operationId: 'layKhuyenMaiDaLuuCuaToi',
    summary: 'Lấy ví voucher của khách hàng hiện tại',
  })
  @ApiOkResponse({ type: [KhuyenMaiKhachHangDto] })
  layDaLuu(@Req() request: RequestDaXacThuc): Promise<KhuyenMaiKhachHangDto[]> {
    return this.service.layDaLuuKhachHang(this.nguoiDungId(request));
  }

  @Post(':id/luu')
  @ApiOperation({
    operationId: 'luuKhuyenMaiCuaToi',
    summary: 'Lưu voucher vào tài khoản khách hàng',
  })
  @ApiCreatedResponse({ type: KhuyenMaiKhachHangDto })
  luu(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<KhuyenMaiKhachHangDto> {
    return this.service.luuKhuyenMaiKhachHang(this.nguoiDungId(request), id);
  }

  @Delete(':id/luu')
  @ApiOperation({
    operationId: 'boLuuKhuyenMaiCuaToi',
    summary: 'Bỏ voucher khỏi ví khách hàng',
  })
  @ApiOkResponse({ type: BoLuuKhuyenMaiKhachHangDto })
  async boLuu(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<BoLuuKhuyenMaiKhachHangDto> {
    await this.service.boLuuKhuyenMaiKhachHang(this.nguoiDungId(request), id);
    return { ok: true };
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }
}
