import {
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAccessGuard, type RequestDaXacThuc } from '../xac-thuc/jwt-access.guard';

import { PhanHoiUrlTepTinDto, PhanHoiXoaTepTinDto, TepTinDto } from './dto/phan-hoi-tep-tin.dto';
import { GIOI_HAN_TEP_TIN_BYTES, TepTinService } from './tep-tin.service';
import type { TepTaiLen } from './tep-tin.types';

@ApiTags('Tệp tin')
@ApiBearerAuth()
@Controller('tep-tin')
@UseGuards(JwtAccessGuard)
export class TepTinController {
  constructor(private readonly tepTinService: TepTinService) {}

  @Post('tai-len')
  @UseInterceptors(
    FileInterceptor('tep', {
      limits: {
        fileSize: GIOI_HAN_TEP_TIN_BYTES,
        files: 1,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['tep'],
      properties: {
        tep: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    operationId: 'taiTepTin',
    summary: 'Tải một file lên kho private',
  })
  @ApiCreatedResponse({
    type: TepTinDto,
  })
  taiLen(
    @UploadedFile() file: TepTaiLen | undefined,
    @Req() request: RequestDaXacThuc,
  ): Promise<TepTinDto> {
    const nguoiDungId = this.layNguoiDungId(request);

    return this.tepTinService.taiLen(nguoiDungId, file, this.layMetadataRequest(request));
  }

  @Get(':id')
  @ApiOperation({
    operationId: 'layMetadataTepTin',
    summary: 'Lấy metadata file',
  })
  @ApiOkResponse({
    type: TepTinDto,
  })
  layMetadata(@Param('id') id: string, @Req() request: RequestDaXacThuc): Promise<TepTinDto> {
    return this.tepTinService.layMetadata(id, this.layNguoiDungId(request));
  }

  @Get(':id/xem-url')
  @ApiOperation({
    operationId: 'taoUrlXemTepTin',
    summary: 'Tạo signed URL để xem file',
  })
  @ApiOkResponse({
    type: PhanHoiUrlTepTinDto,
  })
  taoUrlXem(
    @Param('id') id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiUrlTepTinDto> {
    return this.tepTinService.taoSignedUrl(id, this.layNguoiDungId(request), 'xem');
  }

  @Get(':id/tai-xuong-url')
  @ApiOperation({
    operationId: 'taoUrlTaiTepTin',
    summary: 'Tạo signed URL để tải file',
  })
  @ApiOkResponse({
    type: PhanHoiUrlTepTinDto,
  })
  taoUrlTaiXuong(
    @Param('id') id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiUrlTepTinDto> {
    return this.tepTinService.taoSignedUrl(id, this.layNguoiDungId(request), 'tai-xuong');
  }

  @Delete(':id')
  @ApiOperation({
    operationId: 'xoaTepTin',
    summary: 'Xóa file của tôi',
  })
  @ApiOkResponse({
    type: PhanHoiXoaTepTinDto,
  })
  async xoa(
    @Param('id') id: string,
    @Req() request: RequestDaXacThuc,
  ): Promise<PhanHoiXoaTepTinDto> {
    await this.tepTinService.xoa(
      id,
      this.layNguoiDungId(request),
      this.layMetadataRequest(request),
    );

    return {
      id,
      thongBao: 'Đã xóa file.',
    };
  }

  private layNguoiDungId(request: RequestDaXacThuc): string {
    const nguoiDungId = request.nguoiDungXacThuc?.id;

    if (!nguoiDungId) {
      throw new UnauthorizedException('Thiếu thông tin người dùng.');
    }

    return nguoiDungId;
  }

  private layMetadataRequest(request: RequestDaXacThuc): {
    ip: string | null;
    userAgent: string | null;
  } {
    const userAgent = request.headers['user-agent'];

    return {
      ip: request.ip ?? null,
      userAgent: typeof userAgent === 'string' ? userAgent : null,
    };
  }
}
