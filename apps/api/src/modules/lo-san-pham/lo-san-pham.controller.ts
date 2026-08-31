import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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

import { CapNhatLoSanPhamDto } from './dto/cap-nhat-lo-san-pham.dto';
import { DanhSachLoSanPhamDto, LoSanPhamDto } from './dto/phan-hoi-lo-san-pham.dto';
import { TaoLoTuThuHoachDto } from './dto/tao-lo-tu-thu-hoach.dto';
import { ThuHoiLoSanPhamDto } from './dto/thu-hoi-lo-san-pham.dto';
import { TruyVanLoSanPhamDto } from './dto/truy-van-lo-san-pham.dto';
import { LoSanPhamService } from './lo-san-pham.service';

@ApiTags('Lô sản phẩm')
@ApiBearerAuth()
@Controller('lo-san-pham')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class LoSanPhamController {
  constructor(private readonly service: LoSanPhamService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layDanhSachLoSanPham',
    summary: 'Lấy danh sách lô sản phẩm',
  })
  @ApiOkResponse({
    type: DanhSachLoSanPhamDto,
  })
  layDanhSach(@Query() dto: TruyVanLoSanPhamDto): Promise<DanhSachLoSanPhamDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_XEM)
  @ApiOperation({
    operationId: 'layChiTietLoSanPham',
    summary: 'Lấy chi tiết lô sản phẩm',
  })
  @ApiOkResponse({
    type: LoSanPhamDto,
  })
  layChiTiet(
    @Param('id')
    id: string,
  ): Promise<LoSanPhamDto> {
    return this.service.layChiTiet(id);
  }

  @Post('tu-thu-hoach/:thuHoachId')
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_TAO)
  @ApiOperation({
    operationId: 'taoLoTuThuHoach',
    summary: 'Tạo lô sản phẩm từ Thu hoạch',
  })
  @ApiCreatedResponse({
    type: LoSanPhamDto,
  })
  taoTuThuHoach(
    @Param('thuHoachId')
    thuHoachId: string,
    @Body()
    dto: TaoLoTuThuHoachDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<LoSanPhamDto> {
    return this.service.taoTuThuHoach(
      this.layActor(request),
      thuHoachId,
      dto,
      this.layMetadata(request),
    );
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'capNhatLoSanPham',
    summary: 'Cập nhật lô sản phẩm mới tạo',
  })
  @ApiOkResponse({
    type: LoSanPhamDto,
  })
  capNhat(
    @Param('id')
    id: string,
    @Body()
    dto: CapNhatLoSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<LoSanPhamDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/gui-kiem-dinh')
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_SUA)
  @ApiOperation({
    operationId: 'guiKiemDinhLoSanPham',
    summary: 'Chuyển lô mới tạo sang chờ kiểm định',
  })
  @ApiOkResponse({
    type: LoSanPhamDto,
  })
  guiKiemDinh(
    @Param('id')
    id: string,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<LoSanPhamDto> {
    return this.service.guiKiemDinh(this.layActor(request), id, this.layMetadata(request));
  }

  @Post(':id/thu-hoi')
  @YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_THU_HOI)
  @ApiOperation({
    operationId: 'thuHoiLoSanPham',
    summary: 'Thu hồi Lô sản phẩm',
  })
  @ApiCreatedResponse({
    type: LoSanPhamDto,
  })
  thuHoi(
    @Param('id')
    id: string,
    @Body()
    dto: ThuHoiLoSanPhamDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<LoSanPhamDto> {
    return this.service.thuHoi(this.layActor(request), id, dto, this.layMetadata(request));
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;

    if (!id) {
      throw new UnauthorizedException('Thiếu tác nhân.');
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
