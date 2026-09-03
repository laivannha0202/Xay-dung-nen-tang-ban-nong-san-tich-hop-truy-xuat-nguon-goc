import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';
import { CapNhatQuyTacHoaHongDto } from './dto/cap-nhat-quy-tac-hoa-hong.dto';
import { DanhSachQuyTacHoaHongDto, QuyTacHoaHongDto } from './dto/phan-hoi-quy-tac-hoa-hong.dto';
import { TaoQuyTacHoaHongDto } from './dto/tao-quy-tac-hoa-hong.dto';
import { TruyVanQuyTacHoaHongDto } from './dto/truy-van-quy-tac-hoa-hong.dto';
import { QuyTacHoaHongService } from './quy-tac-hoa-hong.service';

@ApiTags('Quy tắc hoa hồng')
@ApiBearerAuth()
@Controller('quan-tri/quy-tac-hoa-hong')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class QuyTacHoaHongController {
  constructor(private readonly service: QuyTacHoaHongService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachQuyTacHoaHong',
    summary: 'Lấy danh sách quy tắc hoa hồng',
  })
  @ApiOkResponse({ type: DanhSachQuyTacHoaHongDto })
  layDanhSach(@Query() query: TruyVanQuyTacHoaHongDto): Promise<DanhSachQuyTacHoaHongDto> {
    return this.service.layDanhSach(query);
  }

  @Post()
  @ApiOperation({ operationId: 'taoQuyTacHoaHong', summary: 'Tạo quy tắc hoa hồng' })
  @ApiCreatedResponse({ type: QuyTacHoaHongDto })
  tao(
    @Body() dto: TaoQuyTacHoaHongDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<QuyTacHoaHongDto> {
    return this.service.tao(this.tacNhanId(request), dto, this.metadata(request));
  }

  @Put(':id')
  @ApiOperation({
    operationId: 'capNhatQuyTacHoaHong',
    summary: 'Cập nhật quy tắc hoa hồng chưa hiệu lực',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: QuyTacHoaHongDto })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatQuyTacHoaHongDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<QuyTacHoaHongDto> {
    return this.service.capNhat(this.tacNhanId(request), id, dto, this.metadata(request));
  }

  private tacNhanId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu tác nhân quản trị.');
    return id;
  }

  private metadata(request: RequestDaXacThuc): { ip: string | null; userAgent: string | null } {
    const ua = request.headers['user-agent'];
    return {
      ip: request.ip ?? null,
      userAgent: typeof ua === 'string' ? ua : null,
    };
  }
}
