import { AssistantService } from '../assistant.service';
import type { AssistantLlmTurn } from '../assistant.types';

function turn(toolCalls: { name: string; arguments: any }[], content = ''): AssistantLlmTurn {
  return { content, toolCalls, raw: { role: 'assistant', content, tool_calls: toolCalls } };
}

function make(script: AssistantLlmTurn[]) {
  let i = 0;
  const llm: any = { chat: jest.fn().mockImplementation(() => Promise.resolve(script[i++])) };
  const tools: any = { run: jest.fn().mockResolvedValue({ ok: true, templates: [{ name: 'car_a_promo' }] }) };
  const plans: any = {
    stage: jest.fn().mockResolvedValue({ id: 'plan1', status: 'PENDING_APPROVAL', plan: {}, expiresAt: 'x' }),
  };
  return { svc: new AssistantService(llm, tools, plans), llm, tools, plans };
}

describe('AssistantService loop', () => {
  it('runs a read tool, then stages a proposed plan', async () => {
    const { svc, tools, plans } = make([
      turn([{ name: 'search_templates', arguments: { query: 'car a' } }]),
      turn([{ name: 'propose_plan', arguments: { campaignName: 'X' } }], 'Here is your campaign.'),
    ]);
    const out = await svc.handleMessage({ message: 'blast dealers about car a monday', history: [], userId: 'u1' });
    expect(tools.run).toHaveBeenCalledWith('search_templates', { query: 'car a' });
    expect(plans.stage).toHaveBeenCalledTimes(1);
    expect(out.plan?.id).toBe('plan1');
  });

  it('returns a clarifying question when the model produces no tool calls', async () => {
    const { svc, plans } = make([turn([], 'Which audience did you mean?')]);
    const out = await svc.handleMessage({ message: 'send a blast', history: [], userId: 'u1' });
    expect(out.reply).toMatch(/which audience/i);
    expect(plans.stage).not.toHaveBeenCalled();
  });

  it('feeds a validation error back and lets the model repair', async () => {
    const { svc, plans } = make([
      turn([{ name: 'propose_plan', arguments: { bad: true } }]),
      turn([{ name: 'propose_plan', arguments: { campaignName: 'fixed' } }], 'Fixed.'),
    ]);
    plans.stage
      .mockRejectedValueOnce(new Error('sendAt must be in the future'))
      .mockResolvedValueOnce({ id: 'plan2', status: 'PENDING_APPROVAL', plan: {}, expiresAt: 'x' });
    const out = await svc.handleMessage({ message: 'x', history: [], userId: 'u1' });
    expect(plans.stage).toHaveBeenCalledTimes(2);
    expect(out.plan?.id).toBe('plan2');
  });

  it('gives up gracefully after MAX_ITERATIONS of only read tools', async () => {
    const loopTurn = turn([{ name: 'search_templates', arguments: { query: 'x' } }]);
    const { svc } = make([loopTurn, loopTurn, loopTurn, loopTurn, loopTurn, loopTurn]);
    const out = await svc.handleMessage({ message: 'x', history: [], userId: 'u1' });
    expect(out.reply).toMatch(/couldn'?t/i);
  });
});
