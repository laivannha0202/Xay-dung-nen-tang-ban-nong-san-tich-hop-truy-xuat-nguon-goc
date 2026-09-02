import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { CapNhatQuyenVaiTroDto } from './dto/cap-nhat-quyen-vai-tro.dto';
import { GanVaiTroDto } from './dto/gan-vai-tro.dto';
import { MaTranPhanQuyenDto, VaiTroMaTranDto } from './dto/phan-hoi-ma-tran-quyen.dto';
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
    if (!nguoiDungId) throw new UnauthorizedException('Thiếu thông tin người dùng.');
    return this.phanQuyenService.layCuaNguoiDung(nguoiDungId);
  }

  @Get('ma-tran')
  @UseGuards(JwtAccessGuard, QuyenGuard)
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({ operationId: 'layMaTranPhanQuyen', summary: 'Lấy Permission Matrix' })
  @ApiOkResponse({ type: MaTranPhanQuyenDto })
  layMaTran(): Promise<MaTranPhanQuyenDto> {
    return this.phanQuyenService.layMaTranQuyen();
  }

  @Post('gan-vai-tro')
  @UseGuards(JwtAccessGuard, QuyenGuard)
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({ operationId: 'ganVaiTroChoNguoiDung', summary: 'Gán vai trò cho người dùng' })
  @ApiOkResponse({ type: PhanHoiGanVaiTroDto })
  async ganVaiTro(
    @Body() dto: GanVaiTroDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiGanVaiTroDto> {
    const tacNhanId = request.nguoiDungXacThuc?.id;
    if (!tacNhanId) throw new UnauthorizedException('Thiếu thông tin tác nhân thực hiện.');
    const userAgent = request.headers['user-agent'];
    await this.phanQuyenService.ganVaiTro(tacNhanId, dto.nguoiDungId, dto.maVaiTro, {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    });
    return { nguoiDungId: dto.nguoiDungId, maVaiTro: dto.maVaiTro, thongBao: 'Đã gán vai trò.' };
  }

  @Put('vai-tro/:vaiTroId/quyen')
  @UseGuards(JwtAccessGuard, QuyenGuard)
  @YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
  @ApiOperation({ operationId: 'capNhatQuyenChoVaiTro', summary: 'Thay toàn bộ quyền của vai trò' })
  @ApiOkResponse({ type: VaiTroMaTranDto })
  capNhatQuyenVaiTro(
    @Param('vaiTroId') vaiTroId: string,
    @Body() dto: CapNhatQuyenVaiTroDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<VaiTroMaTranDto> {
    const tacNhanId = request.nguoiDungXacThuc?.id;
    if (!tacNhanId) throw new UnauthorizedException('Thiếu thông tin tác nhân thực hiện.');
    const userAgent = request.headers['user-agent'];
    return this.phanQuyenService.capNhatQuyenVaiTro(tacNhanId, vaiTroId, dto, {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    });
  }
}
