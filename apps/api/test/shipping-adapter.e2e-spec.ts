import { MockShippingAdapter } from '../src/modules/giao-hang/adapter/mock-shipping.adapter';
import { ShippingAdapterRegistry } from '../src/modules/giao-hang/adapter/shipping-adapter.registry';
import {
  TEN_SHIPPING_ADAPTER,
  TRANG_THAI_SHIPPING_ADAPTER,
} from '../src/modules/giao-hang/adapter/shipping-adapter';

describe('Shipping Adapter PHIEN-064', () => {
  it('exact master giữ Mock-first và đủ Shipment state mapping', () => {
    expect(TEN_SHIPPING_ADAPTER).toEqual(['MOCK']);
    expect(TRANG_THAI_SHIPPING_ADAPTER).toEqual([
      'CREATED',
      'PICKED_UP',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'FAILED',
      'RETURNED',
    ]);
  });

  it('Mock createShipment trả reference/tracking deterministic và CREATED', async () => {
    const adapter = new MockShippingAdapter();
    const input = {
      donHangNhaCungCapId: 'supplier-order-064',
      maThamChieu: 'SUB-064-01',
      nguoiNhan: {
        hoTen: 'Khách PHIEN 064',
        soDienThoai: '0900000064',
        diaChi: 'Hà Nội',
      },
    };

    const first = await adapter.createShipment(input);
    const second = await adapter.createShipment(input);

    expect(first).toEqual(second);
    expect(first).toEqual({
      adapter: 'MOCK',
      externalReference: 'MOCK:SUB-064-01',
      trackingNumber: 'MOCK-SUB-064-01',
      state: 'CREATED',
    });
  });

  it('Mock getTracking không bịa tracking event khi chưa có carrier thật', async () => {
    const adapter = new MockShippingAdapter();
    const result = await adapter.getTracking({
      externalReference: 'MOCK:SUB-064-01',
      trackingNumber: 'MOCK-SUB-064-01',
    });

    expect(result.currentState).toBe('CREATED');
    expect(result.events).toEqual([]);
  });

  it('registry chỉ resolve adapter được đăng ký và chặn duplicate', () => {
    const mock = new MockShippingAdapter();
    const registry = new ShippingAdapterRegistry([mock]);

    expect(registry.get('MOCK')).toBe(mock);
    expect(() => new ShippingAdapterRegistry([mock, new MockShippingAdapter()])).toThrow(
      'Shipping adapter bị đăng ký trùng: MOCK',
    );
  });

  it('Mock validation chặn input rỗng trước boundary carrier', async () => {
    const adapter = new MockShippingAdapter();
    await expect(
      adapter.createShipment({
        donHangNhaCungCapId: 'supplier-order-064',
        maThamChieu: '   ',
        nguoiNhan: {
          hoTen: 'Khách',
          soDienThoai: '0900000064',
          diaChi: 'Hà Nội',
        },
      }),
    ).rejects.toThrow('maThamChieu không được rỗng');
  });
});
