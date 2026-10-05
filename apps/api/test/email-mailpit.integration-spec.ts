/**
 * GATE TÍCH HỢP MAILPIT — gửi email THẬT qua SMTP rồi đọc hộp thư Mailpit.
 *
 * Vì sao tách riêng khỏi `redis-bullmq.e2e-spec.ts`
 * -------------------------------------------------
 * Trước đây suite BullMQ vừa assert contract queue/worker vừa assert hộp thư
 * Mailpit, với một nhánh `if (EMAIL_TRANSPORT_MODE === 'memory') return;` ở giữa.
 * Hậu quả đo được: `pnpm --filter @agrimarket/api test` trên máy dev KHÔNG set
 * `EMAIL_TRANSPORT_MODE`, nên nhánh Mailpit chạy và đỏ với
 * `ECONNREFUSED 127.0.0.1:1025` — mơ hồ, trông như bug sản phẩm nhưng thực ra
 * chỉ là thiếu dịch vụ hạ tầng.
 *
 * Sau khi tách:
 *   - `jest-e2e.json` (release gate + `pnpm test`): contract queue/worker/retry,
 *     chạy với `EMAIL_TRANSPORT_MODE=memory`, KHÔNG cần Mailpit. Đây là phần
 *     logic sản phẩm.
 *   - `jest-e2e-mailpit.json` (gate này): SMTP thật + Mailpit thật. Đây là phần
 *     tích hợp hạ tầng.
 *
 * Nguyên tắc: gate này KHÔNG skip. Mailpit không chạy -> FAIL kèm hướng dẫn.
 * Test giả xanh ở đây tệ hơn là để người khác tưởng đường gửi mail đã được kiểm.
 *
 * Chạy:
 *   Mailpit local : pnpm test:api:mailpit
 *   CI            : service `mailpit` trong .github/workflows/release-ci.yml
 */

import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { HangDoiService } from '../src/modules/hang-doi/hang-doi.service';

const THOI_GIAN_CHO_TICH_HOP_MS = 60_000;

function mailpitHttpBase() {
  const port = process.env.MAILPIT_HTTP_PORT ?? '8025';
  const host = process.env.MAILPIT_HTTP_HOST ?? '127.0.0.1';
  return `http://${host}:${port}`;
}

async function choJobHoanThanh(queue: Queue, jobId: string) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    const state = await queue.getJobState(jobId);

    if (state === 'completed') {
      const job = await queue.getJob(jobId);

      if (!job?.finishedOn) {
        throw new Error(`Job ${jobId} completed nhưng chưa có finishedOn.`);
      }

      return job;
    }

    if (state === 'failed') {
      const job = await queue.getJob(jobId);
      throw new Error(`Job ${jobId} failed: ${job?.failedReason ?? 'unknown'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Job ${jobId} chưa hoàn thành sau 30s; state=${await queue.getJobState(jobId)}.`);
}

/** Chờ Mailpit trả lời /api/v1/messages — dùng để báo lỗi rõ khi thiếu dịch vụ. */
async function canMailpit(base: string): Promise<boolean> {
  try {
    const response = await fetch(`${base}/api/v1/messages?limit=1`, {
      signal: AbortSignal.timeout(3000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

describe('Mailpit SMTP integration gate (agrimarket_test)', () => {
  let app: INestApplication;
  let hangDoiService: HangDoiService;
  let emailQueue: Queue;

  const base = mailpitHttpBase();
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  beforeAll(async () => {
    // Gate tích hợp: bắt buộc SMTP THẬT. Nếu còn sót
    // EMAIL_TRANSPORT_MODE=memory thì test này chỉ chứng minh jsonTransport,
    // tức là xanh giả — nên từ chối chạy.
    if (process.env.EMAIL_TRANSPORT_MODE === 'memory') {
      throw new Error(
        'EMAIL_TRANSPORT_MODE=memory không dùng được cho gate Mailpit. ' +
          'Bỏ biến này khi chạy `pnpm test:api:mailpit`.',
      );
    }

    if (!(await canMailpit(base))) {
      throw new Error(
        `Không kết nối được Mailpit tại ${base}. ` +
          'Mailpit là dependency BẮT BUỘC của gate này (không skip được). ' +
          'Chạy Mailpit SMTP 1025 + HTTP 8025, hoặc dùng ' +
          '`pnpm --filter @agrimarket/api test` cho phần logic không cần SMTP.',
      );
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    hangDoiService = app.get(HangDoiService);
    emailQueue = app.get(getQueueToken(TEN_HANG_DOI.EMAIL));
  }, THOI_GIAN_CHO_TICH_HOP_MS);

  afterAll(async () => {
    if (emailQueue) {
      await emailQueue.clean(0, 1000, 'completed');
      await emailQueue.clean(0, 1000, 'failed');
      await emailQueue.close();
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_TICH_HOP_MS);

  it(
    'BullMQ email worker gửi thư thật qua SMTP và thư nằm trong hộp thư Mailpit',
    async () => {
      const email = `mailpit-gate-${suffix}@example.com`;
      const maKiemTra = `mailpit-${suffix}`;
      const noiDung = `Mailpit gate OK ${maKiemTra}`;

      const jobId = await hangDoiService.themEmailThu({
        den: email,
        tieuDe: `AgriMarket Mailpit gate ${maKiemTra}`,
        noiDung,
        maKiemTra,
      });

      const job = await choJobHoanThanh(emailQueue, jobId);

      // Contract worker: BullMQ -> EmailWorker -> nodemailer SMTP -> returnvalue.
      expect(job.opts.attempts).toBe(3);
      expect(job.returnvalue).toEqual({ daGui: true, maKiemTra });

      // Contract hạ tầng: Mailpit thật sự nhận được thư.
      const query = encodeURIComponent(`to:${email}`);
      const deadline = Date.now() + 20_000;
      let body = '';

      while (Date.now() < deadline) {
        const response = await fetch(`${base}/view/latest.txt?query=${query}`);

        if (response.ok) {
          body = await response.text();

          if (body.includes(noiDung)) {
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      expect(body).toContain(noiDung);
      // Subject là header MIME nên KHÔNG nằm trong text body (`latest.txt`
      // chỉ trả phần text). Kiểm Subject qua JSON API của Mailpit.
      const timKiem = await fetch(`${base}/api/v1/search?query=${query}&limit=5`);
      expect(timKiem.ok).toBe(true);
      const ketQua = (await timKiem.json()) as {
        messages?: Array<{ Subject?: string }>;
      };
      const tieuDeThat = (ketQua.messages ?? []).map((m) => m.Subject ?? '').join('\n');
      expect(tieuDeThat).toContain(`AgriMarket Mailpit gate ${maKiemTra}`);
    },
    THOI_GIAN_CHO_TICH_HOP_MS,
  );
});
