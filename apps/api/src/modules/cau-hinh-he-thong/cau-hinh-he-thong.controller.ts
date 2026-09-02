import { Body, Controller, Get, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';
import { CauHinhHeThongService } from './cau-hinh-he-thong.service';
import { CapNhatCauHinhHeThongDto } from './dto/cap-nhat-cau-hinh-he-thong.dto';
import { CauHinhHeThongDto } from './dto/phan-hoi-cau-hinh-he-thong.dto';

@ApiTags('Cấu hình hệ thống')
@ApiBearerAuth()
@Controller('quan-tri/cau-hinh')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class CauHinhHeThongController {
  constructor(private readonly service: CauHinhHeThongService) {}

  @Get()
  @ApiOperation({ operationId: 'layCauHinhHeThong', summary: 'Lấy cấu hình hệ thống' })
  @ApiOkResponse({ type: CauHinhHeThongDto })
  layCauHinh(): Promise<CauHinhHeThongDto> {
    return this.service.layCauHinh();
  }

  @Put()
  @ApiOperation({ operationId: 'capNhatCauHinhHeThong', summary: 'Cập nhật cấu hình hệ thống' })
  @ApiOkResponse({ type: CauHinhHeThongDto })
  capNhat(
    @Body() dto: CapNhatCauHinhHeThongDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<CauHinhHeThongDto> {
    return this.service.capNhat(this.tacNhanId(request), dto, this.metadata(request));
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
