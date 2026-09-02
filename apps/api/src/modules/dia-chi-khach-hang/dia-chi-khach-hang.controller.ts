import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

import { CapNhatDiaChiKhachHangDto } from './dto/cap-nhat-dia-chi-khach-hang.dto';
import {
  DiaChiKhachHangPhanHoiDto,
  XoaDiaChiKhachHangPhanHoiDto,
} from './dto/phan-hoi-dia-chi-khach-hang.dto';
import { TaoDiaChiKhachHangDto } from './dto/tao-dia-chi-khach-hang.dto';
import { DiaChiKhachHangService } from './dia-chi-khach-hang.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/dia-chi')
export class DiaChiKhachHangController {
  constructor(private readonly service: DiaChiKhachHangService) {}

  @Get()
  @ApiOperation({ operationId: 'layDanhSachDiaChiKhachHang', summary: 'Lấy sổ địa chỉ của tôi' })
  @ApiOkResponse({ type: [DiaChiKhachHangPhanHoiDto] })
  layDanhSach(@Req() request: RequestDaXacThuc): Promise<DiaChiKhachHangPhanHoiDto[]> {
    return this.service.layDanhSach(this.nguoiDungId(request));
  }

  @Post()
  @ApiOperation({ operationId: 'taoDiaChiKhachHang', summary: 'Thêm địa chỉ giao hàng' })
  @ApiCreatedResponse({ type: DiaChiKhachHangPhanHoiDto })
  tao(
    @Req() request: RequestDaXacThuc,
    @Body() dto: TaoDiaChiKhachHangDto,
  ): Promise<DiaChiKhachHangPhanHoiDto> {
    return this.service.tao(this.nguoiDungId(request), dto);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'capNhatDiaChiKhachHang', summary: 'Cập nhật địa chỉ của tôi' })
  @ApiOkResponse({ type: DiaChiKhachHangPhanHoiDto })
  capNhat(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
    @Body() dto: CapNhatDiaChiKhachHangDto,
  ): Promise<DiaChiKhachHangPhanHoiDto> {
    return this.service.capNhat(this.nguoiDungId(request), id, dto);
  }

  @Put(':id/mac-dinh')
  @ApiOperation({ operationId: 'datDiaChiMacDinhKhachHang', summary: 'Đặt địa chỉ mặc định' })
  @ApiOkResponse({ type: DiaChiKhachHangPhanHoiDto })
  datMacDinh(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<DiaChiKhachHangPhanHoiDto> {
    return this.service.datMacDinh(this.nguoiDungId(request), id);
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'xoaDiaChiKhachHang', summary: 'Xóa địa chỉ của tôi' })
  @ApiOkResponse({ type: XoaDiaChiKhachHangPhanHoiDto })
  async xoa(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<XoaDiaChiKhachHangPhanHoiDto> {
    await this.service.xoa(this.nguoiDungId(request), id);
    return { thongBao: 'Đã xóa địa chỉ.' };
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }
}
