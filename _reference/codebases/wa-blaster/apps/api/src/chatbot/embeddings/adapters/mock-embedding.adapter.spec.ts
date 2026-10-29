import { MockEmbeddingAdapter } from './mock-embedding.adapter';
import { EMBEDDING_DIM } from './embedding-adapter.interface';

describe('MockEmbeddingAdapter', () => {
  const adapter = new MockEmbeddingAdapter();

  it('name() and dim() identify the adapter', () => {
    expect(adapter.name()).toBe('mock-embed');
    expect(adapter.dim()).toBe(EMBEDDING_DIM);
  });

  it('returns one 1024-dim vector per input', async () => {
    const { vectors } = await adapter.embed(['a', 'b', 'c']);
    expect(vectors).toHaveLength(3);
    vectors.forEach((v) => expect(v).toHaveLength(EMBEDDING_DIM));
  });

  it('is deterministic — same text yields the same vector', async () => {
    const a = (await adapter.embed(['shipping to KL?'])).vectors[0];
    const b = (await adapter.embed(['shipping to KL?'])).vectors[0];
    expect(b).toEqual(a);
  });

  it('different texts yield different vectors', async () => {
    const a = (await adapter.embed(['hello'])).vectors[0];
    const b = (await adapter.embed(['world'])).vectors[0];
    expect(b).not.toEqual(a);
  });

  it('vectors are L2-normalized (unit length)', async () => {
    const v = (await adapter.embed(['anything'])).vectors[0];
    const norm = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));
    expect(norm).toBeCloseTo(1, 6);
  });

  it('reports modelUsed and a non-negative latency', async () => {
    const batch = await adapter.embed(['x']);
    expect(batch.modelUsed).toBe('mock-embed');
    expect(batch.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
