import type { INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import type { Job, Queue } from 'bullmq';

import { AppModule } from '../src/app.module';
import { HangDoiService } from '../src/modules/hang-doi/hang-doi.service';
import { TEN_HANG_DOI } from '../src/modules/hang-doi/hang-doi.constants';
import { RedisService } from '../src/redis/redis.service';

const THOI_GIAN_CHO_E2E_MS = 30_000;

async function choJobHoanThanh(queue: Queue, jobId: string): Promise<Job> {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const state = await queue.getJobState(jobId);

    if (state === 'completed') {
      // Không trả về Job object đã load trước thời điểm complete.
      // BullMQ ghi returnvalue khi worker hoàn tất; fetch lại sau
      // khi queue đã xác nhận completed để tránh stale returnvalue.
      const completedJob = await queue.getJob(jobId);

      if (!completedJob) {
        throw new Error(`Job ${jobId} completed nhưng không fetch lại được.`);
      }

      if (!completedJob.finishedOn) {
        throw new Error(`Job ${jobId} completed nhưng thiếu finishedOn.`);
      }

      return completedJob;
    }

    if (state === 'failed') {
      const failedJob = await queue.getJob(jobId);

      throw new Error(`Job ${jobId} failed: ` + `${failedJob?.failedReason ?? 'unknown'}`);
    }

    if (state === 'unknown') {
      // Queue.add() và getJobState() có thể sát nhau.
      // Cho Redis một nhịp trước khi kết luận job biến mất.
      await new Promise((resolve) => setTimeout(resolve, 50));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const stateCuoi = await queue.getJobState(jobId);

  throw new Error(`Job ${jobId} chưa hoàn thành sau 15s; state=${stateCuoi}.`);
}

describe('Redis + BullMQ foundation (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;
  let hangDoiService: HangDoiService;

  let emailQueue: Queue;
  let thongBaoQueue: Queue;
  let heThongQueue: Queue;

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    redisService = app.get(RedisService);
    hangDoiService = app.get(HangDoiService);

    emailQueue = app.get(getQueueToken(TEN_HANG_DOI.EMAIL));
    thongBaoQueue = app.get(getQueueToken(TEN_HANG_DOI.THONG_BAO));
    heThongQueue = app.get(getQueueToken(TEN_HANG_DOI.HE_THONG));
  }, THOI_GIAN_CHO_E2E_MS);

  afterAll(async () => {
    if (redisService) {
      await redisService.xoa(`phien016:${suffix}`);
    }

    for (const queue of [emailQueue, thongBaoQueue, heThongQueue]) {
      if (queue) {
        await queue.clean(0, 1000, 'completed');
        await queue.clean(0, 1000, 'failed');
      }
    }

    if (app) {
      await app.close();
    }
  }, THOI_GIAN_CHO_E2E_MS);

  it('Redis ping + JSON cache + TTL hoạt động', async () => {
    await expect(redisService.ping()).resolves.toBe('PONG');

    const khoa = `phien016:${suffix}`;

    await redisService.datJson(
      khoa,
      {
        ok: true,
        suffix,
      },
      30,
    );

    await expect(
      redisService.layJson<{
        ok: boolean;
        suffix: string;
      }>(khoa),
    ).resolves.toEqual({
      ok: true,
      suffix,
    });

    await redisService.xoa(khoa);

    await expect(redisService.layJson(khoa)).resolves.toBeNull();
  });

  it(
    'email queue gửi email thử thật tới Mailpit',
    async () => {
      const email = `phien016-${suffix}@example.com`;
      const maKiemTra = `mail-${suffix}`;

      const jobId = await hangDoiService.themEmailThu({
        den: email,
        tieuDe: `AgriMarket PHIEN-016 ${maKiemTra}`,
        noiDung: `BullMQ email worker OK ${maKiemTra}`,
        maKiemTra,
      });

      const job = await choJobHoanThanh(emailQueue, jobId);

      expect(job.opts.attempts).toBe(3);
      expect(job.returnvalue).toEqual({
        daGui: true,
        maKiemTra,
      });

      const query = encodeURIComponent(`to:${email}`);

      const deadline = Date.now() + 10_000;
      let body = '';

      while (Date.now() < deadline) {
        const response = await fetch(`http://127.0.0.1:8025/` + `view/latest.txt?query=${query}`);

        if (response.ok) {
          body = await response.text();

          if (body.includes(maKiemTra)) {
            break;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      expect(body).toContain(`BullMQ email worker OK ${maKiemTra}`);
    },
    THOI_GIAN_CHO_E2E_MS,
  );

  it('notification queue có worker foundation', async () => {
    const maKiemTra = `notification-${suffix}`;

    const jobId = await hangDoiService.themThongBaoThu({
      maKiemTra,
      nguoiDungId: 'foundation-test',
    });

    const job = await choJobHoanThanh(thongBaoQueue, jobId);

    expect(job.returnvalue).toEqual({
      daXuLy: true,
      maKiemTra,
    });
  });

  it('system-job queue có worker foundation', async () => {
    const maKiemTra = `system-${suffix}`;

    const jobId = await hangDoiService.themCongViecHeThongThu({
      maKiemTra,
    });

    const job = await choJobHoanThanh(heThongQueue, jobId);

    expect(job.returnvalue).toEqual({
      daXuLy: true,
      maKiemTra,
    });
  });
});
