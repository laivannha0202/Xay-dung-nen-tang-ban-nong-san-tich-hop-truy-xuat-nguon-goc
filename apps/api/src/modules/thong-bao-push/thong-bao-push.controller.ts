import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  JwtAccessGuard,
  type RequestDaXacThuc,
} from '../xac-thuc/jwt-access.guard';

import {
  DangKyThietBiPushDto,
  HuyDangKyThietBiPushDto,
} from './dto/dang-ky-thiet-bi-push.dto';
import {
  GuiThuPushPhanHoiDto,
  HuyThietBiPushPhanHoiDto,
  ThietBiPushPhanHoiDto,
} from './dto/phan-hoi-thiet-bi-push.dto';
import { ThongBaoPushService } from './thong-bao-push.service';

@ApiTags('Khách hàng')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard)
@Controller('khach-hang/thiet-bi-push')
export class ThongBaoPushController {
  constructor(
    private readonly service: ThongBaoPushService,
  ) {}

  @Put()
  @ApiOperation({
    operationId: 'dangKyThietBiPush',
    summary: 'Đăng ký ExpoPushToken của thiết bị hiện tại',
  })
  @ApiOkResponse({
    type: ThietBiPushPhanHoiDto,
  })
  dangKy(
    @Req() request: RequestDaXacThuc,
    @Body() dto: DangKyThietBiPushDto,
  ): Promise<ThietBiPushPhanHoiDto> {
    return this.service.dangKy(
      this.nguoiDungId(request),
      dto,
    );
  }

  @Delete()
  @ApiOperation({
    operationId: 'huyDangKyThietBiPush',
    summary: 'Ngừng gửi push tới ExpoPushToken hiện tại',
  })
  @ApiOkResponse({
    type: HuyThietBiPushPhanHoiDto,
  })
  huy(
    @Req() request: RequestDaXacThuc,
    @Body() dto: HuyDangKyThietBiPushDto,
  ): Promise<HuyThietBiPushPhanHoiDto> {
    return this.service.huy(
      this.nguoiDungId(request),
      dto,
    );
  }

  @Post('gui-thu')
  @ApiOperation({
    operationId: 'guiThuPushCuaToi',
    summary:
      'Gửi remote push diagnostic tới thiết bị của tài khoản hiện tại',
  })
  @ApiOkResponse({
    type: GuiThuPushPhanHoiDto,
  })
  guiThu(
    @Req() request: RequestDaXacThuc,
  ): Promise<GuiThuPushPhanHoiDto> {
    return this.service.guiThuCuaToi(
      this.nguoiDungId(request),
    );
  }

  private nguoiDungId(
    request: RequestDaXacThuc,
  ): string {
    const id =
      request.nguoiDungXacThuc?.id;

    if (!id) {
      throw new UnauthorizedException(
        'Thiếu người dùng xác thực.',
      );
    }

    return id;
  }
}
