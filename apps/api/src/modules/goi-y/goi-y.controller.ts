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

import { DanhSachGoiYSanPhamDto } from './dto/phan-hoi-goi-y.dto';
import { TruyVanGoiYDto } from './dto/truy-van-goi-y.dto';
import { GoiYService } from './goi-y.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/goi-y')
export class GoiYController {
  constructor(private readonly service: GoiYService) {}

  @Get()
  @ApiOperation({
    operationId: 'layGoiYSanPhamCuaToi',
    summary: 'Lấy gợi ý nông sản cho khách hàng hiện tại',
    description:
      'Ưu tiên HybridAffinity-v1 khi có tín hiệu sở thích; tự động dùng MostPopular-90d cho cold-start.',
  })
  @ApiOkResponse({ type: DanhSachGoiYSanPhamDto })
  layChoToi(
    @Req() request: RequestDaXacThuc,
    @Query() query: TruyVanGoiYDto,
  ): Promise<DanhSachGoiYSanPhamDto> {
    return this.service.layChoNguoiDung(this.nguoiDungId(request), query.gioiHan);
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
