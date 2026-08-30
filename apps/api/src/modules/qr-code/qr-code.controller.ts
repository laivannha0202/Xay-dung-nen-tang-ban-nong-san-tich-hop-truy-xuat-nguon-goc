import {
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

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { QrCodeLoSanPhamDto } from './dto/phan-hoi-qr-code.dto';
import { QrCodeService } from './qr-code.service';

@ApiTags('QR Code')
@ApiBearerAuth()
@Controller('qr-code')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class QrCodeController {
  constructor(private readonly service: QrCodeService) {}

  @Get('lo/:loSanPhamId')
  @YeuCauQuyen(MA_QUYEN.QR_CODE_XEM)
  @ApiOperation({
    operationId: 'layQrCodeLoSanPham',
    summary: 'Lấy QR Code đã tạo của Lô sản phẩm',
  })
  @ApiOkResponse({
    type: QrCodeLoSanPhamDto,
  })
  layTheoLo(
    @Param('loSanPhamId')
    loSanPhamId: string,
  ): Promise<QrCodeLoSanPhamDto> {
    return this.service.layTheoLo(loSanPhamId);
  }

  @Post('lo/:loSanPhamId')
  @YeuCauQuyen(MA_QUYEN.QR_CODE_TAO)
  @ApiOperation({
    operationId: 'taoQrCodeLoSanPham',
    summary: 'Tạo hoặc lấy stable QR Code của Lô sản phẩm',
  })
  @ApiCreatedResponse({
    type: QrCodeLoSanPhamDto,
  })
  taoHoacLay(
    @Param('loSanPhamId')
    loSanPhamId: string,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<QrCodeLoSanPhamDto> {
    return this.service.taoHoacLay(this.layActor(request), loSanPhamId, this.layMetadata(request));
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;

    if (!id) {
      throw new UnauthorizedException('Thiếu tác nhân tạo QR Code.');
    }

    return id;
  }

  private layMetadata(request: RequestDaXacThuc) {
    const userAgent = request.headers['user-agent'];

    return {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    };
  }
}
