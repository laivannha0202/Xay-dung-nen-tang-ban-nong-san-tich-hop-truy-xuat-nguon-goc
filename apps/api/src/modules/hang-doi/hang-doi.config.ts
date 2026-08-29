import type { ConfigService } from '@nestjs/config';
import type { BullRootModuleOptions } from '@nestjs/bullmq';

export function taoCauHinhBullMq(configService: ConfigService): BullRootModuleOptions {
  const redisUrl = new URL(configService.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6380');

  const dbPath = redisUrl.pathname.replace('/', '');

  const db = dbPath.length > 0 ? Number(dbPath) : 0;

  if (!Number.isInteger(db) || db < 0) {
    throw new Error('Redis DB index không hợp lệ.');
  }

  const attempts = Number(configService.get<string>('BULLMQ_ATTEMPTS') ?? '3');

  const backoffMs = Number(configService.get<string>('BULLMQ_BACKOFF_MS') ?? '1000');

  return {
    connection: {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || '6379'),
      ...(redisUrl.username
        ? {
            username: decodeURIComponent(redisUrl.username),
          }
        : {}),
      ...(redisUrl.password
        ? {
            password: decodeURIComponent(redisUrl.password),
          }
        : {}),
      db,
    },
    prefix: configService.get<string>('BULLMQ_PREFIX') ?? 'agrimarket:bull',
    defaultJobOptions: {
      attempts,
      backoff: {
        type: 'exponential',
        delay: backoffMs,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 86400,
        count: 5000,
      },
    },
  };
}
