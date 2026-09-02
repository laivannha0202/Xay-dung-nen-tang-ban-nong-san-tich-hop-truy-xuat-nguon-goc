import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CapNhatNhanVienQuanTriDto } from './dto/cap-nhat-nhan-vien-quan-tri.dto';
import { DatLaiMatKhauNhanVienDto } from './dto/dat-lai-mat-khau-nhan-vien.dto';
import { GanVaiTroNhanVienDto } from './dto/gan-vai-tro-nhan-vien.dto';
import { LocNhanVienQuanTriDto } from './dto/loc-nhan-vien-quan-tri.dto';
import {
  DanhSachNhanVienQuanTriDto,
  DanhSachVaiTroKhaDungDto,
  DatLaiMatKhauNhanVienResponseDto,
  NhanVienQuanTriDto,
} from './dto/phan-hoi-nhan-vien-quan-tri.dto';
import { TaoNhanVienQuanTriDto } from './dto/tao-nhan-vien-quan-tri.dto';
import { NhanVienQuanTriService } from './nhan-vien-quan-tri.service';

@ApiTags('Nhân viên quản trị')
@ApiBearerAuth()
@Controller('quan-tri/nhan-vien')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class NhanVienQuanTriController {
  constructor(private readonly service: NhanVienQuanTriService) {}

  @Get()
  @ApiOperation({ operationId: 'layDanhSachNhanVienQuanTri', summary: 'Danh sách nhân viên' })
  @ApiOkResponse({ type: DanhSachNhanVienQuanTriDto })
  layDanhSach(@Query() query: LocNhanVienQuanTriDto) {
    return this.service.layDanhSach(query);
  }

  @Get('vai-tro-kha-dung')
  @ApiOperation({ operationId: 'layVaiTroKhaDungNhanVienQuanTri', summary: 'Vai trò có thể gán' })
  @ApiOkResponse({ type: DanhSachVaiTroKhaDungDto })
  layVaiTroKhaDung() {
    return this.service.layVaiTroKhaDung();
  }

  @Get(':id')
  @ApiOperation({ operationId: 'layChiTietNhanVienQuanTri', summary: 'Chi tiết nhân viên' })
  @ApiOkResponse({ type: NhanVienQuanTriDto })
  layChiTiet(@Param('id') id: string) {
    return this.service.layChiTiet(id);
  }

  @Post()
  @ApiOperation({ operationId: 'taoNhanVienQuanTri', summary: 'Tạo nhân viên' })
  @ApiCreatedResponse({ type: NhanVienQuanTriDto })
  tao(@Body() dto: TaoNhanVienQuanTriDto, @Req() request: RequestDaXacThuc) {
    return this.service.tao(this.tacNhanId(request), dto, this.metadata(request));
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'capNhatNhanVienQuanTri', summary: 'Sửa nhân viên' })
  @ApiOkResponse({ type: NhanVienQuanTriDto })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatNhanVienQuanTriDto,
    @Req() request: RequestDaXacThuc,
  ) {
    return this.service.capNhat(this.tacNhanId(request), id, dto, this.metadata(request));
  }

  @Put(':id/khoa')
  @ApiOperation({ operationId: 'khoaNhanVienQuanTri', summary: 'Khóa nhân viên' })
  @ApiOkResponse({ type: NhanVienQuanTriDto })
  khoa(@Param('id') id: string, @Req() request: RequestDaXacThuc) {
    return this.service.khoa(this.tacNhanId(request), id, this.metadata(request));
  }

  @Put(':id/dat-lai-mat-khau')
  @ApiOperation({ operationId: 'datLaiMatKhauNhanVienQuanTri', summary: 'Đặt lại mật khẩu' })
  @ApiOkResponse({ type: DatLaiMatKhauNhanVienResponseDto })
  datLaiMatKhau(
    @Param('id') id: string,
    @Body() dto: DatLaiMatKhauNhanVienDto,
    @Req() request: RequestDaXacThuc,
  ) {
    return this.service.datLaiMatKhau(
      this.tacNhanId(request),
      id,
      dto.matKhauMoi,
      this.metadata(request),
    );
  }

  @Put(':id/vai-tro')
  @ApiOperation({ operationId: 'ganVaiTroNhanVienQuanTri', summary: 'Gán vai trò nhân viên' })
  @ApiOkResponse({ type: NhanVienQuanTriDto })
  ganVaiTro(
    @Param('id') id: string,
    @Body() dto: GanVaiTroNhanVienDto,
    @Req() request: RequestDaXacThuc,
  ) {
    return this.service.ganVaiTro(this.tacNhanId(request), id, dto, this.metadata(request));
  }

  private tacNhanId(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;
    if (!id) throw new UnauthorizedException('Thiếu tác nhân quản trị.');
    return id;
  }

  private metadata(request: RequestDaXacThuc) {
    const ua = request.headers['user-agent'];
    return {
      ip: request.ip ?? null,
      userAgent: typeof ua === 'string' ? ua : null,
    };
  }
}
