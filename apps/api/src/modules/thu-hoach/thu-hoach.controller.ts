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

import { CapNhatThuHoachDto } from './dto/cap-nhat-thu-hoach.dto';
import { DanhSachThuHoachDto, ThuHoachDto } from './dto/phan-hoi-thu-hoach.dto';
import { TaoThuHoachDto } from './dto/tao-thu-hoach.dto';
import { TruyVanThuHoachDto } from './dto/truy-van-thu-hoach.dto';
import { ThuHoachService } from './thu-hoach.service';

@ApiTags('Thu hoạch')
@ApiBearerAuth()
@Controller('thu-hoach')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class ThuHoachController {
  constructor(private readonly service: ThuHoachService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.THU_HOACH_XEM)
  @ApiOperation({
    operationId: 'layDanhSachThuHoach',
    summary: 'Lấy danh sách thu hoạch',
  })
  @ApiOkResponse({
    type: DanhSachThuHoachDto,
  })
  layDanhSach(@Query() dto: TruyVanThuHoachDto): Promise<DanhSachThuHoachDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.THU_HOACH_XEM)
  @ApiOperation({
    operationId: 'layChiTietThuHoach',
    summary: 'Lấy chi tiết thu hoạch',
  })
  @ApiOkResponse({
    type: ThuHoachDto,
  })
  layChiTiet(@Param('id') id: string): Promise<ThuHoachDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.THU_HOACH_TAO)
  @ApiOperation({
    operationId: 'taoThuHoach',
    summary: 'Ghi nhận thu hoạch',
  })
  @ApiCreatedResponse({
    type: ThuHoachDto,
  })
  tao(@Body() dto: TaoThuHoachDto, @Req() request: RequestDaXacThuc): Promise<ThuHoachDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.THU_HOACH_SUA)
  @ApiOperation({
    operationId: 'capNhatThuHoach',
    summary: 'Cập nhật thu hoạch',
  })
  @ApiOkResponse({
    type: ThuHoachDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatThuHoachDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ThuHoachDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
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
