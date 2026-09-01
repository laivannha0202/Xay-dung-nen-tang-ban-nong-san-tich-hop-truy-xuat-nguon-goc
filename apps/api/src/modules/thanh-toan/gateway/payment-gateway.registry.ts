import { Injectable, NotFoundException } from '@nestjs/common';

import { MockPaymentGateway } from './mock-payment.gateway';
import type { PaymentGatewayAdapter, TenPaymentGateway } from './payment-gateway.adapter';
import { VnPaySandboxGateway } from './vnpay-sandbox.gateway';

@Injectable()
export class PaymentGatewayRegistry {
  private readonly adapters: ReadonlyMap<TenPaymentGateway, PaymentGatewayAdapter>;

  constructor(mock: MockPaymentGateway, vnpay: VnPaySandboxGateway) {
    this.adapters = new Map<TenPaymentGateway, PaymentGatewayAdapter>([
      [mock.name, mock],
      [vnpay.name, vnpay],
    ]);
  }

  get(name: TenPaymentGateway): PaymentGatewayAdapter {
    const adapter = this.adapters.get(name);

    if (!adapter) {
      throw new NotFoundException(`Payment gateway chưa hỗ trợ: ${name}`);
    }

    return adapter;
  }

  names(): TenPaymentGateway[] {
    return [...this.adapters.keys()];
  }
}
