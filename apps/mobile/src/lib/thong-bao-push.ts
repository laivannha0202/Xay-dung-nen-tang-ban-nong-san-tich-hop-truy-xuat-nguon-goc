import Constants, {
  ExecutionEnvironment,
} from 'expo-constants';
import {
  router,
  type Href,
} from 'expo-router';
import { Platform } from 'react-native';

import {
  dangKyThietBiPushMobile,
  guiThuPushCuaToiMobile,
  huyDangKyThietBiPushMobile,
} from './api-thong-bao';

export const KENH_THONG_BAO_ANDROID =
  'agrimarket';

export const LOAI_THONG_BAO_PUSH_MOBILE = [
  'ORDER_STATUS',
  'SHIPMENT_STATUS',
  'REFUND_STATUS',
  'NEW_HARVEST',
  'RECALL',
] as const;

export type LoaiThongBaoPushMobile =
  (typeof LOAI_THONG_BAO_PUSH_MOBILE)[number];

export type DuLieuThongBaoPushMobile = {
  type: LoaiThongBaoPushMobile;
  entityId: string | null;
  deepLink: string;
};

export type ThongBaoThuHoachChoPush = {
  thuHoachId: string;
  trangTraiId: string;
};

export function taoDuLieuPushThuHoachMoi(
  input: ThongBaoThuHoachChoPush,
): DuLieuThongBaoPushMobile {
  return {
    type: 'NEW_HARVEST',
    entityId: input.thuHoachId,
    deepLink:
      `/trang-trai/${input.trangTraiId}`,
  };
}

export type KetQuaDangKyPushMobile =
  | {
      trangThai: 'khong-ho-tro-web';
      expoPushToken: null;
      projectId: null;
      thongBao: string;
    }
  | {
      trangThai: 'can-development-build';
      expoPushToken: null;
      projectId: string | null;
      thongBao: string;
    }
  | {
      trangThai: 'tu-choi-quyen';
      expoPushToken: null;
      projectId: string | null;
      thongBao: string;
    }
  | {
      trangThai: 'thieu-project-id';
      expoPushToken: null;
      projectId: null;
      thongBao: string;
    }
  | {
      trangThai: 'da-dang-ky-backend';
      expoPushToken: string;
      projectId: string;
      thongBao: string;
    }
  | {
      trangThai: 'loi-dang-ky-backend';
      expoPushToken: string;
      projectId: string;
      thongBao: string;
    }
  | {
      trangThai: 'loi-lay-token';
      expoPushToken: null;
      projectId: string | null;
      thongBao: string;
    };

const DUONG_DAN_NOI_BO_CHO_PHEP = [
  '/don-hang',
  '/trang-trai',
  '/truy-xuat',
  '/san-pham',
  '/tai-khoan',
  '/thanh-toan',
] as const;

type NotificationLike = {
  request: {
    content: {
      data?: Record<string, unknown>;
    };
  };
};

let daXuLyNotificationKhoiDong = false;

export function dangChayTrongExpoGo(): boolean {
  return (
    Constants.executionEnvironment ===
    ExecutionEnvironment.StoreClient
  );
}

function laLoaiThongBaoPush(
  value: unknown,
): value is LoaiThongBaoPushMobile {
  return (
    typeof value === 'string' &&
    (
      LOAI_THONG_BAO_PUSH_MOBILE as readonly string[]
    ).includes(value)
  );
}

export function laDeepLinkNoiBoAnToan(
  value: unknown,
): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const deepLink = value.trim();

  if (
    !deepLink.startsWith('/') ||
    deepLink.startsWith('//') ||
    deepLink.includes('://')
  ) {
    return false;
  }

  return DUONG_DAN_NOI_BO_CHO_PHEP.some(
    (root) =>
      deepLink === root ||
      deepLink.startsWith(
        `${root}/`,
      ) ||
      deepLink.startsWith(
        `${root}?`,
      ),
  );
}

