import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { DanhSachSuKienTruyXuatDto, SuKienTruyXuatDto } from './dto/phan-hoi-su-kien-truy-xuat.dto';
import { TaoSuKienTruyXuatDto } from './dto/tao-su-kien-truy-xuat.dto';
import { TruyVanSuKienTruyXuatDto } from './dto/truy-van-su-kien-truy-xuat.dto';
import { SuKienTruyXuatService } from './su-kien-truy-xuat.service';

@ApiTags('Sự kiện truy xuất')
@ApiBearerAuth()
@Controller('su-kien-truy-xuat')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class SuKienTruyXuatController {
  constructor(private readonly service: SuKienTruyXuatService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.SU_KIEN_TRUY_XUAT_XEM)
  @ApiOperation({
    operationId: 'layDanhSachSuKienTruyXuat',
    summary: 'Lấy ledger sự kiện truy xuất',
  })
  @ApiOkResponse({
    type: DanhSachSuKienTruyXuatDto,
  })
  layDanhSach(
    @Query()
    dto: TruyVanSuKienTruyXuatDto,
  ): Promise<DanhSachSuKienTruyXuatDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.SU_KIEN_TRUY_XUAT_XEM)
  @ApiOperation({
    operationId: 'layChiTietSuKienTruyXuat',
    summary: 'Lấy chi tiết sự kiện truy xuất',
  })
  @ApiOkResponse({
    type: SuKienTruyXuatDto,
  })
  layChiTiet(
    @Param('id')
    id: string,
  ): Promise<SuKienTruyXuatDto> {
    return this.service.layChiTiet(id);
  }

  @Post('lo/:loSanPhamId')
  @YeuCauQuyen(MA_QUYEN.SU_KIEN_TRUY_XUAT_TAO)
  @ApiOperation({
    operationId: 'taoSuKienTruyXuat',
    summary: 'Ghi sự kiện mới vào ledger truy xuất của Lô',
  })
  @ApiCreatedResponse({
    type: SuKienTruyXuatDto,
  })
  tao(
    @Param('loSanPhamId')
    loSanPhamId: string,
    @Body()
    dto: TaoSuKienTruyXuatDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<SuKienTruyXuatDto> {
    return this.service.tao(this.layActor(request), loSanPhamId, dto, this.layMetadata(request));
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;

    if (!id) {
      throw new UnauthorizedException('Thiếu tác nhân tạo sự kiện truy xuất.');
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
