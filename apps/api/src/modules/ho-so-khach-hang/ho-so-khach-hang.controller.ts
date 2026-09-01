import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { CapNhatHoSoKhachHangDto } from './dto/cap-nhat-ho-so-khach-hang.dto';
import { HoSoKhachHangPhanHoiDto } from './dto/phan-hoi-ho-so-khach-hang.dto';
import { HoSoKhachHangService } from './ho-so-khach-hang.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/ho-so')
export class HoSoKhachHangController {
  constructor(private readonly service: HoSoKhachHangService) {}

  @Get()
  @ApiOperation({
    operationId: 'layHoSoKhachHang',
    summary: 'Lấy hồ sơ khách hàng đang đăng nhập',
  })
  @ApiOkResponse({ type: HoSoKhachHangPhanHoiDto })
  lay(@Req() request: RequestDaXacThuc): Promise<HoSoKhachHangPhanHoiDto> {
    return this.service.lay(this.nguoiDungId(request));
  }

  @Patch()
  @ApiOperation({
    operationId: 'capNhatHoSoKhachHang',
    summary: 'Cập nhật họ tên, số điện thoại và ngày sinh',
  })
  @ApiOkResponse({ type: HoSoKhachHangPhanHoiDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Body() dto: CapNhatHoSoKhachHangDto,
  ): Promise<HoSoKhachHangPhanHoiDto> {
    return this.service.capNhat(this.nguoiDungId(request), dto);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
