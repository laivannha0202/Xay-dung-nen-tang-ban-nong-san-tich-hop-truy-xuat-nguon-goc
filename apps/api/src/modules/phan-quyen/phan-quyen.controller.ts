import { Body, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { GanVaiTroDto } from './dto/gan-vai-tro.dto';
import { PhanHoiGanVaiTroDto, PhanQuyenNguoiDungDto } from './dto/phan-hoi-phan-quyen.dto';
import { MA_QUYEN } from './ma-quyen';
import { PhanQuyenService } from './phan-quyen.service';
import { QuyenGuard } from './quyen.guard';
import { YeuCauQuyen } from './yeu-cau-quyen.decorator';

@ApiTags('Phân quyền')
@ApiBearerAuth()
@Controller('phan-quyen')
export class PhanQuyenController {
  constructor(private readonly phanQuyenService: PhanQuyenService) {}

  @Get('cua-toi')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({
    operationId: 'layPhanQuyenCuaToi',
    summary: 'Lấy vai trò và quyền hiện hành của tôi',
  })
  @ApiOkResponse({ type: PhanQuyenNguoiDungDto })
  async layCuaToi(@Req() request: RequestDaXacThuc): Promise<PhanQuyenNguoiDungDto> {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu thông tin người dùng.');
    }

    return this.phanQuyenService.layCuaNguoiDung(nguoiDungId);
  }

  @Post('gan-vai-tro')
  @UseGuards(JwtAccessGuard, QuyenGuard)
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({
    operationId: 'ganVaiTroChoNguoiDung',
    summary: 'Gán vai trò cho người dùng',
  })
  @ApiOkResponse({ type: PhanHoiGanVaiTroDto })
  async ganVaiTro(@Body() dto: GanVaiTroDto): Promise<PhanHoiGanVaiTroDto> {
    await this.phanQuyenService.ganVaiTro(dto.nguoiDungId, dto.maVaiTro);

    return {
      nguoiDungId: dto.nguoiDungId,
      maVaiTro: dto.maVaiTro,
      thongBao: 'Đã gán vai trò.',
    };
  }
}
