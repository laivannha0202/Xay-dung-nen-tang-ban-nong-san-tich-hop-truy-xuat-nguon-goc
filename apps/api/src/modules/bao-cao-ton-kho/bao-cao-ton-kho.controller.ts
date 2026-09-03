import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import {
  DanhSachBaoCaoCanhBaoTonKhoDto,
  DanhSachBaoCaoHaoHutTonKhoDto,
  DanhSachBaoCaoTonKhoDto,
} from './dto/phan-hoi-bao-cao-ton-kho.dto';
import {
  TruyVanBaoCaoHaoHutTonKhoDto,
  TruyVanBaoCaoTonKhoDto,
} from './dto/truy-van-bao-cao-ton-kho.dto';
import { BaoCaoTonKhoService } from './bao-cao-ton-kho.service';

@ApiTags('Báo cáo tồn kho')
@ApiBearerAuth()
@Controller('quan-tri/bao-cao-ton-kho')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.KHO_XEM)
export class BaoCaoTonKhoController {
  constructor(private readonly service: BaoCaoTonKhoService) {}

  @Get('ton-kho')
  @ApiOperation({
    operationId: 'layBaoCaoTonKhoHienTai',
    summary: 'Báo cáo stock hiện tại theo InventoryLot',
  })
  @ApiOkResponse({ type: DanhSachBaoCaoTonKhoDto })
  layTonKho(@Query() query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoTonKhoDto> {
    return this.service.layTonKho(query);
  }

  @Get('sap-het-han')
  @ApiOperation({
    operationId: 'layBaoCaoTonKhoSapHetHan',
    summary: 'Báo cáo near-expiry theo System Settings',
  })
  @ApiOkResponse({ type: DanhSachBaoCaoCanhBaoTonKhoDto })
  laySapHetHan(@Query() query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoCanhBaoTonKhoDto> {
    return this.service.laySapHetHan(query);
  }

  @Get('het-han')
  @ApiOperation({ operationId: 'layBaoCaoTonKhoHetHan', summary: 'Báo cáo expired còn tồn vật lý' })
  @ApiOkResponse({ type: DanhSachBaoCaoCanhBaoTonKhoDto })
  layHetHan(@Query() query: TruyVanBaoCaoTonKhoDto): Promise<DanhSachBaoCaoCanhBaoTonKhoDto> {
    return this.service.layHetHan(query);
  }

  @Get('hao-hut')
  @ApiOperation({
    operationId: 'layBaoCaoHaoHutTonKho',
    summary: 'Báo cáo waste từ DAMAGE/EXPIRE ledger',
  })
  @ApiOkResponse({ type: DanhSachBaoCaoHaoHutTonKhoDto })
  layHaoHut(@Query() query: TruyVanBaoCaoHaoHutTonKhoDto): Promise<DanhSachBaoCaoHaoHutTonKhoDto> {
    return this.service.layHaoHut(query);
  }
}
