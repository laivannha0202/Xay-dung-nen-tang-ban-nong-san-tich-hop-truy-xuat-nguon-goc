import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'node:crypto';
import { basename } from 'node:path';

import { PrismaService } from '../../database/prisma.service';
import { TrangThaiBanGhi } from '../../generated/prisma/client';

import type { PhanHoiUrlTepTinDto, TepTinDto } from './dto/phan-hoi-tep-tin.dto';
import type { CheDoUrlTepTin, TepTaiLen } from './tep-tin.types';

export const GIOI_HAN_TEP_TIN_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class TepTinService {
  private readonly logger = new Logger(TepTinService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint?: string;
  private readonly signedUrlTtlSeconds: number;
  private bucketSanSang?: Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.endpoint =
      this.configService.get<string>('S3_ENDPOINT') ??
      this.configService.get<string>('MINIO_ENDPOINT');

    this.bucket =
      this.configService.get<string>('S3_BUCKET') ??
      this.configService.get<string>('MINIO_BUCKET') ??
      'agrimarket';

    const region = this.configService.get<string>('S3_REGION') ?? 'us-east-1';

    const accessKeyId =
      this.configService.get<string>('S3_ACCESS_KEY') ??
      this.configService.get<string>('MINIO_ROOT_USER');

    const secretAccessKey =
      this.configService.get<string>('S3_SECRET_KEY') ??
      this.configService.get<string>('MINIO_ROOT_PASSWORD');

    const forcePathStyle =
      (this.configService.get<string>('S3_FORCE_PATH_STYLE') ??
        (this.endpoint ? 'true' : 'false')) === 'true';

    this.signedUrlTtlSeconds = Number(
      this.configService.get<string>('FILE_SIGNED_URL_TTL_SECONDS') ?? '300',
    );

    this.client = new S3Client({
      region,
      ...(this.endpoint ? { endpoint: this.endpoint } : {}),
      forcePathStyle,
      ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }
        : {}),
    });
  }

  async taiLen(
    nguoiDungId: string,
    file: TepTaiLen | undefined,
    metadata: {
      ip: string | null;
      userAgent: string | null;
    },
  ): Promise<TepTinDto> {
    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDungId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new ForbiddenException('Không tìm thấy người dùng tải file.');
    }

    const thongTin = this.kiemTraFile(file);
    await this.damBaoBucket();

    const objectKey = this.taoObjectKey(thongTin.mimeType);

    const sha256 = createHash('sha256').update(thongTin.buffer).digest('hex');

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: thongTin.buffer,
        ContentType: thongTin.mimeType,
        ContentLength: thongTin.size,
        Metadata: {
          sha256,
        },
      }),
    );

    try {
      const tep = await this.prisma.$transaction(async (tx) => {
        const moi = await tx.tepTin.create({
          data: {
            bucket: this.bucket,
            objectKey,
            tenGoc: thongTin.tenGoc,
            mimeType: thongTin.mimeType,
            kichThuoc: BigInt(thongTin.size),
            sha256,
            nguoiTaiLenId: actor.id,
            nguoiTaiLen: actor.email,
          },
        });

        await tx.nhatKyKiemToan.create({
          data: {
            tacNhanId: actor.id,
            tacNhan: actor.email,
            hanhDong: 'TEP_TIN_TAI_LEN',
            thucThe: 'tep_tin',
            thucTheId: moi.id,
            truoc: {
              tonTai: false,
            },
            sau: {
              tenGoc: moi.tenGoc,
              mimeType: moi.mimeType,
              kichThuoc: thongTin.size,
              sha256: moi.sha256,
              trangThai: TrangThaiBanGhi.HOAT_DONG,
            },
            metadata: {
              ip: metadata.ip,
              userAgent: metadata.userAgent,
            },
          },
        });

        return moi;
      });

      return this.toDto(tep);
    } catch (error) {
      try {
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
          }),
        );
      } catch (cleanupError) {
        this.logger.error('Không xóa bù object sau lỗi DB.', cleanupError);
      }

      throw error;
    }
  }

  async layMetadata(id: string, nguoiDungId: string): Promise<TepTinDto> {
    const tep = await this.layVaKiemTraQuyen(id, nguoiDungId);

    return this.toDto(tep);
  }

  async taoSignedUrl(
    id: string,
    nguoiDungId: string,
    cheDo: CheDoUrlTepTin,
  ): Promise<PhanHoiUrlTepTinDto> {
    const tep = await this.layVaKiemTraQuyen(id, nguoiDungId);

    const contentDisposition = this.taoContentDisposition(tep.tenGoc, cheDo);

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: tep.bucket,
        Key: tep.objectKey,
        ResponseContentType: tep.mimeType,
        ResponseContentDisposition: contentDisposition,
      }),
      {
        expiresIn: this.signedUrlTtlSeconds,
      },
    );

    return {
      url,
      cheDo,
      hetHanSauGiay: this.signedUrlTtlSeconds,
    };
  }

  async taoSignedUrlAnhNoiBo(id: string): Promise<string> {
    const tep = await this.prisma.tepTin.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        mimeType: {
          startsWith: 'image/',
        },
      },
    });

    if (!tep) {
      throw new NotFoundException('Không tìm thấy ảnh đang hoạt động.');
    }

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: tep.bucket,
        Key: tep.objectKey,
        ResponseContentType: tep.mimeType,
        ResponseContentDisposition: this.taoContentDisposition(tep.tenGoc, 'xem'),
      }),
      {
        expiresIn: this.signedUrlTtlSeconds,
      },
    );
  }

  async xoa(
    id: string,
    nguoiDungId: string,
    metadata: {
      ip: string | null;
      userAgent: string | null;
    },
  ): Promise<void> {
    const tep = await this.layVaKiemTraQuyen(id, nguoiDungId);

    const actor = await this.prisma.nguoiDung.findUnique({
      where: { id: nguoiDungId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!actor) {
      throw new ForbiddenException('Không tìm thấy tác nhân xóa file.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tepTin.update({
        where: { id: tep.id },
        data: {
          trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
          xoaLuc: new Date(),
        },
      });

      await tx.nhatKyKiemToan.create({
        data: {
          tacNhanId: actor.id,
          tacNhan: actor.email,
          hanhDong: 'TEP_TIN_XOA',
          thucThe: 'tep_tin',
          thucTheId: tep.id,
          truoc: {
            tenGoc: tep.tenGoc,
            mimeType: tep.mimeType,
            kichThuoc: Number(tep.kichThuoc),
            sha256: tep.sha256,
            trangThai: TrangThaiBanGhi.HOAT_DONG,
          },
          sau: {
            trangThai: TrangThaiBanGhi.NGUNG_HOAT_DONG,
          },
          metadata: {
            ip: metadata.ip,
            userAgent: metadata.userAgent,
          },
        },
      });
    });

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: tep.bucket,
          Key: tep.objectKey,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Metadata file ${tep.id} đã xóa mềm ` + 'nhưng object S3 cleanup thất bại.',
        error,
      );
    }
  }

  private async layVaKiemTraQuyen(id: string, nguoiDungId: string) {
    const tep = await this.prisma.tepTin.findFirst({
      where: {
        id,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
      },
    });

    if (!tep) {
      throw new NotFoundException('Không tìm thấy file.');
    }

    if (tep.nguoiTaiLenId === nguoiDungId) {
      return tep;
    }

    const laAdmin = await this.prisma.nguoiDungVaiTro.findFirst({
      where: {
        nguoiDungId,
        trangThai: TrangThaiBanGhi.HOAT_DONG,
        vaiTro: {
          ma: 'ADMIN',
          trangThai: TrangThaiBanGhi.HOAT_DONG,
        },
      },
      select: {
        id: true,
      },
    });

    if (!laAdmin) {
      throw new ForbiddenException('Bạn không có quyền truy cập file này.');
    }

    return tep;
  }

  private kiemTraFile(file: TepTaiLen | undefined): {
    buffer: Buffer;
    size: number;
    tenGoc: string;
    mimeType: string;
  } {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File không được rỗng.');
    }

    if (file.size > GIOI_HAN_TEP_TIN_BYTES || file.buffer.length > GIOI_HAN_TEP_TIN_BYTES) {
      throw new PayloadTooLargeException('File vượt quá giới hạn 5 MiB.');
    }

    const mimeType = this.nhanDangMime(file.buffer);

    if (!mimeType) {
      throw new UnsupportedMediaTypeException('Chỉ hỗ trợ JPEG, PNG, WebP và PDF.');
    }

    if (file.mimetype !== mimeType) {
      throw new UnsupportedMediaTypeException('MIME khai báo không khớp nội dung file.');
    }

    const tenGoc = basename(file.originalname.replace(/\\/g, '/')).slice(0, 255);

    if (!tenGoc) {
      throw new BadRequestException('Tên file không hợp lệ.');
    }

    return {
      buffer: file.buffer,
      size: file.buffer.length,
      tenGoc,
      mimeType,
    };
  }

  private nhanDangMime(buffer: Buffer): string | null {
    if (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'image/png';
    }

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
      return 'application/pdf';
    }

    return null;
  }

  private taoObjectKey(mimeType: string): string {
    const now = new Date();
    const nam = now.getUTCFullYear().toString();
    const thang = String(now.getUTCMonth() + 1).padStart(2, '0');
    const extension = MIME_EXTENSION[mimeType];

    return `tep/${nam}/${thang}/` + `${randomUUID()}.${extension}`;
  }

  private taoContentDisposition(tenGoc: string, cheDo: CheDoUrlTepTin): string {
    const kieu = cheDo === 'tai-xuong' ? 'attachment' : 'inline';

    const ascii = tenGoc
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\\r\n]/g, '_')
      .slice(0, 120);

    return `${kieu}; filename="${ascii}"; ` + `filename*=UTF-8''` + encodeURIComponent(tenGoc);
  }

  private async damBaoBucket(): Promise<void> {
    if (!this.bucketSanSang) {
      this.bucketSanSang = this.damBaoBucketNoiBo();
    }

    return this.bucketSanSang;
  }

  private async damBaoBucketNoiBo(): Promise<void> {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
      return;
    } catch (headError) {
      if (!this.endpoint) {
        throw headError;
      }
    }

    try {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );
    } catch (error) {
      const name = error instanceof Error ? error.name : '';

      if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') {
        throw error;
      }
    }
  }

  private toDto(tep: {
    id: string;
    tenGoc: string;
    mimeType: string;
    kichThuoc: bigint;
    sha256: string;
    createdAt: Date;
  }): TepTinDto {
    return {
      id: tep.id,
      tenGoc: tep.tenGoc,
      mimeType: tep.mimeType,
      kichThuoc: Number(tep.kichThuoc),
      sha256: tep.sha256,
      createdAt: tep.createdAt,
    };
  }
}
