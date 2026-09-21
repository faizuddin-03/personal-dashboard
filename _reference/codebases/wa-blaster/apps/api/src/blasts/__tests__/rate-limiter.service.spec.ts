import { RateLimiterService } from '../rate-limiter.service';

describe('RateLimiterService', () => {
  let redis: {
    zremrangebyscore: jest.Mock;
    zadd: jest.Mock;
    zcard: jest.Mock;
    zrange: jest.Mock;
    expire: jest.Mock;
  };
  let service: RateLimiterService;

  beforeEach(() => {
    redis = {
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      zadd: jest.fn().mockResolvedValue(1),
      zcard: jest.fn().mockResolvedValue(0),
      zrange: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(1),
    };
    service = new RateLimiterService(redis as any);
  });

  it('admits a send when under the cap', async () => {
    redis.zcard.mockResolvedValue(0);
    const result = await service.consume(1000);
    expect(result.ok).toBe(true);
  });

  it('admits a send right at the limit minus one', async () => {
    redis.zcard.mockResolvedValue(999);
    const result = await service.consume(1000);
    expect(result.ok).toBe(true);
  });

  it('rejects when at the cap', async () => {
    redis.zcard.mockResolvedValue(1000);
    redis.zrange.mockResolvedValue(['ts1', String(Date.now() - 60_000)]);
    const result = await service.consume(1000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('does not increment when rejected', async () => {
    redis.zcard.mockResolvedValue(1000);
    redis.zrange.mockResolvedValue(['ts1', String(Date.now() - 60_000)]);
    await service.consume(1000);
    expect(redis.zadd).not.toHaveBeenCalled();
  });
});
