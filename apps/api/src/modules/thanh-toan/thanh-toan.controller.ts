import {
  Body,
  Controller,
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

import { ThanhToanPhanHoiDto } from './dto/phan-hoi-thanh-toan.dto';
import { TaoThanhToanDto } from './dto/tao-thanh-toan.dto';
import { ThanhToanService } from './thanh-toan.service';
import { ThanhToanWebService } from './thanh-toan-web.service';

@ApiTags('Thanh toán')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('thanh-toan')
export class ThanhToanController {
  constructor(
    private readonly service: ThanhToanService,
    private readonly webService: ThanhToanWebService,
  ) {}

  @Get('don-hang/:donHangId')
  @ApiOperation({
    operationId: 'layThanhToanDonHangCuaToi',
    summary: 'Lấy trạng thái thanh toán mới nhất của đơn hàng hiện tại',
  })
  @ApiOkResponse({ type: ThanhToanPhanHoiDto })
  layTheoDonHang(
    @Req() request: RequestDaXacThuc,
    @Param('donHangId') donHangId: string,
  ): Promise<ThanhToanPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    return this.service.layTheoDonHangCuaToi(nguoiDungId, donHangId);
  }

  @Post()
  @ApiOperation({
    operationId: 'taoThanhToan',
    summary: 'Tạo thanh toán COD, VNPay Sandbox hoặc Mock kiểm thử',
    description:
      'Khách hàng sử dụng COD hoặc VNPay Sandbox. VNPay chỉ nhận kênh trả về MOBILE/WEB đã whitelist; client không truyền return URL tùy ý. MOCK chỉ phục vụ kiểm thử.',
  })
  @ApiCreatedResponse({
    type: ThanhToanPhanHoiDto,
  })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: TaoThanhToanDto,
  ): Promise<ThanhToanPhanHoiDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }

    if (dto.phuongThuc === 'VNPAY_SANDBOX' && dto.kenhTraVe === 'WEB') {
      return this.webService.taoVnPayWeb(nguoiDungId, dto, request.ip);
    }

    return this.service.tao(nguoiDungId, dto, request.ip);
  }
}
