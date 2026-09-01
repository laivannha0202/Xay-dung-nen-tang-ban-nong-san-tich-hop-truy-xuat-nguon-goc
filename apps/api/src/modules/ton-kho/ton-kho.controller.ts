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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CanhBaoHetHanTonKhoService } from '../hang-doi/canh-bao-het-han-ton-kho.service';
import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { ChuyenKhoDto } from './dto/chuyen-kho.dto';
import { DieuChinhTonKhoDto } from './dto/dieu-chinh-ton-kho.dto';
import { NhapKhoDto } from './dto/nhap-kho.dto';
import { KetQuaBienDongTonKhoDto, KetQuaChuyenKhoDto } from './dto/phan-hoi-bien-dong-ton-kho.dto';
import { KetQuaCanhBaoHetHanTonKhoDto } from './dto/phan-hoi-canh-bao-het-han.dto';
import { KetQuaDieuChinhTonKhoDto } from './dto/phan-hoi-dieu-chinh-ton-kho.dto';
import { DanhSachTonKhoLoDto, TonKhoLoDto } from './dto/phan-hoi-ton-kho.dto';
import { TruyVanCanhBaoHetHanTonKhoDto } from './dto/truy-van-canh-bao-het-han.dto';
import { TruyVanTonKhoDto } from './dto/truy-van-ton-kho.dto';
import { XuatKhoDto } from './dto/xuat-kho.dto';
import { TonKhoService } from './ton-kho.service';

@ApiTags('Tồn kho')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, QuyenGuard)
@Controller('ton-kho')
export class TonKhoController {
  constructor(
    private readonly service: TonKhoService,
    private readonly canhBaoHetHan: CanhBaoHetHanTonKhoService,
  ) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layDanhSachTonKho',
    summary: 'Lấy danh sách tồn kho theo Kho + Lô + Biến thể',
  })
  @ApiOkResponse({ type: DanhSachTonKhoLoDto })
  layDanhSach(@Query() dto: TruyVanTonKhoDto): Promise<DanhSachTonKhoLoDto> {
    return this.service.layDanhSach(dto);
  }

  @Get('canh-bao-het-han')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layCanhBaoHetHanTonKho',
    summary: 'Lấy cảnh báo lô sắp hết hạn và đã hết hạn',
  })
  @ApiOkResponse({ type: KetQuaCanhBaoHetHanTonKhoDto })
  layCanhBaoHetHan(
    @Query() dto: TruyVanCanhBaoHetHanTonKhoDto,
  ): Promise<KetQuaCanhBaoHetHanTonKhoDto> {
    return this.canhBaoHetHan.layCanhBao({
      soNgay: dto.soNgay,
      gioiHan: dto.gioiHan,
    });
  }

  @Post('nhap')
  @YeuCauQuyen(MA_QUYEN.TON_KHO_DIEU_CHINH)
  @ApiOperation({
    operationId: 'nhapKho',
    summary: 'Nhập kho atomic: InventoryLot + HARVEST_IN ledger',
  })
  @ApiCreatedResponse({ type: KetQuaBienDongTonKhoDto })
  nhapKho(@Body() dto: NhapKhoDto): Promise<KetQuaBienDongTonKhoDto> {
    return this.service.nhapKho(dto);
  }

  @Post('xuat')
  @YeuCauQuyen(MA_QUYEN.TON_KHO_DIEU_CHINH)
  @ApiOperation({
    operationId: 'xuatKho',
    summary: 'Xuất kho atomic từ available + TRANSFER_OUT ledger',
  })
  @ApiCreatedResponse({ type: KetQuaBienDongTonKhoDto })
  xuatKho(@Body() dto: XuatKhoDto): Promise<KetQuaBienDongTonKhoDto> {
    return this.service.xuatKho(dto);
  }

  @Post('chuyen')
  @YeuCauQuyen(MA_QUYEN.TON_KHO_DIEU_CHINH)
  @ApiOperation({
    operationId: 'chuyenKho',
    summary: 'Chuyển kho atomic + TRANSFER_OUT/TRANSFER_IN ledger',
  })
  @ApiCreatedResponse({ type: KetQuaChuyenKhoDto })
  chuyenKho(@Body() dto: ChuyenKhoDto): Promise<KetQuaChuyenKhoDto> {
    return this.service.chuyenKho(dto);
  }

  @Post(':id/dieu-chinh')
  @YeuCauQuyen(MA_QUYEN.TON_KHO_DIEU_CHINH)
  @ApiOperation({
    operationId: 'dieuChinhTonKho',
    summary: 'Điều chỉnh onHand có ADJUSTMENT ledger + Audit Log',
  })
  @ApiCreatedResponse({ type: KetQuaDieuChinhTonKhoDto })
  dieuChinhTonKho(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DieuChinhTonKhoDto,
    @Req() request: RequestDaXacThuc,
  ): Promise<KetQuaDieuChinhTonKhoDto> {
    return this.service.dieuChinhTonKho(this.layActor(request), id, dto, this.layMetadata(request));
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KHO_XEM)
  @ApiOperation({
    operationId: 'layChiTietTonKho',
    summary: 'Lấy chi tiết tồn kho theo lô',
  })
  @ApiOkResponse({ type: TonKhoLoDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tồn kho theo lô' })
  layChiTiet(@Param('id', ParseUUIDPipe) id: string): Promise<TonKhoLoDto> {
    return this.service.layChiTiet(id);
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
