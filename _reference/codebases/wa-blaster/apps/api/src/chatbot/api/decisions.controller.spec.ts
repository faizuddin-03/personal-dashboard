import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DecisionQueryService } from './decision-query.service';
import { DecisionsController } from './decisions.controller';

describe('DecisionsController', () => {
  let controller: DecisionsController;
  let service: { list: jest.Mock; stats: jest.Mock };

  beforeEach(async () => {
    service = { list: jest.fn(), stats: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [DecisionsController],
      providers: [{ provide: DecisionQueryService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(DecisionsController);
  });

  describe('GET /chatbot/decisions', () => {
    it('passes the query straight through to service.list', async () => {
      const out = { items: [], total: 0, page: 1, limit: 50 };
      service.list.mockResolvedValue(out);
      const q = { kind: 'AUTO_SEND', conversationId: 'c1' } as never;

      expect(await controller.list(q)).toBe(out);
      expect(service.list).toHaveBeenCalledWith(q);
    });
  });

  describe('GET /chatbot/decisions/stats', () => {
    it('defaults to a 7-day window when days is omitted', async () => {
      const out = { days: 7, total: 0 };
      service.stats.mockResolvedValue(out);

      expect(await controller.stats({})).toBe(out);
      expect(service.stats).toHaveBeenCalledWith(7);
    });

    it('forwards the requested window when days is provided', async () => {
      service.stats.mockResolvedValue({ days: 30 });

      await controller.stats({ days: 30 });

      expect(service.stats).toHaveBeenCalledWith(30);
    });
  });
});
