import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const KEY = 'rate:tier:24h';
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type ConsumeResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /** Attempt to record one send within the 24h window. */
  async consume(cap: number): Promise<ConsumeResult> {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    await this.redis.zremrangebyscore(KEY, '-inf', cutoff);
    const count = await this.redis.zcard(KEY);
    if (count >= cap) {
      // Find the oldest entry to compute retry time
      const oldest = await this.redis.zrange(KEY, 0, 0, 'WITHSCORES');
      const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
      const retryAfterMs = Math.max(1000, oldestScore + WINDOW_MS - now);
      return { ok: false, retryAfterMs };
    }
    await this.redis.zadd(KEY, now, `${now}:${Math.random()}`);
    await this.redis.expire(KEY, Math.ceil(WINDOW_MS / 1000));
    return { ok: true };
  }

  /** Convert tier name to numeric cap. */
  static capFor(tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNLIMITED'): number {
    switch (tier) {
      case 'TIER_1': return 1_000;
      case 'TIER_2': return 10_000;
      case 'TIER_3': return 100_000;
      case 'UNLIMITED': return Number.MAX_SAFE_INTEGER;
    }
  }
}
