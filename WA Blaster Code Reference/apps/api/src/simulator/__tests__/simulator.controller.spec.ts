import { SimulatorController } from '../simulator.controller';

describe('SimulatorController', () => {
  const sim = {
    simulateInbound: jest.fn().mockResolvedValue({ subKind: 'rag_answer' }),
    getThread: jest.fn().mockResolvedValue({ phone: '+60123456789', contactId: 'c1', items: [] }),
    reset: jest.fn().mockResolvedValue({ deletedConversations: 1 }),
    status: jest.fn().mockResolvedValue({ simulatorEnabled: true }),
  } as any;
  const ctrl = new SimulatorController(sim);

  it('inbound delegates to simulateInbound(phone, text)', async () => {
    await ctrl.inbound({ phone: '60123456789', text: 'hi' });
    expect(sim.simulateInbound).toHaveBeenCalledWith('60123456789', 'hi');
  });
  it('thread delegates to getThread(phone)', async () => {
    await ctrl.thread('60123456789');
    expect(sim.getThread).toHaveBeenCalledWith('60123456789');
  });
  it('reset delegates to reset(phone)', async () => {
    await ctrl.reset('60123456789');
    expect(sim.reset).toHaveBeenCalledWith('60123456789');
  });
  it('status delegates to status()', async () => {
    await ctrl.status();
    expect(sim.status).toHaveBeenCalled();
  });
});
