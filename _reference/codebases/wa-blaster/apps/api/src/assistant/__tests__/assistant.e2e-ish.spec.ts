import { AssistantService } from '../assistant.service';
import { AssistantPlanService } from '../assistant-plan.service';
import { AssistantToolsService } from '../assistant-tools.service';
import type { AssistantLlmTurn } from '../assistant.types';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const turn = (toolCalls: any[], content = ''): AssistantLlmTurn => ({ content, toolCalls, raw: { role: 'assistant', content, tool_calls: toolCalls } });

describe('assistant chat → propose → approve (integration)', () => {
  it('stages then executes a reuse plan into a scheduled blast', async () => {
    const planRows: any = {};
    const prisma: any = {
      template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED', variables: ['1'] }]) },
      contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Dealers' }) },
      assistantPlan: {
        create: jest.fn().mockImplementation(({ data }: any) => {
          planRows['plan1'] = { id: 'plan1', ...data, expiresAt: data.expiresAt };
          return Promise.resolve(planRows['plan1']);
        }),
        findUnique: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(planRows[where.id])),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          planRows[where.id] = { ...planRows[where.id], ...data };
          return Promise.resolve(planRows[where.id]);
        }),
      },
    };
    const segments: any = { list: jest.fn(), preview: jest.fn() };
    const templates: any = { createDraft: jest.fn(), submitGroup: jest.fn() };
    const blasts: any = { createAndSchedule: jest.fn().mockResolvedValue({ id: 'blast1' }) };
    const config: any = { get: () => undefined };

    const planService = new AssistantPlanService(prisma, templates, blasts, config);
    const toolsService = new AssistantToolsService(prisma, segments);

    const llm: any = {
      chat: jest.fn().mockResolvedValueOnce(
        turn([{ name: 'propose_plan', arguments: {
          intent: 'reuse_and_schedule', campaignName: 'Car A — June',
          template: { mode: 'reuse', name: 'car_a_promo' }, audience: { segmentId: 's1' },
          defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
        } }], 'Ready to send.'),
      ),
    };

    const assistant = new AssistantService(llm, toolsService, planService);

    const chat = await assistant.handleMessage({ message: 'blast dealers about car A on monday morning', history: [], userId: 'u1' });
    expect(chat.plan?.id).toBe('plan1');

    const result = await planService.approve(chat.plan!.id, 'u1');
    expect(result.blastId).toBe('blast1');
    expect(blasts.createAndSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ templateName: 'car_a_promo', segmentId: 's1', scheduledAt: FUTURE }), 'u1',
    );
    expect(planRows['plan1'].status).toBe('EXECUTED');
  });
});
