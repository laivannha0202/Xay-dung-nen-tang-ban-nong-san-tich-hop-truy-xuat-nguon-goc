import type { ShippingAdapter, TenShippingAdapter } from './shipping-adapter';

export class ShippingAdapterRegistry {
  private readonly adapters: ReadonlyMap<TenShippingAdapter, ShippingAdapter>;

  constructor(adapters: readonly ShippingAdapter[]) {
    const registry = new Map<TenShippingAdapter, ShippingAdapter>();
    for (const adapter of adapters) {
      if (registry.has(adapter.name)) {
        throw new Error(`Shipping adapter bị đăng ký trùng: ${adapter.name}`);
      }
      registry.set(adapter.name, adapter);
    }
    this.adapters = registry;
  }

  get(name: TenShippingAdapter): ShippingAdapter {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Shipping adapter chưa được đăng ký: ${name}`);
    }
    return adapter;
  }
}
