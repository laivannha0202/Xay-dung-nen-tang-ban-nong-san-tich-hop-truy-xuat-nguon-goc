import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChienDichFlashSaleCongKhaiDto } from './dto/flash-sale.dto';
import { FlashSaleService } from './flash-sale.service';

@ApiTags('Flash sale công khai')
@Controller('flash-sale-cong-khai')
export class FlashSaleCongKhaiController {
  constructor(private readonly service: FlashSaleService) {}

  @Get('active')
  @ApiOperation({
    operationId: 'layFlashSaleCongKhaiActive',
    summary: 'Chiến dịch flash sale đang diễn ra (giá tính server-side)',
  })
  @ApiOkResponse({ type: [ChienDichFlashSaleCongKhaiDto] })
  layActive(): Promise<ChienDichFlashSaleCongKhaiDto[]> {
    return this.service.layActiveCongKhai();
  }
}
