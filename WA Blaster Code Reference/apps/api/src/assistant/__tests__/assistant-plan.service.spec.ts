import { AssistantPlanService } from '../assistant-plan.service';
import type { AssistantPlanInput } from '../assistant.types';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

function reusePlan(over: Partial<AssistantPlanInput> = {}): AssistantPlanInput {
  return {
    intent: 'reuse_and_schedule',
    campaignName: 'Car A — June',
    template: { mode: 'reuse', name: 'car_a_promo' },
    audience: { segmentId: 's1' },
    defaultLanguage: 'EN',
    variableMapping: { '1': 'contact.name' },
    schedule: { sendAt: FUTURE },
    ...over,
  };
}

function make() {
  const created: any = { id: 'plan1', status: 'PENDING_APPROVAL', plan: null, expiresAt: new Date() };
  const prisma: any = {
    contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Dealers' }) },
    template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED' }]) },
    assistantPlan: {
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...created, ...data })),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const templates: any = {};
  const blasts: any = {};
  const config: any = { get: () => undefined };
  return { svc: new AssistantPlanService(prisma, templates, blasts, config), prisma };
}

describe('AssistantPlanService.stage validation', () => {
  it('stages a valid reuse plan', async () => {
    const { svc } = make();
    const staged = await svc.stage(reusePlan(), 'u1');
    expect(staged.status).toBe('PENDING_APPROVAL');
    expect(staged.plan.campaignName).toBe('Car A — June');
  });

  it('rejects an unknown segment', async () => {
    const { svc, prisma } = make();
    prisma.contactSegment.findUnique.mockResolvedValue(null);
    await expect(svc.stage(reusePlan(), 'u1')).rejects.toThrow(/segment/i);
  });

  it('rejects a past sendAt', async () => {
    const { svc } = make();
    await expect(svc.stage(reusePlan({ schedule: { sendAt: '2000-01-01T00:00:00+08:00' } }), 'u1'))
      .rejects.toThrow(/future/i);
  });

  it('rejects a reuse template that is not APPROVED', async () => {
    const { svc, prisma } = make();
    prisma.template.findMany.mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'PENDING' }]);
    await expect(svc.stage(reusePlan(), 'u1')).rejects.toThrow(/APPROVED/);
  });

  it('rejects a create plan whose name is not Meta-safe', async () => {
    const { svc } = make();
    const bad = reusePlan({
      intent: 'create_and_schedule',
      template: { mode: 'create', name: 'Car A!', category: 'MARKETING', languages: ['EN'], bodyText: 'hi {{1}}', variables: ['1'] },
    });
    await expect(svc.stage(bad, 'u1')).rejects.toThrow(/name/i);
  });

  it('rejects when defaultLanguage is not in a create plan languages', async () => {
    const { svc } = make();
    const bad = reusePlan({
      intent: 'create_and_schedule',
      defaultLanguage: 'ZH',
      template: { mode: 'create', name: 'car_a_promo', category: 'MARKETING', languages: ['EN', 'MS'], bodyText: 'hi {{1}}', variables: ['1'] },
    });
    await expect(svc.stage(bad, 'u1')).rejects.toThrow(/language/i);
  });
});

describe('AssistantPlanService.approve execution', () => {
  function makeApprove(planRow: any) {
    const prisma: any = {
      contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED' }]) },
      assistantPlan: {
        findUnique: jest.fn().mockResolvedValue(planRow),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...planRow, ...data })),
      },
    };
    const templates: any = {
      createDraft: jest.fn().mockResolvedValue([{ name: 'car_a_promo', version: 3 }]),
      submitGroup: jest.fn().mockResolvedValue([]),
    };
    const blasts: any = { createAndSchedule: jest.fn().mockResolvedValue({ id: 'blast1' }) };
    const config: any = { get: () => undefined };
    return {
      svc: new AssistantPlanService(prisma, templates, blasts, config),
      templates, blasts, prisma,
    };
  }

  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const baseRow = (plan: any) => ({
    id: 'plan1', status: 'PENDING_APPROVAL', plan, expiresAt: new Date(Date.now() + 60000),
  });

  it('reuse plan: schedules a blast without creating a template', async () => {
    const plan = {
      intent: 'reuse_and_schedule', campaignName: 'X',
      template: { mode: 'reuse', name: 'car_a_promo' }, audience: { segmentId: 's1' },
      defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
    };
    const { svc, templates, blasts } = makeApprove(baseRow(plan));
    const out = await svc.approve('plan1', 'u1');
    expect(templates.createDraft).not.toHaveBeenCalled();
    expect(blasts.createAndSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ templateName: 'car_a_promo', segmentId: 's1', scheduledAt: FUTURE }), 'u1',
    );
    expect(out.blastId).toBe('blast1');
  });

  it('create plan: drafts + submits the template, then schedules', async () => {
    const plan = {
      intent: 'create_and_schedule', campaignName: 'X',
      template: { mode: 'create', name: 'car_a_promo', category: 'MARKETING', languages: ['EN'], bodyText: 'hi {{1}}', variables: ['1'] },
      audience: { segmentId: 's1' }, defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
    };
    const { svc, templates, blasts } = makeApprove(baseRow(plan));
    await svc.approve('plan1', 'u1');
    expect(templates.createDraft).toHaveBeenCalledTimes(1);
    expect(templates.submitGroup).toHaveBeenCalledWith('car_a_promo', 3);
    expect(blasts.createAndSchedule).toHaveBeenCalledTimes(1);
  });

  it('rejects an already-executed plan', async () => {
    const { svc } = makeApprove({ ...baseRow({}), status: 'EXECUTED' });
    await expect(svc.approve('plan1', 'u1')).rejects.toThrow(/already|not pending/i);
  });

  it('rejects an expired plan', async () => {
    const plan = { intent: 'reuse_and_schedule', template: { mode: 'reuse', name: 'x' } };
    const { svc } = makeApprove({ ...baseRow(plan), expiresAt: new Date(Date.now() - 1000) });
    await expect(svc.approve('plan1', 'u1')).rejects.toThrow(/expired/i);
  });
});
