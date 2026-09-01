import type {
  LayTrackingAdapterInput,
  LayTrackingAdapterResult,
  ShippingAdapter,
  TaoShipmentAdapterInput,
  TaoShipmentAdapterResult,
} from './shipping-adapter';

function batBuoc(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`MockShippingAdapter: ${field} không được rỗng.`);
  }
  return normalized;
}

function trackingTuThamChieu(maThamChieu: string): string {
  const normalized = maThamChieu
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `MOCK-${normalized || 'SHIPMENT'}`.slice(0, 191);
}

export class MockShippingAdapter implements ShippingAdapter {
  readonly name = 'MOCK' as const;

  async createShipment(input: TaoShipmentAdapterInput): Promise<TaoShipmentAdapterResult> {
    const maThamChieu = batBuoc(input.maThamChieu, 'maThamChieu');
    batBuoc(input.donHangNhaCungCapId, 'donHangNhaCungCapId');
    batBuoc(input.nguoiNhan.hoTen, 'nguoiNhan.hoTen');
    batBuoc(input.nguoiNhan.soDienThoai, 'nguoiNhan.soDienThoai');
    batBuoc(input.nguoiNhan.diaChi, 'nguoiNhan.diaChi');

    return {
      adapter: this.name,
      externalReference: `MOCK:${maThamChieu}`,
      trackingNumber: trackingTuThamChieu(maThamChieu),
      state: 'CREATED',
    };
  }

  async getTracking(input: LayTrackingAdapterInput): Promise<LayTrackingAdapterResult> {
    const externalReference = batBuoc(input.externalReference, 'externalReference');
    const trackingNumber = batBuoc(input.trackingNumber, 'trackingNumber');

    return {
      adapter: this.name,
      externalReference,
      trackingNumber,
      currentState: 'CREATED',
      events: [],
    };
  }
}
