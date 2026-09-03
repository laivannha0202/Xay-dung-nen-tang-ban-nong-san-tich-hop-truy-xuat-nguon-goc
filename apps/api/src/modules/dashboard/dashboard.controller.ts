import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MA_QUYEN } from '../phan-quyen/ma-quyen';
import { QuyenGuard } from '../phan-quyen/quyen.guard';
import { YeuCauQuyen } from '../phan-quyen/yeu-cau-quyen.decorator';
import { JwtAccessGuard } from '../xac-thuc/jwt-access.guard';

import { DashboardKpiDto } from './dto/phan-hoi-dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('quan-tri/dashboard')
@UseGuards(JwtAccessGuard, QuyenGuard)
@YeuCauQuyen(MA_QUYEN.PHAN_QUYEN_QUAN_LY)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  @ApiOperation({
    operationId: 'layDashboard',
    summary: 'Lấy 6 KPI Dashboard toàn hệ thống',
  })
  @ApiOkResponse({ type: DashboardKpiDto })
  layDashboard(): Promise<DashboardKpiDto> {
    return this.service.layDashboard();
  }
}
