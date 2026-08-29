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

import { CapNhatChungNhanDto } from './dto/cap-nhat-chung-nhan.dto';
import { ChungNhanChiTietDto, DanhSachChungNhanDto } from './dto/phan-hoi-chung-nhan.dto';
import { TaoChungNhanDto } from './dto/tao-chung-nhan.dto';
import { TruyVanChungNhanDto } from './dto/truy-van-chung-nhan.dto';
import { XacMinhChungNhanDto } from './dto/xac-minh-chung-nhan.dto';
import { ChungNhanService } from './chung-nhan.service';

@ApiTags('Chứng nhận')
@ApiBearerAuth()
@Controller('chung-nhan')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class ChungNhanController {
  constructor(private readonly service: ChungNhanService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.CHUNG_NHAN_XEM)
  @ApiOperation({
    operationId: 'layDanhSachChungNhan',
    summary: 'Lấy danh sách chứng nhận',
  })
  @ApiOkResponse({
    type: DanhSachChungNhanDto,
  })
  layDanhSach(@Query() dto: TruyVanChungNhanDto): Promise<DanhSachChungNhanDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.CHUNG_NHAN_XEM)
  @ApiOperation({
    operationId: 'layChiTietChungNhan',
    summary: 'Lấy chi tiết chứng nhận',
  })
  @ApiOkResponse({
    type: ChungNhanChiTietDto,
  })
  layChiTiet(@Param('id') id: string): Promise<ChungNhanChiTietDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.CHUNG_NHAN_TAO)
  @ApiOperation({
    operationId: 'taoChungNhan',
    summary: 'Tạo chứng nhận',
  })
  @ApiCreatedResponse({
    type: ChungNhanChiTietDto,
  })
  tao(
    @Body() dto: TaoChungNhanDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ChungNhanChiTietDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.CHUNG_NHAN_SUA)
  @ApiOperation({
    operationId: 'capNhatChungNhan',
    summary: 'Cập nhật chứng nhận',
  })
  @ApiOkResponse({
    type: ChungNhanChiTietDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatChungNhanDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ChungNhanChiTietDto> {
    return this.service.capNhat(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Patch(':id/xac-minh')
  @YeuCauQuyen(MA_QUYEN.CHUNG_NHAN_XAC_MINH)
  @ApiOperation({
    operationId: 'xacMinhChungNhan',
    summary: 'Xác minh hoặc từ chối chứng nhận',
  })
  @ApiOkResponse({
    type: ChungNhanChiTietDto,
  })
  xacMinh(
    @Param('id') id: string,
    @Body() dto: XacMinhChungNhanDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<ChungNhanChiTietDto> {
    return this.service.xacMinh(this.layActor(request), id, dto, this.layMetadata(request));
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
