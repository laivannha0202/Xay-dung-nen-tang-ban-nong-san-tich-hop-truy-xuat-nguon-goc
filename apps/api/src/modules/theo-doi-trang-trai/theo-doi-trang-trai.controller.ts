import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachThongBaoThuHoachDto,
  DanhSachTrangTraiTheoDoiDto,
  TrangThaiTheoDoiTrangTraiDto,
} from './dto/phan-hoi-theo-doi-trang-trai.dto';
import { TheoDoiTrangTraiService } from './theo-doi-trang-trai.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang')
export class TheoDoiTrangTraiController {
  constructor(private readonly service: TheoDoiTrangTraiService) {}

  @Get('theo-doi-trang-trai')
  @ApiOperation({
    operationId: 'layDanhSachTrangTraiTheoDoi',
    summary: 'Lấy danh sách trang trại tôi đang theo dõi',
  })
  @ApiOkResponse({ type: DanhSachTrangTraiTheoDoiDto })
  layDanhSach(@Req() request: RequestDaXacThuc): Promise<DanhSachTrangTraiTheoDoiDto> {
    return this.service.layDanhSach(this.nguoiDungId(request));
  }

  @Get('theo-doi-trang-trai/:trangTraiId/trang-thai')
  @ApiOperation({
    operationId: 'layTrangThaiTheoDoiTrangTrai',
    summary: 'Kiểm tra trạng thái theo dõi trang trại',
  })
  @ApiParam({ name: 'trangTraiId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiTheoDoiTrangTraiDto })
  layTrangThai(
    @Req() request: RequestDaXacThuc,
    @Param('trangTraiId', new ParseUUIDPipe()) trangTraiId: string,
  ): Promise<TrangThaiTheoDoiTrangTraiDto> {
    return this.service.layTrangThai(this.nguoiDungId(request), trangTraiId);
  }

  @Put('theo-doi-trang-trai/:trangTraiId')
  @ApiOperation({ operationId: 'theoDoiTrangTrai', summary: 'Theo dõi trang trại' })
  @ApiParam({ name: 'trangTraiId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiTheoDoiTrangTraiDto })
  theoDoi(
    @Req() request: RequestDaXacThuc,
    @Param('trangTraiId', new ParseUUIDPipe()) trangTraiId: string,
  ): Promise<TrangThaiTheoDoiTrangTraiDto> {
    return this.service.theoDoi(this.nguoiDungId(request), trangTraiId);
  }

  @Delete('theo-doi-trang-trai/:trangTraiId')
  @ApiOperation({ operationId: 'boTheoDoiTrangTrai', summary: 'Bỏ theo dõi trang trại' })
  @ApiParam({ name: 'trangTraiId', format: 'uuid' })
  @ApiOkResponse({ type: TrangThaiTheoDoiTrangTraiDto })
  boTheoDoi(
    @Req() request: RequestDaXacThuc,
    @Param('trangTraiId', new ParseUUIDPipe()) trangTraiId: string,
  ): Promise<TrangThaiTheoDoiTrangTraiDto> {
    return this.service.boTheoDoi(this.nguoiDungId(request), trangTraiId);
  }

  @Get('thong-bao-thu-hoach')
  @ApiOperation({
    operationId: 'layThongBaoThuHoachMoi',
    summary: 'Lấy thông báo thu hoạch mới từ các trang trại đã theo dõi',
  })
  @ApiOkResponse({ type: DanhSachThongBaoThuHoachDto })
  layThongBao(@Req() request: RequestDaXacThuc): Promise<DanhSachThongBaoThuHoachDto> {
    return this.service.layThongBaoThuHoach(this.nguoiDungId(request));
  }

  private nguoiDungId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) {
      throw new UnauthorizedException('Thiếu người dùng xác thực.');
    }
    return id;
  }
}
