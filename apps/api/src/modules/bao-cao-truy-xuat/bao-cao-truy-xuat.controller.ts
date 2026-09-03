import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { BaoCaoTruyXuatService } from './bao-cao-truy-xuat.service';
import {
  DanhSachBaoCaoDonHangAnhHuongDto,
  DanhSachBaoCaoLoTruyXuatDto,
  DanhSachBaoCaoThuHoiTruyXuatDto,
} from './dto/phan-hoi-bao-cao-truy-xuat.dto';
import {
  TruyVanBaoCaoTruyXuatDto,
  TruyVanDonHangAnhHuongTruyXuatDto,
} from './dto/truy-van-bao-cao-truy-xuat.dto';

@ApiTags('Báo cáo truy xuất')
@ApiBearerAuth()
@Controller('quan-tri/bao-cao-truy-xuat')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.LO_SAN_PHAM_XEM)
export class BaoCaoTruyXuatController {
  constructor(private readonly service: BaoCaoTruyXuatService) {}

  @Get('lo')
  @ApiOperation({ operationId: 'layBaoCaoTruyXuatLo', summary: 'Báo cáo batch/lô truy xuất' })
  @ApiOkResponse({ type: DanhSachBaoCaoLoTruyXuatDto })
  layLo(@Query() query: TruyVanBaoCaoTruyXuatDto): Promise<DanhSachBaoCaoLoTruyXuatDto> {
    return this.service.layDanhSachLo(query);
  }

  @Get('thu-hoi')
  @ApiOperation({ operationId: 'layBaoCaoTruyXuatThuHoi', summary: 'Báo cáo recall/thu hồi lô' })
  @ApiOkResponse({ type: DanhSachBaoCaoThuHoiTruyXuatDto })
  layThuHoi(@Query() query: TruyVanBaoCaoTruyXuatDto): Promise<DanhSachBaoCaoThuHoiTruyXuatDto> {
    return this.service.layDanhSachThuHoi(query);
  }

  @Get('don-hang-anh-huong')
  @ApiOperation({
    operationId: 'layBaoCaoTruyXuatDonHangAnhHuong',
    summary: 'Báo cáo affected orders từ recalled batch',
  })
  @ApiOkResponse({ type: DanhSachBaoCaoDonHangAnhHuongDto })
  layDonHangAnhHuong(
    @Query() query: TruyVanDonHangAnhHuongTruyXuatDto,
  ): Promise<DanhSachBaoCaoDonHangAnhHuongDto> {
    return this.service.layDonHangAnhHuong(query);
  }
}
