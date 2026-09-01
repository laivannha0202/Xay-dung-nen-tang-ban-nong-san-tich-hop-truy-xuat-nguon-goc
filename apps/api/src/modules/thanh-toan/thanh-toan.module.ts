import { Module } from '@nestjs/common';

import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MockPaymentGateway } from './gateway/mock-payment.gateway';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';
import { VnPaySandboxGateway } from './gateway/vnpay-sandbox.gateway';
import { ThanhToanController } from './thanh-toan.controller';
import { ThanhToanService } from './thanh-toan.service';

@Module({
  imports: [XacThucModule, TonKhoModule],
  controllers: [ThanhToanController],
  providers: [ThanhToanService, MockPaymentGateway, VnPaySandboxGateway, PaymentGatewayRegistry],
  exports: [ThanhToanService, PaymentGatewayRegistry],
})
export class ThanhToanModule {}
