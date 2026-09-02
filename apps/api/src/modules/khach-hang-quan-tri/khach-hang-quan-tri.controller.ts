import {
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { LocKhachHangQuanTriDto } from './dto/loc-khach-hang-quan-tri.dto';
import {
  ChiTietKhachHangQuanTriDto,
  DanhSachDonHangKhachHangQuanTriDto,
  DanhSachKhachHangQuanTriDto,
  DanhSachKhieuNaiKhachHangQuanTriDto,
  TrangThaiKhoaKhachHangQuanTriDto,
} from './dto/phan-hoi-khach-hang-quan-tri.dto';
import { KhachHangQuanTriService } from './khach-hang-quan-tri.service';

@ApiTags('Khách hàng quản trị')
@ApiBearerAuth()
@Controller('quan-tri/khach-hang')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class KhachHangQuanTriController {
  constructor(private readonly service: KhachHangQuanTriService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDanhSachKhachHangQuanTri',
    summary: 'Danh sách khách hàng cho Admin',
  })
  @ApiOkResponse({ type: DanhSachKhachHangQuanTriDto })
  layDanhSach(@Query() query: LocKhachHangQuanTriDto): Promise<DanhSachKhachHangQuanTriDto> {
    return this.service.layDanhSach(query);
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layChiTietKhachHangQuanTri',
    summary: 'Chi tiết khách hàng cho Admin',
  })
  @ApiOkResponse({ type: ChiTietKhachHangQuanTriDto })
  layChiTiet(@Param('id') id: string): Promise<ChiTietKhachHangQuanTriDto> {
    return this.service.layChiTiet(id);
  }

  @Get(':id/don-hang')
  @ApiOperation({ operationId: 'layDonHangKhachHangQuanTri', summary: 'Đơn hàng của khách hàng' })
  @ApiOkResponse({ type: DanhSachDonHangKhachHangQuanTriDto })
  layDonHang(@Param('id') id: string): Promise<DanhSachDonHangKhachHangQuanTriDto> {
    return this.service.layDonHang(id);
  }

  @Get(':id/khieu-nai')
  @ApiOperation({ operationId: 'layKhieuNaiKhachHangQuanTri', summary: 'Khiếu nại của khách hàng' })
  @ApiOkResponse({ type: DanhSachKhieuNaiKhachHangQuanTriDto })
  layKhieuNai(@Param('id') id: string): Promise<DanhSachKhieuNaiKhachHangQuanTriDto> {
    return this.service.layKhieuNai(id);
  }

  @Put(':id/khoa')
  @ApiOperation({ operationId: 'khoaKhachHangQuanTri', summary: 'Khóa tài khoản khách hàng' })
  @ApiOkResponse({ type: TrangThaiKhoaKhachHangQuanTriDto })
  khoa(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<TrangThaiKhoaKhachHangQuanTriDto> {
    return this.service.khoa(this.nguoiDungId(request), id, this.metadata(request));
  }

  @Put(':id/mo-khoa')
  @ApiOperation({ operationId: 'moKhoaKhachHangQuanTri', summary: 'Mở khóa tài khoản khách hàng' })
  @ApiOkResponse({ type: TrangThaiKhoaKhachHangQuanTriDto })
  moKhoa(
    @Req() request: RequestDaXacThuc,
    @Param('id') id: string,
  ): Promise<TrangThaiKhoaKhachHangQuanTriDto> {
    return this.service.moKhoa(this.nguoiDungId(request), id, this.metadata(request));
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu người dùng xác thực.');
    return id;
  }

  private metadata(request: RequestDaXacThuc): { ip: string | null; userAgent: string | null } {
    return { ip: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null };
  }
}