export function phanTichDuLieuThongBaoPush(
  data: Record<string, unknown> | undefined,
): DuLieuThongBaoPushMobile | null {
  if (!data) {
    return null;
  }

  if (
    !laLoaiThongBaoPush(
      data.type,
    )
  ) {
    return null;
  }

  if (
    !laDeepLinkNoiBoAnToan(
      data.deepLink,
    )
  ) {
    return null;
  }

  return {
    type: data.type,
    entityId:
      typeof data.entityId === 'string'
        ? data.entityId
        : null,
    deepLink:
      data.deepLink.trim(),
  };
}

function moThongBaoTheoDeepLink(
  notification: NotificationLike,
) {
  const payload =
    phanTichDuLieuThongBaoPush(
      notification.request.content.data,
    );

  if (!payload) {
    return;
  }

  router.push(
    payload.deepLink as Href,
  );
}

export function layEasProjectId(): string | null {
  const extra =
    Constants.expoConfig?.extra as
      | {
          eas?: {
            projectId?: unknown;
          };
        }
      | undefined;

  const fromExpoConfig =
    extra?.eas?.projectId;

  const fromEasConfig =
    Constants.easConfig?.projectId;

  const candidate =
    typeof fromExpoConfig === 'string'
      ? fromExpoConfig
      : typeof fromEasConfig === 'string'
        ? fromEasConfig
        : null;

  const normalized =
    candidate?.trim() ?? '';

  return normalized.length > 0
    ? normalized
    : null;
}

async function taiNotificationsNative() {
  if (
    Platform.OS === 'web' ||
    dangChayTrongExpoGo()
  ) {
    return null;
  }

  return import(
    'expo-notifications'
  );
}

export async function damBaoKenhThongBaoAndroid() {
  if (
    Platform.OS !== 'android'
  ) {
    return;
  }

  const Notifications =
    await taiNotificationsNative();

  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    KENH_THONG_BAO_ANDROID,
    {
      name: 'AgriMarket',
      importance:
        Notifications.AndroidImportance.HIGH,
      vibrationPattern: [
        0,
        250,
        250,
        250,
      ],
    },
  );
}

export async function dangKyThongBaoPushMobile(
  options: {
    xinQuyen?: boolean;
  } = {},
): Promise<KetQuaDangKyPushMobile> {
  if (Platform.OS === 'web') {
    return {
      trangThai:
        'khong-ho-tro-web',
      expoPushToken: null,
      projectId: null,
      thongBao:
        'Push notification native không được đăng ký trên web.',
    };
  }

  const projectId =
    layEasProjectId();

  if (dangChayTrongExpoGo()) {
    return {
      trangThai:
        'can-development-build',
      expoPushToken: null,
      projectId,
      thongBao:
        'Remote push cần AgriMarket development build/standalone, không dùng Expo Go.',
    };
  }

  const Notifications =
    await taiNotificationsNative();

  if (!Notifications) {
    return {
      trangThai:
        'loi-lay-token',
      expoPushToken: null,
      projectId,
      thongBao:
        'Không tải được expo-notifications trong native build.',
    };
  }

  await damBaoKenhThongBaoAndroid();

  const current =
    await Notifications.getPermissionsAsync();

  let permission =
    current.status;

  if (
    permission !== 'granted' &&
    options.xinQuyen !== false
  ) {
    const requested =
      await Notifications.requestPermissionsAsync();

    permission =
      requested.status;
  }

  if (
    permission !== 'granted'
  ) {
    return {
      trangThai:
        'tu-choi-quyen',
      expoPushToken: null,
      projectId,
      thongBao:
        options.xinQuyen === false
          ? 'Thiết bị chưa cấp quyền push; auto-sync không tự bật permission.'
          : 'Thiết bị chưa cấp quyền hiển thị thông báo.',
    };
  }

  if (!projectId) {
    return {
      trangThai:
        'thieu-project-id',
      expoPushToken: null,
      projectId: null,
      thongBao:
        'Thiếu EAS projectId. Hãy link project bằng EAS trước khi build.',
    };
  }

  let token: string;

  try {
    const response =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    token =
      response.data;
  } catch (error) {
    return {
      trangThai:
        'loi-lay-token',
      expoPushToken: null,
      projectId,
      thongBao:
        error instanceof Error
          ? error.message
          : 'Không lấy được ExpoPushToken.',
    };
  }

  try {
    await dangKyThietBiPushMobile({
      expoPushToken: token,
      projectId,
      nenTang:
        Platform.OS === 'ios'
          ? 'IOS'
          : 'ANDROID',
    });

    return {
      trangThai:
        'da-dang-ky-backend',
      expoPushToken: token,
      projectId,
      thongBao:
        'ExpoPushToken đã được đăng ký với Backend AgriMarket.',
    };
  } catch (error) {
    return {
      trangThai:
        'loi-dang-ky-backend',
      expoPushToken: token,
      projectId,
      thongBao:
        error instanceof Error
          ? error.message
          : 'Backend không đăng ký được ExpoPushToken.',
    };
  }
}

