import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ThanhToanPhanHoiDto } from './dto/phan-hoi-thanh-toan.dto';
import type { TaoThanhToanDto } from './dto/tao-thanh-toan.dto';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';
import { ThanhToanService } from './thanh-toan.service';

@Injectable()
export class ThanhToanWebService {
  constructor(
    private readonly thanhToanService: ThanhToanService,
    private readonly gatewayRegistry: PaymentGatewayRegistry,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Tái sử dụng toàn bộ create/idempotency hiện có, sau đó ký lại VNPay URL
   * với callback Web cố định. Không nhận return URL tùy ý từ client.
   */
  async taoVnPayWeb(
    nguoiDungId: string,
    dto: TaoThanhToanDto,
    ipAddress = '127.0.0.1',
  ): Promise<ThanhToanPhanHoiDto> {
    if (dto.phuongThuc !== 'VNPAY_SANDBOX') {
      throw new BadRequestException('ThanhToanWebService chỉ xử lý VNPay Sandbox.');
    }

    const payment = await this.thanhToanService.tao(nguoiDungId, dto, ipAddress);

    if (payment.trangThai === 'PAID') {
      return payment;
    }

    if (payment.phuongThuc !== 'VNPAY_SANDBOX') {
      throw new BadRequestException('Payment Web không phải VNPay Sandbox.');
    }

    const gateway = this.gatewayRegistry.get('VNPAY_SANDBOX');
    const gatewayResult = await gateway.createPayment({
      maGiaoDich: payment.giaoDich.maGiaoDich,
      soTien: payment.soTien,
      noiDung: `Thanh toan don hang ${payment.maDonHang}`,
      returnUrl:
        `${this.paymentPublicBaseUrl()}` +
        '/api/v1/thanh-toan/callback/VNPAY_SANDBOX/web',
      ipAddress: this.chuanHoaIp(ipAddress),
      locale: 'vn',
      expiresInMinutes: 15,
    });

    return {
      ...payment,
      paymentUrl: gatewayResult.paymentUrl,
      expiresAt: gatewayResult.expiresAt,
    };
  }

  private paymentPublicBaseUrl(): string {
    const raw = this.configService
      .get<string>('PAYMENT_PUBLIC_BASE_URL')
      ?.trim()
      .replace(/\/+$/, '');

    if (!raw) {
      throw new BadRequestException(
        'Thiếu PAYMENT_PUBLIC_BASE_URL để tạo VNPay return URL.',
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      throw new BadRequestException('PAYMENT_PUBLIC_BASE_URL không phải URL hợp lệ.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('PAYMENT_PUBLIC_BASE_URL phải dùng http hoặc https.');
    }

    return raw;
  }

  private chuanHoaIp(value: string): string {
    const raw = value.trim();
    if (!raw || raw === '::1') return '127.0.0.1';
    if (raw.startsWith('::ffff:')) return raw.slice('::ffff:'.length);
    return raw;
  }
}
