import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  PaymentGatewayAdapter,
  RefundGatewayInput,
  RefundGatewayResult,
  TaoPaymentGatewayInput,
  TaoPaymentGatewayResult,
  VerifyPaymentCallbackInput,
  VerifyPaymentCallbackResult,
} from './payment-gateway.adapter';

const VNPAY_VERSION = '2.1.0';
const DEFAULT_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const DEFAULT_API_URL = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';

type VnPayConfig = {
  tmnCode: string;
  hashSecret: string;
  paymentUrl: string;
  apiUrl: string;
};

type VnPayRefundResponse = Readonly<Record<string, unknown>> & {
  vnp_ResponseId?: unknown;
  vnp_Command?: unknown;
  vnp_ResponseCode?: unknown;
  vnp_Message?: unknown;
  vnp_TmnCode?: unknown;
  vnp_TxnRef?: unknown;
  vnp_Amount?: unknown;
  vnp_BankCode?: unknown;
  vnp_PayDate?: unknown;
  vnp_TransactionNo?: unknown;
  vnp_TransactionType?: unknown;
  vnp_TransactionStatus?: unknown;
  vnp_OrderInfo?: unknown;
  vnp_SecureHash?: unknown;
};

@Injectable()
export class VnPaySandboxGateway implements PaymentGatewayAdapter {
  readonly name = 'VNPAY_SANDBOX' as const;

  constructor(private readonly configService: ConfigService) {}

  async createPayment(input: TaoPaymentGatewayInput): Promise<TaoPaymentGatewayResult> {
    this.validateAmount(input.soTien);

    const config = this.layConfig();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (input.expiresInMinutes ?? 15) * 60_000);

    const externalReference = this.onlyAlphaNumeric(input.maGiaoDich, 100);

    const params: Record<string, string> = {
      vnp_Version: VNPAY_VERSION,
      vnp_Command: 'pay',
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: this.amountVnPay(input.soTien),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: externalReference,
      vnp_OrderInfo: input.noiDung,
      vnp_OrderType: 'other',
      vnp_Locale: input.locale ?? 'vn',
      vnp_ReturnUrl: input.returnUrl,
      vnp_IpAddr: input.ipAddress,
      vnp_CreateDate: this.formatVnPayDate(now),
      vnp_ExpireDate: this.formatVnPayDate(expiresAt),
    };

    const signData = this.queryString(params);
    const secureHash = this.hmacSha512(config.hashSecret, signData);

