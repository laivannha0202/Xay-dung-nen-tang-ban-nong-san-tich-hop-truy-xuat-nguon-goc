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

import { CapNhatNhatKyCanhTacDto } from './dto/cap-nhat-nhat-ky-canh-tac.dto';
import { DanhSachNhatKyCanhTacDto, NhatKyCanhTacDto } from './dto/phan-hoi-nhat-ky-canh-tac.dto';
import { TaoNhatKyCanhTacDto } from './dto/tao-nhat-ky-canh-tac.dto';
import { TruyVanNhatKyCanhTacDto } from './dto/truy-van-nhat-ky-canh-tac.dto';
import { NhatKyCanhTacService } from './nhat-ky-canh-tac.service';

@ApiTags('Nhật ký canh tác')
@ApiBearerAuth()
@Controller('nhat-ky-canh-tac')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class NhatKyCanhTacController {
  constructor(private readonly service: NhatKyCanhTacService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.NHAT_KY_CANH_TAC_XEM)
  @ApiOperation({
    operationId: 'layDanhSachNhatKyCanhTac',
    summary: 'Lấy danh sách nhật ký canh tác',
  })
  @ApiOkResponse({
    type: DanhSachNhatKyCanhTacDto,
  })
  layDanhSach(@Query() dto: TruyVanNhatKyCanhTacDto): Promise<DanhSachNhatKyCanhTacDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.NHAT_KY_CANH_TAC_XEM)
  @ApiOperation({
    operationId: 'layChiTietNhatKyCanhTac',
    summary: 'Lấy chi tiết nhật ký canh tác',
  })
  @ApiOkResponse({
    type: NhatKyCanhTacDto,
  })
  layChiTiet(@Param('id') id: string): Promise<NhatKyCanhTacDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.NHAT_KY_CANH_TAC_TAO)
  @ApiOperation({
    operationId: 'taoNhatKyCanhTac',
    summary: 'Tạo nhật ký canh tác',
  })
  @ApiCreatedResponse({
    type: NhatKyCanhTacDto,
  })
  tao(
    @Body() dto: TaoNhatKyCanhTacDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<NhatKyCanhTacDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.NHAT_KY_CANH_TAC_SUA)
  @ApiOperation({
    operationId: 'capNhatNhatKyCanhTac',
    summary: 'Cập nhật nhật ký canh tác',
  })
  @ApiOkResponse({
    type: NhatKyCanhTacDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatNhatKyCanhTacDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<NhatKyCanhTacDto> {
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
