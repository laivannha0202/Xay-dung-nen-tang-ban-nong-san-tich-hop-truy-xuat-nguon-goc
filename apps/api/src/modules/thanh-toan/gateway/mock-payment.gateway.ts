import { Injectable } from '@nestjs/common';

import type {
  PaymentGatewayAdapter,
  RefundGatewayInput,
  RefundGatewayResult,
  TaoPaymentGatewayInput,
  TaoPaymentGatewayResult,
  VerifyPaymentCallbackInput,
  VerifyPaymentCallbackResult,
} from './payment-gateway.adapter';

const MOCK_SIGNATURE = 'AGRIMARKET_MOCK_GATEWAY_V1';

@Injectable()
export class MockPaymentGateway implements PaymentGatewayAdapter {
  readonly name = 'MOCK' as const;

  async createPayment(input: TaoPaymentGatewayInput): Promise<TaoPaymentGatewayResult> {
    this.validateAmount(input.soTien);

    const expiresAt = new Date(Date.now() + (input.expiresInMinutes ?? 15) * 60_000);

    const url = new URL('https://mock-payment.agrimarket.local/pay');
    url.searchParams.set('transaction', input.maGiaoDich);
    url.searchParams.set('amount', input.soTien.toFixed(2));
    url.searchParams.set('returnUrl', input.returnUrl);

    return {
      gateway: this.name,
      externalReference: input.maGiaoDich,
      paymentUrl: url.toString(),
      expiresAt,
    };
  }

  async verifyCallback(input: VerifyPaymentCallbackInput): Promise<VerifyPaymentCallbackResult> {
    const params = input.params;
    const validSignature = params.mock_signature === MOCK_SIGNATURE;
    const success = validSignature && params.mock_result === 'SUCCESS';

    const amountRaw = Number(params.mock_amount ?? '');

    return {
      gateway: this.name,
      validSignature,
      success,
      externalReference: params.mock_transaction ?? null,
      externalTransactionId: params.mock_gateway_transaction ?? null,
      responseCode:
        params.mock_result === 'SUCCESS' ? '00' : params.mock_result === 'FAILED' ? '99' : null,
      transactionStatus: params.mock_result ?? null,
      amount: Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw : null,
    };
  }

  async refund(input: RefundGatewayInput): Promise<RefundGatewayResult> {
    this.validateAmount(input.amount);

    return {
      gateway: this.name,
      accepted: true,
      validSignature: true,
      responseCode: '00',
      message:
        input.transactionType === 'FULL'
          ? 'Mock full refund accepted'
          : 'Mock partial refund accepted',
      externalTransactionId: `MOCK-REFUND-${input.requestId}`,
    };
  }

  static callbackSignature(): string {
    return MOCK_SIGNATURE;
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Payment gateway amount phải > 0.');
    }
  }
}
