import { MockAdapter } from './mock.adapter';

describe('MockAdapter', () => {
  const adapter = new MockAdapter();

  it('name() identifies the adapter', () => {
    expect(adapter.name()).toBe('mock');
  });

  it('jsonMode returns parseable JSON with an intent derived from the last user message', async () => {
    const result = await adapter.complete(
      [
        { role: 'system', content: 'You classify messages.' },
        { role: 'user', content: 'Bila boleh refund?' },
      ],
      { jsonMode: true },
    );

    expect(result.modelUsed).toBe('mock');
    expect(result.finishReason).toBe('stop');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    const parsed = JSON.parse(result.text);
    expect(parsed.intent).toBe('refund');
  });

  it('non-jsonMode returns a plain-text draft (not JSON)', async () => {
    const result = await adapter.complete([{ role: 'user', content: 'Bila boleh refund?' }]);
    expect(result.text.length).toBeGreaterThan(0);
    expect(() => JSON.parse(result.text)).toThrow();
  });

  it('classifies an unrecognised message as "other"', async () => {
    const result = await adapter.complete(
      [{ role: 'user', content: 'xyzzy plugh' }],
      { jsonMode: true },
    );
    expect(JSON.parse(result.text).intent).toBe('other');
  });

  it('is deterministic — identical input yields identical output', async () => {
    const messages = [{ role: 'user' as const, content: 'Berapa harga?' }];
    const a = await adapter.complete(messages, { jsonMode: true });
    const b = await adapter.complete(messages, { jsonMode: true });
    expect(a.text).toBe(b.text);
  });
});
