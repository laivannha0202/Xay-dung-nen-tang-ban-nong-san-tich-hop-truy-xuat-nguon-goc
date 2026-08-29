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

import { CapNhatMuaVuDto } from './dto/cap-nhat-mua-vu.dto';
import { DanhSachMuaVuDto, MuaVuDto } from './dto/phan-hoi-mua-vu.dto';
import { TaoMuaVuDto } from './dto/tao-mua-vu.dto';
import { TruyVanMuaVuDto } from './dto/truy-van-mua-vu.dto';
import { MuaVuService } from './mua-vu.service';

@ApiTags('Mùa vụ')
@ApiBearerAuth()
@Controller('mua-vu')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class MuaVuController {
  constructor(private readonly service: MuaVuService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.MUA_VU_XEM)
  @ApiOperation({
    operationId: 'layDanhSachMuaVu',
    summary: 'Lấy danh sách mùa vụ',
  })
  @ApiOkResponse({
    type: DanhSachMuaVuDto,
  })
  layDanhSach(@Query() dto: TruyVanMuaVuDto): Promise<DanhSachMuaVuDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.MUA_VU_XEM)
  @ApiOperation({
    operationId: 'layChiTietMuaVu',
    summary: 'Lấy chi tiết mùa vụ',
  })
  @ApiOkResponse({
    type: MuaVuDto,
  })
  layChiTiet(@Param('id') id: string): Promise<MuaVuDto> {
    return this.service.layChiTiet(id);
  }

  @Post()
  @YeuCauQuyen(MA_QUYEN.MUA_VU_TAO)
  @ApiOperation({
    operationId: 'taoMuaVu',
    summary: 'Tạo mùa vụ',
  })
  @ApiCreatedResponse({
    type: MuaVuDto,
  })
  tao(@Body() dto: TaoMuaVuDto, @Req() request: RequestDaXacThuc): Promise<MuaVuDto> {
    return this.service.tao(this.layActor(request), dto, this.layMetadata(request));
  }

  @Patch(':id')
  @YeuCauQuyen(MA_QUYEN.MUA_VU_SUA)
  @ApiOperation({
    operationId: 'capNhatMuaVu',
    summary: 'Cập nhật mùa vụ',
  })
  @ApiOkResponse({
    type: MuaVuDto,
  })
  capNhat(
    @Param('id') id: string,
    @Body() dto: CapNhatMuaVuDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<MuaVuDto> {
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
