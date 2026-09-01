import { createHmac } from 'node:crypto';

import { ConfigService } from '@nestjs/config';

import { MockPaymentGateway } from '../src/modules/thanh-toan/gateway/mock-payment.gateway';
import { PaymentGatewayRegistry } from '../src/modules/thanh-toan/gateway/payment-gateway.registry';
import { VnPaySandboxGateway } from '../src/modules/thanh-toan/gateway/vnpay-sandbox.gateway';

describe('Payment Gateway Adapter PHIEN-055', () => {
  const secret = 'sandbox-secret-phien055-for-test-only';
  const tmnCode = 'P055TEST';

  const configValues: Record<string, string> = {
    VNPAY_TMN_CODE: tmnCode,
    VNPAY_HASH_SECRET: secret,
    VNPAY_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    VNPAY_API_URL: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  };

  const config = {
    get: <T = string>(key: string): T | undefined => configValues[key] as T | undefined,
  } as ConfigService;

  const mock = new MockPaymentGateway();
  const vnpay = new VnPaySandboxGateway(config);
  const registry = new PaymentGatewayRegistry(mock, vnpay);

  const encode = (value: string): string => encodeURIComponent(value).replace(/%20/g, '+');

  const queryString = (params: Readonly<Record<string, string>>): string =>
    Object.entries(params)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [encodeURIComponent(key), encode(value)] as const)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

  const signQuery = (params: Readonly<Record<string, string>>): string =>
    createHmac('sha512', secret).update(queryString(params), 'utf8').digest('hex');

  const signPipe = (values: readonly string[]): string =>
    createHmac('sha512', secret).update(values.join('|'), 'utf8').digest('hex');

  it('registry có đúng Mock + VNPay Sandbox và exact interface methods', () => {
    expect(registry.names().sort()).toEqual(['MOCK', 'VNPAY_SANDBOX']);

    for (const name of registry.names()) {
      const adapter = registry.get(name);

      expect(typeof adapter.createPayment).toBe('function');
      expect(typeof adapter.verifyCallback).toBe('function');
      expect(typeof adapter.refund).toBe('function');
    }
  });

  it('Mock implement createPayment/verifyCallback/refund hoàn chỉnh không network', async () => {
    const created = await mock.createPayment({
      maGiaoDich: 'PAY-MOCK-055',
      soTien: 32000,
      noiDung: 'Thanh toan don hang 055',
      returnUrl: 'https://example.test/mock-return',
      ipAddress: '127.0.0.1',
    });

    expect(created.gateway).toBe('MOCK');
    expect(created.externalReference).toBe('PAY-MOCK-055');
    expect(created.paymentUrl).toContain('mock-payment.agrimarket.local');

    const callback = await mock.verifyCallback({
      params: {
        mock_signature: MockPaymentGateway.callbackSignature(),
        mock_result: 'SUCCESS',
        mock_transaction: 'PAY-MOCK-055',
        mock_gateway_transaction: 'MOCK-GW-055',
        mock_amount: '32000',
      },
    });

    expect(callback).toMatchObject({
      validSignature: true,
      success: true,
      amount: 32000,
      externalReference: 'PAY-MOCK-055',
    });

    const refund = await mock.refund({
      requestId: 'refund-mock-055',
      externalReference: 'PAY-MOCK-055',
      amount: 10000,
      transactionDate: '20260901150000',
      transactionType: 'PARTIAL',
      reason: 'Partial refund test',
      requestedBy: 'tester',
      ipAddress: '127.0.0.1',
    });

    expect(refund).toMatchObject({
      accepted: true,
      validSignature: true,
      responseCode: '00',
    });
  });

  it('VNPay createPayment sinh URL v2.1.0, amount x100 và HMACSHA512 đúng', async () => {
    const created = await vnpay.createPayment({
      maGiaoDich: 'PAY-VNPAY-055',
      soTien: 32000,
      noiDung: 'Thanh toan don hang 055',
      returnUrl: 'https://example.test/vnpay-return',
      ipAddress: '127.0.0.1',
      locale: 'vn',
    });

    const url = new URL(created.paymentUrl);
    const params: Record<string, string> = {};

    for (const [key, value] of url.searchParams.entries()) {
      if (key !== 'vnp_SecureHash') {
        params[key] = value;
      }
    }

    const secureHash = url.searchParams.get('vnp_SecureHash');

    expect(url.origin).toBe('https://sandbox.vnpayment.vn');
    expect(params).toMatchObject({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: '3200000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'PAYVNPAY055',
    });
    expect(secureHash).toBe(signQuery(params));
  });

  it('VNPay verifyCallback chỉ success khi checksum + response/status đều hợp lệ', async () => {
    const params: Record<string, string> = {
      vnp_Amount: '3200000',
      vnp_BankCode: 'NCB',
      vnp_PayDate: '20260901150100',
      vnp_ResponseCode: '00',
      vnp_TmnCode: tmnCode,
      vnp_TransactionNo: '123456789',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: 'PAYVNPAY055',
    };

    const valid = await vnpay.verifyCallback({
      params: {
        ...params,
        vnp_SecureHash: signQuery(params),
      },
    });

    expect(valid).toMatchObject({
      validSignature: true,
      success: true,
      amount: 32000,
      externalReference: 'PAYVNPAY055',
      externalTransactionId: '123456789',
    });

    const tampered = await vnpay.verifyCallback({
      params: {
        ...params,
        vnp_Amount: '999999',
        vnp_SecureHash: signQuery(params),
      },
    });

    expect(tampered.validSignature).toBe(false);
    expect(tampered.success).toBe(false);
  });

  it('VNPay refund POST JSON sandbox với checksum exact field-order và verify response', async () => {
    const responseWithoutHash = {
      vnp_ResponseId: 'RESP055',
      vnp_Command: 'refund',
      vnp_ResponseCode: '00',
      vnp_Message: 'Success',
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: 'PAYVNPAY055',
      vnp_Amount: '1000000',
      vnp_BankCode: 'NCB',
      vnp_PayDate: '20260901150500',
      vnp_TransactionNo: '987654321',
      vnp_TransactionType: '03',
      vnp_TransactionStatus: '00',
      vnp_OrderInfo: 'Partial refund test',
    };

    const responseHash = signPipe([
      responseWithoutHash.vnp_ResponseId,
      responseWithoutHash.vnp_Command,
      responseWithoutHash.vnp_ResponseCode,
      responseWithoutHash.vnp_Message,
      responseWithoutHash.vnp_TmnCode,
      responseWithoutHash.vnp_TxnRef,
      responseWithoutHash.vnp_Amount,
      responseWithoutHash.vnp_BankCode,
      responseWithoutHash.vnp_PayDate,
      responseWithoutHash.vnp_TransactionNo,
      responseWithoutHash.vnp_TransactionType,
      responseWithoutHash.vnp_TransactionStatus,
      responseWithoutHash.vnp_OrderInfo,
    ]);

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ...responseWithoutHash,
          vnp_SecureHash: responseHash,
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    try {
      const refund = await vnpay.refund({
        requestId: 'refund-vnpay-055',
        externalReference: 'PAY-VNPAY-055',
        amount: 10000,
        transactionNo: '123456789',
        transactionDate: '20260901150000',
        transactionType: 'PARTIAL',
        reason: 'Partial refund test',
        requestedBy: 'admin-test',
        ipAddress: '127.0.0.1',
      });

      expect(refund).toMatchObject({
        accepted: true,
        validSignature: true,
        responseCode: '00',
        externalTransactionId: '987654321',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const firstCall = fetchSpy.mock.calls[0];

      if (!firstCall) {
        throw new Error('VNPay refund test expected exactly one fetch call.');
      }

      const [url, init] = firstCall;

      expect(String(url)).toBe(configValues.VNPAY_API_URL);
      expect(init?.method).toBe('POST');

      const body = JSON.parse(String(init?.body)) as Record<string, string>;

      expect(body).toMatchObject({
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: tmnCode,
        vnp_TransactionType: '03',
        vnp_TxnRef: 'PAYVNPAY055',
        vnp_Amount: '1000000',
        vnp_TransactionNo: '123456789',
        vnp_TransactionDate: '20260901150000',
        vnp_CreateBy: 'admin-test',
        vnp_IpAddr: '127.0.0.1',
        vnp_OrderInfo: 'Partial refund test',
      });

      const requiredBodyValue = (key: string): string => {
        const value = body[key];

        if (value === undefined) {
          throw new Error(`VNPay refund body thiếu ${key}.`);
        }

        return value;
      };

      const expectedRequestHash = signPipe([
        requiredBodyValue('vnp_RequestId'),
        requiredBodyValue('vnp_Version'),
        requiredBodyValue('vnp_Command'),
        requiredBodyValue('vnp_TmnCode'),
        requiredBodyValue('vnp_TransactionType'),
        requiredBodyValue('vnp_TxnRef'),
        requiredBodyValue('vnp_Amount'),
        requiredBodyValue('vnp_TransactionNo'),
        requiredBodyValue('vnp_TransactionDate'),
        requiredBodyValue('vnp_CreateBy'),
        requiredBodyValue('vnp_CreateDate'),
        requiredBodyValue('vnp_IpAddr'),
        requiredBodyValue('vnp_OrderInfo'),
      ]);

      expect(requiredBodyValue('vnp_SecureHash')).toBe(expectedRequestHash);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
