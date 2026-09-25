import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

import { DanhSachDoiSoatNhaCungCapDto, DoiSoatNhaCungCapDto } from './dto/phan-hoi-doi-soat.dto';
import { TaoDoiSoatDto } from './dto/tao-doi-soat.dto';
import { TruyVanDoiSoatDto } from './dto/truy-van-doi-soat.dto';
import { DoiSoatService } from './doi-soat.service';

@ApiTags('Đối soát nhà cung cấp')
@ApiBearerAuth()
@Controller('quan-tri/doi-soat')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class DoiSoatController {
  constructor(private readonly service: DoiSoatService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.TAI_CHINH_XEM)
  @ApiOperation({ operationId: 'layDanhSachDoiSoat', summary: 'Lấy danh sách kỳ đối soát' })
  @ApiOkResponse({ type: DanhSachDoiSoatNhaCungCapDto })
  layDanhSach(@Query() query: TruyVanDoiSoatDto): Promise<DanhSachDoiSoatNhaCungCapDto> {
    return this.service.layDanhSach(query);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.TAI_CHINH_XEM)
  @ApiOperation({ operationId: 'layChiTietDoiSoat', summary: 'Lấy chi tiết kỳ đối soát' })
  @ApiOkResponse({ type: DoiSoatNhaCungCapDto })
  layChiTiet(@Param('id', new ParseUUIDPipe()) id: string): Promise<DoiSoatNhaCungCapDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.TAI_CHINH_DOI_SOAT)
  @ApiOperation({ operationId: 'taoDoiSoat', summary: 'Tạo kỳ đối soát ở trạng thái đang chờ' })
  @ApiCreatedResponse({ type: DoiSoatNhaCungCapDto })
  tao(@Body() dto: TaoDoiSoatDto, @Req() request: RequestDaXacThuc): Promise<DoiSoatNhaCungCapDto> {
    return this.service.tao(this.tacNhanId(request), dto, this.metadata(request));
  }

  @Post(':id/giai-phong')
  @YeuCauQuyen(MA_QUYEN.TAI_CHINH_DOI_SOAT)
  @ApiOperation({
    operationId: 'giaiPhongDoiSoat',
    summary: 'Giải phóng tiền đối soát từ đang chờ sang khả dụng',
  })
  @ApiOkResponse({ type: DoiSoatNhaCungCapDto })
  giaiPhong(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<DoiSoatNhaCungCapDto> {
    return this.service.giaiPhong(this.tacNhanId(request), id, this.metadata(request));
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
