import {
  Body,
  Controller,
  Get,
  Param,
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

import { KiemDinhChatLuongService } from './kiem-dinh-chat-luong.service';
import {
  DanhSachKiemDinhChatLuongDto,
  KiemDinhChatLuongChiTietDto,
} from './dto/phan-hoi-kiem-dinh-chat-luong.dto';
import { TaoKiemDinhChatLuongDto } from './dto/tao-kiem-dinh-chat-luong.dto';
import { TruyVanKiemDinhChatLuongDto } from './dto/truy-van-kiem-dinh-chat-luong.dto';

@ApiTags('Kiểm định chất lượng')
@ApiBearerAuth()
@Controller('kiem-dinh-chat-luong')
@UseGuards(JwtAccessGuard, QuyenGuard)
export class KiemDinhChatLuongController {
  constructor(private readonly service: KiemDinhChatLuongService) {}

  @Get()
  @YeuCauQuyen(MA_QUYEN.KIEM_DINH_CHAT_LUONG_XEM)
  @ApiOperation({
    operationId: 'layDanhSachKiemDinhChatLuong',
    summary: 'Lấy danh sách kiểm định chất lượng',
  })
  @ApiOkResponse({
    type: DanhSachKiemDinhChatLuongDto,
  })
  layDanhSach(
    @Query()
    dto: TruyVanKiemDinhChatLuongDto,
  ): Promise<DanhSachKiemDinhChatLuongDto> {
    return this.service.layDanhSach(dto);
  }

  @Get(':id')
  @YeuCauQuyen(MA_QUYEN.KIEM_DINH_CHAT_LUONG_XEM)
  @ApiOperation({
    operationId: 'layChiTietKiemDinhChatLuong',
    summary: 'Lấy chi tiết kiểm định chất lượng',
  })
  @ApiOkResponse({
    type: KiemDinhChatLuongChiTietDto,
  })
  layChiTiet(
    @Param('id')
    id: string,
  ): Promise<KiemDinhChatLuongChiTietDto> {
    return this.service.layChiTiet(id);
  }

  @Post('lo/:loSanPhamId')
  @YeuCauQuyen(MA_QUYEN.KIEM_DINH_CHAT_LUONG_TAO)
  @ApiOperation({
    operationId: 'taoKiemDinhChatLuong',
    summary: 'Ghi kết quả kiểm định và cập nhật trạng thái Lô',
  })
  @ApiCreatedResponse({
    type: KiemDinhChatLuongChiTietDto,
  })
  tao(
    @Param('loSanPhamId')
    loSanPhamId: string,
    @Body()
    dto: TaoKiemDinhChatLuongDto,
    @Req()
    request: RequestDaXacThuc,
  ): Promise<KiemDinhChatLuongChiTietDto> {
    return this.service.tao(this.layActor(request), loSanPhamId, dto, this.layMetadata(request));
  }

  private layActor(request: RequestDaXacThuc): string {
    const id = request.nguoiDungXacThuc?.id;

    if (!id) {
      throw new UnauthorizedException('Thiếu người kiểm định.');
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
