import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6380';

    const keyPrefix = this.configService.get<string>('REDIS_PREFIX') ?? 'agrimarket:cache:';

    this.client = new Redis(redisUrl, {
      keyPrefix,
      lazyConnect: true,
      enableReadyCheck: true,
      maxRetriesPerRequest: 2,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();

    const pong = await this.client.ping();

    if (pong !== 'PONG') {
      throw new Error('Redis không phản hồi PONG.');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  ping(): Promise<string> {
    return this.client.ping();
  }

  async datJson(khoa: string, giaTri: unknown, ttlGiay?: number): Promise<void> {
    const serialized = JSON.stringify(giaTri);

    if (ttlGiay && ttlGiay > 0) {
      await this.client.set(khoa, serialized, 'EX', ttlGiay);
      return;
    }

    await this.client.set(khoa, serialized);
  }

  async layJson<T>(khoa: string): Promise<T | null> {
    const raw = await this.client.get(khoa);

    if (raw === null) {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  async xoa(khoa: string): Promise<void> {
    await this.client.del(khoa);
  }
}
