import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { DonHangService } from './don-hang.service';
import { LocDonHangCuaToiDto } from './dto/loc-don-hang-cua-toi.dto';
import { DonHangPhanHoiDto } from './dto/phan-hoi-don-hang.dto';
import {
  ChiTietDonHangCuaToiDto,
  DanhSachDonHangCuaToiDto,
} from './dto/phan-hoi-don-hang-khach.dto';
import { TaoDonHangDto } from './dto/tao-don-hang.dto';

@ApiTags('Đơn hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('don-hang')
export class DonHangController {
  constructor(private readonly service: DonHangService) {}

  @Post()
  @ApiOperation({
    operationId: 'taoDonHang',
    summary: 'Validate cart/price, reserve FEFO và tạo đơn hàng',
  })
  @ApiCreatedResponse({ type: DonHangPhanHoiDto })
  tao(@Req() request: RequestDaXacThuc, @Body() dto: TaoDonHangDto): Promise<DonHangPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    return this.service.tao(nguoiDungId, dto);
  }

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachDonHangCuaToi',
    summary: 'Lấy danh sách đơn hàng của khách hàng hiện tại',
  })
  @ApiOkResponse({ type: DanhSachDonHangCuaToiDto })
  layDanhSachCuaToi(
    @Req() request: RequestDaXacThuc,
    @Query() query: LocDonHangCuaToiDto,
  ): Promise<DanhSachDonHangCuaToiDto> {
    return this.service.layDanhSachCuaToi(this.nguoiDungId(request), query);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietDonHangCuaToi',
    summary: 'Lấy chi tiết đơn hàng thuộc khách hàng hiện tại',
  })
  @ApiOkResponse({ type: ChiTietDonHangCuaToiDto })
  layChiTietCuaToi(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<ChiTietDonHangCuaToiDto> {
    return this.service.layChiTietCuaToi(this.nguoiDungId(request), id);
  }

  @Post(':id/huy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'huyDonHangCuaToi',
    summary: 'Hủy đơn hàng của tôi khi state/payment/inventory còn cho phép',
  })
  @ApiOkResponse({ type: ChiTietDonHangCuaToiDto })
  huyCuaToi(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<ChiTietDonHangCuaToiDto> {
    return this.service.huyCuaToi(this.nguoiDungId(request), id);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const nguoiDungId = request.nguoiDungXacThuc?.id;
    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return nguoiDungId;
  }
}
