import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class ThuDienXacThucService implements OnModuleDestroy {
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') ?? '127.0.0.1',
      port: Number(this.configService.get<string>('SMTP_PORT') ?? '1025'),
      secure: false,
    });
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }

  async guiMaDatLaiMatKhau(email: string, maDatLai: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM') ?? 'no-reply@agrimarket.local';
    const customerWebUrl =
      this.configService.get<string>('CUSTOMER_WEB_URL') ?? 'http://127.0.0.1:3001';

    const lienKet = `${customerWebUrl}/dat-lai-mat-khau?ma=` + encodeURIComponent(maDatLai);

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'AgriMarket - Đặt lại mật khẩu',
      text: [
        'Bạn vừa yêu cầu đặt lại mật khẩu AgriMarket.',
        '',
        `Mã đặt lại mật khẩu: ${maDatLai}`,
        `Liên kết: ${lienKet}`,
        '',
        'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.',
      ].join('\n'),
    });
  }
}
