import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachGiaoDichDiemThuongDto,
  TongQuanDiemThuongDto,
} from './dto/phan-hoi-diem-thuong.dto';
import { TruyVanGiaoDichDiemThuongDto } from './dto/truy-van-giao-dich-diem-thuong.dto';
import { DiemThuongService } from './diem-thuong.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/diem-thuong')
export class DiemThuongController {
  constructor(private readonly service: DiemThuongService) {}

  @Get()
  @ApiOperation({
    operationId: 'layTongQuanDiemThuongCuaToi',
    summary: 'Lấy số dư điểm thưởng của khách hàng hiện tại',
  })
  @ApiOkResponse({ type: TongQuanDiemThuongDto })
  layTongQuan(@Req() request: RequestDaXacThuc): Promise<TongQuanDiemThuongDto> {
    return this.service.layTongQuan(this.nguoiDungId(request));
  }

  @Get('giao-dich')
  @ApiOperation({
    operationId: 'layGiaoDichDiemThuongCuaToi',
    summary: 'Lấy lịch sử biến động điểm thưởng của khách hàng hiện tại',
  })
  @ApiOkResponse({ type: DanhSachGiaoDichDiemThuongDto })
  layGiaoDich(
    @Req() request: RequestDaXacThuc,
    @Query() query: TruyVanGiaoDichDiemThuongDto,
  ): Promise<DanhSachGiaoDichDiemThuongDto> {
    return this.service.layGiaoDich(this.nguoiDungId(request), query);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
