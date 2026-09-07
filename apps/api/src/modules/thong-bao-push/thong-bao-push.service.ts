import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../database/prisma.service';
import { NenTangThietBiPush } from '../../generated/prisma/client';

import type {
  DangKyThietBiPushDto,
  HuyDangKyThietBiPushDto,
} from './dto/dang-ky-thiet-bi-push.dto';
import type {
  GuiThuPushPhanHoiDto,
  HuyThietBiPushPhanHoiDto,
  ThietBiPushPhanHoiDto,
} from './dto/phan-hoi-thiet-bi-push.dto';

type PushData = {
  type:
    | 'ORDER_STATUS'
    | 'SHIPMENT_STATUS'
    | 'REFUND_STATUS'
    | 'NEW_HARVEST'
    | 'RECALL';
  entityId: string | null;
  deepLink: string;
};

type PushPayload = {
  title: string;
  body: string;
  data: PushData;
};

type ExpoTicket = {
  status?: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushResponse = {
  data?: ExpoTicket[];
};

@Injectable()
export class ThongBaoPushService {
  private readonly logger = new Logger(ThongBaoPushService.name);
  private readonly expoPushUrl =
    'https://exp.host/--/api/v2/push/send';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async dangKy(
    nguoiDungId: string,
    dto: DangKyThietBiPushDto,
  ): Promise<ThietBiPushPhanHoiDto> {
    const token = dto.expoPushToken.trim();
    const now = new Date();

    const item = await this.prisma.thietBiPush.upsert({
      where: {
        expoPushToken: token,
      },
      create: {
        nguoiDungId,
        expoPushToken: token,
        projectId: dto.projectId,
        nenTang:
          dto.nenTang === 'IOS'
            ? NenTangThietBiPush.IOS
            : NenTangThietBiPush.ANDROID,
        hoatDong: true,
        lanCuoiDangKy: now,
      },
      update: {
        nguoiDungId,
        projectId: dto.projectId,
        nenTang:
          dto.nenTang === 'IOS'
            ? NenTangThietBiPush.IOS
            : NenTangThietBiPush.ANDROID,
        hoatDong: true,
        lanCuoiDangKy: now,
      },
    });

    return {
      id: item.id,
      nenTang: item.nenTang,
      projectId: item.projectId,
      hoatDong: item.hoatDong,
      lanCuoiDangKy: item.lanCuoiDangKy,
    };
  }

  async huy(
    nguoiDungId: string,
    dto: HuyDangKyThietBiPushDto,
  ): Promise<HuyThietBiPushPhanHoiDto> {
    const result = await this.prisma.thietBiPush.updateMany({
      where: {
        nguoiDungId,
        expoPushToken: dto.expoPushToken.trim(),
        hoatDong: true,
      },
      data: {
        hoatDong: false,
      },
    });

    return {
      daHuy: result.count > 0,
    };
  }

  async guiThuCuaToi(
    nguoiDungId: string,
  ): Promise<GuiThuPushPhanHoiDto> {
    return this.guiChoNguoiDung(
      [nguoiDungId],
      {
        title: 'AgriMarket · Remote push diagnostic',
        body:
          'Chạm để xác minh Backend → Expo Push → Mobile deep-link.',
        data: {
          type: 'ORDER_STATUS',
          entityId: null,
          deepLink: '/tai-khoan/thong-bao',
        },
      },
    );
  }

  async guiThuHoachMoi(
    thuHoachId: string,
  ): Promise<GuiThuPushPhanHoiDto> {
    const [thuHoach, notifications] = await Promise.all([
      this.prisma.thuHoach.findUnique({
        where: {
          id: thuHoachId,
        },
        include: {
          muaVu: {
            include: {
              trangTrai: true,
            },
          },
        },
      }),
      this.prisma.thongBaoThuHoach.findMany({
        where: {
          thuHoachId,
        },
        select: {
          khachHang: {
            select: {
              nguoiDungId: true,
            },
          },
        },
      }),
    ]);

    if (!thuHoach || notifications.length === 0) {
      return {
        soThietBi: 0,
        daGui: 0,
        soLoi: 0,
      };
    }

    const nguoiDungIds = [
      ...new Set(
        notifications.map(
          (item) => item.khachHang.nguoiDungId,
        ),
      ),
    ];

    const title =
      `Thu hoạch mới · ${thuHoach.muaVu.trangTrai.ten}`;

    const body = [
      thuHoach.muaVu.cayTrong,
      thuHoach.muaVu.giong || null,
      `${Number(thuHoach.soLuong)} ${thuHoach.donVi}`,
      thuHoach.phanLoai,
    ]
      .filter(Boolean)
      .join(' · ');

    return this.guiChoNguoiDung(
      nguoiDungIds,
      {
        title,
        body,
        data: {
          type: 'NEW_HARVEST',
          entityId: thuHoach.id,
          deepLink:
            `/trang-trai/${thuHoach.muaVu.trangTraiId}`,
        },
      },
    );
  }

  private async guiChoNguoiDung(
    nguoiDungIds: string[],
    payload: PushPayload,
  ): Promise<GuiThuPushPhanHoiDto> {
    if (nguoiDungIds.length === 0) {
      return {
        soThietBi: 0,
        daGui: 0,
        soLoi: 0,
      };
    }

    const devices = await this.prisma.thietBiPush.findMany({
      where: {
        nguoiDungId: {
          in: nguoiDungIds,
        },
        hoatDong: true,
      },
      select: {
        id: true,
        expoPushToken: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (devices.length === 0) {
      return {
        soThietBi: 0,
        daGui: 0,
        soLoi: 0,
      };
    }

    let daGui = 0;
    let soLoi = 0;

    for (
      let offset = 0;
      offset < devices.length;
      offset += 100
    ) {
      const batch = devices.slice(
        offset,
        offset + 100,
      );

      const messages = batch.map(
        (device) => ({
          to: device.expoPushToken,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: 'default',
          priority: 'high',
          channelId: 'agrimarket',
        }),
      );

      let response: Response;

      try {
        response = await fetch(
          this.expoPushUrl,
          {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify(messages),
          },
        );
      } catch (error) {
        throw new BadGatewayException(
          error instanceof Error
            ? `Không gọi được Expo Push Service: ${error.message}`
            : 'Không gọi được Expo Push Service.',
        );
      }

      if (!response.ok) {
        const body = await response.text();

        throw new BadGatewayException(
          `Expo Push Service HTTP ${response.status}: ${body.slice(0, 500)}`,
        );
      }

      const json =
        (await response.json()) as ExpoPushResponse;

      const tickets = json.data ?? [];

      for (
        let index = 0;
        index < batch.length;
        index += 1
      ) {
        const device = batch[index];

        if (!device) {
          continue;
        }

        const ticket = tickets[index];

        if (ticket?.status === 'ok') {
          daGui += 1;
          continue;
        }

        soLoi += 1;

        if (
          ticket?.details?.error ===
          'DeviceNotRegistered'
        ) {
          await this.prisma.thietBiPush.update({
            where: {
              id: device.id,
            },
            data: {
              hoatDong: false,
            },
          });
        }

        this.logger.warn(
          [
            'Expo push ticket error',
            device.id,
            ticket?.details?.error ?? 'UNKNOWN',
            ticket?.message ?? '',
          ].join(' · '),
        );
      }
    }

    return {
      soThietBi: devices.length,
      daGui,
      soLoi,
    };
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const token = this.configService
      .get<string>('EXPO_ACCESS_TOKEN')
      ?.trim();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }
}
