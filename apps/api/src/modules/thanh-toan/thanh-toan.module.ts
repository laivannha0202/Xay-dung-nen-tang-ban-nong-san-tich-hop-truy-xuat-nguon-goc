import { Module } from '@nestjs/common';

import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MockPaymentGateway } from './gateway/mock-payment.gateway';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';
import { VnPaySandboxGateway } from './gateway/vnpay-sandbox.gateway';
import { ThanhToanCallbackController } from './thanh-toan-callback.controller';
import { ThanhToanCallbackService } from './thanh-toan-callback.service';
import { ThanhToanHoanTienController } from './thanh-toan-hoan-tien.controller';
import { ThanhToanHoanTienService } from './thanh-toan-hoan-tien.service';
import { ThanhToanTaiChinhController } from './thanh-toan-tai-chinh.controller';
import { ThanhToanTaiChinhService } from './thanh-toan-tai-chinh.service';
import { ThanhToanController } from './thanh-toan.controller';
import { ThanhToanService } from './thanh-toan.service';

@Module({
  imports: [XacThucModule, TonKhoModule, PhanQuyenModule],
  controllers: [
    ThanhToanController,
    ThanhToanCallbackController,
    ThanhToanHoanTienController,
    ThanhToanTaiChinhController,
  ],
  providers: [
    ThanhToanService,
    ThanhToanCallbackService,
    ThanhToanHoanTienService,
    ThanhToanTaiChinhService,
    MockPaymentGateway,
    VnPaySandboxGateway,
    PaymentGatewayRegistry,
  ],
  exports: [ThanhToanService, PaymentGatewayRegistry],
})
export class ThanhToanModule {}
