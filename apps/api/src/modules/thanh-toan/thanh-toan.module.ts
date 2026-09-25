import { Module } from '@nestjs/common';

import { DiemThuongModule } from '../diem-thuong/diem-thuong.module';
import { KhuyenMaiModule } from '../khuyen-mai/khuyen-mai.module';
import { PhanBoHoanTienModule } from '../phan-bo-hoan-tien/phan-bo-hoan-tien.module';
import { PhanQuyenModule } from '../phan-quyen/phan-quyen.module';
import { SoDuNhaCungCapModule } from '../so-du-nha-cung-cap/so-du-nha-cung-cap.module';
import { TonKhoModule } from '../ton-kho/ton-kho.module';
import { XacThucModule } from '../xac-thuc/xac-thuc.module';

import { MockPaymentGateway } from './gateway/mock-payment.gateway';
import { PaymentGatewayRegistry } from './gateway/payment-gateway.registry';
import { VnPaySandboxGateway } from './gateway/vnpay-sandbox.gateway';
import { ThanhToanCallbackController } from './thanh-toan-callback.controller';
import { ThanhToanCallbackService } from './thanh-toan-callback.service';
import { ThanhToanHoanTienController } from './thanh-toan-hoan-tien.controller';
import { ThanhToanHoanTienHauXuLyService } from './thanh-toan-hoan-tien-hau-xu-ly.service';
import { ThanhToanHoanTienService } from './thanh-toan-hoan-tien.service';
import { ThanhToanTaiChinhController } from './thanh-toan-tai-chinh.controller';
import { ThanhToanTaiChinhService } from './thanh-toan-tai-chinh.service';
import { ThanhToanController } from './thanh-toan.controller';
import { ThanhToanService } from './thanh-toan.service';
import { ThanhToanWebService } from './thanh-toan-web.service';

@Module({
  imports: [
    XacThucModule,
    TonKhoModule,
    PhanQuyenModule,
    DiemThuongModule,
    KhuyenMaiModule,
    PhanBoHoanTienModule,
    SoDuNhaCungCapModule,
  ],
  controllers: [
    ThanhToanController,
    ThanhToanCallbackController,
    ThanhToanHoanTienController,
    ThanhToanTaiChinhController,
  ],
  providers: [
    ThanhToanService,
    ThanhToanWebService,
    ThanhToanCallbackService,
    ThanhToanHoanTienService,
    ThanhToanHoanTienHauXuLyService,
    ThanhToanTaiChinhService,
    MockPaymentGateway,
    VnPaySandboxGateway,
    PaymentGatewayRegistry,
  ],
  exports: [ThanhToanService, PaymentGatewayRegistry, ThanhToanHoanTienService, ThanhToanHoanTienHauXuLyService],
})
export class ThanhToanModule {}
