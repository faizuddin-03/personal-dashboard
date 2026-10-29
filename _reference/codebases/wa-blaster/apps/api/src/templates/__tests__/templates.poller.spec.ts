import { TemplatesPoller } from '../templates.poller';

describe('TemplatesPoller', () => {
  it('pollPending delegates to TemplatesService.syncPending(true)', async () => {
    const templates = { syncPending: jest.fn().mockResolvedValue({ checked: 2, updated: 1 }) };
    const poller = new TemplatesPoller(templates as any);
    await poller.pollPending();
    expect(templates.syncPending).toHaveBeenCalledTimes(1);
    expect(templates.syncPending).toHaveBeenCalledWith(true);
  });

  it('resolves without throwing when nothing is pending', async () => {
    const templates = { syncPending: jest.fn().mockResolvedValue({ checked: 0, updated: 0 }) };
    const poller = new TemplatesPoller(templates as any);
    await expect(poller.pollPending()).resolves.toBeUndefined();
  });
});
