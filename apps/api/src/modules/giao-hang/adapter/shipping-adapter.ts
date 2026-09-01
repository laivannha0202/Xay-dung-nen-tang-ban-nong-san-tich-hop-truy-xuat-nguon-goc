export const TEN_SHIPPING_ADAPTER = ['MOCK'] as const;

export type TenShippingAdapter = (typeof TEN_SHIPPING_ADAPTER)[number];

export const TRANG_THAI_SHIPPING_ADAPTER = [
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED',
  'RETURNED',
] as const;

export type TrangThaiShippingAdapter = (typeof TRANG_THAI_SHIPPING_ADAPTER)[number];

export type TaoShipmentAdapterInput = {
  donHangNhaCungCapId: string;
  maThamChieu: string;
  nguoiNhan: {
    hoTen: string;
    soDienThoai: string;
    diaChi: string;
  };
  ghiChu?: string;
};

export type TaoShipmentAdapterResult = {
  adapter: TenShippingAdapter;
  externalReference: string;
  trackingNumber: string;
  state: TrangThaiShippingAdapter;
};

export type LayTrackingAdapterInput = {
  externalReference: string;
  trackingNumber: string;
};

export type TrackingAdapterEvent = {
  state: TrangThaiShippingAdapter;
  description: string | null;
  location: string | null;
  occurredAt: Date;
};

export type LayTrackingAdapterResult = {
  adapter: TenShippingAdapter;
  externalReference: string;
  trackingNumber: string;
  currentState: TrangThaiShippingAdapter;
  events: readonly TrackingAdapterEvent[];
};

export interface ShippingAdapter {
  readonly name: TenShippingAdapter;

  createShipment(input: TaoShipmentAdapterInput): Promise<TaoShipmentAdapterResult>;

  getTracking(input: LayTrackingAdapterInput): Promise<LayTrackingAdapterResult>;
}