export async function huyDangKyThongBaoPushMobile(): Promise<boolean> {
  if (
    Platform.OS === 'web' ||
    dangChayTrongExpoGo()
  ) {
    return false;
  }

  const projectId =
    layEasProjectId();

  if (!projectId) {
    return false;
  }

  const Notifications =
    await taiNotificationsNative();

  if (!Notifications) {
    return false;
  }

  const permission =
    await Notifications.getPermissionsAsync();

  if (
    permission.status !== 'granted'
  ) {
    return false;
  }

  try {
    const token =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    return huyDangKyThietBiPushMobile(
      token.data,
    );
  } catch {
    return false;
  }
}

export async function guiPushThuBackendMobile() {
  return guiThuPushCuaToiMobile();
}

export async function guiThongBaoThuNghiemNoiBo() {
  if (Platform.OS === 'web') {
    throw new Error(
      'Local notification diagnostic chỉ chạy trên Android/iOS.',
    );
  }

  if (dangChayTrongExpoGo()) {
    throw new Error(
      'Local notification diagnostic của AgriMarket dùng development build để đồng nhất với remote push.',
    );
  }

  const Notifications =
    await taiNotificationsNative();

  if (!Notifications) {
    throw new Error(
      'Không tải được expo-notifications trong native build.',
    );
  }

  await damBaoKenhThongBaoAndroid();

  await Notifications.scheduleNotificationAsync({
    content: {
      title:
        'AgriMarket · Local diagnostic',
      body:
        'Chạm để kiểm tra internal deep-link.',
      data: {
        type: 'ORDER_STATUS',
        entityId:
          'local-diagnostic',
        deepLink:
          '/tai-khoan/thong-bao',
      },
    },
    trigger: null,
  });
}

export function khoiTaoThongBaoPushMobile(): () => void {
  if (
    Platform.OS === 'web' ||
    dangChayTrongExpoGo()
  ) {
    return () => undefined;
  }

  let dangHoatDong = true;
  let cleanup =
    () => undefined;

  void (async () => {
    const Notifications =
      await taiNotificationsNative();

    if (
      !Notifications ||
      !dangHoatDong
    ) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    await damBaoKenhThongBaoAndroid();

    if (!dangHoatDong) {
      return;
    }

    if (
      !daXuLyNotificationKhoiDong
    ) {
      daXuLyNotificationKhoiDong =
        true;

      const response =
        Notifications.getLastNotificationResponse();

      if (
        response?.notification
      ) {
        moThongBaoTheoDeepLink(
          response.notification,
        );
      }
    }

    const receivedSubscription =
      Notifications.addNotificationReceivedListener(
        () => undefined,
      );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          moThongBaoTheoDeepLink(
            response.notification,
          );
        },
      );

    cleanup = () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  })().catch(
    (error: unknown) => {
      console.warn(
        '[AgriMarket] Không khởi tạo được notification native:',
        error instanceof Error
          ? error.message
          : error,
      );
    },
  );

  return () => {
    dangHoatDong = false;
    cleanup();
  };
}
