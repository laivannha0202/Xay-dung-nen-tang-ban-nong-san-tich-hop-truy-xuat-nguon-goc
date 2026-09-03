import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  ApiTags,
} from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { CapNhatTrangThaiChiTraNhaCungCapDto } from './dto/cap-nhat-trang-thai-chi-tra-nha-cung-cap.dto';
import {
  ChiTraNhaCungCapDto,
  DanhSachChiTraNhaCungCapDto,
} from './dto/phan-hoi-chi-tra-nha-cung-cap.dto';
import { TaoChiTraNhaCungCapDto } from './dto/tao-chi-tra-nha-cung-cap.dto';
import { TruyVanChiTraNhaCungCapDto } from './dto/truy-van-chi-tra-nha-cung-cap.dto';
import { ChiTraNhaCungCapService } from './chi-tra-nha-cung-cap.service';

@ApiTags('Chi trả nhà cung cấp')
@ApiBearerAuth()
@Controller('quan-tri/chi-tra-nha-cung-cap')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class ChiTraNhaCungCapController {
  constructor(private readonly service: ChiTraNhaCungCapService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachChiTraNhaCungCap',
    summary: 'Lấy danh sách yêu cầu chi trả nhà cung cấp',
  })
  @ApiOkResponse({ type: DanhSachChiTraNhaCungCapDto })
  layDanhSach(@Query() query: TruyVanChiTraNhaCungCapDto): Promise<DanhSachChiTraNhaCungCapDto> {
    return this.service.layDanhSach(query);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietChiTraNhaCungCap',
    summary: 'Lấy chi tiết yêu cầu chi trả nhà cung cấp',
  })
  @ApiOkResponse({ type: ChiTraNhaCungCapDto })
  layChiTiet(@Param('id', new ParseUUIDPipe()) id: string): Promise<ChiTraNhaCungCapDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @ApiOperation({
    operationId: 'taoYeuCauChiTraNhaCungCap',
    summary: 'Tạo yêu cầu chi trả và giữ số dư khả dụng',
  })
  @ApiCreatedResponse({ type: ChiTraNhaCungCapDto })
  tao(
    @Body() dto: TaoChiTraNhaCungCapDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ChiTraNhaCungCapDto> {
    return this.service.tao(this.tacNhanId(request), dto, this.metadata(request));
  }

  @Put(':id/trang-thai')
  @ApiOperation({
    operationId: 'capNhatTrangThaiChiTraNhaCungCap',
    summary: 'Chuyển trạng thái payout theo lifecycle',
  })
  @ApiOkResponse({ type: ChiTraNhaCungCapDto })
  capNhatTrangThai(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CapNhatTrangThaiChiTraNhaCungCapDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ChiTraNhaCungCapDto> {
    return this.service.capNhatTrangThai(this.tacNhanId(request), id, dto, this.metadata(request));
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
