import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { TEN_CONG_VIEC, TEN_HANG_DOI } from '../hang-doi.constants';
import type { DuLieuEmailThu } from '../hang-doi.service';

@Processor(TEN_HANG_DOI.EMAIL, {
  concurrency: 2,
})
@Injectable()
export class EmailWorker extends WorkerHost implements OnModuleDestroy {
  private readonly transporter: Transporter;

  constructor(configService: ConfigService) {
    super();

    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST') ?? '127.0.0.1',
      port: Number(configService.get<string>('SMTP_PORT') ?? '1025'),
      secure: false,
    });

    this.from = configService.get<string>('SMTP_FROM') ?? 'no-reply@agrimarket.local';
  }

  private readonly from: string;

  async process(job: Job<DuLieuEmailThu>): Promise<{
    daGui: boolean;
    maKiemTra: string;
  }> {
    if (job.name !== TEN_CONG_VIEC.GUI_EMAIL_THU) {
      throw new Error(`Email job không hỗ trợ: ${job.name}`);
    }

    await this.transporter.sendMail({
      from: this.from,
      to: job.data.den,
      subject: job.data.tieuDe,
      text: job.data.noiDung,
    });

    return {
      daGui: true,
      maKiemTra: job.data.maKiemTra,
    };
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
