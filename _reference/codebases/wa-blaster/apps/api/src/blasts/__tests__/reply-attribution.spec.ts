import { attributeReply } from '../reply-attribution';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeMessage(overrides: Partial<{
  id: string; blastId: string; status: string; sentAt: Date | null;
}> = {}) {
  return {
    id: 'm-default',
    blastId: 'b-default',
    status: 'SENT',
    sentAt: new Date(NOW.getTime() - HOUR),
    ...overrides,
  };
}

describe('attributeReply', () => {
  it('returns null when no candidates exist', () => {
    expect(attributeReply([], NOW, 7)).toBeNull();
  });

  it('picks the most recent SENT message within the window', () => {
    const candidates = [
      makeMessage({ id: 'old', sentAt: new Date(NOW.getTime() - 3 * DAY) }),
      makeMessage({ id: 'newer', sentAt: new Date(NOW.getTime() - 1 * HOUR) }),
      makeMessage({ id: 'oldest', sentAt: new Date(NOW.getTime() - 5 * DAY) }),
    ];
    const result = attributeReply(candidates, NOW, 7);
    expect(result?.messageId).toBe('newer');
  });

  it('considers DELIVERED and READ statuses, not just SENT', () => {
    const candidates = [
      makeMessage({ id: 'sent', status: 'SENT', sentAt: new Date(NOW.getTime() - 10 * HOUR) }),
      makeMessage({ id: 'delivered', status: 'DELIVERED', sentAt: new Date(NOW.getTime() - 5 * HOUR) }),
      makeMessage({ id: 'read', status: 'READ', sentAt: new Date(NOW.getTime() - 1 * HOUR) }),
    ];
    const result = attributeReply(candidates, NOW, 7);
    expect(result?.messageId).toBe('read');
  });

  it('ignores QUEUED, FAILED, CANCELED statuses', () => {
    const candidates = [
      makeMessage({ id: 'queued', status: 'QUEUED', sentAt: null }),
      makeMessage({ id: 'failed', status: 'FAILED', sentAt: new Date(NOW.getTime() - 1 * HOUR) }),
      makeMessage({ id: 'canceled', status: 'CANCELED', sentAt: new Date(NOW.getTime() - 30 * 60 * 1000) }),
    ];
    expect(attributeReply(candidates, NOW, 7)).toBeNull();
  });

  it('ignores candidates outside the window', () => {
    const candidates = [
      makeMessage({ id: 'too-old', sentAt: new Date(NOW.getTime() - 10 * DAY) }),
    ];
    expect(attributeReply(candidates, NOW, 7)).toBeNull();
  });

  it('honors a custom window length', () => {
    const candidates = [
      makeMessage({ id: 'three-days-ago', sentAt: new Date(NOW.getTime() - 3 * DAY) }),
    ];
    expect(attributeReply(candidates, NOW, 1)).toBeNull(); // 1-day window — too old
    expect(attributeReply(candidates, NOW, 7)?.messageId).toBe('three-days-ago');
  });

  it('skips rows with no sentAt', () => {
    const candidates = [
      makeMessage({ id: 'no-sent', status: 'SENT', sentAt: null }),
      makeMessage({ id: 'has-sent', status: 'SENT', sentAt: new Date(NOW.getTime() - 2 * HOUR) }),
    ];
    expect(attributeReply(candidates, NOW, 7)?.messageId).toBe('has-sent');
  });
});
