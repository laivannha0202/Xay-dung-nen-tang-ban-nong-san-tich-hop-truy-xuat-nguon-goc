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
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { DongGoiService } from './dong-goi.service';
import { PhanHoiDongGoiDto } from './dto/phan-hoi-dong-goi.dto';
import { XacNhanDongGoiDto } from './dto/xac-nhan-dong-goi.dto';

@ApiTags('Đóng gói đơn hàng')
@ApiBearerAuth()
@Controller('quan-tri/don-hang/dong-goi')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class DongGoiController {
  constructor(private readonly service: DongGoiService) {}

  @Get(':donNhaCungCapId')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'layChecklistDongGoi',
    summary: 'Lấy checklist đóng gói theo đơn nhà cung cấp',
  })
  @ApiOkResponse({ type: PhanHoiDongGoiDto })
  layChecklist(@Param('donNhaCungCapId') donNhaCungCapId: string): Promise<PhanHoiDongGoiDto> {
    return this.service.layChecklist(donNhaCungCapId);
  }

  @Post(':donNhaCungCapId/bat-dau')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'batDauDongGoi',
    summary: 'Bắt đầu chuẩn bị/đóng gói đơn nhà cung cấp',
  })
  @ApiOkResponse({ type: PhanHoiDongGoiDto })
  batDau(
    @Req() request: RequestDaXacThuc,
    @Param('donNhaCungCapId') donNhaCungCapId: string,
  ): Promise<PhanHoiDongGoiDto> {
    return this.service.batDau(this.actorId(request), donNhaCungCapId, this.metadata(request));
  }

  @Post(':donNhaCungCapId/hoan-tat')
  @YeuCauQuyen(MA_QUYEN.DON_HANG_XU_LY)
  @ApiOperation({
    operationId: 'hoanTatDongGoi',
    summary: 'Xác nhận exact checklist và hoàn tất đóng gói',
  })
  @ApiOkResponse({ type: PhanHoiDongGoiDto })
  hoanTat(
    @Req() request: RequestDaXacThuc,
    @Param('donNhaCungCapId') donNhaCungCapId: string,
    @Body() dto: XacNhanDongGoiDto,
  ): Promise<PhanHoiDongGoiDto> {
    return this.service.hoanTat(
      this.actorId(request),
      donNhaCungCapId,
      dto,
      this.metadata(request),
    );
  }

  private actorId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu tác nhân đóng gói.');
    }
    return id;
  }

  private metadata(request: RequestDaXacThuc) {
    const userAgent = request.headers['user-agent'];
    return {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    };
  }
}