    return {
      gateway: this.name,
      externalReference,
      paymentUrl: `${config.paymentUrl}?${signData}` + `&vnp_SecureHash=${secureHash}`,
      expiresAt,
    };
  }

  async verifyCallback(input: VerifyPaymentCallbackInput): Promise<VerifyPaymentCallbackResult> {
    const config = this.layConfig();

    const secureHash = input.params.vnp_SecureHash ?? '';
    const params: Record<string, string> = {};

    for (const [key, value] of Object.entries(input.params)) {
      if (key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') {
        continue;
      }

      if (key.startsWith('vnp_')) {
        params[key] = value;
      }
    }

    const expected = this.hmacSha512(config.hashSecret, this.queryString(params));

    const checksumValid = this.safeEqual(secureHash, expected);

    const merchantValid = params.vnp_TmnCode === config.tmnCode;

    const validSignature = checksumValid && merchantValid;

    const amountRaw = Number(params.vnp_Amount ?? '');

    return {
      gateway: this.name,
      validSignature,
      success:
        validSignature && params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00',
      externalReference: params.vnp_TxnRef ?? null,
      externalTransactionId: params.vnp_TransactionNo ?? null,
      responseCode: params.vnp_ResponseCode ?? null,
      transactionStatus: params.vnp_TransactionStatus ?? null,
      amount: Number.isFinite(amountRaw) && amountRaw > 0 ? amountRaw / 100 : null,
    };
  }

  async refund(input: RefundGatewayInput): Promise<RefundGatewayResult> {
    this.validateAmount(input.amount);

    const config = this.layConfig();
    const createDate = this.formatVnPayDate(new Date());

    const payload: Record<string, string> = {
      vnp_RequestId: this.onlyAlphaNumeric(input.requestId, 32),
      vnp_Version: VNPAY_VERSION,
      vnp_Command: 'refund',
      vnp_TmnCode: config.tmnCode,
      vnp_TransactionType: input.transactionType === 'FULL' ? '02' : '03',
      vnp_TxnRef: this.onlyAlphaNumeric(input.externalReference, 100),
      vnp_Amount: this.amountVnPay(input.amount),
      vnp_TransactionNo: input.transactionNo ?? '',
      vnp_TransactionDate: input.transactionDate,
      vnp_CreateBy: input.requestedBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: input.ipAddress,
      vnp_OrderInfo: input.reason,
    };

    payload.vnp_SecureHash = this.hmacSha512(
      config.hashSecret,
      this.refundRequestHashData(payload),
    );

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`VNPay Sandbox refund HTTP ${response.status}.`);
    }

    const raw = (await response.json()) as VnPayRefundResponse;

    const responseHash = this.asString(raw.vnp_SecureHash);

    const validSignature =
      responseHash !== null &&
      this.safeEqual(
        responseHash,
        this.hmacSha512(config.hashSecret, this.refundResponseHashData(raw)),
      );

    const responseCode = this.asString(raw.vnp_ResponseCode);

    return {
      gateway: this.name,
      accepted: validSignature && responseCode === '00',
      validSignature,
      responseCode,
      message: this.asString(raw.vnp_Message),
      externalTransactionId: this.asString(raw.vnp_TransactionNo),
    };
  }

  private layConfig(): VnPayConfig {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

    if (!tmnCode || !hashSecret) {
      throw new Error('Thiếu VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET.');
    }

    return {
      tmnCode,
      hashSecret,
      paymentUrl: this.configService.get<string>('VNPAY_PAYMENT_URL') ?? DEFAULT_PAYMENT_URL,
      apiUrl: this.configService.get<string>('VNPAY_API_URL') ?? DEFAULT_API_URL,
    };
  }

  private queryString(params: Readonly<Record<string, string>>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(
        ([key, value]) =>
          [encodeURIComponent(key), encodeURIComponent(value).replace(/%20/g, '+')] as const,
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  private refundRequestHashData(payload: Readonly<Record<string, string>>): string {
    return [
      payload.vnp_RequestId,
      payload.vnp_Version,
      payload.vnp_Command,
      payload.vnp_TmnCode,
      payload.vnp_TransactionType,
      payload.vnp_TxnRef,
      payload.vnp_Amount,
      payload.vnp_TransactionNo,
      payload.vnp_TransactionDate,
      payload.vnp_CreateBy,
      payload.vnp_CreateDate,
      payload.vnp_IpAddr,
      payload.vnp_OrderInfo,
    ].join('|');
  }

  private refundResponseHashData(raw: VnPayRefundResponse): string {
    return [
      this.asString(raw.vnp_ResponseId) ?? '',
      this.asString(raw.vnp_Command) ?? '',
      this.asString(raw.vnp_ResponseCode) ?? '',
      this.asString(raw.vnp_Message) ?? '',
      this.asString(raw.vnp_TmnCode) ?? '',
      this.asString(raw.vnp_TxnRef) ?? '',
      this.asString(raw.vnp_Amount) ?? '',
      this.asString(raw.vnp_BankCode) ?? '',
      this.asString(raw.vnp_PayDate) ?? '',
      this.asString(raw.vnp_TransactionNo) ?? '',
      this.asString(raw.vnp_TransactionType) ?? '',
      this.asString(raw.vnp_TransactionStatus) ?? '',
      this.asString(raw.vnp_OrderInfo) ?? '',
    ].join('|');
  }

  private hmacSha512(secret: string, data: string): string {
    return createHmac('sha512', secret).update(data, 'utf8').digest('hex');
  }

  private safeEqual(actual: string, expected: string): boolean {
    const left = Buffer.from(actual.toLowerCase(), 'utf8');
    const right = Buffer.from(expected.toLowerCase(), 'utf8');

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  private formatVnPayDate(date: Date): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const values = new Map(parts.map((part) => [part.type, part.value]));

    return (
      (values.get('year') ?? '') +
      (values.get('month') ?? '') +
      (values.get('day') ?? '') +
      (values.get('hour') ?? '') +
      (values.get('minute') ?? '') +
      (values.get('second') ?? '')
    );
  }

  private amountVnPay(amount: number): string {
    return String(Math.round(amount * 100));
  }

  private onlyAlphaNumeric(value: string, maxLength: number): string {
    const result = value.replace(/[^A-Za-z0-9]/g, '');

    if (!result) {
      throw new Error('VNPay reference không hợp lệ.');
    }

    return result.slice(0, maxLength);
  }

  private validateAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('VNPay amount phải > 0.');
    }
  }

  private asString(value: unknown): string | null {
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return null;
  }
}
