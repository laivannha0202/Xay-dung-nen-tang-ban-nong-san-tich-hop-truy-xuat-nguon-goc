export const TEN_PAYMENT_GATEWAY = ['MOCK', 'VNPAY_SANDBOX'] as const;

export type TenPaymentGateway = (typeof TEN_PAYMENT_GATEWAY)[number];

export type TaoPaymentGatewayInput = {
  maGiaoDich: string;
  soTien: number;
  noiDung: string;
  returnUrl: string;
  ipAddress: string;
  locale?: 'vn' | 'en';
  expiresInMinutes?: number;
};

export type TaoPaymentGatewayResult = {
  gateway: TenPaymentGateway;
  externalReference: string;
  paymentUrl: string;
  expiresAt: Date;
};

export type VerifyPaymentCallbackInput = {
  params: Readonly<Record<string, string>>;
};

export type VerifyPaymentCallbackResult = {
  gateway: TenPaymentGateway;
  validSignature: boolean;
  success: boolean;
  externalReference: string | null;
  externalTransactionId: string | null;
  responseCode: string | null;
  transactionStatus: string | null;
  amount: number | null;
};

export type RefundGatewayInput = {
  requestId: string;
  externalReference: string;
  amount: number;
  transactionDate: string;
  transactionNo?: string;
  transactionType: 'FULL' | 'PARTIAL';
  reason: string;
  requestedBy: string;
  ipAddress: string;
};

export type RefundGatewayResult = {
  gateway: TenPaymentGateway;
  accepted: boolean;
  validSignature: boolean;
  responseCode: string | null;
  message: string | null;
  externalTransactionId: string | null;
};

export interface PaymentGatewayAdapter {
  readonly name: TenPaymentGateway;

  createPayment(input: TaoPaymentGatewayInput): Promise<TaoPaymentGatewayResult>;

  verifyCallback(input: VerifyPaymentCallbackInput): Promise<VerifyPaymentCallbackResult>;

  refund(input: RefundGatewayInput): Promise<RefundGatewayResult>;
}
