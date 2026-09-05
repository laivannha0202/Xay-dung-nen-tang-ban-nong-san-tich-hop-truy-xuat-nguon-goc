import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';

export const KENH_THONG_BAO_ANDROID = 'agrimarket';

export const LOAI_THONG_BAO_PUSH_MOBILE = [
  'ORDER_STATUS',
  'SHIPMENT_STATUS',
  'REFUND_STATUS',
  'NEW_HARVEST',
  'RECALL',
] as const;

export type LoaiThongBaoPushMobile = (typeof LOAI_THONG_BAO_PUSH_MOBILE)[number];

export type DuLieuThongBaoPushMobile = {
  type: LoaiThongBaoPushMobile;
  entityId: string | null;
  deepLink: string;
};

export type ThongBaoThuHoachChoPush = {
  thuHoachId: string;
  trangTraiId: string;
};

export function taoDuLieuPushThuHoachMoi(input: ThongBaoThuHoachChoPush): DuLieuThongBaoPushMobile {
  return {
    type: 'NEW_HARVEST',
    entityId: input.thuHoachId,
    deepLink: `/trang-trai/${input.trangTraiId}`,
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
      trangThai: 'client-san-sang-chua-co-backend';
      expoPushToken: string;
      projectId: string;
      thongBao: string;
    }
  | {
      trangThai: 'loi-lay-token';
      expoPushToken: null;
      projectId: string;
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

let daXuLyNotificationKhoiDong = false;

function laLoaiThongBaoPush(value: unknown): value is LoaiThongBaoPushMobile {
  return (
    typeof value === 'string' && (LOAI_THONG_BAO_PUSH_MOBILE as readonly string[]).includes(value)
  );
}

export function laDeepLinkNoiBoAnToan(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const deepLink = value.trim();

  if (!deepLink.startsWith('/') || deepLink.startsWith('//') || deepLink.includes('://')) {
    return false;
  }

  return DUONG_DAN_NOI_BO_CHO_PHEP.some(
    (root) =>
      deepLink === root || deepLink.startsWith(`${root}/`) || deepLink.startsWith(`${root}?`),
  );
}

export function phanTichDuLieuThongBaoPush(
  data: Record<string, unknown> | undefined,
): DuLieuThongBaoPushMobile | null {
  if (!data) return null;
  if (!laLoaiThongBaoPush(data.type)) return null;
  if (!laDeepLinkNoiBoAnToan(data.deepLink)) return null;

  return {
    type: data.type,
    entityId: typeof data.entityId === 'string' ? data.entityId : null,
    deepLink: data.deepLink.trim(),
  };
}

function moThongBaoTheoDeepLink(notification: Notifications.Notification) {
  const payload = phanTichDuLieuThongBaoPush(notification.request.content.data);

  if (!payload) return;

  router.push(payload.deepLink as Href);
}

export async function damBaoKenhThongBaoAndroid() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(KENH_THONG_BAO_ANDROID, {
    name: 'AgriMarket',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export function layEasProjectId(): string | null {
  const extra = Constants.expoConfig?.extra as
    | {
        eas?: {
          projectId?: unknown;
        };
      }
    | undefined;

  const fromExpoConfig = extra?.eas?.projectId;
  const fromEasConfig = Constants.easConfig?.projectId;
  const candidate =
    typeof fromExpoConfig === 'string'
      ? fromExpoConfig
      : typeof fromEasConfig === 'string'
        ? fromEasConfig
        : null;

  const normalized = candidate?.trim() ?? '';

  return normalized.length > 0 ? normalized : null;
}

export async function dangKyThongBaoPushMobile(): Promise<KetQuaDangKyPushMobile> {
  if (Platform.OS === 'web') {
    return {
      trangThai: 'khong-ho-tro-web',
      expoPushToken: null,
      projectId: null,
      thongBao: 'Push notification native không được đăng ký trên web.',
    };
  }

  await damBaoKenhThongBaoAndroid();

  const current = await Notifications.getPermissionsAsync();
  let permission = current.status;

  if (permission !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    permission = requested.status;
  }

  const projectId = layEasProjectId();

  if (permission !== 'granted') {
    return {
      trangThai: 'tu-choi-quyen',
      expoPushToken: null,
      projectId,
      thongBao: 'Thiết bị chưa cấp quyền hiển thị thông báo.',
    };
  }

  if (!projectId) {
    return {
      trangThai: 'thieu-project-id',
      expoPushToken: null,
      projectId: null,
      thongBao: 'Chưa có EAS projectId trong app config; không tạo ExpoPushToken giả.',
    };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return {
      trangThai: 'client-san-sang-chua-co-backend',
      expoPushToken: token.data,
      projectId,
      thongBao:
        'Client đã lấy ExpoPushToken nhưng Backend chưa có endpoint đăng ký device token/push sender.',
    };
  } catch (error) {
    return {
      trangThai: 'loi-lay-token',
      expoPushToken: null,
      projectId,
      thongBao: error instanceof Error ? error.message : 'Không lấy được ExpoPushToken.',
    };
  }
}

export async function guiThongBaoThuNghiemNoiBo() {
  if (Platform.OS === 'web') {
    throw new Error('Local notification diagnostic chỉ chạy trên Android/iOS.');
  }

  await damBaoKenhThongBaoAndroid();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'AgriMarket · Kiểm tra thông báo',
      body: 'Chạm để kiểm tra internal deep-link của Mobile.',
      data: {
        type: 'ORDER_STATUS',
        entityId: 'local-diagnostic',
        deepLink: '/tai-khoan/thong-bao',
      },
    },
    trigger: null,
  });
}

export function khoiTaoThongBaoPushMobile(): () => void {
  if (Platform.OS === 'web') {
    return () => undefined;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  void damBaoKenhThongBaoAndroid();

  if (!daXuLyNotificationKhoiDong) {
    daXuLyNotificationKhoiDong = true;

    const response = Notifications.getLastNotificationResponse();

    if (response?.notification) {
      moThongBaoTheoDeepLink(response.notification);
    }
  }

  const receivedSubscription = Notifications.addNotificationReceivedListener(() => undefined);

  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    moThongBaoTheoDeepLink(response.notification);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
